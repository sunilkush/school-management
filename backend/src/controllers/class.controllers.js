import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Class } from "../models/classes.model.js";
import { School } from "../models/school.model.js";
import { Subject } from "../models/subject.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

/* =========================================================
   ✅ CREATE CLASS
========================================================= */
const createClass = asyncHandler(async (req, res) => {
  const {
    name,
    schoolId,
    academicYearId,
    students = [],
    subjects = [],
    sections = [],
  } = req.body;

  if (!name || !schoolId || !academicYearId) {
    throw new ApiError(400, "Name, School ID, Academic Year required");
  }

  const formattedName = name.trim().toUpperCase();

  const existingClass = await Class.findOne({
    name: formattedName,
    schoolId,
    academicYearId,
  });

  if (existingClass) {
    throw new ApiError(400, "Class already exists");
  }

  const newClass = await Class.create({
    name: formattedName,
    schoolId,
    academicYearId,
    students,
    subjects,
    sections,
    createdBy: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});

/* =========================================================
   ✅ UPDATE CLASS
========================================================= */
const updateClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new ApiError(404, "Class not found");

  const {
    name,
    code,
    description,
    schoolId,
    academicYearId,
    isGlobal,
    isActive,
    sections = [],
    subjects = [],
  } = req.body;

  /* ===== CLEAN SECTIONS ===== */
  const cleanSections = sections.filter(
    (s) =>
      mongoose.Types.ObjectId.isValid(s.sectionId) &&
      mongoose.Types.ObjectId.isValid(s.teacherId)
  );

  /* ===== CLEAN SUBJECTS ===== */
  const cleanSubjects = subjects.filter(
    (s) =>
      mongoose.Types.ObjectId.isValid(s.subjectId) &&
      mongoose.Types.ObjectId.isValid(s.teacherId)
  );

  if (name) classDoc.name = name.trim().toUpperCase();
  if (code) classDoc.code = code.trim();
  if (description) classDoc.description = description.trim();
  if (schoolId) classDoc.schoolId = schoolId;
  if (academicYearId) classDoc.academicYearId = academicYearId;

  if (typeof isGlobal === "boolean") classDoc.isGlobal = isGlobal;
  if (typeof isActive === "boolean") classDoc.isActive = isActive;

  classDoc.sections = cleanSections;
  classDoc.subjects = cleanSubjects;
  classDoc.updatedBy = req.user._id;

  await classDoc.save();

  const updated = await Class.findById(classId)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name")
    .populate("sections.sectionId", "name code")
    .populate("sections.teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Class updated successfully"));
});

/* =========================================================
   ✅ DELETE CLASS
========================================================= */
const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const deleted = await Class.findByIdAndDelete(classId);
  if (!deleted) throw new ApiError(404, "Class not found");

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Class deleted successfully"));
});

/* =========================================================
   ✅ GET ALL CLASSES
========================================================= */
const getAllClasses = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, schoolId, schoolName, academicYearId } =
    req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};

  if (schoolId) query.schoolId = schoolId;

  if (schoolName) {
    const school = await School.findOne({
      name: { $regex: schoolName, $options: "i" },
    });
    if (school) query.schoolId = school._id;
  }

  if (academicYearId) query.academicYearId = academicYearId;

  const skip = (page - 1) * limit;

  const total = await Class.countDocuments(query);

  const classes = await Class.find(query)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name")
    .populate("sections.sectionId", "name code")
    .populate("sections.teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email")
    .populate("students", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: classes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      "Classes fetched successfully"
    )
  );
});

/* =========================================================
   ✅ GET CLASS BY ID
========================================================= */
const getClassById = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const data = await Class.findById(classId)
    .populate("schoolId", "name logo")
    .populate("academicYearId", "name")
    .populate("sections.sectionId", "name code")
    .populate("sections.teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email")
    .populate("students", "name email");

  if (!data) throw new ApiError(404, "Class not found");

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Class fetched successfully"));
});

/* =========================================================
   ✅ CLASS ASSIGN TEACHER (MODEL BASED)
========================================================= */
const classAssignTeacher = asyncHandler(async (req, res) => {
  const { teacherId, schoolId, academicYearId } = req.query;

  if (!teacherId || !schoolId || !academicYearId) {
    throw new ApiError(400, "teacherId, schoolId, academicYearId required");
  }

  const classes = await Class.find({
    schoolId,
    academicYearId,
    status: "active",
  })
    .populate("sections.sectionId", "name code")
    .populate("sections.teacherId", "name email")
    .populate("subjects.subjectId", "name code")
    .populate("subjects.teacherId", "name email")
    .populate("students", "name email")
    .lean();

  const finalData = classes
    .map((cls) => {

      /* ===== MATCHED SECTIONS ===== */
      const teacherSections =
        cls.sections?.filter(
          (s) => s.teacherId?._id?.toString() === teacherId
        ) || [];

      /* ===== MATCHED SUBJECTS ===== */
      const teacherSubjects =
        cls.subjects?.filter(
          (s) => s.teacherId?._id?.toString() === teacherId
        ) || [];

      /* ===== CLASS SHOW CONDITION ===== */
      if (!teacherSections.length && !teacherSubjects.length) {
        return null;
      }

      /* ===== FINAL SECTION LOGIC ===== */

      let finalSections = [];

      // ⭐ If teacher subject teacher hai → ALL sections
      if (teacherSubjects.length > 0) {
        finalSections = cls.sections;
      } else {
        // ⭐ Agar sirf section teacher hai → Only matched sections
        finalSections = teacherSections;
      }

      return {
        ...cls,
        sections: finalSections,
        subjects: teacherSubjects,
        studentCount: cls.students?.length || 0,
        subjectCount: teacherSubjects.length,
        sectionCount: finalSections.length,
        isSubjectTeacher: teacherSubjects.length > 0,
        isSectionTeacher: teacherSections.length > 0,
      };
    })
    .filter(Boolean);

  return res.status(200).json(
    new ApiResponse(
      200,
      finalData,
      "Teacher classes fetched successfully"
    )
  );
});




const assignSubjectsToClass = asyncHandler(async (req, res) => {
  const { classId, assignments } = req.body;
  const user = req.user;

  if (user.role?.toLowerCase() !== "super admin") {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "Access denied"));
  }

  if (!classId || !Array.isArray(assignments)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid data format"));
  }

  const classData = await Class.findById(classId);

  if (!classData) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Class not found"));
  }

  const subjectAssignments = [];

  for (const item of assignments) {
    const { subjectId, teacherId, periodPerWeek, isCompulsory } = item;

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(teacherId)
    )
      continue;

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
    new ApiResponse(
      200,
      classData,
      "Subjects and teachers assigned successfully"
    )
  );
});


export {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassById,
  classAssignTeacher,
  assignSubjectsToClass
};
