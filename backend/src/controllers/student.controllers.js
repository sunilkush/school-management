import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";
import { generateNextRegNumber } from "../utils/generateRegNumber.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Section } from "../models/section.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
/* ================= ROLE FETCH ================= */
const getRoleByName = async (name, schoolId, session) => {
  return await Role.findOne({
    name, // ✅ name se match
    $or: [{ schoolId }, { schoolId: null }], // school specific + global
    isActive: true,
  }).session(session);
};

/* ================= CREATE STUDENT ================= */
const createStudentAdmission = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentData,
      fatherData,
      motherData,
      schoolId,
      academicYearId,
      schoolClassId,
      sectionId,
    } = req.body;
    console.log(req.body);
    /* 🔐 VALIDATION */
    if (!studentData?.name || !studentData?.email) {
      throw new ApiError(400, "Student name & email required");
    }

    if (!schoolId || !academicYearId || !schoolClassId || !sectionId) {
      throw new ApiError(400, "School, class, section required");
    }

    /* 🔑 PASSWORD */
    const generatePassword = () => crypto.randomBytes(6).toString("hex");

    /* 🎯 ROLE AUTO PICK */

    const studentRole = await getRoleByName("Student", schoolId, session);
    const parentRole = await getRoleByName("Parent", schoolId, session);

    if (!studentRole || !parentRole) {
      throw new ApiError(500, "Roles not configured properly");
    }

    /* 👤 STUDENT USER */
    const studentPassword = generatePassword();
    const studentUser = (
      await User.create(
        [
          {
            name: studentData.name,
            email: studentData.email,
            password: "784512",
            roleId: studentRole._id,
            schoolId,
            isEmailVerified: true,
          },
        ],
        { session }
      )
    )[0];

    /* 👨 FATHER */
    let fatherUser = null;
    let fatherPassword = null;

    if (fatherData?.email) {
      fatherUser = await User.findOne({
        email: fatherData.email,
        schoolId,
      }).session(session);

      if (!fatherUser) {
        fatherPassword = generatePassword();
        fatherUser = (
          await User.create(
            [
              {
                name: fatherData.name,
                email: fatherData.email,
                password: "784512",
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              },
            ],
            { session }
          )
        )[0];
      }
    }

    /* 👩 MOTHER */
    let motherUser = null;
    let motherPassword = null;

    if (motherData?.email) {
      motherUser = await User.findOne({
        email: motherData.email,
        schoolId,
      }).session(session);

      if (!motherUser) {
        motherPassword = generatePassword();
        motherUser = (
          await User.create(
            [
              {
                name: motherData.name,
                email: motherData.email,
                password: motherPassword,
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              },
            ],
            { session }
          )
        )[0];
      }
    }

    /* 🎓 STUDENT PROFILE */
    const student = (
      await Student.create(
        [
          {
            userId: studentUser._id,
            fatherId: fatherUser?._id || null,
            motherId: motherUser?._id || null,

            dateOfBirth: studentData.dateOfBirth,
            gender: studentData.gender,
            address: studentData.address,
            bloodGroup: studentData.bloodGroup,

            fatherInfo: fatherData,
            motherInfo: motherData,
          },
        ],
        { session }
      )
    )[0];

    /* 📚 REGISTRATION NUMBER */
    const lastEnrollment = await StudentEnrollment.findOne({
      schoolId,
      academicYearId,
    })
      .sort({ createdAt: -1 })
      .session(session);

    const academicYear = await AcademicYear.findById(academicYearId).session(
      session
    );

    const nextRegNo = generateNextRegNumber(
      lastEnrollment?.registrationNumber,
      {
        prefix: "REG",
        year: academicYear?.code || new Date().getFullYear(),
        digits: 4,
      }
    );

    /* 📚 ENROLLMENT */
    const enrollment = (
      await StudentEnrollment.create(
        [
          {
            studentId: student._id,
            schoolId,
            academicYearId,
            schoolClassId,
            sectionId,
            registrationNumber: nextRegNo,
            mobileNumber:
              fatherData?.mobile || motherData?.mobile || null,
          },
        ],
        { session }
      )
    )[0];
    
    // ✅ Save student enrollment reference inside selected section
    const updatedSection = await Section.findOneAndUpdate(
      {
        _id: sectionId,
        schoolId,
        schoolClassId,
      },
      {
        $addToSet: { StudentEnrollmentId: enrollment._id },
      },
      { new: true, session }
    );

    if (!updatedSection) {
      throw new ApiError(404, "Section not found for selected class");
    }


    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          student,
          studentUser,
          father: fatherUser,
          mother: motherUser,
          enrollment,
          credentials: {
            student: {
              userId: studentUser._id,
              loginId: studentUser.email,
              password: studentPassword,
              isNew: true,
            },
            father: fatherUser
              ? {
                  userId: fatherUser._id,
                  loginId: fatherUser.email,
                  password: fatherPassword,
                  isNew: Boolean(fatherPassword),
                }
              : null,
            mother: motherUser
              ? {
                  userId: motherUser._id,
                  loginId: motherUser.email,
                  password: motherPassword,
                  isNew: Boolean(motherPassword),
                }
              : null,
          },
        },
        "Student admission successful"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
// ✅ Get Students (with aggregation)
const getStudents = asyncHandler(async (req, res) => {
  const user = req.user;
  const { schoolClassId, page = 1, limit = 10 } = req.query;
  const academicYearId = req.academicYearId;
  console.log(user)
  // 🔹 Common validation
  if (!academicYearId) {
    throw new ApiError(400, "Academic year is required!");
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const match = { academicYearId: new mongoose.Types.ObjectId(academicYearId) };

  if (user?.role?.name === "Super Admin") {
    // no filter
  } else if (user?.role?.name === "School Admin") {
    if (!user.schoolId) {
      throw new ApiError(400, "School ID not found");
    }
    match.schoolId = new mongoose.Types.ObjectId(user.schoolId);
  } else {
    throw new ApiError(403, "Access denied");
  }

  if (schoolClassId) {
    match.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
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
        localField: "schoolClassId",
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
  const { id } = req.params;

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  // ✅ Student can access ONLY his own profile
  const student = await Student.findOne({
    userId: req.user._id,
  }).populate("userId", "-password -refreshToken")
    .populate("fatherId", "name email")
    .populate("motherId", "name email");

  
  if (!student) {
    throw new ApiError(403, "You are not authorized to view this student");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student fetched successfully"));
});


// ✅ Update Student
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    registrationNumber,
    schoolClassId,
    sectionId,
    schoolId,
    academicYearId,
    admissionDate,
    feeDiscount,
    smsMobile,
    mobileNumber,
    status,
    otherInfo = {},
    fatherInfo = {},
    motherInfo = {},
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ===========================
       🎓 STUDENT FIND
    ============================ */
    const student = await Student.findById(id).session(session);

    if (!student) {
      throw new ApiError(404, "Student not found!");
    }

    /* ===========================
       📚 ENROLLMENT FIND
    ============================ */
    const enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      ...(academicYearId && { academicYearId }),
    }).session(session);

    if (!enrollment) {
      throw new ApiError(404, "Enrollment not found!");
    }

    /* ===========================
       🧠 UPDATE STUDENT (DIRECT FIELDS)
    ============================ */
    const validStudentFields = [
      "dateOfBirth",
      "gender",
      "religion",
      "cast",
      "bloodGroup",
      "address",
      "identificationMark",
      "family",
      "disease",
      "notes",
      "siblings",
      "previousSchool",
      "orphan",
    ];

    for (const field of validStudentFields) {
      if (otherInfo[field] !== undefined) {
        student[field] = otherInfo[field];
      }
    }

    /* ===========================
       👨 FATHER INFO UPDATE
    ============================ */
    if (fatherInfo && typeof fatherInfo === "object") {
      student.fatherInfo = {
        ...student.fatherInfo,
        ...fatherInfo,
      };
    }

    /* ===========================
       👩 MOTHER INFO UPDATE
    ============================ */
    if (motherInfo && typeof motherInfo === "object") {
      student.motherInfo = {
        ...student.motherInfo,
        ...motherInfo,
      };
    }

    await student.save({ session });

    /* ===========================
       📚 UPDATE ENROLLMENT
    ============================ */
    if (registrationNumber) {
      enrollment.registrationNumber = registrationNumber;
    }

    if (schoolClassId) {
      enrollment.schoolClassId = schoolClassId;
    }

    if (sectionId) {
      enrollment.sectionId = sectionId;
    }

    if (schoolId) {
      enrollment.schoolId = schoolId;
    }

    if (admissionDate) {
      enrollment.admissionDate = admissionDate;
    }

    if (feeDiscount !== undefined) {
      enrollment.feeDiscount = feeDiscount;
    }

    if (smsMobile) {
      enrollment.smsMobile = smsMobile;
    }

    if (mobileNumber) {
      enrollment.mobileNumber = mobileNumber;
    }

    if (status) {
      enrollment.status = status;
    }

    await enrollment.save({ session });

    /* ===========================
       ✅ COMMIT
    ============================ */
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          student,
          enrollment,
          credentials: {
            student: {
              userId: studentUser._id,
              loginId: studentUser.email,
              password: studentPassword,
              isNew: true,
            },
            father: fatherUser
              ? {
                  userId: fatherUser._id,
                  loginId: fatherUser.email,
                  password: fatherPassword,
                  isNew: Boolean(fatherPassword),
                }
              : null,
            mother: motherUser
              ? {
                  userId: motherUser._id,
                  loginId: motherUser.email,
                  password: motherPassword,
                  isNew: Boolean(motherPassword),
                }
              : null,
          },
        },
        "Student updated successfully!"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
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

// ✅ Get last student & generate next reg no
const getLastRegisteredStudent = asyncHandler(async (req, res) => {
  debugger;
  const { schoolId, academicYearId } = req.query;

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
  let { schoolId, academicYearId, page = 1, limit = 10 } = req.query;

  // ✅ Validate schoolId
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Valid schoolId is required");
  }

  schoolId = new mongoose.Types.ObjectId(schoolId);

  // ✅ Get Active Academic Year if not provided
  if (!academicYearId) {
    const activeYear = await AcademicYear.findOne({
      schoolId,
      isActive: true,
    }).lean();

    if (!activeYear) {
      throw new ApiError(404, "No active academic year found");
    }

    academicYearId = activeYear._id;
  }

  if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId format");
  }

  academicYearId = new mongoose.Types.ObjectId(academicYearId);

  // ✅ Pagination
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (page - 1) * limit;

  const result = await StudentEnrollment.aggregate([
    {
      $match: { schoolId, academicYearId },
    },

    {
      $facet: {
        data: [
          /* 🔥 SCHOOL */
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "_id",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },

          /* 🔥 ACADEMIC YEAR */
          {
            $lookup: {
              from: "academicyears",
              localField: "academicYearId",
              foreignField: "_id",
              as: "academicYear",
            },
          },
          {
            $unwind: {
              path: "$academicYear",
              preserveNullAndEmptyArrays: true,
            },
          },

          /* STUDENT */
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

          /* USER */
          {
            $lookup: {
              from: "users",
              localField: "student.userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          /* FILTER USERS */
          {
            $match: {
              $or: [
                { "userDetails.isDeleted": false },
                { userDetails: null },
              ],
            },
          },

          /* CLASS */
          {
            $lookup: {
              from: "schoolclasses",
              localField: "schoolClassId",
              foreignField: "_id",
              as: "class",
            },
          },
          {
            $unwind: {
              path: "$class",
              preserveNullAndEmptyArrays: true,
            },
          },

          /* SECTION */
          {
            $lookup: {
              from: "sections",
              localField: "sectionId",
              foreignField: "_id",
              as: "section",
            },
          },
          {
            $unwind: {
              path: "$section",
              preserveNullAndEmptyArrays: true,
            },
          },

          /* SORT */
          { $sort: { createdAt: -1 } },

          /* PAGINATION */
          { $skip: skip },
          { $limit: limit },

          /* FINAL RESPONSE */
          {
            $project: {
              _id: 1,
              registrationNumber: 1,
              admissionDate: 1,
              mobileNumber: 1,
              feeDiscount: 1,
              status: 1,

              school: {
                _id: "$school._id",
                name: "$school.name",
              },

              academicYear: {
                _id: "$academicYear._id",
                name: "$academicYear.name",
                isActive: "$academicYear.isActive",
              },

              student: {
                _id: "$student._id",
                dateOfBirth: "$student.dateOfBirth",
                gender: "$student.gender",
                religion: "$student.religion",
                cast: "$student.cast",
                bloodGroup: "$student.bloodGroup",
                address: "$student.address",
                identificationMark: "$student.identificationMark",
                fatherInfo: "$student.fatherInfo",
                motherInfo: "$student.motherInfo",
              },

              user: {
                _id: "$userDetails._id",
                name: "$userDetails.name",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar",
                isActive: "$userDetails.isActive",
              },

              class: {
                _id: "$class._id",
                name: "$class.name",
              },

              section: {
                _id: "$section._id",
                name: "$section.name",
              },
            },
          },
        ],

        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const students = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Students Retrieved Successfully"
    )
  );
});

const getMyStudentEnrollmentId = asyncHandler(async (req, res) => {
  // 🔐 Step 1: Find student
  const student = await Student.findOne({ userId: req.user._id }).select("_id");

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  // 🔐 Step 2: Active academic year
  const academicYear = await AcademicYear.findOne({
    schoolId: req.user.schoolId,
    isActive: true,
  }).select("_id");

  if (!academicYear) {
    throw new ApiError(404, "Active academic year not found");
  }

  // 🔐 Step 3: Enrollment
  const enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
  })
    .select("_id registrationNumber schoolClassId sectionId academicYearId")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("academicYearId", "name"); // ✅ already populated

  if (!enrollment) {
    throw new ApiError(404, "Student enrollment not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        studentId: student._id,
        enrollmentId: enrollment._id,
        registrationNumber: enrollment.registrationNumber,

        schoolClass: enrollment.schoolClassId, // { _id, name }
        section: enrollment.sectionId,         // { _id, name }

        academicYear: enrollment.academicYearId, // ✅ FIXED (name bhi aayega)
      },
      "Student enrollment fetched successfully"
    )
  );
});

const getMyChildren = asyncHandler(async (req, res) => {
  const parentId = req.user?._id;
  const schoolId = req.user?.schoolId;

  const children = await Student.aggregate([
    {
      $match: {
        $or: [
          { fatherId: new mongoose.Types.ObjectId(parentId) },
          { motherId: new mongoose.Types.ObjectId(parentId) },
          { guardianId: new mongoose.Types.ObjectId(parentId) },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "studentenrollments",
        let: { studentRef: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$studentId", "$$studentRef"] },
              schoolId: new mongoose.Types.ObjectId(schoolId),
              status: "Active",
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "enrollment",
      },
    },
    { $unwind: { path: "$enrollment", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "classes",
        localField: "enrollment.schoolClassId",
        foreignField: "_id",
        as: "schoolClass",
      },
    },
    { $unwind: { path: "$schoolClass", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "sections",
        localField: "enrollment.sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        gender: 1,
        dateOfBirth: 1,
        bloodGroup: 1,
        enrollmentId: "$enrollment._id",
        registrationNumber: "$enrollment.registrationNumber",
        classId: "$schoolClass._id",
        className: "$schoolClass.name",
        sectionId: "$section._id",
        sectionName: "$section.name",
      },
    },
    { $sort: { name: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, children, "Parent children fetched successfully"));
});

export {
  createStudentAdmission,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
  getStudentsBySchoolId,
  getMyStudentEnrollmentId,
  getMyChildren,
};
