import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import { Class } from "../models/classes.model.js";
// ✅ Create a Subject (POST)
// Create subject
 const createSubject = asyncHandler(async (req, res) => {
  const { academicYearId, schoolId, name, teacher, classes } = req.body;

  if (!academicYearId || !schoolId || !name || !teacher) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Validate teacher role
  const teacherUser = await User.findById(teacher).populate("roleId");
  if (!teacherUser) {
    throw new ApiError(404, "Teacher not found");
  }
  if (teacherUser.roleId.name !== "Teacher") {
    throw new ApiError(400, "Selected user is not a Teacher");
  }

  const subject = await Subject.create({
    academicYearId,
    schoolId,
    name,
    teacher,
    classes,
  });

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    data: subject,
  });
});
// ✅ Get All Subjects (GET)
const getAllSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.aggregate([
        {
            $lookup: {
                from: "schools", // collection name in MongoDB
                localField: "schoolId",
                foreignField: "_id",
                as: "school"
            }
        },
        { $unwind: "$school" }, // flatten the school array
        {
            $lookup: {
                from: "users", // teachers are stored in users collection
                localField: "teacherId",
                foreignField: "_id",
                as: "teacher"
            }
        },
        { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } }, // preserveNull so subjects without teacher still appear
        {
            $project: {
                _id: 1,
                name: 1,
                schoolId: 1,
                teacherId: 1,
                "school.name": 1,
                "teacher.name": 1,
                "teacher.email": 1
            }
        }
    ]);

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
