import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";
import { generateNextRegNumber } from "../utils/generateRegNumber.js";
import { ClassSection } from "../models/classSection.model.js";

import { AcademicYear } from "../models/AcademicYear.model.js";
import mongoose from "mongoose";

// ✅ Register and admit student
const registerStudent = asyncHandler(async (req, res) => {
  const {
    studentName, email, password, schoolId, classId, sectionId, admissionDate,
    feeDiscount, smsMobile, dateOfBirth, birthFormId, orphan, gender, cast,
    osc, identificationMark, previousSchool, religion, bloodGroup, previousId,
    family, disease, notes, siblings, address, fatherName, fatherNID, fatherOccupation,
    fatherEducation, fatherMobile, fatherProfession, fatherIncome,
    motherName, motherNID, motherOccupation, motherEducation, motherMobile,
    motherProfession, motherIncome, academicYearId, mobileNumber
  } = req.body;

  if (!studentName || !email || !password || !classId || !schoolId || !sectionId || !academicYearId) {
    throw new ApiError(400, "Missing required fields including sectionId and academicYearId");
  }

  // 🔹 Get student role
  const roleDoc = await Role.findOne({ name: { $regex: /^student$/i } });
  if (!roleDoc) throw new ApiError(400, "Student role not found");

  // 🔹 Create user if not exists
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: studentName,
      email,
      password,
      roleId: roleDoc._id,
      schoolId,
    });
  }

  // 🔹 Create student (permanent info)
  const student = await Student.create({
    userId: user._id,
    dateOfBirth,
    birthFormId,
    gender,
    religion,
    cast,
    osc,
    bloodGroup,
    address,
    identificationMark,
    orphan,
    family,
    disease,
    notes,
    siblings,
    previousSchool,
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

  // 🔹 Get last registration number
// 🔹 Get last registration number
const lastRegNumber = await StudentEnrollment.find({ schoolId, academicYearId })
  .sort({ createdAt: -1 })
  .limit(1)
  .select("registrationNumber");

const academicYearDoc = await AcademicYear.findById(academicYearId).lean();
const yearLabel = academicYearDoc?.code || new Date().getFullYear();

const registrationNumber = generateNextRegNumber(lastRegNumber?.[0]?.registrationNumber, {
  prefix: "REG",
  year: yearLabel,
  digits: 4,
});


// 🔹 Create enrollment
const enrollment = await StudentEnrollment.create({
  studentId: student._id,
  schoolId,
  academicYearId,
  registrationNumber,
  classId,
  sectionId,
  admissionDate,
  feeDiscount,
  smsMobile,
  mobileNumber,
});

  // 🔹 Add student to ClassSection
  const classSection = await ClassSection.findOne({ classId, sectionId, schoolId, academicYearId });
  if (classSection) {
    await ClassSection.findByIdAndUpdate(classSection._id, { $addToSet: { students: user._id } });
  }

  return res.status(201).json(
    new ApiResponse(201, { student, enrollment }, "Student registered and enrolled successfully")
  );
});

// ✅ Get Students (with aggregation)
const getStudents = asyncHandler(async (req, res) => {
  const user = req.user;
  const { classId, page = 1, limit = 10 } = req.query;
  const academicYearId = req.academicYearId;

  // 🔹 Common validation
  if (!academicYearId) {
    throw new ApiError(400, "Academic year is required!");
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const match = { academicYearId: new mongoose.Types.ObjectId(academicYearId) };

  // 🔹 Role-based filter
  if (user.role === "School Admin" || user.role === "Super Admin") {
    if (!user.schoolId) {
      throw new ApiError(400, "School ID not found for admin user!");
    }
    match.schoolId = new mongoose.Types.ObjectId(user.schoolId);
  } else if (user.role === "Super Admin") {
    // Super Admin — no school filter
  } else {
    throw new ApiError(403, "Access denied. Only admins can view student data.");
  }

  if (classId) {
    match.classId = new mongoose.Types.ObjectId(classId);
  }

  // 🔹 Aggregate pipeline
  const result = await StudentEnrollment.aggregate([
    { $match: match },

    // Join with Student Info
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },

    // Join with User Info
    {
      $lookup: {
        from: "users",
        localField: "studentInfo.userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },

    // Join with Class Info
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "classDetails",
      },
    },
    { $unwind: "$classDetails" },

    // Join with Section Info
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "sectionDetails",
      },
    },
    { $unwind: { path: "$sectionDetails", preserveNullAndEmptyArrays: true } },

    // Join with Teacher
    {
      $lookup: {
        from: "users",
        localField: "classDetails.teacherId",
        foreignField: "_id",
        as: "teacherDetails",
      },
    },
    { $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true } },

    // Join with School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "schoolDetails",
      },
    },
    { $unwind: { path: "$schoolDetails", preserveNullAndEmptyArrays: true } },

    // Projection
    {
      $project: {
        _id: 1,
        registrationNumber: 1,
        admissionDate: 1,
        feeDiscount: 1,
        smsMobile: 1,
        mobileNumber: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        studentInfo: 1,
        userDetails: { _id: 1, name: 1, email: 1, role: 1, isActive: 1 },
        classDetails: { _id: 1, name: 1 },
        sectionDetails: { _id: 1, name: 1 },
        teacherDetails: { _id: 1, name: 1, email: 1 },
        schoolDetails: { _id: 1, name: 1 },
      },
    },

    { $skip: skip },
    { $limit: parseInt(limit, 10) },
  ]);

  const total = await StudentEnrollment.countDocuments(match);
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        students: result,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      },
      "Students retrieved successfully"
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

// ✅ Get last student & generate next reg no
const getLastRegisteredStudent = asyncHandler(async (req, res) => {
  debugger;
  const { schoolId, academicYearId } = req.query;
  console.log("Received request for last registered student with schoolId:", schoolId, "and academicYearId:", academicYearId);
  // ✅ Validate IDs
  if (!schoolId || !academicYearId) {
    throw new ApiError(400, "schoolId and academicYearId are required");
  }

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid schoolId format");
  }

  if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId format");
  }

  // ✅ Use aggregation instead of findOne()
  const lastStudentAgg = await StudentEnrollment.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        registrationNumber: 1,
        studentName: "$student.studentName",
      },
    },
  ]);

  const lastStudent = lastStudentAgg[0] || null;

  // ✅ Fetch Academic Year Code
  const academicYearDoc = await AcademicYear.findById(academicYearId).lean();
  const yearLabel = academicYearDoc?.code || new Date().getFullYear();

  // ✅ Generate next registration number
  const lastRegNumber = lastStudent?.registrationNumber ?? null;
  const nextRegNo = generateNextRegNumber(lastRegNumber, {
    prefix: "REG",
    year: yearLabel,
    digits: 4,
  });

  // ✅ Send response
  return res.status(200).json(
    new ApiResponse(200, {
      registrationNumber: nextRegNo,
      lastStudent: lastStudent
        ? {
            name: lastStudent.studentName || null,
            registrationNumber: lastStudent.registrationNumber,
          }
        : null,
    }, "Last registered student fetched successfully")
  );
});

const getStudentsBySchoolId = asyncHandler(async (req, res) => {

  // ✅ Use query param properly
  let { schoolId, academicYearId } = req.query;

  console.log("Fetching students:", { schoolId, academicYearId });

  // ✅ Validate schoolId properly
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Valid schoolId is required");
  }

  // ✅ Fetch Active Academic Year if not passed
  if (!academicYearId) {

    const activeYear = await AcademicYear.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      isActive: true,
    }).lean();

    if (!activeYear) {
      throw new ApiError(404, "No active academic year found");
    }

    academicYearId = activeYear._id;
  }

  // ✅ Also validate academicYearId
  if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId format");
  }

  // ✅ Aggregation Pipeline
  const students = await StudentEnrollment.aggregate([

    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
      },
    },

    // ✅ Student Data
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: false } },

    // ✅ User Data
    {
      $lookup: {
        from: "users",
        localField: "student.userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: false } },

    // ✅ Class Data
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "class",
      },
    },
    { $unwind: { path: "$class", preserveNullAndEmptyArrays: false } },

    // ✅ Section Data
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: { path: "$section", preserveNullAndEmptyArrays: false } },

    // ✅ School Data
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: false } },

    // ✅ Academic Year Data
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: false } },

    { $sort: { createdAt: -1 } },

    // ✅ Clean Projection for Frontend
    {
      $project: {
        registrationNumber: 1,
        admissionDate: 1,
        mobileNumber: 1,
        feeDiscount: 1,
        status: 1,

        student: {
          dateOfBirth: 1,
          gender: 1,
          religion: 1,
          cast: 1,
          bloodGroup: 1,
          address: 1,
          fatherInfo: 1,
          motherInfo: 1,
          identificationMark: 1,
        },

        userDetails: {
          name: 1,
          email: 1,
          isActive: 1,
          avatar: 1,
        },

        class: { name: 1 },
        section: { name: 1 },

        school: {
          name: 1,
          address: 1,
        },

        academicYear: {
          name: 1,
          startDate: 1,
          endDate: 1,
        },
      },
    },
  ]);

  // ✅ If No Students Found
  if (students.length === 0) {
    throw new ApiError(404, "No students found for this school & academic year");
  }

  return res.status(200).json(
    new ApiResponse(200, students, "Students Retrieved Successfully")
  );

});


export {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
  getStudentsBySchoolId
};
