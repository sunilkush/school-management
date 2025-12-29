import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import { FeeInstallment } from "../models/feeInstallment.model.js";
import { payInstallment } from "./feePayment.controller.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ================= RAZORPAY INSTANCE ================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =====================================================
   🔹 CREATE RAZORPAY ORDER
===================================================== */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { installmentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(installmentId)) {
    throw new ApiError(400, "Invalid installment ID");
  }

  const installment = await FeeInstallment.findById(installmentId);

  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  const payableAmount = installment.amount - installment.paidAmount;

  if (payableAmount <= 0) {
    throw new ApiError(400, "Installment already paid");
  }

  const order = await razorpay.orders.create({
    amount: payableAmount * 100, // paisa
    currency: "INR",
    receipt: `INST-${installmentId}`,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        installmentId,
      },
      "Razorpay order created"
    )
  );
});

/* =====================================================
   🔹 VERIFY PAYMENT + UPDATE INSTALLMENT & STUDENT FEE
===================================================== */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    installmentId,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new ApiError(400, "Incomplete Razorpay details");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  /* ===== Get installment to know exact remaining amount ===== */
  const installment = await FeeInstallment.findById(installmentId);

  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  const remainingAmount = installment.amount - installment.paidAmount;

  /* ===== Reuse existing logic ===== */
  req.params.installmentId = installmentId;
  req.body.amount = remainingAmount;

  return payInstallment(req, res);
});
