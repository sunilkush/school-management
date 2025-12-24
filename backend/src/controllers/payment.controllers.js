import { Payment } from "../models/payment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.create(req.body);
  res.status(201).json(new ApiResponse(201, payment, "Payment successful"));
});

export const getPayments = asyncHandler(async (req, res) => {
  const data = await Payment.find()
    .populate("studentId", "name")
    .populate("installmentId");

  res.status(200).json(new ApiResponse(200, data, "Payments fetched"));
});
