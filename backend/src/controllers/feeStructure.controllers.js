import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createFeeStructure = asyncHandler(async (req, res) => {
  const { schoolId, classId,  academicYearId, feeHeadId, amount, frequency } = req.body;

  const exists = await FeeStructure.findOne({
    schoolId,
    classId,
    academicYearId,
    feeHeadId,
  });

  if (exists) throw new ApiError(409, "FeeStructure already exists");

  const fee = await FeeStructure.create({
    schoolId,
    classId,
    academicYearId,
    feeHeadId,
    amount,
    frequency,
  });

  res.status(201).json(new ApiResponse(201, fee, "FeeStructure created"));
});

/* ================= GET ================= */
export const getFeeStructures = asyncHandler(async (req, res) => {
  const filter = {};

  ["schoolId", "classId", "academicYearId"].forEach((k) => {
    if (req.query[k]) filter[k] = req.query[k];
  });

  const data = await FeeStructure.find(filter)
    .populate("feeHeadId", "name")
    .populate("classId", "name")
    .populate("academicYearId", "name");

  res.status(200).json(new ApiResponse(200, data, "Fetched"));
});

/* ================= UPDATE ================= */
export const updateFeeStructure = asyncHandler(async (req, res) => {
  const fee = await FeeStructure.findById(req.params.id);
  if (!fee) throw new ApiError(404, "Not found");

  Object.assign(fee, req.body);
  await fee.save();

  res.status(200).json(new ApiResponse(200, fee, "Updated"));
});

/* ================= DELETE ================= */
export const deleteFeeStructure = asyncHandler(async (req, res) => {
  await FeeStructure.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Deleted"));
});
