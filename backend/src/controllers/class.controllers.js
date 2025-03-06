import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Classes } from '../models/classes.model.js';

const registerClass = asyncHandler(async (req, res) => {
    try {
        const { name, section, schoolId, teacherId, students, subjects } = req.body;

        if ([name, section].some((field) => typeof field === "string" && field.trim() === "") || !schoolId) {
            throw new ApiError(400, "School ID, Class Name, and Section are required");
        }

        const existingClass = await Classes.findOne({ schoolId, name, section });
        if (existingClass) {
            throw new ApiError(400, "Class with the same name and section already exists in this school");
        }

        const newClass = new Classes({
            schoolId,
            name,
            section,
            teacherId,
            students,
            subjects
        });

        const savedClass = await newClass.save();

        if (!savedClass) {
            throw new ApiError(400, "Class was not created");
        }

        return res.status(201).json(
            new ApiResponse(201, savedClass, "Class created successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Class creation failed");
    }
});

const updateClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params;
        const { name, section, teacherId, students, subjects } = req.body;

        if (!classId) {
            throw new ApiError(400, "Class ID is required");
        }

        const classToUpdate = await Classes.findById(classId);
        if (!classToUpdate) {
            throw new ApiError(404, "Class not found");
        }

        if (name) classToUpdate.name = name;
        if (section) classToUpdate.section = section;
        if (teacherId) classToUpdate.teacherId = teacherId;
        if (students) classToUpdate.students = students;
        if (subjects) classToUpdate.subjects = subjects;

        const updatedClass = await classToUpdate.save();

        if (!updatedClass) {
            throw new ApiError(400, "Class update failed");
        }

        return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Class update failed");
    }
});

const deleteClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            throw new ApiError(400, "Class ID is required");
        }

        const deletedClass = await Classes.findByIdAndDelete(classId);
        if (!deletedClass) {
            throw new ApiError(404, "Class not found");
        }

        return res.status(200).json(new ApiResponse(200, deletedClass, "Class deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Class deletion failed");
    }
});

export {
    registerClass,
    updateClass,
    deleteClass
};
