import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  Class from "../models/Classes.model.js";
import { ClassSection } from "../models/classSection.model.js";
import { School } from "../models/school.model.js";

// ✅ Create Class
const createClass = asyncHandler(async (req, res) => {
  const { name, schoolId, academicYearId, teacherId, students = [], subjects = [] } = req.body;

  if (!name || !schoolId || !academicYearId) {
    throw new ApiError(400, "Name, School ID, and Academic Year are required");
  }

  // Normalize
  const formattedName = name.trim().toUpperCase();

  // Duplicate check
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
  const { name, teacherId, students, subjects, status } = req.body;

  if (!classId) throw new ApiError(400, "Class ID is required");

  const classToUpdate = await Class.findById(classId);
  if (!classToUpdate) throw new ApiError(404, "Class not found");

  if (name) classToUpdate.name = name.trim().toUpperCase();
  if (teacherId) classToUpdate.teacherId = teacherId;
  if (students) classToUpdate.students = students;
  if (subjects) classToUpdate.subjects = subjects;
  if (status) classToUpdate.status = status;

  classToUpdate.updatedBy = req.user?._id;

  const updatedClass = await classToUpdate.save();
  return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
});

// ✅ Delete Class
const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!classId) throw new ApiError(400, "Class ID is required");

  const deletedClass = await Class.findByIdAndDelete(classId);
  if (!deletedClass) throw new ApiError(404, "Class not found");

  return res.status(200).json(new ApiResponse(200, deletedClass, "Class deleted successfully"));
});

// ✅ Get All Classes (Pagination + Filtering + Search)
const getAllClasses = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, schoolId, schoolName, academicYearId } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};

  // Filter by schoolId
  if (schoolId) query.schoolId = schoolId;

  // Optional: Find by schoolName
  if (schoolName) {
    const school = await School.findOne({
      name: { $regex: schoolName, $options: "i" },
    });
    if (school) query.schoolId = school._id;
    else
      return res.status(200).json(
        new ApiResponse(
          200,
          { data: [], total: 0, page, limit, totalPages: 0 },
          "No school found with this name"
        )
      );
  }

  if (academicYearId) query.academicYearId = academicYearId;

  const skip = (page - 1) * limit;
  const totalClasses = await Class.countDocuments(query);

  if (totalClasses === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { data: [], total: 0, page, limit, totalPages: 0 }, "No classes found"));
  }

  const classes = await Class.find(query)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name startDate endDate")
    .populate("students", "name email")
    .populate("teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get linked sections
  const classIds = classes.map((c) => c._id);
  const classSectionMappings = await ClassSection.find({
    classId: { $in: classIds },
  }).populate("sectionId", "name capacity");

  // Combine class + sections
  const classesWithSections = classes.map((c) => {
    const sections = classSectionMappings
      .filter((m) => String(m.classId) === String(c._id))
      .map((m) => m.sectionId);
    return { ...c.toObject(), sections };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: classesWithSections,
        total: totalClasses,
        page,
        limit,
        totalPages: Math.ceil(totalClasses / limit),
      },
      "Classes fetched successfully"
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

export { createClass, getAllClasses, getClassById, updateClass, deleteClass };
