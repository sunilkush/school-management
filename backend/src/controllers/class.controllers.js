import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Class } from '../models/classes.model.js';

const createClass = asyncHandler(async (req, res) => {
    try {
        
        const { name, section, schoolId, teacherId, students, subjects } = req.body;

        if ([name, section].some((field) => typeof field === "string" && field.trim() === "") || !schoolId) {
            return res.status(404).json({
                success: false,
                message: "Name, section, and school ID are required fields"
            })
           
        }

        const existingClass = await Class.findOne({ schoolId, name, section });
        if (existingClass) {
            return res.status(404).json({
                success: false,
                message: "Class with the same name and section already exists in this school"
            });
            
        }

        const newClass = new Class({
            schoolId,
            name,
            section,
            teacherId,
            students,
            subjects
        });

        const savedClass = await newClass.save();

        if (!savedClass) {
            res.status(400).json({
                success: false,
                message: "Class was not created"
            });
            
        }

        return res.status(201).json(
            new ApiResponse(201, savedClass, "Class created successfully")
        );
    } catch (error) {
        return res.status(500).json({
            success: false, 
            message: error.message || "Class creation failed"
        });
       
    }
});

const updateClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params;
        const { name, section, teacherId, students, subjects } = req.body;

        if (!classId) {
            throw new ApiError(400, "Class ID is required");
        }

        const classToUpdate = await Class.findById(classId);
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
    const { classId } = req.params;

    if (!classId) {
        throw new ApiError(400, "Class ID is required");
    }

    const deletedClass = await Class.findByIdAndDelete(classId);

    if (!deletedClass) {
        throw new ApiError(404, "Class not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedClass, "Class deleted successfully"));
});

const getAllClasses = asyncHandler(async (req, res) => {
    try {
        const classes = await Class.find().populate("schoolId teacherId students subjects");
        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const getClassById = asyncHandler(async (req, res) => {
    try {
        const classData = await Class.findById(req.params.id).populate("schoolId teacherId students subjects");
        if (!classData) return res.status(404).json({ success: false, message: "Class not found" });
        res.status(200).json({ success: true, data: classData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})


export {


    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,

};
