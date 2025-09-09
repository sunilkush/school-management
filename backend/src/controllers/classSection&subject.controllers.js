import { ClassSection } from "../models/classSection.model.js";
import { Class } from "../models/classes.model.js";
import { Section } from "../models/section.model.js";
import { ClassSubject } from "../models/ClassSubject.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

/**
 * Create ClassSection mapping with multiple subjects
 */
export const createClassSection = asyncHandler(async (req, res) => {
  const { classId, sectionId, schoolId, academicYearId, teacherId, subjects = [] } = req.body;

  if (!classId || !sectionId || !schoolId || !academicYearId || !teacherId) {
    throw new ApiError(400, "All required fields must be provided!");
  }

  // validate IDs
  [classId, sectionId, schoolId, academicYearId, teacherId].forEach((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid ID provided!");
  });

  // check class and section existence
  const classExists = await Class.findById(classId);
  const sectionExists = await Section.findById(sectionId);
  if (!classExists || !sectionExists) throw new ApiError(404, "Class or Section not found!");

  // create Class-Section mapping with classTeacherId
  const classSection = await ClassSection.create({
    classId,
    sectionId,
    schoolId,
    academicYearId,
    teacherId, // ✅ class teacher
    subjects,  // subject-teacher array
  });

  // create ClassSubject records
  if (subjects.length > 0) {
    for (const s of subjects) {
      await ClassSubject.create({
        classId,
        sectionId,
        schoolId,
        academicYearId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, classSection, "Class-Section and Class-Subject mappings created successfully!"));
});

/**
 * Get all mappings
 */
export const getClassSections = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, classId } = req.query;

  const matchStage = {};
  if (schoolId && mongoose.Types.ObjectId.isValid(schoolId))
    matchStage.schoolId = new mongoose.Types.ObjectId(schoolId);
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId))
    matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId);
  if (classId && mongoose.Types.ObjectId.isValid(classId))
    matchStage.classId = new mongoose.Types.ObjectId(classId);

  const mappings = await ClassSection.aggregate([
    { $match: matchStage },

    // ✅ Join with Class
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "class",
      },
    },
    { $unwind: "$class" },

    // ✅ Join with Section
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: "$section" },

    // ✅ Join with School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: "$school" },

    // ✅ Join with Academic Year
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: "$academicYear" },

    // ✅ Lookup Class Teacher
    {
      $lookup: {
        from: "users",
        localField: "teacherId",
        foreignField: "_id",
        as: "classTeacher",
      },
    },
    { $unwind: { path: "$classTeacher", preserveNullAndEmptyArrays: true } },

    // ✅ Expand subjects array
    { $unwind: { path: "$subjects", preserveNullAndEmptyArrays: true } },

    // ✅ Lookup subject details
    {
      $lookup: {
        from: "subjects",
        localField: "subjects.subjectId",
        foreignField: "_id",
        as: "subjectObj",
      },
    },
    { $unwind: { path: "$subjectObj", preserveNullAndEmptyArrays: true } },

    // ✅ Lookup subject teacher details
    {
      $lookup: {
        from: "users",
        localField: "subjects.teacherId",
        foreignField: "_id",
        as: "teacherObj",
      },
    },
    { $unwind: { path: "$teacherObj", preserveNullAndEmptyArrays: true } },

    // ✅ Rebuild subject object with merged details
    {
      $addFields: {
        subjectMerged: {
          $cond: [
            { $gt: ["$subjects", {}] }, // avoid empty pushes
            {
              subjectId: "$subjectObj",
              teacherId: "$teacherObj",
              periodPerWeek: "$subjects.periodPerWeek",
              isCompulsory: "$subjects.isCompulsory",
            },
            "$$REMOVE",
          ],
        },
      },
    },

    // ✅ Group back to collect subjects
    {
      $group: {
        _id: "$_id",
        class: { $first: "$class" },
        section: { $first: "$section" },
        school: { $first: "$school" },
        academicYear: { $first: "$academicYear" },
        classTeacher: { $first: "$classTeacher" },
        subjects: { $push: "$subjectMerged" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    },

    // ✅ Remove null subjectMerged
    {
      $addFields: {
        subjects: {
          $filter: {
            input: "$subjects",
            as: "s",
            cond: { $ne: ["$$s", null] },
          },
        },
      },
    },

    // ✅ Final Projection (with className & sectionName)
    {
      $project: {
        _id: 1,
        class: { _id: 1, name: 1 },
        className: "$class.name", // ✅ direct field
        section: { _id: 1, name: 1 },
        sectionName: "$section.name", // ✅ direct field
        school: { _id: 1, name: 1 },
        academicYear: {
          _id: 1,
          name: 1,
          startDate: 1,
          endDate: 1,
        },
        classTeacher: { _id: 1, name: 1, email: 1 },
        subjects: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, mappings, "Class-Section mappings fetched successfully!")
    );
});



/**
 * Get single mapping by ID
 */
export const getClassSectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mapping = await ClassSection.findById(id)
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startDate endDate")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name");

  if (!mapping) throw new ApiError(404, "Mapping not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, mapping, "Class-Section mapping fetched successfully!"));
});

/**
 * Update mapping
 */
export const updateClassSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { classId, sectionId, subjects } = req.body;

  const mapping = await ClassSection.findById(id);
  if (!mapping) throw new ApiError(404, "Mapping not found!");

  if (classId) mapping.classId = classId;
  if (sectionId) mapping.sectionId = sectionId;
  if (subjects) mapping.subjects = subjects;

  await mapping.save();

  // Optional: update ClassSubject records
  if (subjects && subjects.length > 0) {
    // Remove old ClassSubjects for this class-section
    await ClassSubject.deleteMany({ classId: mapping.classId, sectionId: mapping.sectionId });
    for (const s of subjects) {
      await ClassSubject.create({
        classId: mapping.classId,
        sectionId: mapping.sectionId,
        schoolId: mapping.schoolId,
        academicYearId: mapping.academicYearId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, mapping, "Class-Section mapping updated successfully!"));
});

/**
 * Delete mapping
 */
export const deleteClassSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mapping = await ClassSection.findByIdAndDelete(id);
  if (!mapping) throw new ApiError(404, "Mapping not found!");

  // Optional: delete corresponding ClassSubject records
  await ClassSubject.deleteMany({ classId: mapping.classId, sectionId: mapping.sectionId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Class-Section mapping deleted successfully!"));
});
