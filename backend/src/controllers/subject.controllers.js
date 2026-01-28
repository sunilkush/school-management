import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { mergeSchoolWiseAssignments } from "../utils/mergeAssignments.js";
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
    academicYearId,
    schoolId,
    isGlobal = false,
    createdByRole,
  } = req.body;

  const createdBy = req.user?._id;
  const user = await User.findById(createdBy);
  const role = await Role.findById(user?.roleId);
  const userRole = role?.name;
  if (!name || !createdBy || !userRole) throw new ApiError(400, "Missing required fields");
  
  if (userRole === "School Admin" && !academicYearId)
    throw new ApiError(400, "Academic year is required for school admins");

  // Duplicate check
  const query = isGlobal
    ? { name: name.toUpperCase(), isGlobal: true }
    : { name: name.toUpperCase(), schoolId, academicYearId };

  if (await Subject.findOne(query)) throw new ApiError(400, "Subject already exists");

  // ✅ Create subject
  const subject = await Subject.create({
    name,
    category,
    type,
    maxMarks,
    passMarks,
    description,
    academicYearId: userRole === "Super Admin" ? null : academicYearId,
    schoolId: isGlobal ? null : schoolId,
    schoolByAssignedClasses: [
      ...assignedClasses.map((classId) => ({ schoolId: schoolId, classId })),
    ],
    schoolByAssignedTeachers: [
      ...assignedTeachers.map((teacherId) => ({ schoolId: schoolId, teacherId })),
    ],
    schoolByGradingSchemeId: null,
    isGlobal,
    createdBy,
    createdByRole: userRole,
  });

  const populated = await Subject.findById(subject._id)
    .populate("schoolByAssignedClasses", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startYear endYear");

  res.status(201).json(new ApiResponse(201, populated, "Subject created successfully"));
});

// ✅ ASSIGN SCHOOLS TO SUBJECT
const assignSchoolsToSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { schoolIds = [] } = req.body;

  if (req.user.role !== "Super Admin")
    throw new ApiError(403, "Only Super Admin can assign schools");

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  subject.assignedSchools = [...new Set([...subject.assignedSchools, ...schoolIds])];
  await subject.save();

  res.status(200).json(new ApiResponse(200, subject, "Schools assigned successfully"));
});

// ✅ ASSIGN TEACHERS TO SUBJECT (School-level safe)
const assignTeachersToSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignments = [] } = req.body;

  const role = req.user.role;
  if (!["Super Admin", "School Admin"].includes(role))
    throw new ApiError(403, "Not authorized");

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  const validAssignments = assignments.filter((a) => {
    if (role === "School Admin") {
      return a.schoolId.toString() === req.user.school._id.toString();
    }
    return true;
  });

  validAssignments.forEach((a) => {
    const exists = subject.schoolByAssignedTeachers.some(
      (t) =>
        t.teacherId.toString() === a.teacherId.toString() &&
        t.schoolId.toString() === a.schoolId.toString()
    );
    if (!exists) subject.schoolByAssignedTeachers.push(a);
  });

  await subject.save();
  res
    .status(200)
    .json(new ApiResponse(200, subject, "Teachers assigned successfully"));
});


// ✅ GET ALL SUBJECTS
const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, schoolId, isGlobal } = req.query;
  const skip = (page - 1) * limit;

  const role = req.user.role;
  const query = {};

  /* ================= ROLE BASED QUERY ================= */

  if (role === "Super Admin") {
    if (isGlobal !== undefined) query.isGlobal = isGlobal === "true";
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
      query.schoolId = schoolId;
    }
  }

  if (role === "School Admin") {
    if (!req.user.school?._id) {
      throw new ApiError(403, "School not assigned");
    }

    query.$or = [
      { schoolId: req.user.school._id },
      { isGlobal: true },
    ];
  }

  /* ================= SEARCH ================= */
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  /* ================= FETCH ================= */
  const subjects = await Subject.find(query)
    .populate("schoolId", "name")
    .populate({
      path: "schoolByAssignedTeachers.teacherId",
      select: "name email",
    })
    .populate({
      path: "schoolByAssignedClasses.classId",
      select: "name",
    })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  /* ================= FILTER TEACHERS (Schema Correct) ================= */
  const resultSubjects = subjects.map((subject) => {
    const obj = subject.toObject();

    if (role === "School Admin") {
      obj.schoolByAssignedTeachers =
        obj.schoolByAssignedTeachers?.filter(
          (t) =>
            t.schoolId &&
            t.schoolId.toString() === req.user.school._id.toString()
        ) || [];
    }

    return obj;
  });

  const total = await Subject.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        subjects: resultSubjects,
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

// ✅ GET SINGLE SUBJECT
const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid subject ID");

  const subject = await Subject.findById(id)
    .populate("schoolId", "name")
    .populate("academicYearId", "name startYear endYear")
    .populate({
      path: "schoolByAssignedTeachers.teacherId",
      select: "name email",
    })
    .populate({
      path: "schoolByAssignedClasses.classId",
      select: "name",
    });

  if (!subject) throw new ApiError(404, "Subject not found");

  const role = req.user.role;

  // ❌ School Admin access restriction
  if (
    role === "School Admin" &&
    !subject.isGlobal &&
    subject.schoolId?.toString() !== req.user.school._id.toString()
  ) {
    throw new ApiError(403, "Not authorized");
  }

  // ✅ Filter teachers by schema
  let filteredTeachers = subject.schoolByAssignedTeachers;
  if (role === "School Admin") {
    filteredTeachers = filteredTeachers.filter(
      (t) => t.schoolId.toString() === req.user.school._id.toString()
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { ...subject.toObject(), schoolByAssignedTeachers: filteredTeachers },
      "Subject retrieved successfully"
    )
  );
});


// ✅ UPDATE SUBJECT
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    type,
    maxMarks,
    passMarks,
    academicYearId,
    isGlobal,
    assignedTeachers,
    classIds,
    schoolId,
  } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  const user = await User.findById(req.user._id);
  const roleDoc = await Role.findById(user.roleId);
  const role = roleDoc?.name;

  const adminSchoolId = req.user.schoolId; // ✅ FIXED

  /* ================= AUTH CHECK ================= */
  if (
    role === "School Admin" &&
    !subject.isGlobal &&
    subject.schoolId?.toString() !== adminSchoolId?.toString()
  ) {
    throw new ApiError(403, "Not authorized");
  }

  /* ================= SCHOOL ADMIN ================= */
  if (role === "School Admin") {
    if (!adminSchoolId)
      throw new ApiError(400, "School not assigned to admin");

    // ✅ merge teachers safely
    if (Array.isArray(assignedTeachers)) {
      subject.schoolByAssignedTeachers = mergeSchoolWiseAssignments(
        subject.schoolByAssignedTeachers,
        assignedTeachers,
        adminSchoolId
      );
    }

    // ✅ merge classes safely
    if (Array.isArray(classIds)) {
      subject.schoolByAssignedClasses = mergeSchoolWiseAssignments(
        subject.schoolByAssignedClasses,
        classIds,
        adminSchoolId
      );
    }
  }

  /* ================= SUPER ADMIN ================= */
  if (role === "Super Admin") {
    subject.name = name ?? subject.name;
    subject.category = category ?? subject.category;
    subject.type = type ?? subject.type;
    subject.maxMarks = maxMarks ?? subject.maxMarks;
    subject.passMarks = passMarks ?? subject.passMarks;
    subject.isGlobal = isGlobal ?? subject.isGlobal;
    subject.schoolId = schoolId ?? subject.schoolId;
    subject.academicYearId = academicYearId ?? subject.academicYearId;
  }

  subject.updatedBy = req.user._id;
  await subject.save();

  const updatedSubject = await Subject.findById(id)
    .populate("schoolByAssignedTeachers.teacherId", "name email")
    .populate("schoolByAssignedClasses.classId", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startYear endYear");

  res.status(200).json(
    new ApiResponse(200, updatedSubject, "Subject updated successfully")
  );
});





// ✅ DELETE SUBJECT
const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  if (req.user.role === "School Admin" && (!subject.isGlobal && subject.schoolId?.toString() !== req.user.school._id.toString()))
    throw new ApiError(403, "Not authorized to delete this subject");

  await subject.deleteOne();
  res.status(200).json(new ApiResponse(200, {}, "Subject deleted successfully"));
});



export {
  createSubject,
  getSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
  assignSchoolsToSubject,
  assignTeachersToSubject,
};
