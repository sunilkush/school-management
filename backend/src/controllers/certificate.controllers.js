import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Certificate, CERTIFICATE_TYPES } from "../models/Certificate.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { School } from "../models/school.model.js";
import { exportCertificatePdf } from "../utils/exportService.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import {
  generateNextCertificateNumber,
  getCertificatePrefix,
} from "../utils/generateCertificateNumber.js";

const ensureCertificateAccess = (doc, user) => {
  if (!doc) throw new ApiError(404, "Certificate not found");
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school certificate");
  }
};

// Resolves the calling Student/Parent to the set of Student._id's they're allowed to see —
// their own record for a Student, or their linked children for a Parent. Used only by the /my
// self-service endpoints; admin endpoints above scope by schoolId, not by holder identity.
const resolveMyStudentIds = async (req) => {
  const roleName = req.user.roleId?.name;
  if (roleName === "Student") {
    const student = await Student.findOne({ userId: req.user._id }).select("_id").lean();
    return student ? [student._id] : [];
  }
  if (roleName === "Parent") {
    const children = await Student.find({
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id").lean();
    return children.map((c) => c._id);
  }
  return [];
};

const buildCertificateNumber = async (schoolId, certificateType) => {
  const prefix = getCertificatePrefix(certificateType);
  const year = new Date().getFullYear();

  const lastCert = await Certificate.findOne({ schoolId, certificateType })
    .sort({ createdAt: -1 })
    .select("certificateNumber")
    .lean();

  return generateNextCertificateNumber(lastCert?.certificateNumber, { prefix, year, digits: 4 });
};

export const generateCertificate = asyncHandler(async (req, res) => {
  const {
    studentId,
    certificateType,
    issueDate,
    conduct,
    dateOfLeaving,
    reasonForLeaving,
    purpose,
    remarks,
    signatoryName,
    signatoryDesignation,
  } = req.body;

  if (!CERTIFICATE_TYPES.includes(certificateType)) {
    throw new ApiError(400, "Invalid certificate type");
  }

  const student = await Student.findById(studentId)
    .populate("userId", "name email")
    .lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) {
    throw new ApiError(403, "Forbidden for this school student");
  }

  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();

  let enrollment = null;
  if (school?.activeAcademicYearId) {
    enrollment = await StudentEnrollment.findOne({
      studentId,
      schoolId,
      academicYearId: school.activeAcademicYearId,
    })
      .sort({ createdAt: -1 })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .lean();
  }
  if (!enrollment) {
    enrollment = await StudentEnrollment.findOne({ studentId, schoolId })
      .sort({ createdAt: -1 })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .lean();
  }

  const snapshot = {
    schoolId,
    studentId,
    enrollmentId: enrollment?._id || null,
    academicYearId: enrollment?.academicYearId || school?.activeAcademicYearId || null,
    studentName: student.userId?.name || "",
    fatherName: student.fatherInfo?.name || "",
    motherName: student.motherInfo?.name || "",
    dateOfBirth: student.dateOfBirth || null,
    address: student.address || "",
    className: enrollment?.schoolClassId?.name || "",
    sectionName: enrollment?.sectionId?.name || "",
    rollNumber: enrollment?.rollNumber != null ? String(enrollment.rollNumber) : "",
    registrationNumber: enrollment?.registrationNumber || "",
    admissionDate: enrollment?.admissionDate || null,
    conduct: conduct || "",
    dateOfLeaving: dateOfLeaving || null,
    reasonForLeaving: reasonForLeaving || "",
    purpose: purpose || "",
    remarks: remarks || "",
    signatoryName: signatoryName || "",
    signatoryDesignation: signatoryDesignation || "Principal",
    issueDate: issueDate || new Date(),
    generatedBy: req.user._id,
  };

  let certificate;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const certificateNumber = await buildCertificateNumber(schoolId, certificateType);
    try {
      certificate = await Certificate.create({ ...snapshot, certificateType, certificateNumber });
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) continue;
      throw error;
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, certificate, "Certificate generated successfully"));
});

export const getCertificates = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user.roleId?.name === "Super Admin";
  const schoolId = isSuperAdmin ? req.query.schoolId || req.user.schoolId : req.user.schoolId;

  const { certificateType, status, studentId, from, to, search, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (certificateType) filter.certificateType = certificateType;
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (from || to) {
    filter.issueDate = {};
    if (from) filter.issueDate.$gte = new Date(from);
    if (to) filter.issueDate.$lte = new Date(to);
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ certificateNumber: regex }, { studentName: regex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-createdAt";

  const [certificates, total] = await Promise.all([
    Certificate.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    Certificate.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      certificates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    }, "Certificates fetched successfully")
  );
});

export const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id).lean();
  ensureCertificateAccess(certificate, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, certificate, "Certificate fetched successfully"));
});

export const revokeCertificate = asyncHandler(async (req, res) => {
  const { revokeReason } = req.body;

  const certificate = await Certificate.findById(req.params.id);
  ensureCertificateAccess(certificate, req.user);

  if (certificate.status === "Revoked") {
    throw new ApiError(400, "Certificate already revoked");
  }

  certificate.status = "Revoked";
  certificate.revokedAt = new Date();
  certificate.revokedBy = req.user._id;
  certificate.revokeReason = revokeReason;
  await certificate.save();

  return res
    .status(200)
    .json(new ApiResponse(200, certificate, "Certificate revoked successfully"));
});

export const downloadCertificatePdf = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id).lean();
  ensureCertificateAccess(certificate, req.user);

  const school = await School.findById(certificate.schoolId)
    .select("name address email phone logo")
    .lean();

  const pdfBuffer = await exportCertificatePdf(certificate, school);
  const safeName = certificate.certificateNumber.replace(/[^a-zA-Z0-9-_]/g, "-");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer);
});

/* ══════════════════════ Student/Parent self-service ══════════════════════ */

export const getMyCertificates = asyncHandler(async (req, res) => {
  const studentIds = await resolveMyStudentIds(req);
  if (!studentIds.length) {
    return res.status(200).json(new ApiResponse(200, [], "No certificates found"));
  }

  const certificates = await Certificate.find({ studentId: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, certificates, "Certificates fetched successfully"));
});

export const downloadMyCertificatePdf = asyncHandler(async (req, res) => {
  const studentIds = await resolveMyStudentIds(req);
  const certificate = await Certificate.findOne({
    _id: req.params.id,
    studentId: { $in: studentIds },
  }).lean();

  if (!certificate) throw new ApiError(404, "Certificate not found");

  const school = await School.findById(certificate.schoolId)
    .select("name address email phone logo")
    .lean();

  const pdfBuffer = await exportCertificatePdf(certificate, school);
  const safeName = certificate.certificateNumber.replace(/[^a-zA-Z0-9-_]/g, "-");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer);
});

/* ══════════════════════ Public verification (no auth) ══════════════════════ */
// Deliberately minimal payload — this route is intentionally exempt from the auth wall
// (see PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js), so it must never return the address/
// DOB/parent-contact fields the authenticated endpoints above do.

export const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({
    certificateNumber: req.params.certificateNumber.toUpperCase(),
  }).lean();

  if (!certificate) {
    return res.status(200).json(new ApiResponse(200, { valid: false }, "Certificate not found"));
  }

  const school = await School.findById(certificate.schoolId).select("name").lean();

  return res.status(200).json(new ApiResponse(200, {
    valid: certificate.status === "Issued",
    certificateType: certificate.certificateType,
    certificateNumber: certificate.certificateNumber,
    studentName: certificate.studentName,
    className: certificate.className,
    sectionName: certificate.sectionName,
    issueDate: certificate.issueDate,
    status: certificate.status,
    schoolName: school?.name || "",
  }, "Certificate verification result"));
});
