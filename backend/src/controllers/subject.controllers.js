import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import mongoose from "mongoose";

// ✅ CREATE SUBJECT
const createSubject = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    type,
    maxMarks,
    passMarks,
    description,
    assignedTeachers = [],
    assignedClasses = [],
    assignedSchools = [],
    academicYearId,
    schoolId,
    isGlobal = false,
    createdByRole,
  } = req.body;

  const createdBy = req.user?._id;
  const userRole = createdByRole || req.user?.role;

  // 🔍 Validation
  if (!name || !createdBy || !createdByRole)
    throw new ApiError(400, "Missing required fields");

  if (userRole === "School Admin" && !academicYearId)
    throw new ApiError(400, "Academic year is required for school admins");

  // 🔍 Duplicate check
  const query = isGlobal
    ? { name: name.toUpperCase(), isGlobal: true }
    : { name: name.toUpperCase(), schoolId, academicYearId };

  if (await Subject.findOne(query))
    throw new ApiError(400, "Subject already exists");

  // ✅ Create subject
  const subject = await Subject.create({
    name,
    category,
    type,
    maxMarks,
    passMarks,
    description,
    assignedTeachers,
    assignedClasses,
    assignedSchools,
    academicYearId: userRole === "Super Admin" ? null : academicYearId,
    schoolId: isGlobal ? null : schoolId,
    isGlobal,
    createdBy,
    createdByRole,
  });

  const populated = await Subject.findById(subject._id)
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startYear endYear");

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Subject created successfully"));
});

// ✅ GET ALL SUBJECTS
const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, schoolId, isGlobal } = req.query;
  const skip = (page - 1) * limit;

  const role = req.user.role?.toLowerCase();
  const query = {};

  if (role === "super admin") {
    if (isGlobal !== undefined) query.isGlobal = isGlobal === "true";
    if (schoolId) query.schoolId = new mongoose.Types.ObjectId(schoolId);
  } else if (role === "school admin") {
    query.$or = [
      { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) },
      { isGlobal: true },
    ];
  }

  if (search) query.name = { $regex: search, $options: "i" };

  const subjects = await Subject.find(query)
    .populate("schoolId", "name")
    .populate("assignedTeachers", "name email schoolId")
    .populate("assignedClasses", "name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Subject.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subjects,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Subjects retrieved successfully"
    )
  );
});

// ✅ UPDATE SUBJECT
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  if (
    req.user.role === "School Admin" &&
    (subject.isGlobal ||
      subject.schoolId?.toString() !== req.user.schoolId?.toString())
  ) {
    throw new ApiError(403, "Not authorized to update this subject");
  }

  Object.assign(subject, updates, { updatedBy: req.user._id });
  await subject.save();

  const updatedSubject = await Subject.findById(id)
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .populate("schoolId", "name");

  res
    .status(200)
    .json(new ApiResponse(200, updatedSubject, "Subject updated successfully"));
});

// ✅ DELETE SUBJECT
const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  if (
    req.user.role === "School Admin" &&
    (subject.isGlobal ||
      subject.schoolId?.toString() !== req.user.schoolId?.toString())
  ) {
    throw new ApiError(403, "Not authorized to delete this subject");
  }

  await subject.deleteOne();
  res.status(200).json(new ApiResponse(200, {}, "Subject deleted successfully"));
});

// ✅ ASSIGN MULTIPLE SCHOOLS TO GLOBAL SUBJECT
const assignSchoolsToSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { schoolIds = [] } = req.body;

  if (req.user.role !== "Super Admin")
    throw new ApiError(403, "Only Super Admin can assign schools");

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  subject.assignedSchools = [...new Set([...subject.assignedSchools, ...schoolIds])];
  await subject.save();

  res
    .status(200)
    .json(new ApiResponse(200, subject, "Schools assigned successfully"));
});


//
// ✅ Get Single Subject by ID (Detailed + Role Safe)
//
const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 🧩 Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  // 🔍 Fetch subject with full population
  const subject = await Subject.findById(id)
    .populate("assignedTeachers", "name email role schoolId")
    .populate("assignedClasses", "name section code")
    .populate("schoolId", "name code")
    .populate("academicYearId", "name startYear endYear")
    .populate("gradingSchemeId", "name minMarks maxMarks");

  if (!subject) throw new ApiError(404, "Subject not found");

  // 🧩 Role-based access check
  const userRole = req.user.role;
  if (
    userRole === "School Admin" &&
    subject.isGlobal === false &&
    subject.schoolId &&
    subject.schoolId._id.toString() !== req.user.schoolId?.toString()
  ) {
    throw new ApiError(403, "You are not authorized to view this subject");
  }

  // 🧹 Filter assigned teachers (if School Admin → only same school teachers)
  let filteredTeachers = subject.assignedTeachers;
  if (userRole === "School Admin") {
    filteredTeachers = subject.assignedTeachers.filter(
      (t) => t.schoolId?.toString() === req.user.schoolId?.toString()
    );
  }

  const responseData = {
    _id: subject._id,
    name: subject.name,
    code: subject.code,
    shortName: subject.shortName,
    category: subject.category,
    type: subject.type,
    maxMarks: subject.maxMarks,
    passMarks: subject.passMarks,
    description: subject.description,
    isGlobal: subject.isGlobal,
    school: subject.schoolId,
    academicYear: subject.academicYearId,
    gradingScheme: subject.gradingSchemeId,
    assignedClasses: subject.assignedClasses,
    assignedTeachers: filteredTeachers,
    status: subject.status,
    isActive: subject.isActive,
    remarks: subject.remarks,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Subject retrieved successfully"));
});

export {
  createSubject,
  getSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
  assignSchoolsToSubject,
};
