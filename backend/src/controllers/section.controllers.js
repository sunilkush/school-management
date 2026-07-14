import { Section } from "../models/section.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";

// ==============================
// 🔹 CREATE SECTION
// ==============================
export const createSection = asyncHandler(async (req, res) => {
  const { schoolId, schoolClassId, name, capacity, academicYearId } = req.body;

  if (!schoolId || !schoolClassId || !name) {
    throw new ApiError(400, "Required fields missing");
  }

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(schoolClassId)) {
    throw new ApiError(400, "Invalid schoolClassId");
  }

  // ✅ Check class exists
  const schoolClass = await SchoolClass.findById(schoolClassId);
  if (!schoolClass) {
    throw new ApiError(404, "SchoolClass not found");
  }

  // ✅ Prevent duplicate section name in same class
  const exists = await Section.findOne({
    schoolClassId,
    name: { $regex: `^${name}$`, $options: "i" },
  });

  if (exists) {
    throw new ApiError(400, "Section already exists in this class");
  }

  // ✅ Create Section
  const section = await Section.create({
    schoolId,
    schoolClassId,
    name,
    capacity,
    academicYearId,
    createdBy: req.user?._id,
  });

  // ✅ Sync with SchoolClass (IMPORTANT)
  await SchoolClass.findByIdAndUpdate(schoolClassId, {
    $push: {
      sections: {
        sectionId: section._id,
        teacherId: null,
      },
    },
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
    .populate("schoolClassId", "name") // ✅ FIXED
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

  const section = await Section.findOne(buildSchoolAccessFilter(req, { _id: id }))
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

  const updated = await Section.findOneAndUpdate(
    buildSchoolAccessFilter(req, { _id: id }),
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

  const section = await Section.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // ✅ REMOVE from SchoolClass ALSO (VERY IMPORTANT FIX)
  await SchoolClass.findByIdAndUpdate(section.schoolClassId, {
    $pull: {
      sections: { sectionId: section._id },
    },
  });

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
  console.log("Assigning teacher", { sectionId, teacherId });
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


  // ✅ ALSO update inside SchoolClass.sections
  const teacher =  await SchoolClass.updateOne(
    {
      "sections.sectionId": sectionId,
    },
    {
      $set: {
        "sections.$[elem].teacherId": teacherId,
      },
    },
    {
      arrayFilters: [{ "elem.sectionId": sectionId }],
    }
  );

const populatedSection = await Section.findById(section._id)
    .populate("schoolClassId", "name")
    .populate("classTeacherId", "name email");

  return res.json(
    new ApiResponse(200, populatedSection, "Class teacher assigned", {
      schoolClassUpdate: teacher,
    })
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

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res.json(
    new ApiResponse(200, section, "Student removed")
  );
});

export const addSubjectToSection = asyncHandler(async (req, res) => {
  const { schoolClassId, sectionId, subjectIds } = req.body;

  // =============================
  // 🔹 VALIDATION
  // =============================
  if (!schoolClassId || !sectionId || !Array.isArray(subjectIds)) {
    return res.status(400).json({
      success: false,
      message: "schoolClassId, sectionId and subjectIds are required",
    });
  }

  // =============================
  // 🔹 CHECK SCHOOL CLASS
  // =============================
  const schoolClass = await SchoolClass.findById(schoolClassId);
  if (!schoolClass) {
    return res.status(404).json({
      success: false,
      message: "SchoolClass not found",
    });
  }

  // =============================
  // 🔹 CHECK SECTION
  // =============================
  const section = await Section.findById(sectionId);
  if (!section) {
    return res.status(404).json({
      success: false,
      message: "Section not found",
    });
  }

  // =============================
  // 🔹 VERIFY RELATION
  // =============================
  if (section.schoolClassId.toString() !== schoolClassId) {
    return res.status(400).json({
      success: false,
      message: "Section does not belong to this class",
    });
  }

  // =============================
  // 🔥 REMOVE DUPLICATES
  // =============================
  const uniqueSubjects = [...new Set(subjectIds)];

  // =============================
  // 🔥 MAP FORMAT
  // =============================
  const subjectObjects = uniqueSubjects.map((id) => ({
    subjectId: id,
    teacherId: null, // optional (future use)
  }));

  // =============================
  // 🔥 UPDATE (REPLACE MODE)
  // =============================
  section.subjects = subjectObjects;

  section.updatedBy = req.user?._id; // if auth middleware

  await section.save();

  return res.status(200).json({
    success: true,
    message: "Subjects assigned to section successfully ✅",
    data: section,
  });
});

export const assignSubjectTeacher = asyncHandler(async (req, res) => {
  const { sectionId, subjectId, teacherId } = req.body;

  /* =============================
     ✅ VALIDATION
  ============================= */
  if (!sectionId || !subjectId || !teacherId) {
    return res.status(400).json({
      success: false,
      message: "sectionId, subjectId and teacherId are required",
    });
  }

  /* =============================
     ✅ UPDATE DIRECTLY (OPTIMIZED)
  ============================= */
  const updatedSection = await Section.findOneAndUpdate(
    {
      _id: sectionId,
      "subjects.subjectId": subjectId, // 🔥 match subject inside array
    },
    {
      $set: {
        "subjects.$.teacherId": teacherId, // 🔥 update matched subject
        updatedBy: req.user?._id,
      },
    },
    { new: true }
  );

  /* =============================
     ❌ NOT FOUND CASE
  ============================= */
  if (!updatedSection) {
    return res.status(404).json({
      success: false,
      message: "Section or Subject not found",
    });
  }

  /* =============================
     ✅ SUCCESS
  ============================= */
  return res.status(200).json({
    success: true,
    message: "Teacher assigned successfully ✅",
    data: updatedSection,
  });
});