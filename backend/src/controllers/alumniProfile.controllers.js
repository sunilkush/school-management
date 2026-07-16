import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AlumniProfile } from "../models/AlumniProfile.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

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

export const markAsAlumni = asyncHandler(async (req, res) => {
  const { studentId, graduationYear } = req.body;

  const student = await Student.findById(studentId).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const existing = await AlumniProfile.findOne({ schoolId, studentId }).lean();
  if (existing) throw new ApiError(400, "This student has already been marked as alumni");

  const enrollment = await StudentEnrollment.findOne({ studentId, schoolId })
    .sort({ createdAt: -1 })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .lean();

  const profile = await AlumniProfile.create({
    schoolId,
    studentId,
    userId: student.userId?._id || null,
    fullName: student.userId?.name || "",
    graduationYear: graduationYear || new Date().getFullYear(),
    lastClassName: enrollment?.schoolClassId?.name || "",
    lastSectionName: enrollment?.sectionId?.name || "",
    registrationNumber: enrollment?.registrationNumber || "",
    markedBy: req.user._id,
  });

  await Student.findByIdAndUpdate(studentId, { status: "alumni" });
  if (enrollment?._id) {
    await StudentEnrollment.findByIdAndUpdate(enrollment._id, { status: "Alumni" });
  }

  return res.status(201).json(new ApiResponse(201, profile, "Student marked as alumni successfully"));
});

export const getAlumni = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { graduationYear, isReachable, search, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (graduationYear) filter.graduationYear = parseInt(graduationYear, 10);
  if (isReachable !== undefined) filter.isReachable = isReachable === "true";
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ fullName: regex }, { currentOccupation: regex }, { currentEmployer: regex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-graduationYear";

  const [alumni, total] = await Promise.all([
    AlumniProfile.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    AlumniProfile.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      alumni,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "Alumni fetched successfully")
  );
});

export const getAlumniById = asyncHandler(async (req, res) => {
  const profile = await AlumniProfile.findById(req.params.id).lean();
  ensureAccess(profile, req.user, "Alumni profile not found");

  return res.status(200).json(new ApiResponse(200, profile, "Alumni profile fetched successfully"));
});

export const updateAlumniProfile = asyncHandler(async (req, res) => {
  const profile = await AlumniProfile.findById(req.params.id);
  ensureAccess(profile, req.user, "Alumni profile not found");

  const {
    currentOccupation, currentEmployer, higherEducation, currentAddress,
    currentPhone, currentEmail, linkedInUrl, achievements, engagementNotes, isReachable,
  } = req.body;

  if (currentOccupation !== undefined) profile.currentOccupation = currentOccupation;
  if (currentEmployer !== undefined) profile.currentEmployer = currentEmployer;
  if (higherEducation !== undefined) profile.higherEducation = higherEducation;
  if (currentAddress !== undefined) profile.currentAddress = currentAddress;
  if (currentPhone !== undefined) profile.currentPhone = currentPhone;
  if (currentEmail !== undefined) profile.currentEmail = currentEmail;
  if (linkedInUrl !== undefined) profile.linkedInUrl = linkedInUrl;
  if (achievements !== undefined) profile.achievements = achievements;
  if (engagementNotes !== undefined) profile.engagementNotes = engagementNotes;
  if (isReachable !== undefined) profile.isReachable = isReachable;

  await profile.save();

  return res.status(200).json(new ApiResponse(200, profile, "Alumni profile updated successfully"));
});
