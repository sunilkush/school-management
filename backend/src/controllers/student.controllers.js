import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Register a Student
const registerStudent = asyncHandler(async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            isActive,
            phoneNumber,
            dateOfBirth,
            gender,
            address,
            enrollmentNumber,
            guardian,
            admissionDate,
            schoolId,
            classId
        } = req.body;

        // Validate required fields
        if (![name, email, password, phoneNumber, dateOfBirth, gender, enrollmentNumber].every(Boolean)) {
            throw new ApiError(400, "All required fields must be filled!");
        }

        // Ensure role is "Student"
        if (role !== "Student") {
            throw new ApiError(400, "Only 'Student' role is allowed!");
        }

        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(400, "User with this email already exists!");
        }

        // Create user with Student role
        const user = await User.create({
            name,
            email,
            password,
            role,
            isActive,
            schoolId,
            classId
        });

        // Create Student record linked to the User ID
        const student = await Student.create({
            userId: user?._id,
            phoneNumber,
            dateOfBirth,
            gender,
            address,
            enrollmentNumber,
            guardian,
            admissionDate
        });

        // Remove sensitive fields before returning
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        const createdStudent = await Student.findById(student._id).populate("userId", "-password -refreshToken");

        return res.status(201).json(
            new ApiResponse(201, { createdUser, createdStudent }, "Student registered successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});

// ✅ Get All Students
const getStudents = asyncHandler(async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    enrollmentNumber: 1,
                    phoneNumber: 1,
                    dateOfBirth: 1,
                    gender: 1,
                    admissionDate: 1,
                    address: 1,
                    guardian: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    "userDetails.role": 1,
                    "userDetails.isActive": 1,
                    "userDetails.schoolId": 1
                }
            }
        ]);

        if (!students.length) {
            throw new ApiError(404, "No students found!");
        }

        return res.status(200).json(new ApiResponse(200, students, "Students retrieved successfully!"));
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});

// ✅ Get Student by ID
const getStudentById = asyncHandler(async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate("userId", "-password -refreshToken");
        if (!student) {
            throw new ApiError(404, "Student not found!");
        }

        return res.status(200).json(new ApiResponse(200, student, "Student found successfully!"));
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});

// ✅ Update Student
const updateStudent = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneNumber, dateOfBirth, gender, address, guardian } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            throw new ApiError(404, "Student not found!");
        }

        if (phoneNumber) student.phoneNumber = phoneNumber;
        if (dateOfBirth) student.dateOfBirth = dateOfBirth;
        if (gender) student.gender = gender;
        if (address) student.address = address;
        if (guardian) student.guardian = guardian;

        const updatedStudent = await student.save();
        return res.status(200).json(new ApiResponse(200, updatedStudent, "Student updated successfully!"));
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});

// ✅ Delete Student
const deleteStudent = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByIdAndDelete(id);
        if (!student) {
            throw new ApiError(404, "Student not found!");
        }

        await User.findByIdAndDelete(student.userId);

        return res.status(200).json(new ApiResponse(200, {}, "Student deleted successfully!"));
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});

export {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent
};
