import mongoose from "mongoose";
import { FeeStructure } from "../models/feeStructure.model.js";
import { FeeHead } from "../models/feeHead.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ CREATE FEE STRUCTURE (Super Admin / School Admin)
===================================================== */
export const createFeeStructure = asyncHandler(async (req, res) => {
  const {
    schoolId,
    classId,
    sessionId,
    feeHeadId,
    amount,
    frequency,
  } = req.body;

  if (!["Super Admin", "School Admin"].includes(req.user.role)) {
    throw new ApiError(403, "Not allowed to create fee structure");
  }

  const finalSchoolId =
    req.user.role === "School Admin"
      ? req.user.schoolId
      : schoolId;

  if (!finalSchoolId) {
    throw new ApiError(400, "School is required");
  }

  // prevent duplicate
  const exists = await FeeStructure.findOne({
    schoolId: finalSchoolId,
    classId,
    sessionId,
    feeHeadId,
  });

  if (exists) {
    throw new ApiError(
      409,
      "Fee structure already exists for this class & fee head"
    );
  }

  const feeStructure = await FeeStructure.create({
    schoolId: finalSchoolId,
    classId,
    sessionId,
    feeHeadId,
    amount,
    frequency,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      feeStructure,
      "Fee structure created successfully"
    )
  );
});

export const getFeeStructures = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.schoolId) {
    filter.schoolId = req.query.schoolId;
  }

  if (req.query.sessionId) {
    filter.sessionId = req.query.sessionId;
  }

  if (req.query.classId) {
    filter.classId = req.query.classId;
  }

  const fees = await FeeStructure.find(filter)
    .populate("classId", "name")
    .populate("sessionId", "name")
    .populate("feeHeadId", "name type")
    .populate("schoolId", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, fees, "Fee structures fetched successfully")
  );
});

export const updateFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const fee = await FeeStructure.findById(id);
  if (!fee) {
    throw new ApiError(404, "Fee structure not found");
  }

  if (
    req.user.role === "School Admin" &&
    fee.schoolId.toString() !== req.user.schoolId.toString()
  ) {
    throw new ApiError(403, "You cannot update this fee structure");
  }

  Object.assign(fee, req.body);
  await fee.save();

  return res.status(200).json(
    new ApiResponse(200, fee, "Fee structure updated successfully")
  );
});

export const deleteFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const fee = await FeeStructure.findById(id);
  if (!fee) {
    throw new ApiError(404, "Fee structure not found");
  }

  if (
    req.user.role === "School Admin" &&
    fee.schoolId.toString() !== req.user.schoolId.toString()
  ) {
    throw new ApiError(403, "You cannot delete this fee structure");
  }

  await fee.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Fee structure deleted successfully")
  );
});
