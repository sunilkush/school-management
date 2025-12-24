import mongoose from "mongoose";
import { Fees } from "../models/fees.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import {Role} from "../models/Roles.model.js";
/* =====================================================
   ✅ CREATE MASTER FEE  (Super Admin + School Admin)
=====================================================*/
export const createFees = asyncHandler(async (req, res) => {
  const {
    feeName,
    amount,
    frequency,
    dueDate,
    classId,
    sectionId,
    academicYearId,
    schoolId,
  } = req.body;

  if (!["Super Admin", "School Admin"].includes(req.user.role)) {
    throw new ApiError(403, "You are not allowed to declare fees");
  }

  const finalSchoolId =
    req.user.role === "School Admin" ? req.user.schoolId : schoolId;

  if (!finalSchoolId) {
    throw new ApiError(400, "School is required");
  }

  const exists = await Fees.findOne({
    feeName,
    classId,
    sectionId,
    academicYearId,
    schoolId: finalSchoolId,
    isActive: true,
  });

  if (exists) {
    throw new ApiError(409, "Fee already declared for this class");
  }

  const fee = await Fees.create({
    feeName,
    amount,
    frequency,
    dueDate,
    classId,
    sectionId,
    academicYearId,
    schoolId: finalSchoolId,
    declaredBy: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, fee, "Fees declared successfully"));
});

/* =====================================================
   ✅ GET ALL FEES (School + Academic Year Wise)
===================================================== */
export const getAllFees = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  /* ================= REQUIRED / COMMON FILTERS ================= */

  if (req.query.schoolId) {
    filter.schoolId = req.query.schoolId;
  }

  if (req.query.academicYearId) {
    filter.academicYearId = req.query.academicYearId;
  }

  /* ================= OPTIONAL FILTERS ================= */

  if (req.query.classId) {
    filter.classId = req.query.classId;
  }

  if (req.query.sectionId) {
    filter.sectionId = req.query.sectionId;
  }

  const fees = await Fees.find(filter)
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("academicYearId", "name")
    .populate("schoolId", "name")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, fees, "Fees list fetched successfully")
  );
});





/* =====================================================
   ✅ UPDATE FEE
===================================================== */
export const updateFee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const fee = await Fees.findById(id);
  if (!fee) {
    throw new ApiError(404, "Fee not found");
  }

  if (
    req.user.role === "School Admin" &&
    fee.schoolId.toString() !== req.user.schoolId.toString()
  ) {
    throw new ApiError(403, "You cannot update this fee");
  }

  Object.assign(fee, req.body);
  await fee.save();

  res
    .status(200)
    .json(new ApiResponse(200, fee, "Fees updated successfully"));
});

/* =====================================================
   ✅ DELETE FEE
===================================================== */
export const deleteFee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const fee = await Fees.findById(id);
  if (!fee) {
    throw new ApiError(404, "Fee not found");
  }

  if (
    req.user.role === "School Admin" &&
    fee.schoolId.toString() !== req.user.schoolId.toString()
  ) {
    throw new ApiError(403, "You cannot delete this fee");
  }

  fee.isActive = false;
  await fee.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Fees deleted successfully"));
});

