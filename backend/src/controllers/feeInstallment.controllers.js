import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { Student } from "../models/student.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import { actingRoleName } from "../utils/actingRole.js";
import {
  FEE_FREQUENCIES,
  PAY_PLANS,
  applyPayPlan,
  draftPayPlan,
  generateSchedules,
  getFeeSettings,
  outstandingOf,
  refreshInstallments,
  round2,
} from "../services/feeSchedule.service.js";

// 🔒 Student/Parent may only ever read their own (or their linked child's) records — filtering by
// {studentId, schoolId} alone would let any authenticated Student/Parent pass an arbitrary
// studentId and read an unrelated student's fees.
//
// The role is worked out from every role the caller holds, not the primary one: the routes admit
// additional roles, so a Teacher holding "Parent" as an additional role got in as a Parent, and a
// primary-role check then read "teacher" and skipped the ownership test for any student.
// Mirrors the roles on GET / and POST /quote in routes/feeInstallment.routes.js, broadest first.
const INSTALLMENT_READ_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];
const assertOwnsStudentRecord = async ({ user, studentId, schoolId }) => {
  const userId = user._id;
  const role = actingRoleName(user, INSTALLMENT_READ_ROLES)?.toLowerCase();
  if (!role) throw new ApiError(403, "Forbidden. Insufficient role access.");
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

  await assertOwnsStudentRecord({ user: req.user, studentId, schoolId });

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
    // A family on a pay plan pays every head on that plan, whatever the head's own frequency.
    const frequency = fee.payPlan || structure.frequency || "yearly";
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

  /* What falls due together, as one line: "Oct 2026 — ₹3,500". A fee screen for a parent shows
     these rather than one row per fee head. */
  const STATUS_RANK = { overdue: 3, partial: 2, pending: 1, paid: 0 };
  const periodMap = new Map();
  for (const row of rows) {
    const day = new Date(row.dueDate);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}|${row.installmentName}`;
    if (!periodMap.has(key)) {
      periodMap.set(key, { key, label: row.installmentName, dueDate: row.dueDate, amount: 0, fineAmount: 0, paidAmount: 0, balance: 0, status: "paid", dueNow: false, installmentIds: [], lines: [] });
    }
    const p = periodMap.get(key);
    p.amount = round2(p.amount + row.amount);
    p.fineAmount = round2(p.fineAmount + row.fineAmount);
    p.paidAmount = round2(p.paidAmount + row.paidAmount);
    p.balance = round2(p.balance + row.balance);
    if (STATUS_RANK[row.status] > STATUS_RANK[p.status]) p.status = row.status;
    if (row.dueNow) p.dueNow = true;
    if (row.balance > 0) p.installmentIds.push(row._id);
    p.lines.push({ _id: row._id, feeHeadName: row.feeHeadName, amount: row.amount, fineAmount: row.fineAmount, paidAmount: row.paidAmount, balance: row.balance, status: row.status });
  }
  const periods = [...periodMap.values()];

  /* The three ways to pay, each with what it would come to from today. */
  const plansInUse = new Set(studentFees.map((f) => f.payPlan || null));
  const payPlan = plansInUse.size === 1 ? [...plansInUse][0] : null;
  let planOptions = [];
  if (academicYearId && studentFees.length) {
    planOptions = await Promise.all(PAY_PLANS.map(async (plan) => {
      const draft = await draftPayPlan({ schoolId, studentId, academicYearId, plan });
      const byDue = new Map();
      draft.forEach((d) => d.created.forEach((doc) => {
        const k = `${new Date(doc.dueDate).getTime()}|${doc.installmentName}`;
        if (!byDue.has(k)) byDue.set(k, { label: doc.installmentName, dueDate: doc.dueDate, amount: 0 });
        byDue.get(k).amount = round2(byDue.get(k).amount + doc.amount);
      }));
      const upcoming = [...byDue.values()].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      return {
        plan,
        label: FEE_FREQUENCIES[plan].label,
        count: upcoming.length,
        amountEach: upcoming[0]?.amount || 0,
        firstDue: upcoming[0]?.dueDate || null,
        lastDue: upcoming[upcoming.length - 1]?.dueDate || null,
        total: round2(upcoming.reduce((s, u) => s + u.amount, 0)),
        // Stays as it is whichever plan is chosen: already due, or partly paid.
        staysDue: round2(draft.reduce((s, d) => s + d.kept.reduce((t, k) => t + outstandingOf(k), 0), 0)),
      };
    }));
  }
  const role = actingRoleName(req.user, INSTALLMENT_READ_ROLES)?.toLowerCase();

  return res.status(200).json(
    new ApiResponse(
      200,
      { installments: rows, periods, heads, perFrequency, totals, settings, payPlan, planOptions, canChoosePlan: role !== "student" },
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

  await assertOwnsStudentRecord({ user: req.user, studentId, schoolId });

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

/* =====================================================
   ✅ CHOOSE A PAY PLAN
   POST /fee-installments/plan   { studentId, academicYearId, plan: monthly | quarterly | yearly }

   The year's fee, split the way the family wants to pay it. Paid and partly paid installments
   stay; so does anything that was already due before today. The rest is re-split evenly over the
   plan's periods still ahead. Staff may pass respreadArrears to re-split overdue ones as well.
===================================================== */
export const choosePayPlan = asyncHandler(async (req, res) => {
  const { studentId, academicYearId, plan } = req.body || {};
  const schoolId = resolveSchoolId(req.user);
  validateIds({ schoolId, studentId, academicYearId });
  if (!academicYearId) throw new ApiError(400, "academicYearId is required");
  if (!PAY_PLANS.includes(plan)) throw new ApiError(400, "Plan must be monthly, quarterly or yearly");

  await assertOwnsStudentRecord({ user: req.user, studentId, schoolId });
  const role = actingRoleName(req.user, INSTALLMENT_READ_ROLES)?.toLowerCase();
  if (role === "student") throw new ApiError(403, "A parent or the school office chooses the pay plan");

  const hasFees = await StudentFee.exists({ schoolId, studentId, academicYearId });
  if (!hasFees) throw new ApiError(404, "No fees have been assigned for this academic year");

  await refreshInstallments({ schoolId, studentId, academicYearId });
  const result = await applyPayPlan({
    schoolId, studentId, academicYearId, plan,
    respreadArrears: role !== "parent" && req.body?.respreadArrears === true,
  });

  return res.status(200).json(new ApiResponse(200, result, `Pay plan set to ${FEE_FREQUENCIES[plan].label.toLowerCase()}`));
});
