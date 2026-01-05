import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { School } from "../models/school.model.js";
import { payInstallment } from "./feeInstallment.controllers.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   🔹 RAZORPAY INSTANCE (PER SCHOOL)
===================================================== */
const getRazorpayInstance = async (schoolId) => {
  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid school ID");
  }

  const school = await School.findById(schoolId).select("razorpay");

  if (!school || !school.razorpay?.keyId || !school.razorpay?.keySecret) {
    throw new ApiError(400, "Razorpay not configured for this school");
  }

  return {
    razorpay: new Razorpay({
      key_id: school.razorpay.keyId,
      key_secret: school.razorpay.keySecret,
    }),
    keySecret: school.razorpay.keySecret,
  };
};

/* =====================================================
   🔹 CREATE PAYMENT (MANUAL / CASH / UPI / ADMIN)
===================================================== */
export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, installmentId, amount, paymentMethod } = req.body;
  const schoolId = req.user.schoolId;

  if (!mongoose.Types.ObjectId.isValid(installmentId)) {
    throw new ApiError(400, "Invalid installment ID");
  }

  const installment = await FeeInstallment.findById(installmentId);

  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  if (installment.schoolId.toString() !== schoolId) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Invalid amount");
  }

  const payment = await Payment.create({
    schoolId,
    studentId,
    installmentId,
    amount,
    paymentMethod,
    status: "SUCCESS",
  });

  installment.paidAmount += amount;
  installment.status =
    installment.paidAmount >= installment.amount ? "PAID" : "PARTIAL";

  await installment.save();

  return res.status(201).json(
    new ApiResponse(201, payment, "Payment created successfully")
  );
});

/* =====================================================
   🔹 CREATE RAZORPAY ORDER
===================================================== */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { installmentId } = req.body;
  const schoolId = req.user.schoolId;

  const installment = await FeeInstallment.findById(installmentId);

  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  const payableAmount = installment.amount - installment.paidAmount;

  if (payableAmount <= 0) {
    throw new ApiError(400, "Installment already paid");
  }

  const { razorpay } = await getRazorpayInstance(schoolId);

  const order = await razorpay.orders.create({
    amount: payableAmount * 100,
    currency: "INR",
    receipt: `INST-${installmentId}`,
  });

  return res.status(200).json(
    new ApiResponse(200, order, "Razorpay order created")
  );
});

/* =====================================================
   🔹 VERIFY RAZORPAY PAYMENT
===================================================== */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    installmentId,
  } = req.body;

  const schoolId = req.user.schoolId;

  const { keySecret } = await getRazorpayInstance(schoolId);

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  const installment = await FeeInstallment.findById(installmentId);
  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  req.params.installmentId = installmentId;
  req.body.amount = installment.amount - installment.paidAmount;

  return payInstallment(req, res);
});

/* =====================================================
   🔹 GET PAYMENTS (ALL / SINGLE)
===================================================== */
export const getPayments = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { id } = req.params;

  const filter = { schoolId };

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    filter._id = id;
  }

  const payments = await Payment.find(filter)
    .populate("studentId", "name admissionNo")
    .populate("installmentId", "amount dueDate")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payments fetched successfully")
  );
});

/* =====================================================
   🔹 PAYMENT SUMMARY
===================================================== */
export const paymentSummary = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  const summary = await Payment.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      summary[0] || { totalAmount: 0, totalTransactions: 0 },
      "Payment summary fetched"
    )
  );
});
