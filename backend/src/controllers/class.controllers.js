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

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const {
    name,
    code,
    description,
    academicYearId,
    teacherId,
    isGlobal = false,
    isActive,
    schoolId,
    sections = [],
    subjects = [],
  } = req.body;

  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new ApiError(404, "Class not found");

  /* ========== CLEAN SECTIONS ========== */
  const cleanSections = sections.filter(
    (s) =>
      mongoose.Types.ObjectId.isValid(s.sectionId) &&
      (!s.inChargeId || mongoose.Types.ObjectId.isValid(s.inChargeId))
  );

  /* ========== CLEAN SUBJECTS ========== */
  const cleanSubjects = subjects.filter(
    (s) =>
      mongoose.Types.ObjectId.isValid(s.subjectId) &&
      mongoose.Types.ObjectId.isValid(s.teacherId)
  );

  /* ========== UPDATE CLASS ========== */
  if (name) classDoc.name = name.trim().toUpperCase();
  if (code) classDoc.code = code.trim();
  if (description) classDoc.description = description.trim();
  if (academicYearId) classDoc.academicYearId = academicYearId;
  if (teacherId) classDoc.teacherId = teacherId;
  if (schoolId) classDoc.schoolId = schoolId;
  if (typeof isGlobal === "boolean") classDoc.isGlobal = isGlobal;
  if (typeof isActive === "boolean") classDoc.isActive = isActive;

  classDoc.subjects = cleanSubjects;
  classDoc.updatedBy = req.user._id;

  await classDoc.save();

  /* ========== RESET CLASS SECTIONS ========== */
  await ClassSection.deleteMany({ classId });

  if (cleanSections.length) {
    await ClassSection.insertMany(
      cleanSections.map((s) => ({
        classId,
        sectionId: s.sectionId,
        teacherId: s.inChargeId || null, // ✅ IN-CHARGE SAVED HERE
        schoolId: isGlobal ? null : schoolId,
        academicYearId: isGlobal ? null : academicYearId,
        isGlobal,
        createdBy: req.user._id,
      }))
    );
  }

  /* ========== FINAL RESPONSE ========== */
  const classData = await Class.findById(classId)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name startDate endDate")
    .populate("teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email");

  const sectionsData = await ClassSection.find({ classId })
    .populate("sectionId", "name code")
    .populate("teacherId", "name email"); // ✅ IN-CHARGE DATA

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...classData.toObject(),
        sections: sectionsData,
      },
      "Class updated successfully"
    )
  );
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
})
  .populate("sectionId", "name capacity")
  .populate("teacherId", "name email"); // ✅ IN-CHARGE

  // Combine class + sections
 const classesWithSections = classes.map((c) => {
  const sections = classSectionMappings
    .filter((m) => String(m.classId) === String(c._id))
    .map((m) => ({
      _id: m._id,
      sectionId: m.sectionId,
      inChargeId: m.teacherId || null, // ✅ NAME + EMAIL
    }));

  return {
    ...c.toObject(),
    sections,
  };
})

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
