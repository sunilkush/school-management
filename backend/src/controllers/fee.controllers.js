import mongoose from "mongoose";
import { Fees } from "../models/fees.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
/* =====================================================
   ✅ CREATE MASTER FEE  (Super Admin + School Admin)
=====================================================*/
export const createFees = asyncHandler(async (req, res) => {
  const { feeName, amount, dueDate, academicYearId, schoolId } = req.body;

  if (!feeName || !amount || !dueDate) {
    throw new ApiError(400, "Fee name, amount and dueDate are required");
  } 
  
  console.log("role:", req.user?.role?.name);

  if (req.user?.role?.name === "Super Admin") {
    if (!schoolId || !mongoose.isValidObjectId(schoolId)) {
      throw new ApiError(400, "Valid schoolId is required");
    }
  }
  if (req.user?.role?.name === "School Admin") {
    if (!schoolId || schoolId.toString() !== req.user?.school?._id.toString()) {
      throw new ApiError(403, "You can only create fees for your own school");
    }
  }


  const fee = await Fees.create({
    feeName,
    amount,
    dueDate,
    academicYearId: academicYearId,
    schoolId: schoolId,
    createdBy: req.user._id,
  });

  return res.json(new ApiResponse(201, fee, "Fee Created Successfully"));
});

/* =====================================================
   ✅ GET ALL FEES (School + Academic Year Wise)
===================================================== */
export const getAllFees = asyncHandler(async (req, res) => {
  const { academicYearId, schoolId } = req.query;

  const filter = {};
  
  /* ================= ROLE BASED SCHOOL ACCESS ================= */

  // SUPER ADMIN → can view any school (schoolId required in query)
  if (req.user?.role?.name === "Super Admin") {
    if (!schoolId || !mongoose.isValidObjectId(schoolId)) {
      throw new ApiError(400, "Valid schoolId is required");
    }
    filter.schoolId = new mongoose.Types.ObjectId(schoolId);
  }

  // SCHOOL ADMIN → only own school
  if (req.user?.role?.name === "School Admin") {
    filter.schoolId = new mongoose.Types.ObjectId(req.user?.school?._id);
  }

  /* ================= ACADEMIC YEAR FILTER ================= */

  if (academicYearId && mongoose.isValidObjectId(academicYearId)) {
    filter.academicYearId = new mongoose.Types.ObjectId(academicYearId);
  }

  /* ================= FETCH DATA ================= */

  const fees = await Fees.find(filter)
    .populate("academicYearId", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, fees, "Fees fetched successfully")
  );
});
/* =====================================================
   ✅ UPDATE FEE
===================================================== */
export const updateFee = asyncHandler(async (req, res) => {
  const updated = await Fees.findOneAndUpdate(
    {
      _id: req.params.id,
      schoolId: req.user?.school?._id,
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
    schoolId: req.user?.school?._id,
  });

  if (!deleted) {
    throw new ApiError(404, "Fee not found");
  }

  return res.json(
    new ApiResponse(200, null, "Fee deleted successfully")
  );
});
