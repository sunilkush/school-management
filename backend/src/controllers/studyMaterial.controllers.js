import { StudyMaterial } from "../models/StudyMaterial.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

const isStudent = (req) => (req.userRole?.name || req.user?.role?.name) === "Student";

// Students may only ever browse materials for their own enrolled class — resolve it
// server-side rather than trusting a client-supplied schoolClassId query param.
const getMyEnrolledClassId = async (req) => {
  const student = await Student.findOne({ userId: req.user._id }).select("_id");
  if (!student) throw new ApiError(404, "Student profile not found");

  const enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    schoolId: getSchoolId(req),
  })
    .select("schoolClassId")
    .sort({ createdAt: -1 });

  if (!enrollment) throw new ApiError(404, "Enrollment not found");
  return enrollment.schoolClassId;
};

const assertSameSchool = (req, material) => {
  if (isSuperAdmin(req)) return;
  if (`${material.schoolId}` !== `${getSchoolId(req)}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

export const createStudyMaterial = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { academicYearId, schoolClassId, sectionId, subjectId, title, description, type, externalLink } = req.body;

  if (!schoolClassId || !subjectId || !title || !academicYearId) {
    throw new ApiError(400, "academicYearId, schoolClassId, subjectId, and title are required");
  }

  let fileUrl = "";
  let fileName = "";
  let fileSize = 0;

  if (req.file) {
    const upload = await uploadOnCloudinary(req.file.path);
    if (upload) {
      fileUrl  = upload.secure_url;
      fileName = req.file.originalname || upload.original_filename || "";
      fileSize = upload.bytes || req.file.size || 0;
    }
  }

  const material = await StudyMaterial.create({
    schoolId,
    academicYearId,
    schoolClassId,
    sectionId: sectionId || null,
    subjectId,
    uploadedBy: req.user._id,
    title,
    description: description || "",
    type: type || "notes",
    fileUrl,
    fileName,
    fileSize,
    externalLink: externalLink || "",
  });

  return res.status(201).json(new ApiResponse(201, material, "Study material uploaded successfully"));
});

export const getStudyMaterials = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { academicYearId, schoolClassId, subjectId, type, page = 1, limit = 20 } = req.query;

  const filter = { schoolId, isActive: true };
  if (academicYearId) filter.academicYearId = academicYearId;
  if (subjectId)      filter.subjectId      = subjectId;
  if (type)           filter.type           = type;

  if (isStudent(req)) {
    filter.schoolClassId = await getMyEnrolledClassId(req);
  } else if (schoolClassId) {
    filter.schoolClassId = schoolClassId;
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await StudyMaterial.countDocuments(filter);
  const items = await StudyMaterial.find(filter)
    .populate("schoolClassId", "name")
    .populate("subjectId", "name")
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }, "Study materials fetched"));
});

export const getStudyMaterialById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const material = await StudyMaterial.findById(id)
    .populate("schoolClassId", "name")
    .populate("subjectId", "name")
    .populate("uploadedBy", "name email");

  if (!material || !material.isActive) throw new ApiError(404, "Study material not found");
  assertSameSchool(req, material);

  if (isStudent(req)) {
    const myClassId = await getMyEnrolledClassId(req);
    if (`${material.schoolClassId?._id || material.schoolClassId}` !== `${myClassId}`) {
      throw new ApiError(403, "Forbidden access outside your class");
    }
  }

  return res.json(new ApiResponse(200, material, "Study material fetched"));
});

export const updateStudyMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const material = await StudyMaterial.findById(id);
  if (!material || !material.isActive) throw new ApiError(404, "Study material not found");
  assertSameSchool(req, material);

  if (String(material.uploadedBy) !== String(req.user._id)) {
    const userRole = req.userRole?.name || req.user?.role?.name;
    if (!["Super Admin", "School Admin"].includes(userRole)) {
      throw new ApiError(403, "Not authorized to update this material");
    }
  }

  const { title, description, type, externalLink } = req.body;
  if (title)        material.title       = title;
  if (description !== undefined) material.description = description;
  if (type)         material.type        = type;
  if (externalLink !== undefined) material.externalLink = externalLink;

  if (req.file) {
    const upload = await uploadOnCloudinary(req.file.path);
    if (upload) {
      material.fileUrl  = upload.secure_url;
      material.fileName = req.file.originalname || upload.original_filename || "";
      material.fileSize = upload.bytes || req.file.size || 0;
    }
  }

  await material.save();
  return res.json(new ApiResponse(200, material, "Study material updated"));
});

export const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const material = await StudyMaterial.findById(id);
  if (!material || !material.isActive) throw new ApiError(404, "Study material not found");
  assertSameSchool(req, material);

  if (String(material.uploadedBy) !== String(req.user._id)) {
    const userRole = req.userRole?.name || req.user?.role?.name;
    if (!["Super Admin", "School Admin"].includes(userRole)) {
      throw new ApiError(403, "Not authorized to delete this material");
    }
  }

  material.isActive = false;
  await material.save();
  return res.json(new ApiResponse(200, {}, "Study material deleted"));
});
