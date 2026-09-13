import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { School } from "../models/school.model.js";

/**
 * The fee calendar: how a fee head's per-period amount becomes a student's dated installments,
 * and how those installments turn overdue and pick up late fines.
 *
 * FeeStructure.amount is the charge for ONE period. Tuition ₹2,000 monthly means twelve
 * installments of ₹2,000 — ₹24,000 for the year.
 */

/** Keep in step with the FeeStructure.frequency enum. */
export const FEE_FREQUENCIES = {
  monthly: { periods: 12, monthsApart: 1, label: "Monthly" },
  quarterly: { periods: 4, monthsApart: 3, label: "Quarterly" },
  half_yearly: { periods: 2, monthsApart: 6, label: "Half-yearly" },
  yearly: { periods: 1, monthsApart: 12, label: "Yearly" },
  one_time: { periods: 1, monthsApart: 12, label: "One-time" },
};

export const periodsPerYear = (frequency) => FEE_FREQUENCIES[frequency]?.periods ?? 1;

export const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * The one place fee figures are worked out for display. Screens never multiply or add amounts
 * themselves — they show what this returns.
 *
 * `lines`: [{ ...anything, frequency, perPeriodAmount }]
 * Returns each line with `periods` and `yearlyAmount`, the per-frequency totals ("Total monthly
 * ₹3,000") and the year total.
 */
export const summarizeFeeLines = (lines) => {
  const perFrequency = {};
  const rows = lines.map((line) => {
    const frequency = FEE_FREQUENCIES[line.frequency] ? line.frequency : "yearly";
    const perPeriodAmount = round2(line.perPeriodAmount);
    const periods = periodsPerYear(frequency);
    perFrequency[frequency] = round2((perFrequency[frequency] || 0) + perPeriodAmount);
    return { ...line, frequency, perPeriodAmount, periods, yearlyAmount: round2(perPeriodAmount * periods) };
  });
  return { rows, perFrequency, yearlyTotal: round2(rows.reduce((s, r) => s + r.yearlyAmount, 0)) };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/* ── School settings ─────────────────────────────────────────────── */

export const DEFAULT_FEE_SETTINGS = Object.freeze({
  dueDay: 10,
  lateFine: Object.freeze({ enabled: false, type: "fixed", amount: 0, graceDays: 0, maxAmount: 0 }),
});

/** A school's fee settings with defaults filled in — schools created before these existed have none. */
export const normalizeFeeSettings = (raw) => ({
  dueDay: Math.min(Math.max(Number(raw?.dueDay) || DEFAULT_FEE_SETTINGS.dueDay, 1), 28),
  lateFine: {
    enabled: Boolean(raw?.lateFine?.enabled),
    type: raw?.lateFine?.type === "per_day" ? "per_day" : "fixed",
    amount: Math.max(Number(raw?.lateFine?.amount) || 0, 0),
    graceDays: Math.max(Number(raw?.lateFine?.graceDays) || 0, 0),
    maxAmount: Math.max(Number(raw?.lateFine?.maxAmount) || 0, 0),
  },
});

export const getFeeSettings = async (schoolId, session = null) => {
  const school = await School.findById(schoolId).select("feeSettings").session(session).lean();
  return normalizeFeeSettings(school?.feeSettings);
};

/* ── Building a schedule ─────────────────────────────────────────── */

const periodLabel = (frequency, index, periodStart) => {
  const m = periodStart.getMonth();
  const span = (months) => `${MONTHS[m]}–${MONTHS[(m + months - 1) % 12]}`;
  switch (frequency) {
    case "monthly":
      return `${MONTHS[m]} ${periodStart.getFullYear()}`;
    case "quarterly":
      return `Q${index + 1} (${span(3)})`;
    case "half_yearly":
      return `H${index + 1} (${span(6)})`;
    case "one_time":
      return "One-time";
    default:
      return "Annual";
  }
};

/**
 * The installment documents for one StudentFee, one per period of the academic year.
 *
 * StudentFee.totalAmount (already discounted) is split evenly; the last installment absorbs the
 * rounding so the installments always add up to the total exactly. Each falls due on the
 * school's due day in the first month of its period, counted from the academic year's start.
 *
 * A student assigned part-way through the year still owes the periods already gone — the fee is
 * for the year — but was never late for them, so a due date before the assignment date is moved
 * up to the assignment date instead of arriving overdue.
 */
export const buildInstallments = ({ studentFee, frequency, academicYear, dueDay, assignedAt = new Date() }) => {
  const freq = FEE_FREQUENCIES[frequency] ? frequency : "yearly";
  const { periods, monthsApart } = FEE_FREQUENCIES[freq];

  const yearStart = new Date(academicYear?.startDate || assignedAt);
  const total = round2(studentFee.totalAmount);
  const share = Math.floor((total / periods) * 100) / 100;
  const earliestDue = startOfDay(assignedAt);

  return Array.from({ length: periods }, (_, i) => {
    const periodStart = new Date(yearStart.getFullYear(), yearStart.getMonth() + i * monthsApart, 1);
    let dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), dueDay);
    if (dueDate < earliestDue) dueDate = earliestDue;

    return {
      schoolId: studentFee.schoolId,
      academicYearId: studentFee.academicYearId,
      studentId: studentFee.studentId,
      studentFeeId: studentFee._id,
      installmentType: freq,
      installmentName: periodLabel(freq, i, periodStart),
      periodIndex: i,
      amount: i === periods - 1 ? round2(total - share * (periods - 1)) : share,
      fineAmount: 0,
      paidAmount: 0,
      dueDate,
      status: "pending",
    };
  });
};

/**
 * Creates the installment schedule for each given StudentFee that does not have one yet.
 * `studentFees` must have feeStructureId populated with at least `frequency`, or pass
 * `frequencyByStructureId`. Returns how many installments were created.
 */
export const generateSchedules = async ({
  studentFees,
  academicYear,
  schoolId,
  assignedAt = new Date(),
  frequencyByStructureId = null,
  session = null,
}) => {
  if (!studentFees.length) return 0;

  const { dueDay } = await getFeeSettings(schoolId, session);

  const existing = new Set(
    (
      await FeeInstallment.distinct(
        "studentFeeId",
        { studentFeeId: { $in: studentFees.map((f) => f._id) } },
        { session }
      )
    ).map(String)
  );

  const docs = studentFees
    .filter((fee) => !existing.has(String(fee._id)))
    .flatMap((fee) => {
      const structureId = String(fee.feeStructureId?._id || fee.feeStructureId);
      const frequency = frequencyByStructureId?.get(structureId) || fee.feeStructureId?.frequency || "yearly";
      return buildInstallments({ studentFee: fee, frequency, academicYear, dueDay, assignedAt });
    });

  if (!docs.length) return 0;
  await FeeInstallment.insertMany(docs, { session });
  return docs.length;
};

/* ── Overdue and late fines ──────────────────────────────────────── */

/** What is still owed on an installment, fine included. */
export const outstandingOf = (inst) =>
  Math.max(round2(Number(inst.amount || 0) + Number(inst.fineAmount || 0) - Number(inst.paidAmount || 0)), 0);

/**
 * The late fine an installment carries as of `now`.
 *
 * Settled installments keep the fine they were settled with. Otherwise it is worked out afresh
 * from the school's current rule — a school that switches fines off stops charging them — but
 * never below what has already been paid toward the fine (payments settle the base amount first),
 * so a rule change can never leave a student having paid for a fine that no longer exists.
 */
export const computeFine = (inst, lateFine, now = new Date()) => {
  if (inst.status === "paid") return round2(inst.fineAmount);

  const alreadyPaidTowardFine = Math.max(round2(Number(inst.paidAmount || 0) - Number(inst.amount || 0)), 0);

  let fine = 0;
  if (lateFine?.enabled && lateFine.amount > 0 && inst.dueDate) {
    const graceEnds = startOfDay(inst.dueDate).getTime() + (lateFine.graceDays || 0) * DAY_MS;
    const daysLate = Math.floor((startOfDay(now).getTime() - graceEnds) / DAY_MS);
    if (daysLate > 0) {
      fine = lateFine.type === "per_day" ? lateFine.amount * daysLate : lateFine.amount;
      if (lateFine.maxAmount > 0) fine = Math.min(fine, lateFine.maxAmount);
    }
  }

  return round2(Math.max(fine, alreadyPaidTowardFine));
};

/** Status from amounts and date. The fine must already be current. */
export const statusOf = (inst, now = new Date()) => {
  if (outstandingOf(inst) <= 0) return "paid";
  if (inst.dueDate && startOfDay(now) > startOfDay(inst.dueDate)) return "overdue";
  return Number(inst.paidAmount || 0) > 0 ? "partial" : "pending";
};

/**
 * Brings fines and statuses up to date on the given installment documents and saves the ones that
 * changed. Returns the ids of StudentFees whose fine total needs recomputing.
 */
export const refreshInstallmentDocs = async ({ installments, lateFine, now = new Date(), session = null }) => {
  const touchedFeeIds = new Set();

  for (const inst of installments) {
    const fineAmount = computeFine(inst, lateFine, now);
    const status = statusOf({ ...inst.toObject(), fineAmount }, now);
    if (fineAmount !== round2(inst.fineAmount) || status !== inst.status) {
      inst.fineAmount = fineAmount;
      inst.status = status;
      await inst.save({ session });
      touchedFeeIds.add(String(inst.studentFeeId));
    }
  }

  return touchedFeeIds;
};

/** Recomputes StudentFee.fineAmount from its installments; the pre-save hook redoes due/status. */
export const syncStudentFeeFines = async ({ studentFeeIds, session = null }) => {
  const ids = [...studentFeeIds];
  if (!ids.length) return;

  const totals = await FeeInstallment.aggregate([
    { $match: { studentFeeId: { $in: ids.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    { $group: { _id: "$studentFeeId", fine: { $sum: "$fineAmount" } } },
  ]).session(session);
  const fineById = new Map(totals.map((t) => [String(t._id), round2(t.fine)]));

  const fees = await StudentFee.find({ _id: { $in: ids } }).session(session);
  for (const fee of fees) {
    const fine = fineById.get(String(fee._id)) || 0;
    if (round2(fee.fineAmount) !== fine) {
      fee.fineAmount = fine;
      await fee.save({ session });
    }
  }
};

/**
 * Refreshes every unsettled installment matching the filter for one school. Used before showing a
 * student's fees or taking a payment, so the numbers are today's, and by the nightly job for
 * everyone else.
 */
export const refreshInstallments = async ({
  schoolId,
  studentId = null,
  academicYearId = null,
  onlyPastDue = false,
  now = new Date(),
  session = null,
}) => {
  const { lateFine } = await getFeeSettings(schoolId, session);

  const filter = { schoolId, status: { $ne: "paid" } };
  if (studentId) filter.studentId = studentId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (onlyPastDue) filter.dueDate = { $lt: startOfDay(now) };

  const installments = await FeeInstallment.find(filter).session(session);
  const touched = await refreshInstallmentDocs({ installments, lateFine, now, session });
  await syncStudentFeeFines({ studentFeeIds: touched, session });

  return { checked: installments.length, updated: touched.size };
};
