import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { requireSchoolId } from "../utils/resolveSchoolId.js";
import { summarizeFeeLines } from "../services/feeSchedule.service.js";

/* ================= CREATE ================= */
export const createFeeStructure = asyncHandler(async (req, res) => {
  const { schoolClassId, academicYearId, feeHeadId, amount, frequency } = req.body;
  // schoolId is resolved from the caller's own session (Super Admin may still override via
  // body.schoolId) — previously trusted req.body.schoolId outright for every role, letting a
  // School Admin/Accountant create a fee structure inside another school's namespace.
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin && req.body.schoolId ? req.body.schoolId : requireSchoolId(req.user);
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
    // amount is per period of frequency (see FeeStructure.amount).
    amountBasis: "per_period",
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

  const docs = await FeeStructure.find(filter)
    .populate("feeHeadId", "name type")
    .populate("schoolClassId", "name")
    .populate("academicYearId", "name")
    .lean();

  // periods and yearlyAmount are worked out here so no screen has to calculate them.
  const { rows } = summarizeFeeLines(docs.map((d) => ({ ...d, perPeriodAmount: d.amount })));
  const data = rows.map(({ perPeriodAmount: _p, ...row }) => row);

  res.status(200).json(new ApiResponse(200, data, "Fetched"));
});

/* ================= CLASS SUMMARY =================
   GET /fee-structures/summary?schoolClassId=&academicYearId=
   What one student of a class pays: Fee Head | Amount | Frequency | Per year, the total per
   frequency ("Total monthly ₹3,000") and the year total.
*/
export const getFeeStructureSummary = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { schoolClassId, academicYearId } = req.query;

  if (!mongoose.isValidObjectId(schoolClassId)) throw new ApiError(400, "Invalid schoolClassId");
  if (academicYearId && !mongoose.isValidObjectId(academicYearId)) throw new ApiError(400, "Invalid academicYearId");

  const docs = await FeeStructure.find({
    schoolId,
    schoolClassId,
    ...(academicYearId ? { academicYearId } : {}),
    isActive: { $ne: false },
  })
    .populate("feeHeadId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const summary = summarizeFeeLines(
    docs.map((d) => ({
      _id: d._id,
      feeHeadName: d.feeHeadId?.name || "Fee",
      frequency: d.frequency,
      perPeriodAmount: d.amount,
    }))
  );

  res.status(200).json(new ApiResponse(200, summary, "Fee summary"));
});

/* ================= UPDATE ================= */
export const updateFeeStructure = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;
  const query = schoolId ? { _id: req.params.id, schoolId } : { _id: req.params.id };
  const fee = await FeeStructure.findOne(query);
  if (!fee) throw new ApiError(404, "Not found");

  // schoolId must not be attacker-settable via the body — Object.assign would otherwise let a
  // caller reassign their own fee structure into another school's namespace.
  const { schoolId: _schoolId, _id, amountBasis: _amountBasis, ...updates } = req.body;
  Object.assign(fee, updates);
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
