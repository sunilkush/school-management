import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import {Class} from "../models/classes.model.js"
import mongoose from "mongoose";
// Create subject
const createSubject = asyncHandler(async (req, res) => {
  const { academicYearId, schoolId, name, teacherId, classId } = req.body;

  if (!academicYearId || !schoolId || !name || !teacherId || !classId) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // ✅ Create subject
  const subject = await Subject.create({
    academicYearId,
    schoolId,
    name,
    teacherId,
    classId,
  });

  // ✅ Add subject to the Class model subjects array
  await Class.findByIdAndUpdate(
    classId,
    {
      $addToSet: {
        subjects: {
          subjectId: subject._id,
          teacherId: teacherId,
        },
      },
    },
    { new: true }
  );

  // ✅ Populate teacher info in response (optional)
  const populatedSubject = await Subject.findById(subject._id)
    .populate("teacherId", "name email")
    .populate("classId", "name section");

  res.status(201).json({
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
