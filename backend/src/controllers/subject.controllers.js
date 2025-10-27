import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import mongoose from "mongoose";

//
// ✅ Create Subject (Super Admin & School Admin)
//
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
    academicYearId,
    schoolId,
    isGlobal = false,
    createdByRole
  } = req.body;

  const createdBy = req.user?._id;
  
  
  console.log(createdByRole)
  if (!name || !academicYearId || !createdBy || !createdByRole) {
    throw new ApiError(400, "Missing required fields");
  }

  // 🔍 Check for duplicate by name + context
  const query = isGlobal
    ? { name: name.toUpperCase(), isGlobal: true }
    : { name: name.toUpperCase(), schoolId, academicYearId };

  const existing = await Subject.findOne(query);
  if (existing) {
    throw new ApiError(400, "Subject already exists in this context");
  }

  // ✅ Create new subject
  const subject = await Subject.create({
    name,
    category,
    type,
    maxMarks,
    passMarks,
    description,
    assignedTeachers,
    assignedClasses,
    academicYearId,
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

//
// ✅ Get All Subjects (Super Admin → all, School Admin → own + global)
//
const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, schoolId, isGlobal } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = {};

  const role = req.user.role?.toLowerCase();

  // Role-based visibility
  if (role === "Super Admin") {
    if (isGlobal !== undefined) query.isGlobal = isGlobal === "true";
    if (schoolId) query.schoolId = new mongoose.Types.ObjectId(schoolId);
  } else if (role === "School Admin") {
    query.$or = [
      { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) },
      { isGlobal: true },
    ];
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const subjects = await Subject.find(query)
    .populate("schoolId", "name")
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subject.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subjects,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Subjects retrieved successfully"
    )
  );
});

//
// ✅ Get Single Subject by ID
//
const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await Subject.findById(id)
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startYear endYear")
    .populate("gradingSchemeId", "name minMarks maxMarks");

  if (!subject) throw new ApiError(404, "Subject not found");

  return res
    .status(200)
    .json(new ApiResponse(200, subject, "Subject retrieved successfully"));
});

//
// ✅ Update Subject
//
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    type,
    maxMarks,
    passMarks,
    assignedTeachers,
    assignedClasses,
    isActive,
    description,
  } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  // Role-based restriction
  if (
    req.user.role === "School Admin" &&
    (subject.isGlobal || subject.schoolId?.toString() !== req.user.schoolId)
  ) {
    throw new ApiError(403, "Not authorized to update this subject");
  }

  Object.assign(subject, {
    name,
    category,
    type,
    maxMarks,
    passMarks,
    assignedTeachers,
    assignedClasses,
    isActive,
    description,
    updatedBy: req.user._id,
  });

  await subject.save();

  const updated = await Subject.findById(id)
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .populate("schoolId", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Subject updated successfully"));
});

//
// ✅ Delete Subject
//
const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  // Role-based restriction
  if (
    req.user.role === "School Admin" &&
    (subject.isGlobal || subject.schoolId?.toString() !== req.user.schoolId)
  ) {
    throw new ApiError(403, "Not authorized to delete this subject");
  }

  await subject.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subject deleted successfully"));
});

export {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
};
