import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
/* ================= CREATE ================= */
export const createFeeStructure = asyncHandler(async (req, res) => {
  const { schoolId, schoolClassId,  academicYearId, feeHeadId, amount, frequency } = req.body;
   for (const [key, value] of Object.entries({ schoolId, schoolClassId, academicYearId, feeHeadId })) {
    if (!mongoose.isValidObjectId(value)) {
      throw new ApiError(400, `Invalid ${key}`);
    }
  }
  const existing = await FeeStructure.findOne({
  schoolId,
  schoolClassId,
  academicYearId,
  feeHeadId,
});

if (existing) {
   throw new ApiError(409, "Fee structure already exists for this class");
}

  

  const fee = await FeeStructure.create({
    schoolId,
    schoolClassId,
    academicYearId,
    feeHeadId,
    amount,
    frequency,
  });

  res.status(201).json(new ApiResponse(201, fee, "FeeStructure created"));
});

/* ================= GET ================= */
export const getFeeStructures = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const filter = {};

  ["schoolId", "schoolClassId", "academicYearId"].forEach((k) => {
   if (!req.query[k]) return;

    if (!mongoose.isValidObjectId(req.query[k])) {
      throw new ApiError(400, `Invalid ${k}`);
    }

    filter[k] = req.query[k];
  });

  // Non-Super-Admin is always scoped to their own school
  if (!isSuperAdmin) {
    filter.schoolId = req.user.schoolId?.toString();
  }

  const data = await FeeStructure.find(filter)
    .populate("feeHeadId", "name")
    .populate("schoolClassId", "name")
    .populate("academicYearId", "name");

  res.status(200).json(new ApiResponse(200, data, "Fetched"));
});

/* ================= UPDATE ================= */
export const updateFeeStructure = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;
  const query = schoolId ? { _id: req.params.id, schoolId } : { _id: req.params.id };
  const fee = await FeeStructure.findOne(query);
  if (!fee) throw new ApiError(404, "Not found");

  Object.assign(fee, req.body);
  await fee.save();

  res.status(200).json(new ApiResponse(200, fee, "Updated"));
});

/* ================= DELETE ================= */
export const deleteFeeStructure = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;
  const query = schoolId ? { _id: req.params.id, schoolId } : { _id: req.params.id };
  const fee = await FeeStructure.findOneAndDelete(query);
  if (!fee) throw new ApiError(404, "Not found");
  res.status(200).json(new ApiResponse(200, null, "Deleted"));
});
