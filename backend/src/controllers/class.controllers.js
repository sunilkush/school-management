import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Class } from '../models/classes.model.js';

// ✅ Create Class
const createClass = asyncHandler(async (req, res) => {
    const { name, section, schoolId, teacherId, students, subjects } = req.body;

    if ([name, section].some((field) => typeof field === "string" && field.trim() === "") || !schoolId) {
        throw new ApiError(400, "Name, Section and School ID are required");
    }

    // Duplicate class check (per schoolId + name + section)
    const existingClass = await Class.findOne({ schoolId, name, section });
    if (existingClass) {
        throw new ApiError(400, "Class with same name & section already exists in this school");
    }

    const newClass = new Class({
        schoolId,
        name,
        section,
        teacherId,
        students,
        subjects,
    });

    const savedClass = await newClass.save();

    return res.status(201).json(
        new ApiResponse(201, savedClass, "Class created successfully")
    );
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
const getAllClasses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, schoolId, teacherId, section, search } = req.query;

    const query = {};

    // 🔍 Filtering
    if (schoolId) query.schoolId = schoolId;
    if (teacherId) query.teacherId = teacherId;
    if (section) query.section = section;

    // 🔍 Search by name (case insensitive)
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Get total count for pagination
    const totalClasses = await Class.countDocuments(query);

    // ✅ Fetch with pagination + populate
    const classes = await Class.find(query)
        .populate("schoolId teacherId students")
        .populate("subjects.subjectId")
        .populate("subjects.teacherId")
        .skip(skip)
        .limit(parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            data: classes,
            total: totalClasses,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalClasses / limit),
        }, "Classes fetched successfully")
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
