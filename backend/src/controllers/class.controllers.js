import mongoose from "mongoose";
import { Class } from "../models/classes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Section } from "../models/section.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const createClass = asyncHandler(async (req, res) => {
  const { name, code, description, isGlobal, status } = req.body;
  const normalizedName = name.trim().toUpperCase();

  const existingClass = await Class.findOne({ name: normalizedName });
  if (existingClass) {
    throw new ApiError(400, "Class already exists");
  }

  const newClass = await Class.create({
    name: normalizedName,
    code,
    description,
    isGlobal,
    status,
    createdBy: req.user?._id,
  });

  return res.status(201).json(new ApiResponse(201, newClass, "Class created successfully"));
});

const updateClass = asyncHandler(async (req, res) => {
  const { schoolClassId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(schoolClassId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const classDoc = await Class.findById(schoolClassId);
  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

  const { name, code, description, isGlobal, status } = req.body;
  if (name) classDoc.name = name.trim().toUpperCase();
  if (code) classDoc.code = code.trim();
  if (description) classDoc.description = description.trim();
  if (typeof isGlobal === "boolean") classDoc.isGlobal = isGlobal;
  if (status) classDoc.status = status;

  classDoc.updatedBy = req.user?._id;
  await classDoc.save();

  return res.status(200).json(new ApiResponse(200, classDoc, "Class updated successfully"));
});

const deleteClass = asyncHandler(async (req, res) => {
  const { schoolClassId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(schoolClassId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const deleted = await Class.findByIdAndDelete(schoolClassId);
  if (!deleted) {
    throw new ApiError(404, "Class not found");
  }

  return res.status(200).json(new ApiResponse(200, deleted, "Class deleted successfully"));
});

const getAllClasses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const requestedLimit = Number(req.query.limit || 15);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 15)
    : 15;
  const search = req.query.search || "";

  const query = {};
  if (search) query.name = { $regex: escapeRegex(search), $options: "i" };

  const shouldPaginate = Number.isFinite(limit) && limit > 0;
  const skip = shouldPaginate ? (page - 1) * limit : 0;

  const [classes, total] = await Promise.all([
    Class.find(query)
      .skip(skip)
      .limit(shouldPaginate ? limit : 0)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role"),
    Class.countDocuments(query),
  ]);

  const meta = shouldPaginate
    ? { page, total, limit, totalPages: Math.ceil(total / limit) }
    : { total };

  return res
    .status(200)
    .json(new ApiResponse(200, classes, "Classes fetched successfully", meta));
});

const getClassById = asyncHandler(async (req, res) => {
  const { schoolClassId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(schoolClassId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const classData = await Class.findById(schoolClassId);
  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  return res.status(200).json(new ApiResponse(200, classData, "Class fetched successfully"));
});

const fetchAssignedClasses = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const schoolId = req.user.schoolId;
  const academicYearId = req.query.academicYearId;
  const roleName = (req.userRole?.name || "").toLowerCase();
  // A section's classTeacherId/subjects.teacherId can be assigned to any of these roles (see
  // ClassTeacherAssignmentPage.jsx's own teacherOptions filter and SchoolClassSectionTeacher.jsx's
  // assignClassTeacher flow on the frontend) — each should only see the sections they're
  // personally assigned to, unlike Exam Coordinator/Subject Coordinator who legitimately see
  // every section. The previous `roleName === "teacher"` check excluded every other assignable
  // role, including the literal "Class Teacher" role itself, from ever seeing their own sections.
  const ASSIGNMENT_SCOPED_ROLES = new Set(["teacher", "sports teacher", "class teacher"]);
  const isTeacher = ASSIGNMENT_SCOPED_ROLES.has(roleName);

  if (!academicYearId) {
    throw new ApiError(400, "Academic year ID is required");
  }

  // Non-teacher roles (Exam Coordinator, Admin etc.) see all sections/classes
  const sectionQuery = { schoolId, academicYearId };
  if (isTeacher) {
    sectionQuery.$or = [
      { classTeacherId: teacherId },
      { "subjects.teacherId": teacherId },
    ];
  }

  const sections = await Section.find(sectionQuery)
    .populate("schoolClassId", "name")
    .populate("subjects.subjectId", "name")
    .lean();

  const classMap = {};

  sections.forEach((sec) => {
    const classId = sec.schoolClassId?._id?.toString();
    if (!classId) return;

    if (!classMap[classId]) {
      classMap[classId] = {
        _id: classId,
        name: sec.schoolClassId?.name,
        sections: [],
        subjects: [],
        studentCount: sec.StudentEnrollmentId?.length || 0,
        role: [],
      };
    }

    const isClassTeacher = isTeacher && sec.classTeacherId?.toString() === teacherId.toString();
    const teacherSubjects = isTeacher
      ? sec.subjects.filter((s) => s.teacherId?.toString() === teacherId.toString())
      : sec.subjects;
    const sectionSubjects = isClassTeacher ? sec.subjects : teacherSubjects;

    classMap[classId].sections.push({
      sectionId: { _id: sec._id, name: sec.name },
      subjects: sectionSubjects.map((sub) => ({
        subjectId: { _id: sub.subjectId?._id, name: sub.subjectId?.name },
      })),
      isClassTeacher,
      studentCount: sec.StudentEnrollmentId?.length || 0,
    });

    if (isClassTeacher) classMap[classId].role.push("class_teacher");

    sectionSubjects.forEach((sub) => {
      classMap[classId].subjects.push({
        subjectId: { _id: sub.subjectId?._id, name: sub.subjectId?.name },
      });
      classMap[classId].role.push(isTeacher ? "subject_teacher" : "coordinator");
    });

    classMap[classId].subjects = [
      ...new Map(
        classMap[classId].subjects
          .filter((s) => s?.subjectId?._id)
          .map((s) => [s.subjectId._id.toString(), s])
      ).values(),
    ];
    classMap[classId].role = [...new Set(classMap[classId].role)];
  });

  const result = Object.values(classMap);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assigned classes fetched successfully"));
});

export { createClass, updateClass, deleteClass, getAllClasses, getClassById, fetchAssignedClasses };
