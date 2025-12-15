import mongoose from "mongoose";
import { Fees } from "../models/fees.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ CREATE MASTER FEE  (Super Admin + School Admin)
=====================================================*/
export const createFees = asyncHandler(async (req, res) => {
  const { feeName, amount, dueDate, academicYearId, schoolId } = req.body;

  if (!feeName || !amount || !dueDate) {
    throw new ApiError(400, "Fee name, amount and dueDate are required");
  }

  // ✅ schoolId
  const finalSchoolId =
    req.user.role === "super_admin"
      ? schoolId
      : req.user.schoolId;

  if (!finalSchoolId) {
    throw new ApiError(400, "School Id is required");
  }

  // ✅ academic year
  const finalAcademicYear =
    academicYearId || req.user.activeAcademicYearId;

  const fee = await Fees.create({
    feeName,
    amount,
    dueDate,
    academicYearId: finalAcademicYear,
    schoolId: finalSchoolId,
    createdBy: req.user._id,
  });

  return res.json(new ApiResponse(201, fee, "Fee Created Successfully"));
});

/* =====================================================
   ✅ GET ALL FEES (School + Academic Year Wise)
===================================================== */
export const getAllFees = asyncHandler(async (req, res) => {
  const { academicYearId } = req.query;

  const filter = {
    schoolId: req.user.schoolId,
  };

  if (academicYearId && mongoose.isValidObjectId(academicYearId)) {
    filter.academicYearId = academicYearId;
  }

  const data = await Fees.find(filter)
    .populate("academicYearId", "name")
    .sort({ createdAt: -1 });

  return res.json(new ApiResponse(200, data));
});

/* =====================================================
   ✅ UPDATE FEE
===================================================== */
export const updateFee = asyncHandler(async (req, res) => {
  const updated = await Fees.findOneAndUpdate(
    {
      _id: req.params.id,
      schoolId: req.user.schoolId,
    },
    req.body,
    { new: true }
  );

  if (!updated) {
    throw new ApiError(404, "Fee not found");
  }

  return res.json(
    new ApiResponse(200, updated, "Fee updated successfully")
  );
});

/* =====================================================
   ✅ DELETE FEE
===================================================== */
export const deleteFee = asyncHandler(async (req, res) => {
  const deleted = await Fees.findOneAndDelete({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });

  if (!deleted) {
    throw new ApiError(404, "Fee not found");
  }

  return res.json(
    new ApiResponse(200, null, "Fee deleted successfully")
  );
});
