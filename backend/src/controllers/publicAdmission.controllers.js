import crypto from "crypto";
import mongoose from "mongoose";

import { AdmissionInquiry } from "../models/AdmissionInquiry.model.js";
import { School } from "../models/school.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { notifyUser } from "../utils/notifyService.js";

/**
 * Public (unauthenticated) admission portal — the outside-facing half of the admissions
 * pipeline. Everything a parent submits here lands in the SAME AdmissionInquiry collection
 * the staff Admission Inquiry screen already reads, with source "website", so schools work
 * one inbox instead of two.
 *
 * Trust model, since none of these routes have a session:
 *  - schoolId is the one field that legitimately comes from the client (the applicant picks
 *    their school); every handler re-validates it against an active, admissions-open School
 *    before writing anything, and never accepts a schoolId indirectly via another document.
 *  - applicationNumber is random, not sequential, and every lookup additionally requires the
 *    registered parent phone — so the tracking endpoint can't be walked to enumerate
 *    applicants of any school.
 *  - Responses are built field-by-field; internal pipeline data (notes, assignedTo,
 *    convertedStudentId, follow-ups) is never exposed publicly.
 */

const DOC_TYPES = [
  "photo",
  "birth_certificate",
  "prev_marksheet",
  "transfer_certificate",
  "address_proof",
  "id_proof",
  "other",
];

/** Random, non-guessable public reference: ADM-2026-K3F9QX. Retried on the (very unlikely)
 *  collision rather than made sequential, which would be enumerable from /track. */
const makeApplicationNumber = () => {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).readUInt32BE(0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `ADM-${year}-${suffix}`;
};

/** Loads a school only if it is currently accepting public applications. */
const getOpenSchool = async (schoolId) => {
  if (!mongoose.isValidObjectId(schoolId)) throw new ApiError(400, "Invalid school");
  const school = await School.findOne({
    _id: schoolId,
    isActive: true,
    status: "active",
    admissionsOpen: true,
    deletedAt: null,
  }).select("name activeAcademicYearId").lean();
  if (!school) throw new ApiError(404, "This school is not accepting online applications");
  return school;
};

/** Shape returned to the applicant — deliberately narrow. */
const publicView = (application) => ({
  applicationNumber: application.applicationNumber,
  studentName: application.studentName,
  applyingClass: application.applyingClass,
  academicYear: application.academicYear,
  status: application.status,
  submittedAt: application.submittedAt,
  documents: (application.documents || []).map((d) => ({
    docType: d.docType,
    originalName: d.originalName,
    uploadedAt: d.uploadedAt,
  })),
});

/** Fire-and-forget: tell the school's admins a new application arrived. Never throws — a
 *  notification problem must not fail the applicant's submission. */
const notifySchoolAdmins = async ({ schoolId, application }) => {
  try {
    const adminRole = await Role.findOne({ name: "School Admin", schoolId });
    if (!adminRole) return;
    const admins = await User.find({ schoolId, roleId: adminRole._id, isActive: true }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          schoolId,
          userId: admin._id,
          title: "New online admission application",
          message: `${application.studentName} applied for ${application.applyingClass} (${application.applicationNumber}). Review it under Admissions → Inquiries.`,
          channels: { inApp: true, email: true },
        })
      )
    );
  } catch (error) {
    console.error("[publicAdmission] Admin notification failed:", error.message);
  }
};

/* ── GET /public/admissions/schools ──────────────────────────────────
   Directory of schools currently open for online admission. */
export const listAdmissionSchools = asyncHandler(async (_req, res) => {
  const schools = await School.find({
    isActive: true,
    status: "active",
    admissionsOpen: true,
    deletedAt: null,
  })
    .select("name logo address website")
    .sort({ name: 1 })
    .limit(200)
    .lean();

  return res.json(new ApiResponse(200, schools, "Schools open for admission"));
});

/* ── GET /public/admissions/schools/:schoolId ────────────────────────
   Everything the application form needs to render for one school. */
export const getSchoolAdmissionInfo = asyncHandler(async (req, res) => {
  const school = await getOpenSchool(req.params.schoolId);

  const classes = await SchoolClass.find({
    schoolId: req.params.schoolId,
    status: "active",
    ...(school.activeAcademicYearId ? { academicYearId: school.activeAcademicYearId } : {}),
  })
    .select("name")
    .sort({ name: 1 })
    .lean();

  return res.json(
    new ApiResponse(
      200,
      {
        school: { _id: school._id, name: school.name },
        classes: classes.map((c) => c.name),
        documentTypes: DOC_TYPES,
      },
      "School admission info"
    )
  );
});

/* ── POST /public/admissions/apply ───────────────────────────────────
   Submits an application. Re-submitting the same child/class from the same phone
   returns the existing application rather than creating a duplicate. */
export const submitApplication = asyncHandler(async (req, res) => {
  const {
    schoolId,
    studentName, dateOfBirth, gender, applyingClass, academicYear,
    parentName, parentPhone, parentEmail, relationship, address,
    previousSchool, previousClass,
  } = req.body;

  await getOpenSchool(schoolId);

  if (!studentName?.trim()) throw new ApiError(400, "Student name is required");
  if (!parentName?.trim()) throw new ApiError(400, "Parent/guardian name is required");
  if (!parentPhone?.trim()) throw new ApiError(400, "Parent phone is required");
  if (!applyingClass?.trim()) throw new ApiError(400, "Class applying for is required");

  const phone = parentPhone.trim();
  if (!/^[0-9+\-() ]{6,20}$/.test(phone)) throw new ApiError(400, "Enter a valid phone number");
  if (parentEmail && !/^\S+@\S+\.\S+$/.test(parentEmail.trim())) {
    throw new ApiError(400, "Enter a valid email address");
  }

  const existing = await AdmissionInquiry.findOne({
    schoolId,
    parentPhone: phone,
    studentName: studentName.trim(),
    applyingClass: applyingClass.trim(),
    applicationNumber: { $ne: null },
  });
  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, publicView(existing), "An application already exists for this student"));
  }

  // Retry only on a duplicate-key collision of the random reference.
  let application = null;
  for (let attempt = 0; attempt < 5 && !application; attempt += 1) {
    try {
      application = await AdmissionInquiry.create({
        schoolId,
        studentName: studentName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender,
        applyingClass: applyingClass.trim(),
        academicYear,
        parentName: parentName.trim(),
        parentPhone: phone,
        parentEmail: parentEmail?.trim(),
        relationship,
        address,
        previousSchool,
        previousClass,
        source: "website",
        status: "new",
        applicationNumber: makeApplicationNumber(),
        submittedAt: new Date(),
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  if (!application) throw new ApiError(500, "Could not generate an application number, please retry");

  notifySchoolAdmins({ schoolId, application });

  return res
    .status(201)
    .json(new ApiResponse(201, publicView(application), "Application submitted"));
});

/* ── GET /public/admissions/track?applicationNumber=&phone= ──────────
   Both parts are required — the reference alone is never enough. */
export const trackApplication = asyncHandler(async (req, res) => {
  const applicationNumber = String(req.query.applicationNumber || "").trim();
  const phone = String(req.query.phone || "").trim();
  if (!applicationNumber || !phone) {
    throw new ApiError(400, "Application number and registered phone are both required");
  }

  const application = await AdmissionInquiry.findOne({ applicationNumber, parentPhone: phone });
  // Same message either way, so a wrong phone can't confirm that a reference exists.
  if (!application) throw new ApiError(404, "No application found for those details");

  return res.json(new ApiResponse(200, publicView(application), "Application status"));
});

/* ── POST /public/admissions/documents/:applicationNumber ────────────
   Applicant uploads supporting documents against their own application. */
export const uploadApplicationDocuments = asyncHandler(async (req, res) => {
  const applicationNumber = String(req.params.applicationNumber || "").trim();
  const phone = String(req.body.phone || "").trim();
  if (!phone) throw new ApiError(400, "Registered phone is required");

  const application = await AdmissionInquiry.findOne({ applicationNumber, parentPhone: phone });
  if (!application) throw new ApiError(404, "No application found for those details");

  if (["enrolled", "rejected"].includes(application.status)) {
    throw new ApiError(400, "This application is closed and no longer accepts documents");
  }

  const files = req.files || [];
  if (!files.length) throw new ApiError(400, "Attach at least one document");

  const requestedType = String(req.body.docType || "other");
  const docType = DOC_TYPES.includes(requestedType) ? requestedType : "other";

  const uploaded = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadOnCloudinary(file.path);
    if (!result?.secure_url) continue;
    uploaded.push({
      docType,
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.originalname,
      uploadedAt: new Date(),
    });
  }

  if (!uploaded.length) throw new ApiError(502, "Document upload failed, please try again");

  application.documents.push(...uploaded);
  if (application.status === "new") application.status = "docs_submitted";
  await application.save();

  return res.json(new ApiResponse(200, publicView(application), "Documents uploaded"));
});
