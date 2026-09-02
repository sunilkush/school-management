import mongoose from "mongoose";

import { ReportCard } from "../models/ReportCard.model.js";
import { ReportCardTemplate } from "../models/ReportCardTemplate.model.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import { generateReportCards } from "../services/reportCard.service.js";

/**
 * Report cards — the consolidated, publishable term document built on top of per-exam
 * ExamResults. See services/reportCard.service.js for the weighting and ranking rules.
 *
 * Every handler resolves schoolId from the session, never from the request, and re-checks it on
 * any document fetched by id — the pattern the rest of the controllers use.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const isSuperAdmin = (req) => (req.userRole?.name || "").toLowerCase().trim() === "super admin";

/** Loads a template and confirms it belongs to the caller's school. */
const loadTemplate = async (req, templateId) => {
  if (!mongoose.isValidObjectId(templateId)) throw new ApiError(400, "Invalid template id");
  const template = await ReportCardTemplate.findById(templateId);
  if (!template) throw new ApiError(404, "Report card template not found");
  if (!isSuperAdmin(req) && String(template.schoolId) !== String(requireSchool(req))) {
    throw new ApiError(403, "This template belongs to another school");
  }
  return template;
};

/* ── Templates ───────────────────────────────────────────────────── */

export const createTemplate = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { name, academicYearId, exams, coScholasticAreas, attendanceFrom, attendanceTo, options } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Template name is required");
  if (!academicYearId) throw new ApiError(400, "Academic year is required");

  const template = await ReportCardTemplate.create({
    schoolId,
    academicYearId,
    name: name.trim(),
    exams: exams || [],
    coScholasticAreas: coScholasticAreas || [],
    attendanceFrom: attendanceFrom || null,
    attendanceTo: attendanceTo || null,
    options: options || undefined,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, template, "Template created"));
});

export const listTemplates = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { academicYearId, status } = req.query;

  const templates = await ReportCardTemplate.find({
    schoolId,
    ...(academicYearId ? { academicYearId } : {}),
    ...(status ? { status } : {}),
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(new ApiResponse(200, templates, "Templates fetched"));
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await loadTemplate(req, req.params.id);
  return res.json(new ApiResponse(200, template, "Template fetched"));
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await loadTemplate(req, req.params.id);

  const allowed = ["name", "exams", "coScholasticAreas", "attendanceFrom", "attendanceTo", "options", "status"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) template[field] = req.body[field];
  });
  template.updatedBy = req.user._id;
  await template.save();

  return res.json(new ApiResponse(200, template, "Template updated"));
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await loadTemplate(req, req.params.id);

  const issued = await ReportCard.countDocuments({ templateId: template._id, isPublished: true });
  if (issued > 0) {
    throw new ApiError(400, `Cannot delete — ${issued} report card(s) from this template are already published`);
  }

  await ReportCard.deleteMany({ templateId: template._id });
  await template.deleteOne();

  return res.json(new ApiResponse(200, null, "Template deleted"));
});

/* ── Generation ──────────────────────────────────────────────────── */

export const generateForClass = asyncHandler(async (req, res) => {
  const { templateId, schoolClassId, sectionId } = req.body;
  if (!schoolClassId) throw new ApiError(400, "Class is required");

  const template = await loadTemplate(req, templateId);
  if (!template.exams?.length) throw new ApiError(400, "Add at least one exam to the template before generating");

  const summary = await generateReportCards({
    template,
    schoolClassId,
    sectionId: sectionId || null,
    generatedBy: req.user._id,
  });

  return res.json(
    new ApiResponse(
      200,
      { generated: summary.generated, skippedPublished: summary.skippedPublished },
      summary.skippedPublished
        ? `Generated ${summary.generated}. Skipped ${summary.skippedPublished} already-published card(s) — unpublish them to regenerate.`
        : `Generated ${summary.generated} report card(s)`
    )
  );
});

/* ── Cards ───────────────────────────────────────────────────────── */

export const listReportCards = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { templateId, schoolClassId, sectionId, isPublished } = req.query;

  const cards = await ReportCard.find({
    schoolId,
    ...(templateId ? { templateId } : {}),
    ...(schoolClassId ? { schoolClassId } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(isPublished !== undefined ? { isPublished: isPublished === "true" } : {}),
  })
    .populate("studentId", "name email")
    .sort({ rank: 1 })
    .lean();

  return res.json(new ApiResponse(200, cards, "Report cards fetched"));
});

/** Staff read. Students/parents use myReportCards / childReportCards instead. */
export const getReportCard = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const card = await ReportCard.findOne({ _id: req.params.id, schoolId })
    .populate("studentId", "name email")
    .populate("templateId", "name options")
    .lean();
  if (!card) throw new ApiError(404, "Report card not found");
  return res.json(new ApiResponse(200, card, "Report card fetched"));
});

/** Class-teacher finishing pass: co-scholastic grades and the written remark. */
export const updateReportCard = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const card = await ReportCard.findOne({ _id: req.params.id, schoolId });
  if (!card) throw new ApiError(404, "Report card not found");
  if (card.isPublished) throw new ApiError(400, "This report card is published — unpublish it before editing");

  if (req.body.coScholastic !== undefined) card.coScholastic = req.body.coScholastic;
  if (req.body.classTeacherRemarks !== undefined) card.classTeacherRemarks = req.body.classTeacherRemarks;

  await card.save();
  return res.json(new ApiResponse(200, card, "Report card updated"));
});

export const publishReportCards = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { cardIds, templateId, schoolClassId, sectionId, publish = true } = req.body;

  const filter = cardIds?.length
    ? { schoolId, _id: { $in: cardIds } }
    : {
        schoolId,
        ...(templateId ? { templateId } : {}),
        ...(schoolClassId ? { schoolClassId } : {}),
        ...(sectionId ? { sectionId } : {}),
      };

  if (!cardIds?.length && !templateId) {
    throw new ApiError(400, "Provide cardIds, or a templateId to publish a whole batch");
  }

  const update = publish
    ? { $set: { isPublished: true, publishedAt: new Date(), publishedBy: req.user._id } }
    : { $set: { isPublished: false, publishedAt: null, publishedBy: null } };

  const result = await ReportCard.updateMany(filter, update);

  return res.json(
    new ApiResponse(
      200,
      { modified: result.modifiedCount },
      `${result.modifiedCount} report card(s) ${publish ? "published" : "unpublished"}`
    )
  );
});

/* ── Student / parent access ─────────────────────────────────────── */

/** A student sees only their own, and only once published. */
export const myReportCards = asyncHandler(async (req, res) => {
  const cards = await ReportCard.find({ studentId: req.user._id, isPublished: true })
    .populate("templateId", "name options")
    .sort({ createdAt: -1 })
    .lean();
  return res.json(new ApiResponse(200, cards, "Report cards fetched"));
});

/** A parent sees only their own child's, and only once published. */
export const childReportCards = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) throw new ApiError(400, "Invalid student id");

  const student = await Student.findOne({ userId: studentId }).select("fatherId motherId guardianId schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const parentId = String(req.user._id);
  const linked = [student.fatherId, student.motherId, student.guardianId].filter(Boolean).map(String);
  if (!linked.includes(parentId)) {
    throw new ApiError(403, "You are not allowed to view this child's report cards");
  }

  const cards = await ReportCard.find({ studentId, isPublished: true })
    .populate("templateId", "name options")
    .sort({ createdAt: -1 })
    .lean();

  return res.json(new ApiResponse(200, cards, "Report cards fetched"));
});
