import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";
import { generateNextRegNumber } from "../utils/generateRegNumber.js";
import mongoose from "mongoose";
// ✅ Register and admit student
const registerStudent = asyncHandler(async (req, res) => {
  const {
    studentName, email, password, schoolId, classId, registrationNumber,
    admissionDate, feeDiscount, smsMobile, dateOfBirth, birthFormId, orphan,
    gender, cast, osc, identificationMark, previousSchool, religion, bloodGroup,
    previousId, family, disease, notes, siblings, address, fatherName, fatherNID,
    fatherOccupation, fatherEducation, fatherMobile, fatherProfession, fatherIncome,
    motherName, motherNID, motherOccupation, motherEducation, motherMobile,
    motherProfession, motherIncome, academicYearId, mobileNumber
  } = req.body;

  if (!studentName || !email || !password || !registrationNumber || !classId || !schoolId || !academicYearId) {
    throw new ApiError(400, "Missing required fields");
  }

  // Fetch student role
  const roleDoc = await Role.findOne({ name: { $regex: /^student$/i } });
  if (!roleDoc) throw new ApiError(400, "Student role not found");

  // Create user if not exists
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: studentName,
      email,
      password,
      roleId: roleDoc._id,
      schoolId,
      academicYearId
    });
  }

  // Check for existing student registration number
  const existingStudent = await Student.findOne({ registrationNumber });
  if (existingStudent) throw new ApiError(409, "Student with this registration number already exists");

  // Create student
  const student = await Student.create({
    userId: user._id,
    schoolId,
    academicYearId,
    registrationNumber,
    classId,
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
    mobileNumber,
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

  // ✅ Add student to the class.students array
  await Class.findByIdAndUpdate(
    classId,
    { $addToSet: { students: user._id } }, // prevents duplicates
    { new: true }
  );

  const populatedStudent = await Student.findById(student._id)
    .populate("userId", "-password")
    .populate("classId", "name section");

  return res
    .status(201)
    .json(new ApiResponse(201, { student: populatedStudent }, "Student registered and admitted successfully"));
});



// ✅ Get Students (with pagination, class + school + academicYear filters, teacher details)
const getStudents = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId; // from auth
  const academicYearId = req.academicYearId; // from middleware
  const { classId, page = 1, limit = 10 } = req.query; // pagination

  if (!schoolId || !academicYearId) {
    throw new ApiError(400, "schoolId and academicYearId are required!");
  }

  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  // ✅ Build match conditions dynamically
  const matchConditions = {
    schoolId: new mongoose.Types.ObjectId(schoolId),
    academicYearId: new mongoose.Types.ObjectId(academicYearId),
  };

  if (classId) {
    matchConditions.classId = new mongoose.Types.ObjectId(classId);
  }

  const result = await Student.aggregate([
    {
      $match: matchConditions,
    },

    // 🔹 Lookup student -> user
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },

    // 🔹 Lookup student -> class
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "classDetails",
      },
    },
    { $unwind: "$classDetails" },

    // 🔹 Lookup class -> teacher
    {
      $lookup: {
        from: "users",
        localField: "classDetails.teacherId",
        foreignField: "_id",
        as: "teacherDetails",
      },
    },
    {
      $unwind: {
        path: "$teacherDetails",
        preserveNullAndEmptyArrays: true, // teacher may not exist
      },
    },
     // 🔹 Lookup School 
    // Join School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    
    // 🔹 Projection
    {
      $project: {
        _id: 1,
        registrationNumber: 1,
        admissionDate: 1,
        feeDiscount: 1,
        smsMobile: 1,
        status: 1,
        bloodGroup:1,
        academicYearId: 1,
        dateOfBirth:1,
        mobileNumber:1,
        createdAt: 1,
        updatedAt: 1,
        otherInfo: 1,
        fatherInfo: 1,
        motherInfo: 1,
        school: {
          _id: "$school._id",
          name: "$school.name",
        },
        // student user info
        "userDetails._id": 1,
        "userDetails.name": 1,
        "userDetails.email": 1,
        "userDetails.role": 1,
        "userDetails.isActive": 1,

        // class info
        "classDetails._id": 1,
        "classDetails.name": 1,
        "classDetails.section": 1,

        // teacher info
        "teacherDetails._id": 1,
        "teacherDetails.name": 1,
        "teacherDetails.email": 1,
      },
    },

    // 🔹 Pagination using $facet
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: pageSize }],
      },
    },
    {
      $addFields: {
        total: { $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0] },
      },
    },
  ]);

  const students = result[0]?.data || [];
  const total = result[0]?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        students,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages,
        },
      },
      "Students retrieved successfully!"
    )
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
  const lastStudent = await Student.findOne()
  .sort({ createdAt: -1 })
  .populate("userId", "name");

  let nextRegNumber = "REG2025-101"; // default
  let lastStudentName = "";

  if (lastStudent) {
    nextRegNumber = generateNextRegNumber(lastStudent.registrationNumber);
    lastStudentName = lastStudent.userId?.name || ""; // if populated
  }

  res.status(200).json({
    registrationNumber: nextRegNumber,
    studentName: lastStudentName,
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
