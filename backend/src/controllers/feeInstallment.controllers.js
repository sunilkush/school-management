import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { Student } from "../models/student.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  FEE_FREQUENCIES,
  generateSchedules,
  getFeeSettings,
  outstandingOf,
  refreshInstallments,
  round2,
} from "../services/feeSchedule.service.js";

// 🔒 Student/Parent may only ever read their own (or their linked child's) records — filtering by
// {studentId, schoolId} alone would let any authenticated Student/Parent pass an arbitrary
// studentId and read an unrelated student's fees.
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
  // Accountant / School Admin / Super Admin: no further restriction beyond schoolId in the query.
};

const validateIds = ({ schoolId, studentId, academicYearId }) => {
  if (!schoolId) throw new ApiError(400, "School not found");
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid studentId");
  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId");
  }
};

/* =====================================================
   ✅ GENERATE MISSING SCHEDULES (staff only)
   Schedules are created when a fee is assigned. This only fills in fee records that have none —
   ones assigned before schedules were generated automatically.
===================================================== */
export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentId, academicYearId } = req.body;
  const schoolId = resolveSchoolId(req.user);
  validateIds({ schoolId, studentId, academicYearId });

  const feeFilter = { studentId, schoolId };
  if (academicYearId) feeFilter.academicYearId = academicYearId;

  const studentFees = await StudentFee.find(feeFilter).populate("feeStructureId", "frequency");
  if (!studentFees.length) throw new ApiError(404, "No fee records found for this student");

  let created = 0;
  const byYear = new Map();
  for (const fee of studentFees) {
    const key = String(fee.academicYearId);
    if (!byYear.has(key)) byYear.set(key, []);
    byYear.get(key).push(fee);
  }

  for (const [yearId, fees] of byYear) {
    // eslint-disable-next-line no-await-in-loop
    const academicYear = await AcademicYear.findOne({ _id: yearId, schoolId }).select("startDate").lean();
    // eslint-disable-next-line no-await-in-loop
    created += await generateSchedules({
      studentFees: fees,
      academicYear,
      schoolId,
      // Back-filled schedules follow the academic year's calendar; whatever is already past due
      // is genuinely late.
      assignedAt: academicYear?.startDate || new Date(),
    });
  }

  if (!created) throw new ApiError(400, "Every fee for this student already has its installments");

  return res.status(201).json(new ApiResponse(201, { created }, "Installments generated successfully"));
});

/* =====================================================
   ✅ STUDENT FEE SCHEDULE
   GET /fee-installments?studentId=&academicYearId=

   Returns every installment (fine and status current as of today) plus the summary a fee
   screen needs:
     heads   — Fee Head | Amount | Frequency | Yearly, with paid/due per head
     perFrequency — "Total monthly ₹3,000", quarterly, …
     totals  — year fee, fine, paid, due, overdue
===================================================== */
export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId, academicYearId } = req.query;
  const schoolId = resolveSchoolId(req.user);
  validateIds({ schoolId, studentId, academicYearId });

  await assertOwnsStudentRecord({ roleName: req.userRole?.name, userId: req.user._id, studentId, schoolId });

  await refreshInstallments({ schoolId, studentId, academicYearId: academicYearId || null });

  const filter = { studentId, schoolId };
  if (academicYearId) filter.academicYearId = academicYearId;

  const [installments, studentFees, settings] = await Promise.all([
    FeeInstallment.find(filter)
      .populate({
        path: "studentFeeId",
        select: "feeStructureId",
        populate: { path: "feeStructureId", select: "feeHeadId", populate: { path: "feeHeadId", select: "name" } },
      })
      .sort({ dueDate: 1, periodIndex: 1 })
      .lean(),
    StudentFee.find(filter)
      .populate({ path: "feeStructureId", select: "amount frequency feeHeadId", populate: { path: "feeHeadId", select: "name type" } })
      .sort({ createdAt: 1 })
      .lean(),
    getFeeSettings(schoolId),
  ]);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const rows = installments.map((inst) => ({
    _id: inst._id,
    studentFeeId: inst.studentFeeId?._id || inst.studentFeeId,
    feeHeadName: inst.studentFeeId?.feeStructureId?.feeHeadId?.name || "Fee",
    installmentName: inst.installmentName,
    frequency: inst.installmentType || "yearly",
    periodIndex: inst.periodIndex || 0,
    dueDate: inst.dueDate,
    amount: round2(inst.amount),
    fineAmount: round2(inst.fineAmount),
    paidAmount: round2(inst.paidAmount),
    balance: outstandingOf(inst),
    status: inst.status === "late" ? "overdue" : inst.status,
    // Owed by today — what "Select all due" picks.
    dueNow: outstandingOf(inst) > 0 && new Date(inst.dueDate) <= endOfToday,
  }));

  const instByFee = new Map();
  for (const row of rows) {
    const key = String(row.studentFeeId);
    if (!instByFee.has(key)) instByFee.set(key, []);
    instByFee.get(key).push(row);
  }

  const perFrequency = {};
  const heads = studentFees.map((fee) => {
    const structure = fee.feeStructureId || {};
    const frequency = structure.frequency || "yearly";
    const feeRows = instByFee.get(String(fee._id)) || [];
    const periods = FEE_FREQUENCIES[frequency]?.periods || 1;
    // What this student is charged per period, after discount — not the structure's list price.
    const perPeriod = round2(fee.totalAmount / periods);
    perFrequency[frequency] = round2((perFrequency[frequency] || 0) + perPeriod);

    return {
      studentFeeId: fee._id,
      feeHeadName: structure.feeHeadId?.name || "Fee",
      feeHeadType: structure.feeHeadId?.type || null,
      frequency,
      listAmount: round2(structure.amount),
      perPeriodAmount: perPeriod,
      yearlyAmount: round2(fee.totalAmount),
      discountApplied: fee.discountApplied || null,
      fineAmount: round2(fee.fineAmount),
      paidAmount: round2(fee.paidAmount),
      dueAmount: round2(fee.dueAmount),
      status: fee.status,
      overdueAmount: round2(feeRows.filter((r) => r.status === "overdue").reduce((s, r) => s + r.balance, 0)),
      nextDueDate: feeRows.find((r) => r.balance > 0)?.dueDate || null,
      hasSchedule: feeRows.length > 0,
    };
  });

  const sum = (list, key) => round2(list.reduce((s, x) => s + Number(x[key] || 0), 0));
  const totals = {
    yearlyAmount: sum(heads, "yearlyAmount"),
    fineAmount: sum(heads, "fineAmount"),
    paidAmount: sum(heads, "paidAmount"),
    dueAmount: sum(heads, "dueAmount"),
    overdueAmount: sum(rows.filter((r) => r.status === "overdue"), "balance"),
    // Due by today: everything overdue plus whatever falls due today.
    dueNowAmount: sum(rows.filter((r) => r.dueNow), "balance"),
    dueNowCount: rows.filter((r) => r.dueNow).length,
    overdueCount: rows.filter((r) => r.status === "overdue").length,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { installments: rows, heads, perFrequency, totals, settings },
      "Fee schedule fetched successfully"
    )
  );
});

/* =====================================================
   ✅ QUOTE
   POST /fee-installments/quote   { studentId, installmentIds: [] }

   What the chosen installments owe right now, fines included — the figure a fee screen shows
   before collecting or paying. Screens never add balances themselves; the payment is checked
   against the same figure again when it is recorded.
===================================================== */
export const quoteInstallments = asyncHandler(async (req, res) => {
  const { studentId, installmentIds } = req.body || {};
  const schoolId = resolveSchoolId(req.user);
  validateIds({ schoolId, studentId });

  const ids = [...new Set((Array.isArray(installmentIds) ? installmentIds : []).map(String))];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) throw new ApiError(400, "Invalid installment id");

  await assertOwnsStudentRecord({ roleName: req.userRole?.name, userId: req.user._id, studentId, schoolId });

  if (!ids.length) {
    return res.status(200).json(new ApiResponse(200, { total: 0, count: 0, installments: [] }, "Quote"));
  }

  await refreshInstallments({ schoolId, studentId });

  const installments = await FeeInstallment.find({ _id: { $in: ids }, schoolId, studentId })
    .populate({
      path: "studentFeeId",
      select: "feeStructureId",
      populate: { path: "feeStructureId", select: "feeHeadId", populate: { path: "feeHeadId", select: "name" } },
    })
    .sort({ dueDate: 1, periodIndex: 1 })
    .lean();

  if (installments.length !== ids.length) {
    throw new ApiError(404, "Some selected installments were not found for this student");
  }

  const lines = installments.map((inst) => ({
    _id: inst._id,
    feeHeadName: inst.studentFeeId?.feeStructureId?.feeHeadId?.name || "Fee",
    installmentName: inst.installmentName,
    fineAmount: round2(inst.fineAmount),
    balance: outstandingOf(inst),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      { total: round2(lines.reduce((s, l) => s + l.balance, 0)), count: lines.length, installments: lines },
      "Quote"
    )
  );
});
