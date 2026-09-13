/**
 * One-time migration to the per-period fee model.
 *
 * Run: node scripts/migrateFeesToPerPeriod.mjs          # report only, changes nothing
 *      node scripts/migrateFeesToPerPeriod.mjs --apply  # actually migrate
 *
 * Take a database backup first. Safe to run more than once: every step skips records it has
 * already handled.
 *
 * 1. Fee structure amounts. FeeStructure.amount used to hold the whole year's total and was split
 *    by frequency. It now means the charge for ONE period (Tuition ₹2,000 monthly = ₹2,000 a
 *    month). Every structure not yet marked `amountBasis: "per_period"` has its amount divided by
 *    its number of periods, so the year total — and every student fee already assigned from it —
 *    stays the same. Amounts that do not divide exactly are rounded to paise and listed.
 *
 * 2. Installment schedules. Schedules are now generated when a fee is assigned, dated from the
 *    academic year and the school's due day. Existing student fees are brought in line:
 *      - no installments at all           → a schedule is generated
 *      - installments, none paid anything → replaced with a correctly dated schedule
 *      - installments with money on them  → left exactly as they are (listed for review)
 *    Any amount a student fee already shows as paid is spread over its new installments, oldest
 *    first, so the installments agree with what has been collected.
 *
 * 3. Status. Every unpaid installment gets its overdue status and fine worked out from its
 *    school's fee settings (late fines are off until a school turns them on).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { DB_NAME } = await import("../src/constants.js");
const { FeeStructure } = await import("../src/models/feeStructure.model.js");
const { StudentFee } = await import("../src/models/studentFee.model.js");
const { FeeInstallment } = await import("../src/models/feeInstallment.model.js");
const { Payment } = await import("../src/models/payment.model.js");
const { AcademicYear } = await import("../src/models/AcademicYear.model.js");
const {
  buildInstallments,
  getFeeSettings,
  periodsPerYear,
  refreshInstallments,
  round2,
  statusOf,
} = await import("../src/services/feeSchedule.service.js");

const URI = process.env.MONGOOSE_URI;
if (!URI) {
  console.error("MONGOOSE_URI not found in .env");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const log = (...args) => console.log(...args);

/* ── 1. Fee structure amounts ───────────────────────────────────── */

const migrateStructureAmounts = async () => {
  const raw = await FeeStructure.collection.find({ amountBasis: { $exists: false } }).toArray();
  log(`\n[1] Fee structures still holding a yearly total: ${raw.length}`);

  let inexact = 0;
  for (const fs of raw) {
    const periods = periodsPerYear(fs.frequency);
    const perPeriod = round2(fs.amount / periods);
    const exact = round2(perPeriod * periods) === round2(fs.amount);
    if (!exact) inexact += 1;

    log(
      `    ${fs._id}  ${fs.frequency.padEnd(11)} ₹${fs.amount} / ${periods} → ₹${perPeriod}` +
        (exact ? "" : `   (not exact: ${periods} × ₹${perPeriod} = ₹${round2(perPeriod * periods)})`)
    );

    if (APPLY) {
      await FeeStructure.collection.updateOne(
        { _id: fs._id, amountBasis: { $exists: false } },
        { $set: { amount: perPeriod, amountBasis: "per_period" } }
      );
    }
  }
  if (inexact) log(`    ${inexact} amount(s) rounded — re-check those structures before assigning them again.`);
};

/* ── 2. Installment schedules ───────────────────────────────────── */

/** Spreads `paid` over installments in due order and sets each status. */
const spreadPaid = (installments, paid) => {
  let remaining = round2(paid);
  for (const inst of installments) {
    const take = round2(Math.min(remaining, inst.amount));
    inst.paidAmount = take;
    remaining = round2(remaining - take);
    inst.status = statusOf(inst);
  }
  return remaining;
};

const migrateSchedules = async () => {
  const fees = await StudentFee.find({}).populate("feeStructureId", "frequency").lean();
  log(`\n[2] Student fee records: ${fees.length}`);

  const yearCache = new Map();
  const dueDayCache = new Map();
  const counts = { generated: 0, replaced: 0, keptWithPayments: 0, unchanged: 0 };
  const review = [];

  for (const fee of fees) {
    const existing = await FeeInstallment.find({ studentFeeId: fee._id }).lean();
    const hasMoney = existing.some((i) => Number(i.paidAmount || 0) > 0);
    const referenced =
      existing.length > 0 && (await Payment.exists({ installmentId: { $in: existing.map((i) => i._id) } }));

    if (hasMoney || referenced) {
      counts.keptWithPayments += 1;
      const scheduled = round2(existing.reduce((s, i) => s + Number(i.amount || 0), 0));
      if (scheduled !== round2(fee.totalAmount)) {
        review.push(`    ${fee._id}: installments total ₹${scheduled}, fee total ₹${fee.totalAmount} — has payments, left as is`);
      }
      continue;
    }

    const frequency = fee.feeStructureId?.frequency || "yearly";
    const expectedCount = periodsPerYear(frequency);
    const alreadyCorrect =
      existing.length === expectedCount &&
      existing.every((i) => i.installmentType === frequency && typeof i.periodIndex === "number");
    if (alreadyCorrect) {
      counts.unchanged += 1;
      continue;
    }

    const yearKey = String(fee.academicYearId);
    if (!yearCache.has(yearKey)) {
      yearCache.set(yearKey, await AcademicYear.findById(fee.academicYearId).select("startDate").lean());
    }
    const schoolKey = String(fee.schoolId);
    if (!dueDayCache.has(schoolKey)) dueDayCache.set(schoolKey, (await getFeeSettings(fee.schoolId)).dueDay);

    const academicYear = yearCache.get(yearKey);
    const docs = buildInstallments({
      studentFee: fee,
      frequency,
      academicYear,
      dueDay: dueDayCache.get(schoolKey),
      // The schedule follows the academic year; whatever is already past due is genuinely late.
      assignedAt: academicYear?.startDate || fee.createdAt,
    });
    const leftover = spreadPaid(docs, fee.paidAmount || 0);
    if (leftover > 0) review.push(`    ${fee._id}: ₹${leftover} paid beyond the fee total — check this record`);

    if (existing.length) counts.replaced += 1;
    else counts.generated += 1;

    if (APPLY) {
      if (existing.length) await FeeInstallment.deleteMany({ _id: { $in: existing.map((i) => i._id) } });
      await FeeInstallment.insertMany(docs);
    }
  }

  log(`    schedules generated:            ${counts.generated}`);
  log(`    unpaid schedules re-dated:      ${counts.replaced}`);
  log(`    already correct:                ${counts.unchanged}`);
  log(`    kept (money already on them):   ${counts.keptWithPayments}`);
  if (review.length) {
    log("    for review:");
    review.forEach((line) => log(line));
  }
};

/* ── 3. Status and fines ────────────────────────────────────────── */

const refreshStatuses = async () => {
  const schoolIds = await FeeInstallment.distinct("schoolId", { status: { $ne: "paid" } });
  log(`\n[3] Schools with unpaid installments: ${schoolIds.length}`);
  if (!APPLY) return;

  let updated = 0;
  for (const schoolId of schoolIds) {
    updated += (await refreshInstallments({ schoolId })).updated;
  }
  log(`    installments updated: ${updated}`);
};

try {
  await mongoose.connect(URI, { dbName: DB_NAME });
  log(`Connected to ${mongoose.connection.host} / ${mongoose.connection.name}`);
  log(APPLY ? "Mode: APPLY — changes will be written" : "Mode: report only — run with --apply to migrate");

  await migrateStructureAmounts();
  await migrateSchedules();
  await refreshStatuses();

  log(APPLY ? "\nDone." : "\nNothing was changed. Re-run with --apply to migrate.");
} catch (err) {
  console.error("\nMigration failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

