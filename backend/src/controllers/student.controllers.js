import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


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

        // ✅ Validate required fields
        if (![name, email, password, role, phoneNumber, dateOfBirth, gender, enrollmentNumber].every(Boolean)) {
            throw new ApiError(400, "All required fields must be filled!");
        }

        // ✅ Ensure role is "Student"
        if (role !== "Student") {
            throw new ApiError(400, "Only 'Student' role is allowed!");
        }

        // ✅ Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(400, "User with this email already exists!");
        }

        // ✅ Create user with Student role
        const user = await User.create({
            name,
            email,
            password,
            role,
            isActive,
            schoolId,
            classId
        });

        // ✅ Create Student record linked to the User ID
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

        // ✅ Remove sensitive fields before returning
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        const createdStudent = await Student.findById(student._id).populate("userId", "-password -refreshToken");

        return res.status(201).json(
            new ApiResponse(201, { createdUser, createdStudent }, "Student registered successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong!");
    }
});




const getStudents = asyncHandler(async (req, res) => {
    try {
        // Aggregation pipeline
        const students = await Student.aggregate([
            {
                $lookup: {
                    from: "users", // Collection to join (case-sensitive)
                    localField: "userId", // Field in Student model
                    foreignField: "_id", // Field in User model
                    as: "userDetails" // Output array name
                }
            },
            {
                $unwind: "$userDetails" // Convert userDetails array to an object
            },
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

                    // User details
                    "userDetails._id": 1,
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

export {
    registerStudent,
    getStudents
}