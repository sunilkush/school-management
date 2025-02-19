import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Classes } from '../models/classes.model.js';

const registerClass = asyncHandler(async (req, res) => {

    try {
        const { name, section, schoolId, teacherId, students, subjects } = req.body

        if ([name, section, schoolId,].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "School ID,Class Name, and Section are required");
        }

        const existingClass = await Classes.findOne({ schoolId, name, section });
        if (existingClass) {
            throw new ApiError(400, "Class with the same name and section already exists in this school");
        }
        // Step 3: Create new class
        const newClass = new Classes({
            schoolId,
            name,
            section,
            teacherId,
            students,
            subjects
        });

        // Step 4: Save class
        const savedClass = await newClass.save();

        if (!savedClass) {
            throw new ApiError(400, "class ditn,t create")
        }


        return res.status(201).json(
            new ApiResponse(201, savedClass, "Class created successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Class creation failed");
    }


});


const updateClass = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { name, section, teacherId, students, subjects } = req.body;

    // Step 1: Find class
    const classToUpdate = await Classes.findById(classId);

    if (!classToUpdate) {
        throw new ApiError(404, "Class not found");
    }
    // Step 2: Update fields if provided
    if (name) classToUpdate.name = name;
    if (section) classToUpdate.section = section;
    if (teacherId) classToUpdate.teacherId = teacherId;
    if (students) classToUpdate.students = students;
    if (subjects) classToUpdate.subjects = subjects;

    // Step 3: Save updated class
    const updatedClass = await classToUpdate.save();

    if (!updatedClass) {
        throw new ApiError(404, "Class not save");
    }
    return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
})

const deleteClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params;

        // Step 1: Find and delete class
        const deletedClass = await Classes.findByIdAndDelete(classId);
        if (!deletedClass) {
            throw new ApiError(404, "Class not found");
        }

        res.status(200).json(new ApiResponse(200, null, "Class deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Class deletion failed");
    }
});

export {
    registerClass,
    updateClass,
    deleteClass
}
