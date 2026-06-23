import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { School } from "../models/school.model.js";

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

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

const ensureInstallmentAccess = async ({ installmentId, schoolId }) => {
  const installment = await FeeInstallment.findById(installmentId);
  if (!installment) throw new ApiError(404, "Installment not found");
  if (installment.schoolId.toString() !== schoolId.toString()) throw new ApiError(403, "Unauthorized access");
  return installment;
};

const resolveSchoolIdFromUser = (user) => {
  if (!user) return null;
  return user.schoolId?._id || user.schoolId || user.school?._id || null;
};
const requireSchoolId = (user) => {
  const schoolId = resolveSchoolIdFromUser(user);
  if (!schoolId) throw new ApiError(400, "School not found for this user");
  return schoolId;
};
export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, installmentId, amount, paymentMethod, paymentMode, transactionId, razorpay } = req.body;
  const schoolId = requireSchoolId(req.user);

  const installment = await ensureInstallmentAccess({ installmentId, schoolId });
  const mode = String(paymentMethod || paymentMode || "cash").toLowerCase();

  if (mode === "razorpay") {
    const dueAmount = installment.amount - installment.paidAmount;
    if (dueAmount <= 0) throw new ApiError(400, "Installment already paid");

    if (razorpay?.razorpay_order_id && razorpay?.razorpay_payment_id && razorpay?.razorpay_signature) {
      const { keySecret } = await getRazorpayInstance(schoolId);
      const body = `${razorpay.razorpay_order_id}|${razorpay.razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

      if (expectedSignature !== razorpay.razorpay_signature) {
        throw new ApiError(400, "Payment verification failed");
      }

      const payment = await Payment.create({
        schoolId,
        studentId: installment.studentId,
        installmentId,
        amountPaid: dueAmount,
        paymentMode: "razorpay",
        status: "success",
        razorpay,
        receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });

      installment.paidAmount += dueAmount;
      installment.status = "PAID";
      await installment.save();

      return sendSuccess(res, {
        statusCode: 201,
        message: "Payment verified and captured",
        data: payment,
      });
    }

    const { razorpay: razorpayClient, keyId } = await getRazorpayInstance(schoolId);
    const order = await razorpayClient.orders.create({
      amount: Math.round(dueAmount * 100),
      currency: "INR",
      receipt: `INST-${installmentId}`,
      notes: {
        schoolId: schoolId.toString(),
        installmentId,
        requestId: req.requestId,
      },
    });

    return sendSuccess(res, {
      message: "Razorpay order created",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      },
    });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid amount is required");
  }

  if (numericAmount > installment.amount - installment.paidAmount) {
    throw new ApiError(400, "Amount exceeds remaining due");
  }

  const payment = await Payment.create({
    schoolId,
    studentId: studentId || installment.studentId,
    installmentId,
    amountPaid: numericAmount,
    paymentMode: mode,
    status: "success",
    transactionId: transactionId || null,
    receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  });

  installment.paidAmount += numericAmount;
  installment.status = installment.paidAmount >= installment.amount ? "PAID" : "PARTIAL";
  await installment.save();

  return sendSuccess(res, {
    statusCode: 201,
    message: "Payment created successfully",
    data: payment,
  });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { installmentId } = req.body;
   const schoolId = requireSchoolId(req.user);

  const installment = await ensureInstallmentAccess({ installmentId, schoolId });
  const payableAmount = installment.amount - installment.paidAmount;

  if (payableAmount <= 0) throw new ApiError(400, "Installment already paid");

  const { razorpay, keyId } = await getRazorpayInstance(schoolId);
  const order = await razorpay.orders.create({
    amount: Math.round(payableAmount * 100),
    currency: "INR",
    receipt: `INST-${installmentId}`,
    notes: {
      schoolId: schoolId.toString(),
      installmentId,
      requestId: req.requestId,
    },
  });

  return sendSuccess(res, {
    message: "Razorpay order created",
    data: { ...order, keyId },
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, installmentId } = req.body;
  const schoolId = requireSchoolId(req.user);

  const { keySecret } = await getRazorpayInstance(schoolId);
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

  if (expectedSignature !== razorpay_signature) throw new ApiError(400, "Payment verification failed");

  const installment = await ensureInstallmentAccess({ installmentId, schoolId });
  const amount = installment.amount - installment.paidAmount;

  if (amount <= 0) throw new ApiError(400, "Installment already paid");

  const payment = await Payment.create({
    schoolId,
    studentId: installment.studentId,
    installmentId,
    amountPaid: amount,
    paymentMode: "razorpay",
    status: "success",
    razorpay: { razorpay_order_id, razorpay_payment_id },
    receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
  });

  installment.paidAmount += amount;
  installment.status = "PAID";
  await installment.save();

  return sendSuccess(res, { message: "Payment verified and captured", data: payment });
});

export const getPayments = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { id } = req.params;
  const { page = 1, limit = 20, paymentMode, startDate, endDate } = req.query;

  const filter = { schoolId };
  if (id) filter._id = id;
  if (["Student", "Parent"].includes(req.userRole?.name)) {
    filter.studentId = req.user._id;
  }
  if (paymentMode) filter.paymentMode = paymentMode;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .select("studentId installmentId amountPaid paymentMode status paymentDate receiptNo createdAt")
      .populate("studentId", "name regId")
      .populate("installmentId", "amount dueDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Payments fetched successfully",
    data: payments,
    meta: {
      page: Number(page),
      total,
    },
  });
});

export const paymentSummary = asyncHandler(async (req, res) => {
const schoolId = requireSchoolId(req.user);

  const [summary] = await Payment.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPaid" },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return sendSuccess(res, {
    message: "Payment summary fetched",
    data: summary || { totalAmount: 0, totalTransactions: 0 },
  });
});

export const getRazorpayConfig = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  const school = await School.findById(schoolId).select("+razorpay.keyId razorpay.accountId razorpay.isEnabled");
  if (!school) throw new ApiError(404, "School not found");

  return sendSuccess(res, {
    message: "Razorpay config fetched",
    data: {
      keyId: school.razorpay?.keyId || "",
      accountId: school.razorpay?.accountId || "",
      isEnabled: Boolean(school.razorpay?.isEnabled),
      hasKeySecret: Boolean(school.razorpay?.keySecret),
    },
  });
});

export const updateRazorpayConfig = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  const { keyId, keySecret, accountId, isEnabled } = req.body;
  const school = await School.findById(schoolId).select("+razorpay.keyId +razorpay.keySecret razorpay.accountId razorpay.isEnabled");
  if (!school) throw new ApiError(404, "School not found");

  school.razorpay = school.razorpay || {};
  school.razorpay.keyId = keyId?.trim();
  school.razorpay.accountId = accountId?.trim() || "";
  school.razorpay.isEnabled = Boolean(isEnabled);

  if (keySecret?.trim()) {
    school.razorpay.keySecret = keySecret.trim();
  }

  if (school.razorpay.isEnabled && (!school.razorpay.keyId || !school.razorpay.keySecret)) {
    throw new ApiError(400, "Key ID and Key Secret are required to enable Razorpay");
  }

  await school.save();

  return sendSuccess(res, {
    message: "Razorpay config updated successfully",
    data: {
      keyId: school.razorpay?.keyId || "",
      accountId: school.razorpay?.accountId || "",
      isEnabled: Boolean(school.razorpay?.isEnabled),
      hasKeySecret: Boolean(school.razorpay?.keySecret),
    },
  });
});
