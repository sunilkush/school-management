import mongoose from "mongoose";

import { ScholarshipAward } from "../models/ScholarshipAward.model.js";
import { ScholarshipScheme } from "../models/ScholarshipScheme.model.js";
import { Student } from "../models/student.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  concessionMismatches,
  effectiveConcession,
  giveawayReport,
  schemeUsage,
  syncConcessionToEnrollments,
} from "../services/scholarship.service.js";

/**
 * Scholarships and fee concessions.
 *
 * Replaces an anonymous percentage on the enrolment record with a named scheme, an approval, a
 * reason and an end date — so the school can answer who got what, who allowed it, and what it all
 * adds up to.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}`);
  return value;
};

/* ══ Schemes ══════════════════════════════════════════════════════ */

export const listSchemes = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { isActive, category, academicYearId } = req.query;

  const schemes = await ScholarshipScheme.find({
    schoolId,
    ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
    ...(category ? { category } : {}),
    ...(academicYearId ? { academicYearId } : {}),
  })
    .sort({ category: 1, name: 1 })
    .lean();

  // The cap is only useful next to how much of it is gone.
  const withUsage = await Promise.all(
    schemes.map(async (scheme) => ({ ...scheme, usage: await schemeUsage({ schoolId, schemeId: scheme._id }) }))
  );

  return res.json(new ApiResponse(200, withUsage, "Schemes fetched"));
});

export const createScheme = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { name, code, category, description, discountType, value, feeHeadIds, maxAwards, eligibility, requiresApproval, validFrom, validUntil, academicYearId } = req.body;

  if (!name?.trim()) throw new ApiError(400, "A scheme name is required");
  if (!code?.trim()) throw new ApiError(400, "A short code is required");
  if (value == null || Number(value) < 0) throw new ApiError(400, "A concession value is required");

  try {
    const scheme = await ScholarshipScheme.create({
      schoolId,
      academicYearId: academicYearId || null,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category: category || "Other",
      description: description || "",
      discountType: discountType || "percent",
      value: Number(value),
      feeHeadIds: Array.isArray(feeHeadIds) ? feeHeadIds : [],
      maxAwards: maxAwards ?? null,
      eligibility: eligibility || "",
      requiresApproval: requiresApproval !== false,
      validFrom: parseDate(validFrom, "valid from"),
      validUntil: parseDate(validUntil, "valid until"),
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, scheme, "Scheme created"));
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, "A scheme with that code already exists");
    throw error;
  }
});

export const updateScheme = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const scheme = await ScholarshipScheme.findOne({ _id: objectId(req.params.id, "scheme id"), schoolId });
  if (!scheme) throw new ApiError(404, "Scheme not found");

  const fields = ["name", "category", "description", "discountType", "value", "feeHeadIds", "maxAwards", "eligibility", "requiresApproval", "isActive"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) scheme[field] = req.body[field];
  });
  if (req.body.validFrom !== undefined) scheme.validFrom = parseDate(req.body.validFrom, "valid from");
  if (req.body.validUntil !== undefined) scheme.validUntil = parseDate(req.body.validUntil, "valid until");

  // Lowering a cap below what has already been given away would report the school as within a
  // limit it has already passed.
  if (req.body.maxAwards != null) {
    const usage = await schemeUsage({ schoolId, schemeId: scheme._id });
    const taken = (usage?.approved || 0) + (usage?.pending || 0);
    if (Number(req.body.maxAwards) < taken) {
      throw new ApiError(400, `${taken} award(s) have already been given or requested — the cap cannot be set below that`);
    }
  }

  await scheme.save();
  return res.json(new ApiResponse(200, scheme, "Scheme updated"));
});

export const deleteScheme = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const scheme = await ScholarshipScheme.findOne({ _id: objectId(req.params.id, "scheme id"), schoolId });
  if (!scheme) throw new ApiError(404, "Scheme not found");

  const awards = await ScholarshipAward.countDocuments({ schemeId: scheme._id });
  if (awards > 0) {
    // The awards are the record of money the school chose not to collect. Deleting the scheme
    // would leave every one of them pointing at nothing.
    throw new ApiError(400, `Cannot delete — ${awards} award(s) use this scheme. Deactivate it instead.`);
  }

  await scheme.deleteOne();
  return res.json(new ApiResponse(200, null, "Scheme deleted"));
});

/* ══ Awards ═══════════════════════════════════════════════════════ */

export const listAwards = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { status, schemeId, studentId, academicYearId } = req.query;

  const awards = await ScholarshipAward.find({
    schoolId,
    ...(status ? { status } : {}),
    ...(schemeId ? { schemeId } : {}),
    ...(studentId ? { studentId } : {}),
    ...(academicYearId ? { academicYearId } : {}),
  })
    .populate("schemeId", "name code category discountType value")
    .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, awards, "Awards fetched"));
});

export const requestAward = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { schemeId, studentId, reason, academicYearId, validFrom, validUntil } = req.body;

  const scheme = await ScholarshipScheme.findOne({ _id: objectId(schemeId, "scheme id"), schoolId });
  if (!scheme) throw new ApiError(404, "Scheme not found");
  if (!scheme.isActive) throw new ApiError(400, "That scheme is no longer active");

  const student = await Student.findOne({ _id: objectId(studentId, "student id"), schoolId });
  if (!student) throw new ApiError(404, "Student not found");

  // Checked before creating rather than after: a school that discovers at approval time that the
  // last funded place was already gone has already told a parent they had it.
  const usage = await schemeUsage({ schoolId, schemeId: scheme._id });
  if (usage?.isFull) {
    throw new ApiError(400, `All ${scheme.maxAwards} place(s) on this scheme are taken or pending`);
  }

  try {
    const award = await ScholarshipAward.create({
      schoolId,
      schemeId: scheme._id,
      studentId: student._id,
      academicYearId: academicYearId || null,
      // A scheme that needs no approval is granted outright — otherwise every sibling discount
      // sits in a queue waiting for somebody to click approve on a decision already made.
      status: scheme.requiresApproval ? "pending" : "approved",
      ...(scheme.requiresApproval ? {} : { approvedBy: req.user._id, approvedAt: new Date() }),
      reason: reason || "",
      requestedBy: req.user._id,
      validFrom: parseDate(validFrom, "valid from") || scheme.validFrom,
      validUntil: parseDate(validUntil, "valid until") || scheme.validUntil,
    });

    return res.status(201).json(new ApiResponse(201, award, award.status === "approved" ? "Concession granted" : "Concession requested"));
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, "This student already holds that scheme for the year");
    throw error;
  }
});

export const decideAward = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const award = await ScholarshipAward.findOne({ _id: objectId(req.params.id, "award id"), schoolId });
  if (!award) throw new ApiError(404, "Award not found");

  const { decision, note } = req.body;
  if (!["approved", "rejected"].includes(decision)) throw new ApiError(400, "Decision must be approved or rejected");
  if (award.status !== "pending") throw new ApiError(400, `This award is already ${award.status}`);

  if (decision === "approved") {
    const usage = await schemeUsage({ schoolId, schemeId: award.schemeId });
    // Re-checked at approval too: several requests can sit pending against the last place at once.
    if (usage?.maxAwards != null && usage.approved >= usage.maxAwards) {
      throw new ApiError(400, `All ${usage.maxAwards} place(s) on this scheme are already approved`);
    }
    award.approvedBy = req.user._id;
    award.approvedAt = new Date();
  }

  award.status = decision;
  award.decisionNote = note || "";
  await award.save();

  return res.json(new ApiResponse(200, award, decision === "approved" ? "Concession approved" : "Concession rejected"));
});

export const revokeAward = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const award = await ScholarshipAward.findOne({ _id: objectId(req.params.id, "award id"), schoolId });
  if (!award) throw new ApiError(404, "Award not found");
  if (award.status !== "approved") throw new ApiError(400, "Only an approved concession can be revoked");
  if (!req.body.note?.trim()) {
    // A concession taken away from a family needs a reason on the record more than one granted does.
    throw new ApiError(400, "A reason is required to revoke a concession");
  }

  award.status = "revoked";
  award.revokedAt = new Date();
  award.decisionNote = req.body.note.trim();
  await award.save();

  return res.json(new ApiResponse(200, award, "Concession revoked"));
});

/* ══ Applying it to fees ══════════════════════════════════════════ */

export const getStudentConcession = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await effectiveConcession({
    schoolId,
    studentId: objectId(req.params.studentId, "student id"),
    academicYearId: req.query.academicYearId || null,
  });
  return res.json(new ApiResponse(200, data, "Concession for this student"));
});

export const syncConcessions = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const result = await syncConcessionToEnrollments({
    schoolId,
    academicYearId: req.body.academicYearId || null,
  });

  return res.json(
    new ApiResponse(
      200,
      result,
      result.updated
        ? `${result.updated} student(s) updated — fees assigned from now on will use the new figure`
        : "Every student's concession already matches"
    )
  );
});

export const getMismatches = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await concessionMismatches({ schoolId, academicYearId: req.query.academicYearId || null });

  return res.json(
    new ApiResponse(
      200,
      rows,
      rows.length
        ? `${rows.length} student(s) have a bill that no longer matches their concession`
        : "Every assigned bill matches the concession held"
    )
  );
});

/**
 * Records what each approved award actually took off the bill.
 *
 * Run after fees are assigned. Until it runs, the giveaway report has counts but no rupees, and
 * it says so rather than showing zero as though nothing was given away.
 */
export const recordAppliedAmounts = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const academicYearId = req.body.academicYearId || null;

  const awards = await ScholarshipAward.find({ schoolId, status: "approved", ...(academicYearId ? { academicYearId } : {}) });

  let recorded = 0;
  for (const award of awards) {
    // eslint-disable-next-line no-await-in-loop
    const fees = await StudentFee.find({
      schoolId,
      studentId: award.studentId,
      ...(academicYearId ? { academicYearId } : {}),
    })
      .select("discountApplied")
      .lean();

    const waived = fees.reduce((sum, f) => sum + (f.discountApplied?.amount || 0), 0);
    if (!waived) continue;

    // eslint-disable-next-line no-await-in-loop
    const concession = await effectiveConcession({ schoolId, studentId: award.studentId, academicYearId });

    // The bill records one combined discount, not one per scheme, so a student holding two
    // concessions has the total split between them in proportion to what each contributes.
    const scheme = await ScholarshipScheme.findById(award.schemeId).select("value discountType").lean();
    const share = concession.percent > 0 && scheme?.discountType === "percent"
      ? scheme.value / concession.percentBeforeCap
      : 1 / Math.max(1, concession.awards.length);

    award.appliedAmount = Math.round(waived * share * 100) / 100;
    award.appliedAt = new Date();
    // eslint-disable-next-line no-await-in-loop
    await award.save();
    recorded += 1;
  }

  return res.json(new ApiResponse(200, { recorded, total: awards.length }, `${recorded} award(s) costed`));
});

export const getGiveawayReport = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await giveawayReport({ schoolId, academicYearId: req.query.academicYearId || null });
  return res.json(new ApiResponse(200, data, "What the school is giving away"));
});
