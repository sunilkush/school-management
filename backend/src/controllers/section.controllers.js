import { Section } from "../models/section.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";


// ==============================
// 🔹 CREATE SECTION
// ==============================
export const createSection = asyncHandler(async (req, res) => {
  const {
    schoolId,
    schoolClassId,
    name,
    capacity,
    academicYearId,
  } = req.body;

  if (!schoolId || !schoolClassId || !name) {
    throw new ApiError(400, "Required fields missing");
  }

  // ✅ Check schoolClass exists
  const schoolClass = await SchoolClass.findById(schoolClassId);
  if (!schoolClass) {
    throw new ApiError(404, "SchoolClass not found");
  }

  // ✅ Create
  const section = await Section.create({
    schoolId,
    schoolClassId,
    name,
    capacity,
    academicYearId,
    createdBy: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, section, "Section created successfully"));
});


// ==============================
// 🔹 GET ALL SECTIONS
// ==============================
export const getAllSections = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, schoolClassId } = req.query;

  const filter = {};

  if (schoolId) filter.schoolId = schoolId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (schoolClassId) filter.schoolClassId = schoolClassId;

  const sections = await Section.find(filter)
    .populate("classTeacherId", "name email")
    .populate("schoolClassId", "classId")
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, sections, "Sections fetched successfully")
  );
});


// ==============================
// 🔹 GET SINGLE SECTION
// ==============================
export const getSectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ID");
  }

  const section = await Section.findById(id)
    .populate("classTeacherId", "name email")
    .populate("StudentEnrollmentId", "name email");

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res.json(
    new ApiResponse(200, section, "Section fetched successfully")
  );
});


// ==============================
// 🔹 UPDATE SECTION
// ==============================
export const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await Section.findByIdAndUpdate(
    id,
    {
      ...req.body,
      updatedBy: req.user?._id,
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new ApiError(404, "Section not found");
  }

  return res.json(
    new ApiResponse(200, updated, "Section updated successfully")
  );
});


// ==============================
// 🔹 DELETE SECTION
// ==============================
export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const section = await Section.findById(id);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  await section.deleteOne();

  return res.json(
    new ApiResponse(200, {}, "Section deleted successfully")
  );
});


// ==============================
// 🔥 ASSIGN CLASS TEACHER
// ==============================
export const assignClassTeacher = asyncHandler(async (req, res) => {
  const { sectionId, teacherId } = req.body;

  const section = await Section.findByIdAndUpdate(
    sectionId,
    {
      classTeacherId: teacherId,
      updatedBy: req.user?._id,
    },
    { new: true }
  );

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res.json(
    new ApiResponse(200, section, "Class teacher assigned")
  );
});


// ==============================
// 🔥 ADD STUDENT TO SECTION
// ==============================
export const addStudentToSection = asyncHandler(async (req, res) => {
  const { sectionId, studentId } = req.body;

  const section = await Section.findById(sectionId);

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // ✅ prevent duplicate
  if (section.StudentEnrollmentId.includes(studentId)) {
    throw new ApiError(400, "Student already added");
  }

  section.StudentEnrollmentId.push(studentId);
  await section.save();

  return res.json(
    new ApiResponse(200, section, "Student added successfully")
  );
});


// ==============================
// 🔥 REMOVE STUDENT
// ==============================
export const removeStudentFromSection = asyncHandler(async (req, res) => {
  const { sectionId, studentId } = req.body;

  const section = await Section.findByIdAndUpdate(
    sectionId,
    {
      $pull: { StudentEnrollmentId: studentId },
    },
    { new: true }
  );

  return res.json(
    new ApiResponse(200, section, "Student removed")
  );
});