import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Class from "../models/classes.model.js";
import { ClassSection } from "../models/classSection.model.js";
import { School } from "../models/school.model.js";
import { Subject } from "../models/subject.model.js";
import { User } from "../models/user.model.js"; // ✅ for teacher validation
import mongoose from "mongoose";

// ✅ Create Class
const createClass = asyncHandler(async (req, res) => {
  const { name, schoolId, academicYearId, teacherId, students = [], subjects = [] } = req.body;

  if (!name || !schoolId || !academicYearId) {
    throw new ApiError(400, "Name, School ID, and Academic Year are required");
  }

  const formattedName = name.trim().toUpperCase();

  const existingClass = await Class.findOne({
    schoolId,
    academicYearId,
    name: formattedName,
  });

  if (existingClass) {
    throw new ApiError(400, "Class with same name already exists in this school and academic year");
  }

  const newClass = new Class({
    name: formattedName,
    schoolId,
    academicYearId,
    teacherId,
    students,
    subjects,
    createdBy: req.user?._id,
  });

  const savedClass = await newClass.save();
  return res.status(201).json(new ApiResponse(201, savedClass, "Class created successfully"));
});

// ✅ Update Class
const updateClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const {
    name,
    code,
    description,
    academicYearId,
    teacherId,
    isGlobal,
    isActive,
    schoolId,
    sections = [],
    subjects = [],
  } = req.body;

  if (!classId) throw new ApiError(400, "Class ID is required");

  const classToUpdate = await Class.findById(classId);
  if (!classToUpdate) throw new ApiError(404, "Class not found");

  const cleanSections = Array.isArray(sections)
    ? sections.filter(
        (s) =>
          s.sectionId &&
          mongoose.Types.ObjectId.isValid(s.sectionId) &&
          (!s.inChargeId || mongoose.Types.ObjectId.isValid(s.inChargeId))
      )
    : [];

  const cleanSubjects = Array.isArray(subjects)
    ? subjects.filter(
        (s) =>
          s.subjectId &&
          mongoose.Types.ObjectId.isValid(s.subjectId) &&
          s.teacherId &&
          mongoose.Types.ObjectId.isValid(s.teacherId)
      )
    : [];

  if (name) classToUpdate.name = name.trim().toUpperCase();
  if (code) classToUpdate.code = code.trim();
  if (description) classToUpdate.description = description.trim();
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId))
    classToUpdate.academicYearId = academicYearId;
  if (teacherId && mongoose.Types.ObjectId.isValid(teacherId))
    classToUpdate.teacherId = teacherId;
  if (schoolId && mongoose.Types.ObjectId.isValid(schoolId))
    classToUpdate.schoolId = schoolId;
  if (typeof isGlobal === "boolean") classToUpdate.isGlobal = isGlobal;
  if (typeof isActive === "boolean") classToUpdate.isActive = isActive;

  classToUpdate.subjects = cleanSubjects;
  classToUpdate.updatedBy = req.user?._id;

  const updatedClass = await classToUpdate.save();

  // ✅ Update ClassSection
  if (cleanSections.length > 0) {
    await ClassSection.deleteMany({ classId });

    const newSectionMappings = cleanSections.map((sec) => ({
      classId,
      sectionId: sec.sectionId,
      teacherId: sec.inChargeId || null,
      schoolId: isGlobal ? null : schoolId,
      academicYearId: isGlobal ? null : academicYearId,
      isGlobal: !!isGlobal,
      createdBy: req.user?._id,
    }));

    await ClassSection.insertMany(newSectionMappings);
  }

  const populatedClass = await Class.findById(classId)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name startDate endDate")
    .populate("teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email")
    .populate("sections.sectionId", "name code")
    .populate("sections.inChargeId", "name email");

  return res.status(200).json(new ApiResponse(200, populatedClass, "Class updated successfully with sections"));
});

// ✅ Delete Class
const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!classId) throw new ApiError(400, "Class ID is required");

  const deletedClass = await Class.findByIdAndDelete(classId);
  if (!deletedClass) throw new ApiError(404, "Class not found");

  return res.status(200).json(new ApiResponse(200, deletedClass, "Class deleted successfully"));
});

// ✅ Get All Classes (Aggregation + Teacher Name + Serial)
const getAllClasses = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, schoolId, schoolName, academicYearId } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const matchStage = {};

  if (schoolId) matchStage.schoolId = new mongoose.Types.ObjectId(schoolId);

  if (schoolName) {
    const school = await School.findOne({
      name: { $regex: schoolName, $options: "i" },
    });
    if (school) matchStage.schoolId = school._id;
    else
      return res.status(200).json(
        new ApiResponse(
          200,
          { data: [], total: 0, page, limit, totalPages: 0 },
          "No school found with this name"
        )
      );
  }

  if (academicYearId)
    matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId);

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "schoolId",
      },
    },
    { $unwind: { path: "$schoolId", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYearId",
      },
    },
    { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "teachers",
        localField: "teacherId",
        foreignField: "_id",
        as: "teacherId",
      },
    },
    { $unwind: { path: "$teacherId", preserveNullAndEmptyArrays: true } },
    {
      $addFields: { teacherName: "$teacherId.name" },
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subjects.subjectId",
        foreignField: "_id",
        as: "subjectDetails",
      },
    },
    {
      $lookup: {
        from: "classsections",
        localField: "_id",
        foreignField: "classId",
        as: "classSections",
      },
    },
    {
      $lookup: {
        from: "sections",
        localField: "classSections.sectionId",
        foreignField: "_id",
        as: "sections",
      },
    },
    {
      $addFields: {
        numericName: {
          $convert: { input: "$name", to: "int", onError: 9999, onNull: 9999 },
        },
      },
    },
    { $sort: { numericName: 1, name: 1 } },
    {
      $setWindowFields: {
        sortBy: { numericName: 1 },
        output: { serial: { $documentNumber: {} } },
      },
    },
    { $skip: skip },
    { $limit: limit },
    { $project: { numericName: 0, classSections: 0, teacherId: 0 } },
  ];

  const classes = await Class.aggregate(pipeline);
  const totalClasses = await Class.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: classes,
        total: totalClasses,
        page,
        limit,
        totalPages: Math.ceil(totalClasses / limit),
      },
      "Classes fetched successfully (with serial)"
    )
  );
});

// ✅ Get Class By ID
const getClassById = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const classData = await Class.findById(classId)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name")
    .populate("teacherId", "name email")
    .populate("students", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email");

  if (!classData) throw new ApiError(404, "Class not found");

  return res.status(200).json(new ApiResponse(200, classData, "Class fetched successfully"));
});

// ✅ Assign Subjects to Class
const assignSubjectsToClass = asyncHandler(async (req, res) => {
  const { classId, assignments } = req.body;
  const user = req.user;

  if (user.role?.toLowerCase() !== "super admin") {
    return res.status(403).json(new ApiResponse(403, null, "Access denied"));
  }

  if (!classId || !Array.isArray(assignments)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid data format"));
  }

  const classData = await Class.findById(classId);
  if (!classData) {
    return res.status(404).json(new ApiResponse(404, null, "Class not found"));
  }

  const subjectAssignments = [];

  for (const item of assignments) {
    const { subjectId, teacherId, periodPerWeek, isCompulsory } = item;
    if (!subjectId || !teacherId) continue;

    const [subject, teacher] = await Promise.all([
      Subject.findById(subjectId),
      User.findById(teacherId),
    ]);

    if (!subject || !teacher) continue;

    subjectAssignments.push({
      subjectId: new mongoose.Types.ObjectId(subjectId),
      teacherId: new mongoose.Types.ObjectId(teacherId),
      periodPerWeek: periodPerWeek || 0,
      isCompulsory: isCompulsory ?? true,
    });
  }

  classData.subjects = subjectAssignments;
  classData.updatedBy = user._id;
  await classData.save();

  return res.status(200).json(
    new ApiResponse(200, classData, "Subjects and teachers assigned to class successfully")
  );
});

export {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignSubjectsToClass,
};
