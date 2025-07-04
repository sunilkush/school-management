import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Register a Student


const registerStudent = asyncHandler(async (req, res) => {
    const {
        userId,
        schoolId,
        registrationNumber,
        class: classId,
        admissionDate,
        feeDiscount,
        smsMobile,
        otherInfo,
        fatherInfo,
        motherInfo,
        status,
    } = req.body;

    // Validate required fields
    if (!userId || !schoolId || !classId || !registrationNumber) {
        throw new ApiError(400, "User ID, School ID, Class, and Registration Number are required");
    }

    // Optional: Validate if user has 'Student' role
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.role !== "Student") {
        throw new ApiError(400, "Only 'Student' role is allowed!");
    }

    // Check for duplicate registrationNumber
    const existingStudent = await Student.findOne({ registrationNumber });
    if (existingStudent) {
        throw new ApiError(409, "Student with this registration number already exists");
    }

    // Create the student
    const student = await Student.create({
        userId,
        schoolId,
        registrationNumber,
        class: classId,
        admissionDate,
        feeDiscount,
        smsMobile,
        otherInfo,
        fatherInfo,
        motherInfo,
        status,
    });

    const populatedStudent = await Student.findById(student._id).populate("userId", "-password -refreshToken");

    return res
        .status(201)
        .json(new ApiResponse(201, { student: populatedStudent }, "Student registered successfully!"));
});


// ✅ Get All Students
const getStudents = asyncHandler(async (req, res) => {
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
                registrationNumber: 1,
                admissionDate: 1,
                feeDiscount: 1,
                smsMobile: 1,
                status: 1,
                schoolId: 1,
                class: 1,
                createdAt: 1,
                updatedAt: 1,
                otherInfo: 1,
                fatherInfo: 1,
                motherInfo: 1,
                "userDetails._id": 1,
                "userDetails.name": 1,
                "userDetails.email": 1,
                "userDetails.role": 1,
                "userDetails.isActive": 1,
                "userDetails.schoolId": 1
            }
        }
    ]);

    if (!students || students.length === 0) {
        throw new ApiError(404, "No students found!");
    }

    return res.status(200).json(
        new ApiResponse(200, students, "Students retrieved successfully!")
    );
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
    const { id } = req.params;
    const {
        registrationNumber,
        class: classId,
        schoolId,
        admissionDate,
        feeDiscount,
        smsMobile,
        status,
        otherInfo = {},
        fatherInfo = {},
        motherInfo = {}
    } = req.body;

    const student = await Student.findById(id);
    if (!student) {
        throw new ApiError(404, "Student not found!");
    }

    // === Validate and update top-level fields ===
    if (registrationNumber) student.registrationNumber = registrationNumber;
    if (classId) student.class = classId;
    if (schoolId) student.schoolId = schoolId; // Allow school update if explicitly needed
    if (admissionDate) student.admissionDate = admissionDate;
    if (feeDiscount !== undefined) student.feeDiscount = feeDiscount;
    if (smsMobile) student.smsMobile = smsMobile;
    if (status) student.status = status;

    // === Validate and update otherInfo fields ===
    const validOtherFields = [
        "dateOfBirth", "birthFormId", "orphan", "gender", "cast",
        "osc", "identificationMark", "previousSchool", "religion",
        "bloodGroup", "previousId", "family", "disease", "notes",
        "siblings", "address"
    ];

    for (const field of validOtherFields) {
        if (otherInfo[field] !== undefined) {
            student.otherInfo[field] = otherInfo[field];
        }
    }

    // === Validate and update fatherInfo ===
    const validFatherFields = [
        "name", "nationalId", "occupation", "education",
        "mobile", "profession", "income"
    ];
    for (const field of validFatherFields) {
        if (fatherInfo[field] !== undefined) {
            student.fatherInfo[field] = fatherInfo[field];
        }
    }

    // === Validate and update motherInfo ===
    const validMotherFields = [
        "name", "nationalId", "occupation", "education",
        "mobile", "profession", "income"
    ];
    for (const field of validMotherFields) {
        if (motherInfo[field] !== undefined) {
            student.motherInfo[field] = motherInfo[field];
        }
    }

    // === Optional: Audit Logging ===
    const auditTrail = {
        updatedBy: req.user?._id || "System",
        updatedAt: new Date(),
        changes: req.body,
    };

    console.log("[AUDIT] Student update:", JSON.stringify(auditTrail, null, 2));

    const updatedStudent = await student.save();

    return res.status(200).json(
        new ApiResponse(200, updatedStudent, "Student updated successfully!")
    );
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
const getLastRegisteredStudent = asyncHandler(async (req, res) => {
    const lastStudent = await Student.findOne().sort({ createdAt: -1 });
    if (!lastStudent) {
        return res.status(200).json({
            registrationNumber: "", // No previous registration
            studentName: "",
        });
    }
    res.status(200).json({
        registrationNumber: lastStudent.registrationNumber,
        studentName: lastStudent.studentName,
    });
});


export {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getLastRegisteredStudent
};
