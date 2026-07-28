import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { CanteenItem, CANTEEN_CATEGORIES } from "../models/CanteenItem.model.js";
import { StudentWallet } from "../models/StudentWallet.model.js";
import { WalletTransaction } from "../models/WalletTransaction.model.js";
import { CanteenOrder } from "../models/CanteenOrder.model.js";
import { Student } from "../models/student.model.js";
import { School } from "../models/school.model.js";

const resolveSchoolId = (req) =>
  req.user.roleId?.name === "Super Admin" ? req.query.schoolId || req.body.schoolId || req.user.schoolId : req.user.schoolId;

const ensureAccess = (doc, user, notFoundMessage) => {
  if (!doc) throw new ApiError(404, notFoundMessage);
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school record");
  }
};

const getRazorpayInstance = async (schoolId) => {
  if (!mongoose.Types.ObjectId.isValid(schoolId)) throw new ApiError(400, "Invalid school ID");

  const school = await School.findById(schoolId).select("+razorpay.keyId +razorpay.keySecret razorpay.isEnabled");
  if (!school || !school.razorpay?.keyId || !school.razorpay?.keySecret) {
    throw new ApiError(400, "Razorpay not configured for this school. Please add Key ID and Key Secret in Settings.");
  }
  if (!school.razorpay.isEnabled) {
    throw new ApiError(400, "Razorpay is disabled for this school. Please enable it in Settings → School → Razorpay Integration.");
  }

  return {
    razorpay: new Razorpay({ key_id: school.razorpay.keyId, key_secret: school.razorpay.keySecret }),
    keySecret: school.razorpay.keySecret,
    keyId: school.razorpay.keyId,
  };
};

/* ══════════════════════════ Menu Items ══════════════════════════ */

export const createItem = asyncHandler(async (req, res) => {
  const { name, category, price, isAvailable } = req.body;

  if (category && !CANTEEN_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Invalid category");
  }

  const schoolId = resolveSchoolId(req);
  const item = await CanteenItem.create({
    schoolId, name, category: category || "Other", price, isAvailable: isAvailable ?? true, createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, item, "Canteen item created successfully"));
});

export const getItems = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { category, isAvailable } = req.query;

  const filter = { schoolId };
  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";

  const items = await CanteenItem.find(filter).sort({ category: 1, name: 1 }).lean();

  return res.status(200).json(new ApiResponse(200, items, "Canteen items fetched successfully"));
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await CanteenItem.findById(req.params.id);
  ensureAccess(item, req.user, "Canteen item not found");

  const { name, category, price, isAvailable } = req.body;
  if (name !== undefined) item.name = name;
  if (category !== undefined) {
    if (!CANTEEN_CATEGORIES.includes(category)) throw new ApiError(400, "Invalid category");
    item.category = category;
  }
  if (price !== undefined) item.price = price;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;

  await item.save();

  return res.status(200).json(new ApiResponse(200, item, "Canteen item updated successfully"));
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await CanteenItem.findById(req.params.id);
  ensureAccess(item, req.user, "Canteen item not found");

  await CanteenItem.findByIdAndDelete(req.params.id);

  return res.status(200).json(new ApiResponse(200, { _id: req.params.id }, "Canteen item deleted successfully"));
});

/* ══════════════════════════ Wallet ══════════════════════════ */

export const getWallet = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const wallet = await StudentWallet.findOneAndUpdate(
    { schoolId, studentId },
    { $setOnInsert: { schoolId, studentId, balance: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(new ApiResponse(200, wallet, "Wallet fetched successfully"));
});

export const topUpCash = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { amount } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid top-up amount is required");
  }

  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const wallet = await StudentWallet.findOneAndUpdate(
    { schoolId, studentId },
    { $inc: { balance: numericAmount }, $setOnInsert: { schoolId, studentId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const transaction = await WalletTransaction.create({
    schoolId, studentId, walletId: wallet._id,
    type: "TopUp", amount: numericAmount, balanceAfter: wallet.balance,
    paymentMode: "Cash", performedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, { wallet, transaction }, "Wallet topped up successfully"));
});

export const createTopUpRazorpayOrder = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { amount } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid top-up amount is required");
  }

  const schoolId = resolveSchoolId(req);
  const { razorpay, keyId } = await getRazorpayInstance(schoolId);

  const order = await razorpay.orders.create({
    amount: Math.round(numericAmount * 100),
    currency: "INR",
    receipt: `WALLET-${studentId}-${Date.now()}`,
    notes: { schoolId: schoolId.toString(), studentId, requestId: req.requestId },
  });

  return res.status(200).json(
    new ApiResponse(200, { orderId: order.id, amount: order.amount, currency: order.currency, keyId }, "Razorpay order created")
  );
});

export const verifyTopUpRazorpay = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid top-up amount is required");
  }

  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const { keySecret } = await getRazorpayInstance(schoolId);
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  const wallet = await StudentWallet.findOneAndUpdate(
    { schoolId, studentId },
    { $inc: { balance: numericAmount }, $setOnInsert: { schoolId, studentId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const transaction = await WalletTransaction.create({
    schoolId, studentId, walletId: wallet._id,
    type: "TopUp", amount: numericAmount, balanceAfter: wallet.balance,
    paymentMode: "Razorpay", razorpay: { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
    performedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, { wallet, transaction }, "Wallet topped up via Razorpay successfully"));
});

export const getTransactions = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const schoolId = resolveSchoolId(req);
  const { page, limit } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const filter = { schoolId, studentId };
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    WalletTransaction.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "Transactions fetched successfully")
  );
});

/* ══════════════════════════ Orders (POS) ══════════════════════════ */

export const createOrder = asyncHandler(async (req, res) => {
  const { studentId, items } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "At least one item is required to place an order");
  }

  const student = await Student.findById(studentId).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const itemIds = items.map((i) => i.itemId);
  const menuItems = await CanteenItem.find({ _id: { $in: itemIds }, schoolId }).lean();
  const menuMap = new Map(menuItems.map((m) => [`${m._id}`, m]));

  const orderItems = items.map((i) => {
    const menuItem = menuMap.get(`${i.itemId}`);
    if (!menuItem) throw new ApiError(404, `Menu item ${i.itemId} not found`);
    if (!menuItem.isAvailable) throw new ApiError(400, `${menuItem.name} is currently unavailable`);
    const quantity = Math.max(1, parseInt(i.quantity, 10) || 1);
    return { itemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const wallet = await StudentWallet.findOneAndUpdate(
    { schoolId, studentId, balance: { $gte: totalAmount } },
    { $inc: { balance: -totalAmount } },
    { new: true }
  );

  if (!wallet) {
    throw new ApiError(400, "Insufficient wallet balance for this order");
  }

  const order = await CanteenOrder.create({
    schoolId, studentId, studentName: student.userId?.name || "",
    items: orderItems, totalAmount, orderedBy: req.user._id,
  });

  await WalletTransaction.create({
    schoolId, studentId, walletId: wallet._id,
    type: "Purchase", amount: totalAmount, balanceAfter: wallet.balance,
    orderId: order._id, performedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

export const getOrders = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { studentId, status, search, from, to, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  if (from || to) {
    filter.orderDate = {};
    if (from) filter.orderDate.$gte = new Date(from);
    if (to) filter.orderDate.$lte = new Date(to);
  }
  if (search) {
    filter.studentName = new RegExp(escapeRegex(search.trim()), "i");
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-orderDate";

  const [orders, total] = await Promise.all([
    CanteenOrder.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    CanteenOrder.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "Orders fetched successfully")
  );
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await CanteenOrder.findById(req.params.id);
  ensureAccess(order, req.user, "Order not found");

  if (order.status === "Cancelled") {
    throw new ApiError(400, "Order already cancelled");
  }

  order.status = "Cancelled";
  await order.save();

  const wallet = await StudentWallet.findOneAndUpdate(
    { schoolId: order.schoolId, studentId: order.studentId },
    { $inc: { balance: order.totalAmount } },
    { new: true }
  );

  await WalletTransaction.create({
    schoolId: order.schoolId, studentId: order.studentId, walletId: wallet._id,
    type: "Refund", amount: order.totalAmount, balanceAfter: wallet.balance,
    orderId: order._id, performedBy: req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled and refunded successfully"));
});
