import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import {ClassSubject} from "../models/ClassSubject.model.js";
import mongoose from "mongoose";
// Create subject
const createSubject = asyncHandler(async (req, res) => {
  const { name,
    category,
    type,
    teacherId,
    schoolId,
    academicYearId } = req.body;

  if (!academicYearId || !schoolId || !name || !teacherId ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // 🔎 Prevent duplicate subject in same class
  const existing = await Subject.findOne({ schoolId, name });
  if (existing) {
    throw new ApiError(400, "This subject already exists for the class");
  }

  // ✅ Create subject
  const subject = await Subject.create({
    academicYearId,
    schoolId,
    name,
    teacherId,
    category,
    type
  });

  
  // ✅ Populate for response
  const populatedSubject = await Subject.findById(subject._id)
    .populate("teacherId", "name email")
   

  return res.status(201).json({
    success: true,
    message: "Subject created and added to class successfully",
    data: populatedSubject,
  });
});

// ✅ Get All Subjects (Admin & Teacher)
const getAllSubjects = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, schoolId, teacherId, section, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // 🔍 Filtering
    if (schoolId) query.schoolId = new mongoose.Types.ObjectId(schoolId);
    if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId);
    if (section) query.section = section;

    // 🔍 Search by subject name (case insensitive)
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    // ✅ Aggregate pipeline for better joins
    const subjects = await Subject.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "schools",
                localField: "schoolId",
                foreignField: "_id",
                as: "school"
            }
        },
        { $unwind: "$school" },
        {
            $lookup: {
                from: "users", // teachers stored in users collection
                localField: "teacherId",
                foreignField: "_id",
                as: "teacher"
            }
        },
        { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                name: 1,
                section: 1,
                schoolId: 1,
                teacherId: 1,
                "school._id": 1,
                "school.name": 1,
                "teacher._id": 1,
                "teacher.name": 1,
                "teacher.email": 1,
            }
        },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ]);

    // ✅ Get total count separately for pagination
    const totalSubjects = await Subject.countDocuments(query);

    if (!subjects.length) {
        throw new ApiError(404, "No subjects found!");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            subjects,
            pagination: {
                total: totalSubjects,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalSubjects / limit),
            }
        }, "Subjects retrieved successfully!")
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
    const { name, teacherId } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
        id,
        { name, teacherId},
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
