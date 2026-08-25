import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { Student } from "../models/student.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";

// 🔒 Student/Parent may only ever read or generate installments for their own (or their linked
// child's) records — filtering by {studentId, schoolId} alone (as both handlers below used to)
// lets any authenticated Student/Parent/Accountant pass an arbitrary studentId and read or
// generate installments for a completely unrelated student. Mirrors the ownership check already
// used correctly elsewhere in this codebase (studentFee.controllers.js getMyFees/payStudentFee).
const assertOwnsStudentRecord = async ({ roleName, userId, studentId, schoolId }) => {
  const role = roleName?.toLowerCase();
  if (role === "student") {
    const owns = await Student.exists({ _id: studentId, userId, schoolId });
    if (!owns) throw new ApiError(403, "Access denied: this student record does not belong to you");
  } else if (role === "parent") {
    const owns = await Student.exists({
      _id: studentId,
      schoolId,
      $or: [{ fatherId: userId }, { motherId: userId }, { guardianId: userId }],
    });
    if (!owns) throw new ApiError(403, "This student is not linked with this parent");
  }
  // Accountant / School Admin / Super Admin: no further restriction beyond the schoolId already in the query filter.
};

/* =====================================================
   ✅ GENERATE INSTALLMENTS (Monthly | Quarterly | Yearly)
===================================================== */
const VALID_FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly"];

export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentId, academicYearId, frequency: requestedFrequency } = req.body;
  const schoolId = resolveSchoolId(req.user);

  if (requestedFrequency && !VALID_FREQUENCIES.includes(requestedFrequency)) {
    throw new ApiError(400, `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(", ")}`);
  }

  if (!schoolId) {
    throw new ApiError(400, "School not found");
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId");
  }

  await assertOwnsStudentRecord({ roleName: req.userRole?.name, userId: req.user._id, studentId, schoolId });

  const feeFilter = { studentId, schoolId };
  if (academicYearId) feeFilter.academicYearId = academicYearId;

  const studentFees = await StudentFee.find(feeFilter).populate("feeStructureId", "frequency");

  if (!studentFees.length) {
    throw new ApiError(404, "No fee records found for this student");
  }

  const allInstallments = [];

  // One batched lookup for every fee record's existing installments, instead of a separate
  // FeeInstallment.exists() query per fee — studentFees here is small (one student's own fee
  // records), but there's no reason to pay per-record round-trips for it.
  const existingInstallments = await FeeInstallment.find({
    studentFeeId: { $in: studentFees.map((f) => f._id) },
    schoolId,
  })
    .select("studentFeeId academicYearId")
    .lean();

  const existingByFeeId = new Map();
  for (const inst of existingInstallments) {
    const key = String(inst.studentFeeId);
    if (!existingByFeeId.has(key)) existingByFeeId.set(key, []);
    existingByFeeId.get(key).push(inst.academicYearId ? String(inst.academicYearId) : null);
  }
  // Mirrors the original per-fee query's semantics: with no academicYearId filter, ANY
  // existing installment for that fee counts; with one, only a matching year does.
  const hasExistingInstallment = (feeId, effectiveAcademicYearId) => {
    const years = existingByFeeId.get(String(feeId));
    if (!years) return false;
    return effectiveAcademicYearId ? years.includes(String(effectiveAcademicYearId)) : years.length > 0;
  };

  for (const fee of studentFees) {
    const effectiveAcademicYearId = academicYearId || fee.academicYearId;

    if (hasExistingInstallment(fee._id, effectiveAcademicYearId)) continue;

    const frequency = requestedFrequency || fee?.feeStructureId?.frequency || "yearly";

    const count =
      frequency === "monthly" ? 12 :
      frequency === "quarterly" ? 4 :
      frequency === "half_yearly" ? 2 :
      1;

    const gap =
      frequency === "monthly" ? 1 :
      frequency === "quarterly" ? 3 :
      frequency === "half_yearly" ? 6 :
      12;

    const amount = Number((fee.totalAmount / count).toFixed(2));
    const baseDate = new Date();

    for (let i = 1; i <= count; i++) {
      allInstallments.push({
        schoolId,
        academicYearId: effectiveAcademicYearId,
        studentId,
        studentFeeId: fee._id,
        installmentType: frequency,
        installmentName:
          frequency === "monthly"
            ? baseDate.toLocaleString("default", { month: "short" })
            : frequency === "quarterly"
            ? `Q${i}`
            : frequency === "half_yearly"
            ? `H${i}`
            : "Yearly",
        amount,
        paidAmount: 0,
        dueDate: new Date(baseDate),
        status: "pending",
      });

      baseDate.setMonth(baseDate.getMonth() + gap);
    }
  }

  if (!allInstallments.length) {
    throw new ApiError(400, "Installments already generated");
  }

  const created = await FeeInstallment.insertMany(allInstallments);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Installments generated successfully"));
});


/* =====================================================
   ✅ GET INSTALLMENTS + FEE HEAD NAMES (FIXED)
===================================================== */
export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId, academicYearId } = req.query;
  const schoolId = resolveSchoolId(req.user);

  if (!schoolId) {
    throw new ApiError(400, "School not found");
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId");
  }

  await assertOwnsStudentRecord({ roleName: req.userRole?.name, userId: req.user._id, studentId, schoolId });

  const filter = { studentId, schoolId };
  if (academicYearId) filter.academicYearId = academicYearId;

  const installments = await FeeInstallment.find(filter)
    .populate({
      path: "studentFeeId",
      select: "totalAmount paidAmount dueAmount status feeStructureId",
      populate: {
        path: "feeStructureId",
        select: "amount feeHeadId frequency",
        populate: {
          path: "feeHeadId",
          select: "name",
        },
      },
    })
    .populate("academicYearId", "name")
    .sort({ dueDate: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, installments, "Installments fetched successfully"));
});
// A payInstallment endpoint used to live here (POST /fee-installments/pay/:installmentId),
// duplicating money-movement logic now centralized in services/feePayment.service.js's
// applyFeePayment, which every real payment entry point (payment.controllers.js's
// createPayment, studentFee.controllers.js's payStudentFee) goes through instead. Removed as
// dead code — confirmed zero frontend callers.
