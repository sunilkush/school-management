import { ScholarshipAward } from "../models/ScholarshipAward.model.js";
import { ScholarshipScheme } from "../models/ScholarshipScheme.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { StudentFee } from "../models/studentFee.model.js";

/**
 * Working out what a school is actually giving away, and keeping it consistent with the fee
 * records that already exist.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** An award only counts while it is approved and inside its dates. */
export const isAwardLive = (award, on = new Date()) => {
  if (award.status !== "approved") return false;
  if (award.validFrom && new Date(award.validFrom) > on) return false;
  if (award.validUntil && new Date(award.validUntil) < on) return false;
  return true;
};

/**
 * The combined concession for one student, as a percentage.
 *
 * Two things worth knowing about how this adds up:
 *
 * Percentages are summed, not compounded. A 30% staff concession and a 20% sibling concession
 * make 50% off, not 44%. Compounding is defensible arithmetic but it is not what a school means
 * when it tells a parent "thirty plus twenty", and the version that matches what was promised is
 * the one to implement.
 *
 * The total is capped at 100. Overlapping concessions adding up past the full fee would otherwise
 * produce a negative bill, and a school refunding money it never charged is not a rounding error.
 */
export const effectiveConcession = async ({ schoolId, studentId, academicYearId = null, on = new Date() }) => {
  const awards = await ScholarshipAward.find({
    schoolId,
    studentId,
    status: "approved",
    ...(academicYearId ? { academicYearId } : {}),
  })
    .populate("schemeId", "name code category discountType value isActive")
    .lean();

  const live = awards.filter((a) => isAwardLive(a, on) && a.schemeId?.isActive !== false);

  let percent = 0;
  let flatAmount = 0;
  const applied = [];

  for (const award of live) {
    const scheme = award.schemeId;
    if (!scheme) continue;
    if (scheme.discountType === "percent") percent += scheme.value;
    else flatAmount += scheme.value;
    applied.push({
      awardId: award._id,
      scheme: scheme.name,
      code: scheme.code,
      category: scheme.category,
      discountType: scheme.discountType,
      value: scheme.value,
    });
  }

  const cappedPercent = Math.min(100, round2(percent));

  return {
    percent: cappedPercent,
    // Reported so the office can see a cap actually bit, rather than wondering why two 60%
    // concessions came out as 100.
    percentBeforeCap: round2(percent),
    wasCapped: percent > 100,
    flatAmount: round2(flatAmount),
    awards: applied,
  };
};

/**
 * How many live awards a scheme has, against what it was funded for.
 *
 * Rejected and revoked awards do not count — the place is free again.
 */
export const schemeUsage = async ({ schoolId, schemeId }) => {
  const scheme = await ScholarshipScheme.findOne({ _id: schemeId, schoolId }).lean();
  if (!scheme) return null;

  const counts = await ScholarshipAward.aggregate([
    { $match: { schemeId: scheme._id } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  const taken = (byStatus.approved || 0) + (byStatus.pending || 0);

  return {
    approved: byStatus.approved || 0,
    pending: byStatus.pending || 0,
    rejected: byStatus.rejected || 0,
    revoked: byStatus.revoked || 0,
    maxAwards: scheme.maxAwards ?? null,
    // Pending counts against the cap: a place promised is a place gone, and discovering at
    // approval time that the last one was taken is how a school ends up over-committed.
    remaining: scheme.maxAwards == null ? null : Math.max(0, scheme.maxAwards - taken),
    isFull: scheme.maxAwards != null && taken >= scheme.maxAwards,
  };
};

/**
 * Writes each student's combined concession back onto their enrolment.
 *
 * `StudentEnrollment.feeDiscount` is what assignFeesToStudents already reads, so this keeps the
 * existing fee path working untouched rather than rebuilding it.
 *
 * It deliberately does NOT rewrite fees already assigned. Those are money records a parent may
 * have seen and paid against; silently restating them is how a school ends up unable to explain
 * its own receipts. Fees assigned from now on pick the new figure up, and `concessionMismatches`
 * below lists anyone whose existing bill no longer matches, for a human to decide about.
 */
export const syncConcessionToEnrollments = async ({ schoolId, academicYearId = null, studentIds = null }) => {
  const filter = {
    schoolId,
    status: "Active",
    ...(academicYearId ? { academicYearId } : {}),
    ...(studentIds ? { studentId: { $in: studentIds } } : {}),
  };

  const enrollments = await StudentEnrollment.find(filter).select("studentId feeDiscount academicYearId").lean();

  let updated = 0;
  const changes = [];

  for (const enrollment of enrollments) {
    // eslint-disable-next-line no-await-in-loop
    const concession = await effectiveConcession({
      schoolId,
      studentId: enrollment.studentId,
      academicYearId: enrollment.academicYearId,
    });

    const current = enrollment.feeDiscount || 0;
    if (round2(current) === concession.percent) continue;

    // eslint-disable-next-line no-await-in-loop
    await StudentEnrollment.updateOne({ _id: enrollment._id }, { $set: { feeDiscount: concession.percent } });
    updated += 1;
    changes.push({ studentId: enrollment.studentId, from: round2(current), to: concession.percent });
  }

  return { considered: enrollments.length, updated, changes: changes.slice(0, 200) };
};

/**
 * Students whose already-assigned fee does not match the concession they now hold.
 *
 * Surfaced rather than fixed, on purpose. Changing a bill somebody has already been given is a
 * decision, not a cleanup task.
 */
export const concessionMismatches = async ({ schoolId, academicYearId = null }) => {
  const fees = await StudentFee.find({
    schoolId,
    ...(academicYearId ? { academicYearId } : {}),
  })
    .select("studentId discountApplied totalAmount paidAmount academicYearId")
    .limit(1000)
    .lean();

  const rows = [];
  for (const fee of fees) {
    // eslint-disable-next-line no-await-in-loop
    const concession = await effectiveConcession({
      schoolId,
      studentId: fee.studentId,
      academicYearId: fee.academicYearId,
    });

    const onBill = round2(fee.discountApplied?.percent || 0);
    if (onBill === concession.percent) continue;

    rows.push({
      studentId: fee.studentId,
      studentFeeId: fee._id,
      onBill,
      nowEntitledTo: concession.percent,
      alreadyPaid: fee.paidAmount || 0,
    });
  }

  return rows;
};

/**
 * What the school is giving away, by scheme and by category.
 *
 * The number a management committee actually asks for, and the one nobody could produce before.
 */
export const giveawayReport = async ({ schoolId, academicYearId = null }) => {
  const schemes = await ScholarshipScheme.find({ schoolId, ...(academicYearId ? { academicYearId } : {}) }).lean();
  const awards = await ScholarshipAward.find({
    schoolId,
    ...(academicYearId ? { academicYearId } : {}),
  })
    .select("schemeId status appliedAmount")
    .lean();

  const bySchemeId = new Map(schemes.map((s) => [String(s._id), s]));
  const rows = new Map();

  for (const award of awards) {
    const scheme = bySchemeId.get(String(award.schemeId));
    if (!scheme) continue;
    const key = String(scheme._id);
    const row = rows.get(key) || {
      schemeId: scheme._id,
      name: scheme.name,
      code: scheme.code,
      category: scheme.category,
      discountType: scheme.discountType,
      value: scheme.value,
      approved: 0,
      pending: 0,
      amountWaived: 0,
    };
    if (award.status === "approved") {
      row.approved += 1;
      row.amountWaived += award.appliedAmount || 0;
    }
    if (award.status === "pending") row.pending += 1;
    rows.set(key, row);
  }

  const schemeRows = [...rows.values()].sort((a, b) => b.amountWaived - a.amountWaived);

  const byCategory = schemeRows.reduce((acc, r) => {
    const entry = acc[r.category] || { category: r.category, approved: 0, amountWaived: 0 };
    entry.approved += r.approved;
    entry.amountWaived += r.amountWaived;
    acc[r.category] = entry;
    return acc;
  }, {});

  return {
    schemes: schemeRows,
    byCategory: Object.values(byCategory).sort((a, b) => b.amountWaived - a.amountWaived),
    totalApproved: schemeRows.reduce((s, r) => s + r.approved, 0),
    totalPending: schemeRows.reduce((s, r) => s + r.pending, 0),
    totalWaived: round2(schemeRows.reduce((s, r) => s + r.amountWaived, 0)),
    // Said plainly: this is only as good as the last recalculation.
    note: "Amounts come from the last time concessions were applied to fees, not live from the bills.",
  };
};
