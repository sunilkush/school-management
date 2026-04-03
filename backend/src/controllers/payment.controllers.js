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

  const school = await School.findById(schoolId).select("razorpay");
  if (!school || !school.razorpay?.keyId || !school.razorpay?.keySecret) {
    throw new ApiError(400, "Razorpay not configured for this school");
  }

  return {
    razorpay: new Razorpay({ key_id: school.razorpay.keyId, key_secret: school.razorpay.keySecret }),
    keySecret: school.razorpay.keySecret,
  };
};

const ensureInstallmentAccess = async ({ installmentId, schoolId }) => {
  const installment = await FeeInstallment.findById(installmentId);
  if (!installment) throw new ApiError(404, "Installment not found");
  if (installment.schoolId.toString() !== schoolId.toString()) throw new ApiError(403, "Unauthorized access");
  return installment;
};

export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, installmentId, amount, paymentMethod } = req.body;
  const schoolId = req.user.schoolId;

  const installment = await ensureInstallmentAccess({ installmentId, schoolId });

  if (amount > installment.amount - installment.paidAmount) {
    throw new ApiError(400, "Amount exceeds remaining due");
  }

  const payment = await Payment.create({
    schoolId,
    studentId,
    installmentId,
    amountPaid: amount,
    paymentMode: String(paymentMethod || "cash").toLowerCase(),
    status: "success",
    receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
  });

  installment.paidAmount += amount;
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
  const schoolId = req.user.schoolId;

  const installment = await ensureInstallmentAccess({ installmentId, schoolId });
  const payableAmount = installment.amount - installment.paidAmount;

  if (payableAmount <= 0) throw new ApiError(400, "Installment already paid");

  const { razorpay } = await getRazorpayInstance(schoolId);
  const order = await razorpay.orders.create({
    amount: payableAmount * 100,
    currency: "INR",
    receipt: `INST-${installmentId}`,
    notes: {
      schoolId: schoolId.toString(),
      installmentId,
      requestId: req.requestId,
    },
  });

  return sendSuccess(res, { message: "Razorpay order created", data: order });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, installmentId } = req.body;
  const schoolId = req.user.schoolId;

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
  const schoolId = req.user.schoolId;
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const filter = { schoolId };
  if (id) filter._id = id;
  if (["Student", "Parent"].includes(req.userRole?.name)) {
    filter.studentId = req.user._id;
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
  const schoolId = req.user.schoolId;

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
