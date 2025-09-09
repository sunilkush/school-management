import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";
import { generateNextRegNumber } from "../utils/generateRegNumber.js";
import { Class } from "../models/classes.model.js";
import { ClassSection } from "../models/classSection.model.js";
import { Section } from "../models/section.model.js";
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
    gender,
    religion,
    cast,
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
const lastRegNumber = await StudentEnrollment.find({ schoolId, academicYearId })
  .sort({ createdAt: -1 })
  .limit(1)
  .select("registrationNumber");

// 🔹 Generate next registration number (await!)
const registrationNumber = await generateNextRegNumber(lastRegNumber?.[0]?.registrationNumber, academicYearId);


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
  const schoolId = req.user?.schoolId;
  const academicYearId = req.academicYearId;
  const { classId, page = 1, limit = 10 } = req.query;

  if (!schoolId || !academicYearId) throw new ApiError(400, "schoolId and academicYearId are required!");

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const match = { schoolId: new mongoose.Types.ObjectId(schoolId), academicYearId: new mongoose.Types.ObjectId(academicYearId) };
  if (classId) match.classId = new mongoose.Types.ObjectId(classId);

  const result = await StudentEnrollment.aggregate([
    { $match: match },

    // 🔹 Join student info
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },

    // 🔹 Join user info
    {
      $lookup: {
        from: "users",
        localField: "studentInfo.userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },

    // 🔹 Join class info
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "classDetails",
      },
    },
    { $unwind: "$classDetails" },

    // 🔹 Join section info
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "sectionDetails",
      },
    },
    { $unwind: { path: "$sectionDetails", preserveNullAndEmptyArrays: true } },

    // 🔹 Join teacher
    {
      $lookup: {
        from: "users",
        localField: "classDetails.teacherId",
        foreignField: "_id",
        as: "teacherDetails",
      },
    },
    { $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true } },

    // 🔹 Join school
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "schoolDetails",
      },
    },
    { $unwind: { path: "$schoolDetails", preserveNullAndEmptyArrays: true } },

    // 🔹 Projection
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

    // 🔹 Pagination
    { $skip: skip },
    { $limit: parseInt(limit, 10) },
  ]);

  const total = await StudentEnrollment.countDocuments(match);
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json(
    new ApiResponse(200, { students: result, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages } }, "Students retrieved successfully")
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
/* function generateNextRegNumber(lastNumber, academicYear) {
  if (!lastNumber) {
    return `REG${academicYear}-0001`;
  }

  const [prefix, num] = lastNumber.split("-");
  const nextNum = String(parseInt(num, 10) + 1).padStart(4, "0");
  return `${prefix}-${nextNum}`;
} */

// ✅ Get last student & generate next reg no
const getLastRegisteredStudent = async (req, res, next) => {
  try {
    const { schoolId, academicYearId } = req.query;

    if (!schoolId || !academicYearId) {
      throw new ApiError(400, "schoolId and academicYearId are required");
    }

    // 🔹 Get last student (optional)
    const lastStudent = await Student.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      academicYearId: new mongoose.Types.ObjectId(academicYearId),
    })
      .sort({ createdAt: -1 })
      .select("registrationNumber studentName");

    // 🔹 Generate next registration number
    const nextRegNo = await generateNextRegNumber(schoolId, academicYearId);

    return res.json(
      new ApiResponse(200, {
        registrationNumber: nextRegNo,
        lastStudent: lastStudent
          ? {
              name: lastStudent.studentName,
              registrationNumber: lastStudent.registrationNumber,
            }
          : null,
      })
    );
  } catch (err) {
    next(err);
  }
};

export {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
};
