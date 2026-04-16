import mongoose from "mongoose";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { StudentTimetable } from "../models/StudentTimetable.model.js";
import { StudentTransportAssignment } from "../models/StudentTransportAssignment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMyActiveEnrollment = async (user) => {
  const student = await Student.findOne({ userId: user._id }).select("_id");
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const activeAcademicYear = await AcademicYear.findOne({
    schoolId: user.schoolId,
    isActive: true,
  }).select("_id name");

  let enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    schoolId: user.schoolId,
    ...(activeAcademicYear ? { academicYearId: activeAcademicYear._id } : {}),
  })
    .select("_id schoolClassId sectionId registrationNumber academicYearId")
    .sort({ createdAt: -1 });

  // Fallback: active year set nahi hai, ya active year me enrollment missing hai.
  if (!enrollment) {
    enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      schoolId: user.schoolId,
    })
      .select("_id schoolClassId sectionId registrationNumber academicYearId")
      .sort({ createdAt: -1 });
  }

  if (!enrollment) {
    throw new ApiError(404, "Student enrollment not found");
  }

  const academicYear =
    activeAcademicYear ||
    (await AcademicYear.findById(enrollment.academicYearId).select("_id name"));

  if (!academicYear) {
    throw new ApiError(404, "Academic year not found for student enrollment");
  }

  return { student, academicYear, enrollment };
};

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id })
    .populate("fatherId", "name email phone")
    .populate("motherId", "name email phone")
    .lean();

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student profile fetched successfully"));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    fatherInfo = {},
    motherInfo = {},
  } = req.body;

  if (!safeText(name) || !safeText(email)) {
    throw new ApiError(400, "Name and email are required");
  }

  const [user, student] = await Promise.all([
    User.findById(req.user._id),
    Student.findOne({ userId: req.user._id }),
  ]);

  if (!user || !student) {
    throw new ApiError(404, "Student profile not found");
  }

  user.name = safeText(name);
  user.email = safeText(email).toLowerCase();
  user.phone = safeText(phone);
  await user.save();

  if (dateOfBirth) student.dateOfBirth = new Date(dateOfBirth);
  if (gender) student.gender = safeText(gender);
  if (bloodGroup !== undefined) student.bloodGroup = safeText(bloodGroup);
  if (address !== undefined) student.address = safeText(address);

  student.fatherInfo = {
    ...student.fatherInfo,
    name: safeText(fatherInfo.name),
    mobile: safeText(fatherInfo.mobile),
    email: safeText(fatherInfo.email).toLowerCase(),
  };
  student.motherInfo = {
    ...student.motherInfo,
    name: safeText(motherInfo.name),
    mobile: safeText(motherInfo.mobile),
    email: safeText(motherInfo.email).toLowerCase(),
  };

  await student.save();

  const updatedProfile = await Student.findById(student._id)
    .populate("fatherId", "name email phone")
    .populate("motherId", "name email phone")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProfile, "Student profile updated successfully"));
});

export const getMyGrades = asyncHandler(async (req, res) => {
  const { student, academicYear } = await getMyActiveEnrollment(req.user);

  const grades = await ExamResult.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    studentId: req.user._id,
    isPublished: true,
  })
    .populate("examId", "title examDate")
    .populate("subjects.subjectId", "name")
    .sort({ examDate: -1, createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        studentId: student._id,
        academicYear,
        grades,
      },
      "Student grades fetched successfully"
    )
  );
});

export const getMyTimetable = asyncHandler(async (req, res) => {
  const { enrollment, academicYear } = await getMyActiveEnrollment(req.user);

  const timetable = await StudentTimetable.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    schoolClassId: enrollment.schoolClassId,
    sectionId: enrollment.sectionId,
    isActive: true,
  })
    .populate("subjectId", "name code")
    .populate("teacherId", "name email")
    .sort({ day: 1, startTime: 1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        enrollmentId: enrollment._id,
        timetable,
      },
      "Student timetable fetched successfully"
    )
  );
});

export const createTimetableEntry = asyncHandler(async (req, res) => {
  const {
    academicYearId,
    schoolClassId,
    sectionId,
    subjectId,
    teacherId,
    day,
    startTime,
    endTime,
    room,
  } = req.body;

  if (!academicYearId || !schoolClassId || !sectionId || !subjectId || !day || !startTime || !endTime) {
    throw new ApiError(400, "Missing required timetable fields");
  }

  const payload = {
    schoolId: req.user.schoolId,
    academicYearId,
    schoolClassId,
    sectionId,
    subjectId,
    day,
    startTime,
    endTime,
    room,
  };

  if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
    payload.teacherId = teacherId;
  }

  const entry = await StudentTimetable.create(payload);

  return res
    .status(201)
    .json(new ApiResponse(201, entry, "Timetable entry created successfully"));
});

export const getMyTransport = asyncHandler(async (req, res) => {
  const { enrollment, academicYear } = await getMyActiveEnrollment(req.user);

  const assignment = await StudentTransportAssignment.findOne({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    studentEnrollmentId: enrollment._id,
    isActive: true,
  })
    .populate("routeId")
    .populate("vehicleId")
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        enrollmentId: enrollment._id,
        assignment,
      },
      "Student transport details fetched successfully"
    )
  );
});

export const assignStudentTransport = asyncHandler(async (req, res) => {
  const { studentEnrollmentId, academicYearId, routeId, vehicleId, pickupStop, dropStop } = req.body;

  if (!studentEnrollmentId || !academicYearId || !routeId || !vehicleId) {
    throw new ApiError(400, "studentEnrollmentId, academicYearId, routeId and vehicleId are required");
  }

  const assignment = await StudentTransportAssignment.findOneAndUpdate(
    {
      studentEnrollmentId,
      academicYearId,
      schoolId: req.user.schoolId,
    },
    {
      studentEnrollmentId,
      academicYearId,
      schoolId: req.user.schoolId,
      routeId,
      vehicleId,
      pickupStop: pickupStop || "",
      dropStop: dropStop || "",
      isActive: true,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Student transport assigned successfully"));
});

export const getMyLibraryBooks = asyncHandler(async (req, res) => {
  const { student } = await getMyActiveEnrollment(req.user);

  const issuedBooks = await IssuedBook.find({
    studentId: student._id,
    schoolId: req.user.schoolId,
    status: { $in: ["Issued", "Overdue"] },
  })
    .populate("bookId", "title author isbn")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, issuedBooks, "Student issued books fetched successfully")
  );
});
