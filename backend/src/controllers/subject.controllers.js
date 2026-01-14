import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
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
  // assignments = [{ teacherId, schoolId }]

  const userRole = req.user.role;
  if (!["Super Admin", "School Admin"].includes(userRole))
    throw new ApiError(403, "Not authorized to assign teachers");

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  // School Admin can only assign teachers from their own school
  const filteredAssignments = assignments.filter((a) => {
    if (userRole === "School Admin") {
      return a.schoolId.toString() === req.user.school._id.toString();
    }
    return true;
  });

  filteredAssignments.forEach((a) => {
    const exists = subject.schoolByAssignedTeachers.some(
      (st) =>
        st.schoolId.toString() === a.schoolId.toString() &&
        st.teacherId.toString() === a.teacherId.toString()
    );
    if (!exists) subject.schoolByAssignedTeachers.push(a);
  });

  await subject.save();
  res.status(200).json(new ApiResponse(200, subject, "Teachers assigned successfully"));
});

// ✅ GET ALL SUBJECTS
const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, schoolId, isGlobal } = req.query;
  const skip = (page - 1) * limit;

  const role = req.user.role;
  const query = {};

  if (role === "Super Admin") {
    if (isGlobal !== undefined) query.isGlobal = isGlobal === "true";
    if (schoolId) query.schoolId = new mongoose.Types.ObjectId(schoolId);
  } else if (role === "School Admin") {
    query.$or = [
      { schoolId: new mongoose.Types.ObjectId(req.user.school._id) },
      { isGlobal: true },
    ];
  }

  if (search) query.name = { $regex: search, $options: "i" };

  const subjects = await Subject.find(query)
    .populate("schoolId", "name")
    .populate({
      path: "schoolByAssignedTeachers.teacherId",
      select: "name email schoolId",
    })
    .populate("schoolByAssignedClasses", "name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Filter teachers for School Admin
  const resultSubjects = subjects.map((subj) => {
    if (role === "School Admin") {
      const filteredTeachers = subj.schoolByAssignedTeachers.filter(
        (t) => t.schoolId.toString() === req.user.school._id.toString()
      );
      return { ...subj.toObject(), schoolByAssignedTeachers: filteredTeachers };
    }
    return subj;
  });

  const total = await Subject.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      subjects: resultSubjects,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    }, "Subjects retrieved successfully")
  );
});

// ✅ GET SINGLE SUBJECT
const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subject ID");

  const subject = await Subject.findById(id)
    .populate("schoolByAssignedClasses", "name section code")
    .populate("schoolId", "name code")
    .populate("academicYearId", "name startYear endYear")
    .populate("gradingSchemeId", "name minMarks maxMarks")
    .populate("schoolByAssignedTeachers.teacherId", "name email schoolId");

  if (!subject) throw new ApiError(404, "Subject not found");

  // Role-based access check
  const role = req.user.role;
  if (role === "School Admin" && !subject.isGlobal && subject.schoolId?._id.toString() !== req.user.school._id.toString())
    throw new ApiError(403, "Not authorized to view this subject");

  // Filter teachers for School Admin
  let filteredTeachers = subject.schoolByAssignedTeachers;
  if (role === "School Admin") {
    filteredTeachers = filteredTeachers.filter(
      (t) => t.schoolId.toString() === req.user.school._id.toString()
    );
  }

  res.status(200).json(new ApiResponse(200, { ...subject.toObject(), schoolByAssignedTeachers: filteredTeachers }, "Subject retrieved successfully"));
});

// ✅ UPDATE SUBJECT
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  const user = await User.findById(req.user._id);
  const role = await Role.findById(user.roleId);

  // ❌ School Admin cannot update other school subject
  if (
    role.name === "School Admin" &&
    !subject.isGlobal &&
    subject.schoolId.toString() !== req.user.school._id.toString()
  ) {
    throw new ApiError(403, "Not authorized");
  }

  /* ===============================
     SCHOOL ADMIN (LIMITED ACCESS)
  ================================*/
  if (role.name === "School Admin") {
    subject.schoolByAssignedTeachers =
      req.body.assignedTeachers?.map((teacherId) => ({
        schoolId: subject.schoolId,
        teacherId,
      })) || [];

    subject.schoolByAssignedClasses =
      req.body.classIds?.map((classId) => ({
        schoolId: subject.schoolId,
        classId,
      })) || [];
  }

  /* ===============================
     SUPER ADMIN (FULL ACCESS)
  ================================*/
  if (role.name === "Super Admin") {
    subject.name = req.body.name;
    subject.shortName = req.body.shortName;
    subject.code = req.body.code;
    subject.category = req.body.category;
    subject.type = req.body.type;
    subject.maxMarks = req.body.maxMarks;
    subject.passMarks = req.body.passMarks;
    subject.isGlobal = req.body.isGlobal;
    subject.schoolId = req.body.schoolId;
    subject.academicYearId = req.body.academicYearId;

    subject.schoolByAssignedTeachers =
      req.body.assignedTeachers?.map((teacherId) => ({
        schoolId: req.body.schoolId,
        teacherId,
      })) || [];

    subject.isActive = req.body.isActive;
  }

  subject.updatedBy = req.user._id;
  await subject.save();

  const updatedSubject = await Subject.findById(id)
    .populate("schoolByAssignedClasses", "name")
    .populate("schoolByAssignedTeachers", "name")
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
