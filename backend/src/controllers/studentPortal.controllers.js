import mongoose from "mongoose";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Assignment } from "../models/AssignmentsAndHomework.model.js";
import { AssignmentSubmission } from "../models/AssignmentSubmission.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { HostelRoom } from "../models/HostelRoom.model.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { StudentTimetable } from "../models/StudentTimetable.model.js";
import { StudentTransportAssignment } from "../models/StudentTransportAssignment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    .populate({ path: "userId", select: "name email phone", match: { isActive: true, isDeleted: { $ne: true } } })
    .populate({ path: "fatherId", select: "name email phone", match: { isActive: true, isDeleted: { $ne: true } } })
    .populate({ path: "motherId", select: "name email phone", match: { isActive: true, isDeleted: { $ne: true } } })
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
    User.findOne({ _id: req.user._id, isActive: true, isDeleted: { $ne: true } }),
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
    .populate({ path: "fatherId", select: "name email phone", match: { isActive: true, isDeleted: { $ne: true } } })
    .populate({ path: "motherId", select: "name email phone", match: { isActive: true, isDeleted: { $ne: true } } })
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
    .populate({ path: "teacherId", select: "name email", match: { isActive: true, isDeleted: { $ne: true } } })
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
export const getMyHomework = asyncHandler(async (req, res) => {
  const { enrollment, academicYear } = await getMyActiveEnrollment(req.user);

  const homework = await Assignment.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    schoolClassId: enrollment.schoolClassId,
    $or: [
      { sectionId: enrollment.sectionId },
      { sectionId: { $exists: false } },
      { sectionId: null },
    ],
  })
    .populate("subjectId", "name code")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    studentEnrollmentId: enrollment._id,
  })
    .select("assignmentId submittedAt attachments")
    .lean();

  const submissionMap = new Map(
    submissions.map((entry) => [String(entry.assignmentId), entry])
  );

  const homeworkWithSubmission = homework.map((item) => {
    const submission = submissionMap.get(String(item._id));

    return {
      ...item,
      submission: submission
        ? {
            submittedAt: submission.submittedAt,
            attachments: submission.attachments || [],
          }
        : null,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        enrollmentId: enrollment._id,
        homework: homeworkWithSubmission,
      },
      "Student homework fetched successfully"
    )
  );
});

export const getTeacherHomework = asyncHandler(async (req, res) => {
  const { academicYearId } = req.query;

  const filters = {
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
  };

  if (academicYearId) {
    filters.academicYearId = academicYearId;
  }

  const homework = await Assignment.find(filters)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const assignmentIds = homework.map((item) => item._id);
  const submissionCountsRaw = assignmentIds.length
    ? await AssignmentSubmission.aggregate([
        {
          $match: {
            schoolId: req.user.schoolId,
            assignmentId: { $in: assignmentIds },
          },
        },
        {
          $group: {
            _id: "$assignmentId",
            count: { $sum: 1 },
          },
        },
      ])
    : [];

  const submissionCountMap = new Map(
    submissionCountsRaw.map((item) => [String(item._id), item.count])
  );

  const data = homework.map((item) => ({
    ...item,
    submissionCount: submissionCountMap.get(String(item._id)) || 0,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Teacher homework fetched successfully"));
});

export const createTeacherHomework = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId, subjectId, title, description, dueDate, attachments = [] } =
    req.body;

  if (!academicYearId || !schoolClassId || !subjectId || !title || !description || !dueDate) {
    throw new ApiError(400, "academicYearId, schoolClassId, subjectId, title, description, dueDate are required");
  }

  const created = await Assignment.create({
    academicYearId,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
    schoolClassId,
    sectionId: sectionId || undefined,
    subjectId,
    title,
    description,
    dueDate: new Date(dueDate),
    attachments,
  });

  const assignment = await Assignment.findById(created._id)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  return res
    .status(201)
    .json(new ApiResponse(201, assignment, "Assignment created successfully"));
});

export const submitHomework = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { attachments = [], remarks = "" } = req.body || {};

  const { student, enrollment, academicYear } = await getMyActiveEnrollment(
    req.user
  );

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    schoolClassId: enrollment.schoolClassId,
    $or: [
      { sectionId: enrollment.sectionId },
      { sectionId: null },
      { sectionId: { $exists: false } },
    ],
  }).select("_id");

  if (!assignment) {
    throw new ApiError(404, "Homework not found for this student");
  }

  // body se aane wale attachments normalize karo
  const normalizedBodyAttachments = Array.isArray(attachments)
    ? attachments
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          name: item.name || "attachment",
          url: item.url || "",
          mimeType: item.mimeType || "",
          publicId: item.publicId || "",
        }))
        .filter((item) => item.url)
    : [];

  // file uploads handle karo
  const uploadedAttachments = [];
  const attachmentFiles = Array.isArray(req.files?.attachments)
    ? req.files.attachments
    : [];

  for (const file of attachmentFiles) {
    const uploaded = await uploadOnCloudinary(file.path);

    if (!uploaded?.secure_url && !uploaded?.url) {
      throw new ApiError(500, "Failed to upload one or more attachments");
    }

    uploadedAttachments.push({
      name:
        file.originalname ||
        uploaded.original_filename ||
        uploaded.display_name ||
        "attachment",
      url: uploaded.secure_url || uploaded.url,
      mimeType: file.mimetype || "",
      publicId: uploaded.public_id || "",
    });
  }

  const normalizedAttachments = [
    ...normalizedBodyAttachments,
    ...uploadedAttachments,
  ];

  const submission = await AssignmentSubmission.findOneAndUpdate(
    {
      assignmentId: assignment._id,
      studentEnrollmentId: enrollment._id,
    },
    {
      assignmentId: assignment._id,
      schoolId: req.user.schoolId,
      academicYearId: academicYear._id,
      studentId: student._id,
      studentEnrollmentId: enrollment._id,
      attachments: normalizedAttachments,
      remarks: typeof remarks === "string" ? remarks.trim() : "",
      submittedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Homework submitted successfully"));
});

export const getHomeworkSubmissions = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    schoolId: req.user.schoolId,
    ...(req.userRole?.name === "Teacher" ? { teacherId: req.user._id } : {}),
  }).select("_id");

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const submissions = await AssignmentSubmission.find({
    assignmentId,
    schoolId: req.user.schoolId,
  })
    .populate({
      path: "studentEnrollmentId",
      select: "registrationNumber",
      populate: [
        {
          path: "studentId",
          select: "userId",
          populate: { path: "userId", select: "name email" },
        },
        { path: "schoolClassId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    })
    .sort({ submittedAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Homework submissions fetched successfully"));
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

  const now = new Date();
  const booksWithFine = issuedBooks.map((book) => {
    let fineAmount = 0;
    if (book.status === "Overdue" && book.dueDate) {
      const overdueDays = Math.max(0, Math.ceil((now - new Date(book.dueDate)) / (1000 * 60 * 60 * 24)));
      fineAmount = overdueDays * (book.finePerDay || 2);
    }
    return { ...book, fineAmount };
  });

  return res.status(200).json(
    new ApiResponse(200, booksWithFine, "Student issued books fetched successfully")
  );
});

/* ── GET MY HOSTEL ALLOCATION ────────────────────────────────────────────── */
export const getMyHostel = asyncHandler(async (req, res) => {
  const room = await HostelRoom.findOne({
    schoolId: req.user.schoolId,
    "students.studentId": req.user._id,
  })
    .populate("academicYearId", "name")
    .lean();

  const hostel = room
    ? {
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        status: "occupied",
        academicYear: room.academicYearId || null,
        roommates: (room.students || [])
          .filter((s) => `${s.studentId}` !== `${req.user._id}`)
          .map((s) => s.name),
      }
    : null;

  return res.status(200).json(
    new ApiResponse(200, hostel, "Hostel details fetched successfully")
  );
});

/* ── UPDATE TEACHER HOMEWORK ─────────────────────────────────────────────── */
export const updateTeacherHomework = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, attachments, status } = req.body;

  const assignment = await Assignment.findOne({
    _id: id,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
  });

  if (!assignment) throw new ApiError(404, "Assignment not found");

  if (title)       assignment.title       = title;
  if (description) assignment.description = description;
  if (dueDate)     assignment.dueDate     = new Date(dueDate);
  if (attachments) assignment.attachments = attachments;
  if (status)      assignment.status      = status;
  assignment.updatedBy = req.user._id;

  await assignment.save();

  const updated = await Assignment.findById(assignment._id)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  return res.status(200).json(new ApiResponse(200, updated, "Assignment updated successfully"));
});

/* ── DELETE TEACHER HOMEWORK ─────────────────────────────────────────────── */
export const deleteTeacherHomework = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await Assignment.findOne({
    _id: id,
    schoolId: req.user.schoolId,
    teacherId: req.user._id,
  });

  if (!assignment) throw new ApiError(404, "Assignment not found");

  await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
  await assignment.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Assignment deleted successfully"));
});

/* ── GRADE A SUBMISSION ──────────────────────────────────────────────────── */
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  if (grade === undefined) throw new ApiError(400, "Grade is required");

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    schoolId: req.user.schoolId,
  });

  if (!submission) throw new ApiError(404, "Submission not found");

  const assignment = await Assignment.findOne({
    _id: submission.assignmentId,
    teacherId: req.user._id,
  });

  if (!assignment) throw new ApiError(403, "Not authorized to grade this submission");

  submission.grade     = Number(grade);
  submission.feedback  = feedback?.trim() || "";
  submission.gradedBy  = req.user._id;
  submission.gradedAt  = new Date();
  await submission.save();

  return res.status(200).json(new ApiResponse(200, submission, "Submission graded successfully"));
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PARENT CHILD ENDPOINTS                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const getChildEnrollment = async (childUserId, schoolId) => {
  const student = await Student.findOne({ userId: childUserId }).select("_id");
  if (!student) throw new ApiError(404, "Child student profile not found");

  const activeYear = await AcademicYear.findOne({ schoolId, isActive: true }).select("_id name");

  let enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    schoolId,
    ...(activeYear ? { academicYearId: activeYear._id } : {}),
  })
    .select("_id schoolClassId sectionId registrationNumber academicYearId")
    .sort({ createdAt: -1 });

  if (!enrollment) {
    enrollment = await StudentEnrollment.findOne({ studentId: student._id, schoolId })
      .select("_id schoolClassId sectionId registrationNumber academicYearId")
      .sort({ createdAt: -1 });
  }

  if (!enrollment) throw new ApiError(404, "Child enrollment not found");

  const academicYear =
    activeYear ||
    (await AcademicYear.findById(enrollment.academicYearId).select("_id name"));

  return { student, enrollment, academicYear };
};

const verifyParentChild = async (parentId, childUserId) => {
  const child = await Student.findOne({
    userId: childUserId,
    $or: [{ fatherId: parentId }, { motherId: parentId }, { guardianId: parentId }],
  }).select("_id");
  if (!child) throw new ApiError(403, "You are not authorized to access this child's data");
  return child;
};

export const getChildHomework = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  await verifyParentChild(req.user._id, childId);
  const { enrollment, academicYear } = await getChildEnrollment(childId, req.user.schoolId);

  const homework = await Assignment.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    schoolClassId: enrollment.schoolClassId,
    $or: [
      { sectionId: enrollment.sectionId },
      { sectionId: { $exists: false } },
      { sectionId: null },
    ],
  })
    .populate("subjectId", "name code")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const submissions = await AssignmentSubmission.find({
    schoolId: req.user.schoolId,
    academicYearId: academicYear._id,
    studentEnrollmentId: enrollment._id,
  })
    .select("assignmentId submittedAt grade feedback")
    .lean();

  const submissionMap = new Map(submissions.map((s) => [String(s.assignmentId), s]));

  const result = homework.map((item) => {
    const submission = submissionMap.get(String(item._id));
    return { ...item, submission: submission || null };
  });

  return res.status(200).json(
    new ApiResponse(200, { enrollmentId: enrollment._id, homework: result }, "Child homework fetched")
  );
});

export const getChildTransport = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  await verifyParentChild(req.user._id, childId);
  const { enrollment, academicYear } = await getChildEnrollment(childId, req.user.schoolId);

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
    new ApiResponse(200, { enrollmentId: enrollment._id, assignment }, "Child transport fetched")
  );
});

export const getChildHostel = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  await verifyParentChild(req.user._id, childId);

  const room = await HostelRoom.findOne({
    schoolId: req.user.schoolId,
    "students.studentId": childId,
  })
    .populate("academicYearId", "name")
    .lean();

  const hostel = room
    ? {
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        status: "occupied",
        academicYear: room.academicYearId || null,
        roommates: (room.students || [])
          .filter((s) => `${s.studentId}` !== `${childId}`)
          .map((s) => s.name),
      }
    : null;

  return res.status(200).json(
    new ApiResponse(200, hostel, "Child hostel details fetched")
  );
});

export const getChildLibrary = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  await verifyParentChild(req.user._id, childId);
  const { student } = await getChildEnrollment(childId, req.user.schoolId);

  const issuedBooks = await IssuedBook.find({
    studentId: student._id,
    schoolId: req.user.schoolId,
  })
    .populate("bookId", "title author isbn")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const now = new Date();
  const booksWithFine = issuedBooks.map((book) => {
    let fineAmount = 0;
    if (book.status === "Overdue" && book.dueDate) {
      const overdueDays = Math.max(0, Math.ceil((now - new Date(book.dueDate)) / (1000 * 60 * 60 * 24)));
      fineAmount = overdueDays * (book.finePerDay || 2);
    }
    return { ...book, fineAmount };
  });

  return res.status(200).json(
    new ApiResponse(200, booksWithFine, "Child library books fetched")
  );
});
