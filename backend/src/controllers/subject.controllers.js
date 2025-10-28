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
    createdByRole,
  } = req.body;

  const createdBy = req.user?._id;
  const userRole = createdByRole || req.user?.role;

  // ✅ Role-based validation
  if (userRole === "Super Admin") {
    if (!name || !createdBy || !createdByRole) {
      throw new ApiError(400, "Missing required fields for Super Admin");
    }
  } else {
    if (!name || !academicYearId || !createdBy || !createdByRole) {
      throw new ApiError(400, "Missing required fields for School Admin");
    }
  }

  // 🔍 Duplicate check
  const query = isGlobal
    ? { name: name.toUpperCase(), isGlobal: true }
    : { name: name.toUpperCase(), schoolId, academicYearId };

  const existing = await Subject.findOne(query);
  if (existing) throw new ApiError(400, "Subject already exists in this context");

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

  return res.status(201).json(
    new ApiResponse(201, populated, "Subject created successfully")
  );
});



//
// ✅ Get All Subjects (Super Admin → all, School Admin → own + global)
//
const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, schoolId, isGlobal } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = {};

  const role = req.user.role?.toLowerCase();

  // 🧩 Role-based filter
  if (role === "Super Admin") {
    if (isGlobal !== undefined) query.isGlobal = isGlobal === "true";
    if (schoolId) query.schoolId = new mongoose.Types.ObjectId(schoolId);
  } else if (role === "School Admin") {
    query.$or = [
      { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) },
      { isGlobal: true },
    ];
  }

  // 🧩 Search filter
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  // 🧩 Fetch and populate related data
  const subjects = await Subject.find(query)
    .populate("schoolId", "name")
    .populate("assignedTeachers", "name email schoolId")
    .populate("assignedClasses", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subject.countDocuments(query);

  // 🧹 Filter out teachers who belong to other schools
  const filteredSubjects = subjects.map((subj) => {
    let filteredTeachers = subj.assignedTeachers;
    if (schoolId) {
      filteredTeachers = subj.assignedTeachers?.filter(
        (t) => String(t.schoolId) === String(schoolId)
      );
    } else if (req.user.schoolId && role === "School Admin") {
      filteredTeachers = subj.assignedTeachers?.filter(
        (t) => String(t.schoolId) === String(req.user.schoolId)
      );
    }

    return {
      ...subj.toObject(),
      assignedTeachers: filteredTeachers || [],
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subjects: filteredSubjects,
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
  const { id } = req.params; // ✅ Subject ID from route parameter
  const {
    name,
    category,
    type,
    maxMarks,
    passMarks,
    assignedTeachers = [],
    assignedClasses = [],
    isActive,
    description,
  } = req.body;

  // ✅ Check if subject exists
  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  // ✅ Restrict School Admin from editing global subjects or others' data
  if (
    req.user.role === "School Admin" &&
    (subject.isGlobal || subject.schoolId?.toString() !== req.user.schoolId?.toString())
  ) {
    throw new ApiError(403, "Not authorized to update this subject");
  }

  // ✅ Update only provided fields
  if (name !== undefined) subject.name = name;
  if (category !== undefined) subject.category = category;
  if (type !== undefined) subject.type = type;
  if (maxMarks !== undefined) subject.maxMarks = maxMarks;
  if (passMarks !== undefined) subject.passMarks = passMarks;
  if (assignedTeachers !== undefined) subject.assignedTeachers = assignedTeachers;
  if (assignedClasses !== undefined) subject.assignedClasses = assignedClasses;
  if (isActive !== undefined) subject.isActive = isActive;
  if (description !== undefined) subject.description = description;

  subject.updatedBy = req.user._id;

  // ✅ Save updates
  await subject.save();

  // ✅ Populate for response
  const updatedSubject = await Subject.findById(id)
    .populate("assignedTeachers", "name email")
    .populate("assignedClasses", "name")
    .populate("schoolId", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSubject, "Subject updated successfully"));
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


const assignSchoolsToSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { schoolIds = [] } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  if (req.user.role !== "Super Admin") {
    throw new ApiError(403, "Only Super Admin can assign schools");
  }

  subject.assignedSchools = [...new Set([...subject.assignedSchools, ...schoolIds])];
  await subject.save();

  res
    .status(200)
    .json(new ApiResponse(200, subject, "Schools assigned successfully"));
});


export {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  assignSchoolsToSubject
};
