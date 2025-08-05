import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";

// ✅ Register and admit student
const registerStudent = asyncHandler(async (req, res) => {
  const {
    studentName,
    email,
    password,
    role, // "student"
    schoolId,
    class: classId,
    section,
    registrationNumber,
    admissionDate,
    feeDiscount,
    smsMobile,

    dateOfBirth,
    birthFormId,
    orphan,
    gender,
    cast,
    osc,
    identificationMark,
    previousSchool,
    religion,
    bloodGroup,
    previousId,
    family,
    disease,
    notes,
    siblings,
    address,

    fatherName,
    fatherNID,
    fatherOccupation,
    fatherEducation,
    fatherMobile,
    fatherProfession,
    fatherIncome,

    motherName,
    motherNID,
    motherOccupation,
    motherEducation,
    motherMobile,
    motherProfession,
    motherIncome,
  } = req.body;

  if (!studentName || !email || !password || !registrationNumber || !classId || !schoolId || !role) {
    throw new ApiError(400, "Missing required fields");
  }

  const roleDoc = await Role.findOne({ name: { $regex: /^student$/i } });
  if (!roleDoc || roleDoc._id.toString() !== role) {
    throw new ApiError(400, "Invalid student role provided");
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: studentName,
      email,
      password,
      role: roleDoc._id,
      schoolId,
    });
  }

  const existingStudent = await Student.findOne({ registrationNumber });
  if (existingStudent) {
    throw new ApiError(409, "Student with this registration number already exists");
  }

  const student = await Student.create({
    userId: user._id,
    schoolId,
    registrationNumber,
    class: classId,
    section,
    admissionDate,
    feeDiscount,
    smsMobile,

    dateOfBirth,
    birthFormId,
    orphan,
    gender,
    cast,
    osc,
    identificationMark,
    previousSchool,
    religion,
    bloodGroup,
    previousId,
    family,
    disease,
    notes,
    siblings,
    address,

    fatherInfo: {
      name: fatherName,
      NID: fatherNID,
      occupation: fatherOccupation,
      education: fatherEducation,
      mobile: fatherMobile,
      profession: fatherProfession,
      income: fatherIncome,
    },

    motherInfo: {
      name: motherName,
      NID: motherNID,
      occupation: motherOccupation,
      education: motherEducation,
      mobile: motherMobile,
      profession: motherProfession,
      income: motherIncome,
    },
  });

  const populatedStudent = await Student.findById(student._id).populate("userId", "-password");

  return res.status(201).json(new ApiResponse(201, { student: populatedStudent }, "Student registered and admitted successfully"));
});

// ✅ Get All Students
const getStudents = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId;
  const academicYearId = req.academicYearId;

  const students = await Student.aggregate([
    {
      $match: {
        schoolId,
        academicYearId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
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
        academicYearId: 1,
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
        "userDetails.schoolId": 1,
      },
    },
  ]);

  if (!students || students.length === 0) {
    throw new ApiError(404, "No students found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, students, "Students retrieved successfully!"));
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
    motherInfo = {},
  } = req.body;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, "Student not found!");
  }

  if (registrationNumber) student.registrationNumber = registrationNumber;
  if (classId) student.class = classId;
  if (schoolId) student.schoolId = schoolId;
  if (admissionDate) student.admissionDate = admissionDate;
  if (feeDiscount !== undefined) student.feeDiscount = feeDiscount;
  if (smsMobile) student.smsMobile = smsMobile;
  if (status) student.status = status;

  const validOtherFields = [
    "dateOfBirth", "birthFormId", "orphan", "gender", "cast",
    "osc", "identificationMark", "previousSchool", "religion",
    "bloodGroup", "previousId", "family", "disease", "notes",
    "siblings", "address",
  ];

  for (const field of validOtherFields) {
    if (otherInfo[field] !== undefined) {
      student.otherInfo[field] = otherInfo[field];
    }
  }

  const validFatherFields = [
    "name", "nationalId", "occupation", "education",
    "mobile", "profession", "income",
  ];
  for (const field of validFatherFields) {
    if (fatherInfo[field] !== undefined) {
      student.fatherInfo[field] = fatherInfo[field];
    }
  }

  const validMotherFields = [
    "name", "nationalId", "occupation", "education",
    "mobile", "profession", "income",
  ];
  for (const field of validMotherFields) {
    if (motherInfo[field] !== undefined) {
      student.motherInfo[field] = motherInfo[field];
    }
  }

  const auditTrail = {
    updatedBy: req.user?._id || "System",
    updatedAt: new Date(),
    changes: req.body,
  };
  console.log("[AUDIT] Student update:", JSON.stringify(auditTrail, null, 2));

  const updatedStudent = await student.save();

  return res.status(200).json(new ApiResponse(200, updatedStudent, "Student updated successfully!"));
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
      registrationNumber: "",
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
  getLastRegisteredStudent,
};
