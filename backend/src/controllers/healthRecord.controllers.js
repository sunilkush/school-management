import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { HealthProfile } from "../models/HealthProfile.model.js";
import { HealthVisit } from "../models/HealthVisit.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { School } from "../models/school.model.js";

const resolveSchoolId = (req) =>
  req.user.roleId?.name === "Super Admin" ? req.query.schoolId || req.body.schoolId || req.user.schoolId : req.user.schoolId;

const ensureAccess = (doc, user, notFoundMessage) => {
  if (!doc) throw new ApiError(404, notFoundMessage);
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school record");
  }
};

const resolveStudentEnrollment = async (studentId, schoolId, activeAcademicYearId) => {
  let enrollment = null;
  if (activeAcademicYearId) {
    enrollment = await StudentEnrollment.findOne({ studentId, schoolId, academicYearId: activeAcademicYearId })
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
  return enrollment;
};

export const getHealthProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const profile = await HealthProfile.findOne({ schoolId, studentId }).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, profile || null, profile ? "Health profile fetched successfully" : "No health profile created yet"));
});

export const upsertHealthProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const {
    bloodGroup, height, weight, allergies, chronicConditions,
    medications, vaccinations, emergencyContact, doctorContact, notes,
  } = req.body;

  const profile = await HealthProfile.findOneAndUpdate(
    { schoolId, studentId },
    {
      $set: {
        schoolId,
        studentId,
        bloodGroup, height, weight, allergies, chronicConditions,
        medications, vaccinations, emergencyContact, doctorContact, notes,
        updatedBy: req.user._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(new ApiResponse(200, profile, "Health profile saved successfully"));
});

export const createHealthVisit = asyncHandler(async (req, res) => {
  const {
    studentId, visitDate, symptoms, treatmentGiven, temperature, severity,
    referredToHospital, referredTo, parentNotified, followUpDate,
  } = req.body;

  const student = await Student.findById(studentId).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();
  const enrollment = await resolveStudentEnrollment(studentId, schoolId, school?.activeAcademicYearId);

  const visit = await HealthVisit.create({
    schoolId,
    studentId,
    studentName: student.userId?.name || "",
    className: enrollment?.schoolClassId?.name || "",
    sectionName: enrollment?.sectionId?.name || "",
    visitDate: visitDate || new Date(),
    symptoms,
    treatmentGiven: treatmentGiven || "",
    temperature: temperature ?? null,
    severity: severity || "Minor",
    referredToHospital: !!referredToHospital,
    referredTo: referredTo || "",
    parentNotified: !!parentNotified,
    parentNotifiedAt: parentNotified ? new Date() : null,
    followUpDate: followUpDate || null,
    recordedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, visit, "Health visit recorded successfully"));
});

export const getHealthVisits = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { studentId, status, severity, search, from, to, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (from || to) {
    filter.visitDate = {};
    if (from) filter.visitDate.$gte = new Date(from);
    if (to) filter.visitDate.$lte = new Date(to);
  }
  if (search) {
    filter.studentName = new RegExp(search.trim(), "i");
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-visitDate";

  const [visits, total] = await Promise.all([
    HealthVisit.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    HealthVisit.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      visits,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "Health visits fetched successfully")
  );
});

export const getHealthVisitById = asyncHandler(async (req, res) => {
  const visit = await HealthVisit.findById(req.params.id).lean();
  ensureAccess(visit, req.user, "Health visit not found");

  return res.status(200).json(new ApiResponse(200, visit, "Health visit fetched successfully"));
});

export const updateHealthVisit = asyncHandler(async (req, res) => {
  const visit = await HealthVisit.findById(req.params.id);
  ensureAccess(visit, req.user, "Health visit not found");

  const {
    treatmentGiven, temperature, severity, referredToHospital, referredTo,
    parentNotified, followUpDate, status,
  } = req.body;

  if (treatmentGiven !== undefined) visit.treatmentGiven = treatmentGiven;
  if (temperature !== undefined) visit.temperature = temperature;
  if (severity !== undefined) visit.severity = severity;
  if (referredToHospital !== undefined) visit.referredToHospital = referredToHospital;
  if (referredTo !== undefined) visit.referredTo = referredTo;
  if (followUpDate !== undefined) visit.followUpDate = followUpDate;
  if (status !== undefined) visit.status = status;
  if (parentNotified !== undefined && parentNotified && !visit.parentNotified) {
    visit.parentNotified = true;
    visit.parentNotifiedAt = new Date();
  } else if (parentNotified !== undefined) {
    visit.parentNotified = parentNotified;
  }

  await visit.save();

  return res.status(200).json(new ApiResponse(200, visit, "Health visit updated successfully"));
});
