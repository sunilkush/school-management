import mongoose from "mongoose";

import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  apaarStatusFor,
  exportRows,
  missingFieldsFor,
  readinessReport,
  rteReport,
  validateIdentifier,
} from "../services/compliance.service.js";

/**
 * UDISE+ / APAAR / PEN / RTE record-keeping.
 *
 * Nothing here talks to a government system — there is no UDISE+ API to talk to. This holds the
 * identifiers, checks their shape before they are filed rather than after they are rejected, and
 * says exactly which records are still incomplete.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

/* ── School identifiers ──────────────────────────────────────────── */

export const getSchoolCompliance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const school = await School.findById(schoolId).select("name compliance").lean();
  if (!school) throw new ApiError(404, "School not found");

  return res.json(new ApiResponse(200, { name: school.name, ...(school.compliance || {}) }, "School compliance details"));
});

export const updateSchoolCompliance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const school = await School.findById(schoolId);
  if (!school) throw new ApiError(404, "School not found");

  const { udiseCode, affiliationBoard, affiliationNumber, recognitionNumber, schoolCategory, management, rteQuotaPercent } = req.body;

  if (udiseCode !== undefined) {
    const problem = validateIdentifier("udiseCode", udiseCode);
    if (problem) throw new ApiError(400, problem);
    school.compliance.udiseCode = String(udiseCode).trim();
  }
  if (affiliationBoard !== undefined) school.compliance.affiliationBoard = affiliationBoard;
  if (affiliationNumber !== undefined) school.compliance.affiliationNumber = affiliationNumber;
  if (recognitionNumber !== undefined) school.compliance.recognitionNumber = recognitionNumber;
  if (schoolCategory !== undefined) school.compliance.schoolCategory = schoolCategory;
  if (management !== undefined) school.compliance.management = management;
  if (rteQuotaPercent !== undefined) {
    const percent = Number(rteQuotaPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new ApiError(400, "The RTE quota must be a percentage between 0 and 100");
    }
    school.compliance.rteQuotaPercent = percent;
  }

  school.updatedBy = req.user._id;
  await school.save();

  return res.json(new ApiResponse(200, school.compliance, "School compliance details updated"));
});

/* ── Student records ─────────────────────────────────────────────── */

export const listStudentCompliance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { search, incompleteOnly, rteOnly, schoolClassId, academicYearId } = req.query;

  const students = await Student.find({ schoolId, status: "active" })
    .populate("userId", "name email")
    .lean();

  const enrollments = await StudentEnrollment.find({
    schoolId,
    status: "Active",
    ...(academicYearId ? { academicYearId } : {}),
    ...(schoolClassId ? { schoolClassId } : {}),
  })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .select("studentId schoolClassId sectionId registrationNumber rollNumber")
    .lean();

  const byStudent = new Map(enrollments.map((e) => [String(e.studentId), e]));
  const term = String(search || "").trim().toLowerCase();

  let rows = students.map((student) => {
    const enrollment = byStudent.get(String(student._id)) || null;
    const missing = missingFieldsFor(student);
    return {
      studentId: student._id,
      name: student.userId?.name || "Unnamed",
      className: enrollment?.schoolClassId?.name || null,
      sectionName: enrollment?.sectionId?.name || null,
      registrationNumber: enrollment?.registrationNumber || null,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender || "",
      compliance: student.compliance || {},
      apaarStatus: apaarStatusFor(student),
      missing,
      isComplete: missing.length === 0,
    };
  });

  // A class filter is applied through the enrollments, so students without one drop out.
  if (schoolClassId) rows = rows.filter((r) => byStudent.has(String(r.studentId)));
  if (incompleteOnly === "true") rows = rows.filter((r) => !r.isComplete);
  if (rteOnly === "true") rows = rows.filter((r) => r.compliance?.rteAdmission);
  if (term) {
    rows = rows.filter((r) =>
      `${r.name} ${r.registrationNumber || ""} ${r.compliance?.pen || ""}`.toLowerCase().includes(term)
    );
  }

  return res.json(new ApiResponse(200, rows, "Student compliance records"));
});

/** The fields a school actually edits; anything else in the body is ignored rather than trusted. */
const STUDENT_FIELDS = [
  "socialCategory", "minorityGroup", "motherTongue",
  "cwsn", "cwsnType", "bplCard", "rteAdmission", "rteCategory",
  "aadhaarOnFile", "aadhaarLast4", "pen", "apaarId",
];

const applyStudentCompliance = (student, body, userId) => {
  for (const key of STUDENT_FIELDS) {
    if (body[key] === undefined) continue;

    if (key === "pen" || key === "apaarId" || key === "aadhaarLast4") {
      const problem = validateIdentifier(key === "aadhaarLast4" ? "aadhaarLast4" : key, body[key]);
      if (problem) throw new ApiError(400, problem);
      student.compliance[key] = String(body[key] ?? "").trim();
      continue;
    }
    student.compliance[key] = body[key];
  }

  if (body.apaarConsent !== undefined) {
    const given = Boolean(body.apaarConsent);
    student.compliance.apaarConsent = {
      given,
      givenAt: given ? new Date() : null,
      recordedBy: given ? userId : null,
    };
  }

  // An APAAR id cannot exist without the parent's consent behind it. Accepting one without a
  // recorded consent would leave the school holding an id it cannot account for.
  if (student.compliance.apaarId && !student.compliance.apaarConsent?.given) {
    throw new ApiError(400, "Record the parent's consent before saving an APAAR ID");
  }

  student.compliance.updatedAt = new Date();
  student.compliance.updatedBy = userId;
};

export const updateStudentCompliance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid student id");

  const student = await Student.findOne({ _id: req.params.id, schoolId });
  if (!student) throw new ApiError(404, "Student not found");

  applyStudentCompliance(student, req.body, req.user._id);

  try {
    await student.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "That PEN or APAAR ID is already recorded against another student");
    }
    throw error;
  }

  return res.json(new ApiResponse(200, student.compliance, "Student compliance updated"));
});

/**
 * Bulk update, for the realistic case: the office downloads PENs from the portal and pastes them
 * back in a few hundred at a time.
 *
 * Every row is reported individually. Failing the whole batch because one PEN is a duplicate
 * would mean the office cannot make progress until every single row is perfect.
 */
export const bulkUpdateStudentCompliance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { rows } = req.body;

  if (!Array.isArray(rows) || !rows.length) throw new ApiError(400, "Nothing to update");
  if (rows.length > 500) throw new ApiError(400, "Update at most 500 students at a time");

  const updated = [];
  const failed = [];

  for (const row of rows) {
    if (!mongoose.isValidObjectId(row?.studentId)) {
      failed.push({ studentId: row?.studentId ?? null, reason: "Invalid student id" });
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const student = await Student.findOne({ _id: row.studentId, schoolId });
      if (!student) {
        failed.push({ studentId: row.studentId, reason: "Student not found in your school" });
        continue;
      }
      applyStudentCompliance(student, row, req.user._id);
      // eslint-disable-next-line no-await-in-loop
      await student.save();
      updated.push(String(student._id));
    } catch (error) {
      failed.push({
        studentId: row.studentId,
        reason: error?.code === 11000 ? "That PEN or APAAR ID already belongs to another student" : error.message,
      });
    }
  }

  return res.json(
    new ApiResponse(
      200,
      { updated: updated.length, failed },
      failed.length ? `${updated.length} updated, ${failed.length} could not be saved` : `${updated.length} student(s) updated`
    )
  );
});

/* ── Reports ─────────────────────────────────────────────────────── */

export const getReadiness = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await readinessReport({ schoolId, academicYearId: req.query.academicYearId || null });

  return res.json(
    new ApiResponse(
      200,
      data,
      data.incompleteStudents
        ? `${data.incompleteStudents} student record(s) are not ready to file`
        : "Every student record is complete"
    )
  );
});

export const getRte = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await rteReport({ schoolId, academicYearId: req.query.academicYearId || null });
  return res.json(new ApiResponse(200, data, "RTE position"));
});

export const getExport = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await exportRows({ schoolId, academicYearId: req.query.academicYearId || null });
  return res.json(new ApiResponse(200, rows, `${rows.length} row(s) ready`));
});
