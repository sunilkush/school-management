import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Class } from '../models/classes.model.js';
import { ClassSection } from '../models/classSection.model.js';
// ✅ Create Class
const createClass = asyncHandler(async (req, res) => {
  const { name, schoolId, academicYearId, teacherId, students = [], subjects = [] } = req.body;

  if (!name || !schoolId || !academicYearId) {
    throw new ApiError(400, "Name, School ID and Academic Year are required");
  }
 // ✅ Fix schoolId if nested
const fixedSchoolId = schoolId?.schoolId || schoolId;
const fixedAcademicYearId = academicYearId?.academicYearId || academicYearId;
  // Duplicate check (unique per school + academic year + name)
 const existingClass = await Class.findOne({
  schoolId: fixedSchoolId,
  academicYearId: fixedAcademicYearId,
  name: name.toLowerCase(),
});

  if (existingClass) {
    throw new ApiError(400, "Class with same name already exists in this school for this academic year");
  }

const newClass = new Class({
  schoolId: fixedSchoolId,
  academicYearId: fixedAcademicYearId,
  name: name.toLowerCase(),
  teacherId,
  students,
  subjects,
});

  const savedClass = await newClass.save();

  return res
    .status(201)
    .json(new ApiResponse(201, savedClass, "Class created successfully"));
});


// ✅ Update Class
const updateClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { name, section, teacherId, students, subjects } = req.body;

    if (!classId) throw new ApiError(400, "Class ID is required");

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) throw new ApiError(404, "Class not found");

    if (name) classToUpdate.name = name;
    if (section) classToUpdate.section = section;
    if (teacherId) classToUpdate.teacherId = teacherId;
    if (students) classToUpdate.students = students;
    if (subjects) classToUpdate.subjects = subjects;

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

// ✅ Get All Classes
// ✅ Get All Classes with Pagination + Filtering + Search
// ✅ Fetch all classes with populated sections
const getAllClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, schoolId } = req.query;
  const query = {};

  if (schoolId) query.schoolId = schoolId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const totalClasses = await Class.countDocuments(query);

  // Agar classes hi 0 hain, to seedha empty response bhej do
  if (totalClasses === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
        "No classes found"
      )
    );
  }

  const classes = await Class.find(query)
  .populate("schoolId students")
  .populate({
    path: "teacherId",
    match: { "role.name": "Teacher" }, // only teachers
  })
  .populate("subjects.subjectId")
  .populate({
    path: "subjects.teacherId",
    match: { "role.name": "Teacher" },
  })
  .skip(skip)
  .limit(parseInt(limit));

  // ✅ Populate mapped sections for each class
  const classIds = classes.map((c) => c._id);
  const classSectionMappings = await ClassSection.find({
    classId: { $in: classIds },
  }).populate("sectionId");

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
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalClasses / limit),
      },
      "Classes fetched successfully"
    )
  );
});




// ✅ Get Class By Id
const getClassById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const classData = await Class.findById(id)
        .populate("schoolId teacherId students")
        .populate("subjects.subjectId")
        .populate("subjects.teacherId");

    if (!classData) throw new ApiError(404, "Class not found");

    return res.status(200).json(new ApiResponse(200, classData, "Class fetched successfully"));
});

export {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
};
