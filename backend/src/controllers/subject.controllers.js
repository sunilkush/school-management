import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";

// ✅ Create a Subject (POST)
const createSubject = asyncHandler(async (req, res) => {
    const { schoolId, name, teacherId, classes } = req.body;

    if ([schoolId, name, teacherId, classes].some(field => !field)) {
        throw new ApiError(400, "All required fields must be provided.");
    }

    const subject = new Subject({
        schoolId,
        name,
        teacherId,
        classes
    });

    const savedSubject = await subject.save();

    if (!savedSubject) {
        throw new ApiError(500, "Subject not created!");
    }

    return res.status(201).json(
        new ApiResponse(201, savedSubject, "Subject created successfully!")
    );
});

// ✅ Get All Subjects (GET)
const getAllSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find()
        .populate("schoolId", "name")
        .populate("teacherId", "name email")
        .populate("classes", "name");

    if (!subjects.length) {
        throw new ApiError(404, "No subjects found!");
    }

    return res.status(200).json(
        new ApiResponse(200, subjects, "Subjects retrieved successfully!")
    );
});

// ✅ Get Subject by ID (GET)
const getSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subject = await Subject.findById(id)
        .populate("schoolId", "name")
        .populate("teacherId", "name email")
        .populate("classes", "name");

    if (!subject) {
        throw new ApiError(404, "Subject not found!");
    }

    return res.status(200).json(
        new ApiResponse(200, subject, "Subject retrieved successfully!")
    );
});

// ✅ Update Subject (PUT)
const updateSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, teacherId, classes } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
        id,
        { name, teacherId, classes },
        { new: true } // Return updated document
    );

    if (!updatedSubject) {
        throw new ApiError(404, "Subject not found!");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedSubject, "Subject updated successfully!")
    );
});

// ✅ Delete Subject (DELETE)
const deleteSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedSubject = await Subject.findByIdAndDelete(id);

    if (!deletedSubject) {
        throw new ApiError(404, "Subject not found!");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Subject deleted successfully!")
    );
});

export {
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject
};
