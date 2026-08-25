import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Exam } from "../models/Exam.model.js";
import { ExamClass } from "../models/ExamClass.model.js";
import { Marks } from "../models/Marks.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ExamAttempt } from "../models/ExamAttempts.model.js";
import { getGradeBands, resolveGrade } from "./gradingScale.service.js";

const OBJECT_ID = mongoose.Types.ObjectId;
const getActiveEnrollmentForStudentUser = async ({ userId, academicYearId }) => {
  const student = await Student.findOne({ userId }).select("_id").lean();
  if (!student) return null;

  const enrollmentQuery = { studentId: student._id, status: "Active" };
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    enrollmentQuery.academicYearId = academicYearId;
  }

  return StudentEnrollment.findOne(enrollmentQuery)
    .sort({ createdAt: -1 })
    .select("schoolId academicYearId schoolClassId sectionId")
    .lean();
};

const getParentChildEnrollment = async ({ parentId, studentUserId, academicYearId }) => {
  const childQuery = {
    $or: [{ fatherId: parentId }, { motherId: parentId }, { guardianId: parentId }],
  };
  if (studentUserId && mongoose.Types.ObjectId.isValid(studentUserId)) {
    childQuery.userId = studentUserId;
  }

  const child = await Student.findOne(childQuery).select("_id userId").lean();
  if (!child) return null;

  const enrollmentQuery = { studentId: child._id, status: "Active" };
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    enrollmentQuery.academicYearId = academicYearId;
  }

  return StudentEnrollment.findOne(enrollmentQuery)
    .sort({ createdAt: -1 })
    .select("schoolId academicYearId schoolClassId sectionId")
    .lean();
};

const normalizeExamPayload = (payload = {}) => ({
  ...payload,
  title: payload.name || payload.title,
  examCode: payload.examCode ? String(payload.examCode).trim().toUpperCase() : undefined,
  totalMarks: payload.totalMarks !== undefined ? Number(payload.totalMarks) : payload.totalMarks,
  passingMarks: payload.passingMarks !== undefined ? Number(payload.passingMarks) : payload.passingMarks,
  durationMinutes:
    payload.durationMinutes !== undefined ? Number(payload.durationMinutes) : payload.durationMinutes,
  settings: {
    negativeMarking: Number(payload?.settings?.negativeMarking || 0),
    allowPartialScoring: Boolean(payload?.settings?.allowPartialScoring || false),
    maxAttempts: Math.max(Number(payload?.settings?.maxAttempts || 1), 1),
  },
});

const validateExamPayload = (payload) => {
  if (!payload.title || !payload.schoolClassId || !payload.subjectId || !payload.examDate) {
    throw new ApiError(400, "name/title, schoolClassId, subjectId and examDate are required");
  }

  if (!payload.totalMarks || payload.passingMarks === undefined) {
    throw new ApiError(400, "totalMarks and passingMarks are required");
  }

  if (!payload.startTime || !payload.endTime || !payload.durationMinutes) {
    throw new ApiError(400, "startTime, endTime and durationMinutes are required");
  }

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(400, "Invalid startTime or endTime");
  }
  if (endTime <= startTime) {
    throw new ApiError(400, "End time must be after start time");
  }

  if (Number(payload.passingMarks) > Number(payload.totalMarks)) {
    throw new ApiError(400, "Passing marks cannot exceed total marks");
  }
};

const resolveScope = async ({ user, studentId }) => {
  if (user?.roleId?.name === "Student") {
    return { studentId: user._id };
  }

  if (user?.roleId?.name === "Parent") {
    const query = { $or: [{ fatherId: user._id }, { motherId: user._id }, { guardianId: user._id }] };
    if (studentId) query.userId = new OBJECT_ID(studentId);

    const child = await Student.findOne(query)
      .populate({ path: "userId", select: "schoolId" })
      .select("userId")
      .lean();
    if (!child) throw new ApiError(404, "Child not found for this parent");
    if (`${child.userId?.schoolId}` !== `${user.schoolId}`) {
      throw new ApiError(403, "Forbidden to access child outside your school");
    }
    return { studentId: child.userId?._id || child.userId };
  }

  // Staff roles (Teacher, School Admin, Principal, Exam Coordinator, ...) reach here with an
  // arbitrary :studentId from the route param. Without pinning schoolId too, any staff member
  // in ANY school could pull another school's student's exam results just by knowing/guessing
  // their user id — ExamResult always carries its own schoolId, so scoping by it here is enough
  // to keep this staff-only branch tenant-safe (Super Admin is intentionally left unscoped).
  if (!studentId) throw new ApiError(400, "studentId is required");
  const scope = { studentId: new OBJECT_ID(studentId) };
  if (user?.roleId?.name !== "Super Admin") {
    scope.schoolId = user?.schoolId?._id || user?.schoolId;
  }
  return scope;
};

export const createExamService = async ({ body, user }) => {
  const generatedCode = body.examCode || `EX-${Date.now().toString().slice(-8)}`;
  const payload = normalizeExamPayload({
    ...body,
    examCode: generatedCode,
    createdBy: user._id,
    schoolId: user.roleId?.name === "Super Admin" ? body.schoolId : user.schoolId,
  });

  validateExamPayload(payload);

  const duplicateExam = await Exam.findOne({
    schoolId: payload.schoolId,
    academicYearId: payload.academicYearId,
    schoolClassId: payload.schoolClassId,
    subjectId: payload.subjectId,
    examDate: new Date(payload.examDate),
    title: payload.title,
  })
    .select("_id")
    .lean();

  if (duplicateExam) {
    throw new ApiError(409, "An exam with the same title, class, subject, and examDate already exists");
  }

  const exam = await Exam.create(payload);
 
  return exam;
};

export const getExamsService = async ({ query, user }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filters = {};
  if (user.roleId?.name !== "Super Admin") filters.schoolId = user.schoolId;
  if (query.schoolId && user.roleId?.name === "Super Admin") filters.schoolId = query.schoolId;
  if (query.academicYearId) filters.academicYearId = query.academicYearId;
  if (query.schoolClassId) filters.schoolClassId = query.schoolClassId;
  if (query.sectionId) filters.sectionId = query.sectionId;
  if (query.subjectId) filters.subjectId = query.subjectId;
  if (query.status) filters.status = query.status;

  if (query.search) {
    const searchTerm = query.search.trim();
    filters.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { examCode: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (user.roleId?.name === "Student") {
    const enrollment = await getActiveEnrollmentForStudentUser({
      userId: user._id,
      academicYearId: query.academicYearId,
    });

    filters.status = "published";
    if (enrollment) {
      filters.schoolId = enrollment.schoolId;
      filters.academicYearId = enrollment.academicYearId;
      filters.schoolClassId = enrollment.schoolClassId;
      filters.$or = [
        { sectionId: enrollment.sectionId },
        { sectionId: null },
        { sectionId: { $exists: false } },
      ];
    } else {
      filters._id = { $exists: false };
    }
  }

  if (user.roleId?.name === "Parent") {
    const enrollment = await getParentChildEnrollment({
      parentId: user._id,
      studentUserId: query.studentId,
      academicYearId: query.academicYearId,
    });

    filters.status = "published";
    if (enrollment) {
      filters.schoolId = enrollment.schoolId;
      filters.academicYearId = enrollment.academicYearId;
      filters.schoolClassId = enrollment.schoolClassId;
      filters.$or = [
        { sectionId: enrollment.sectionId },
        { sectionId: null },
        { sectionId: { $exists: false } },
      ];
    } else {
      filters._id = { $exists: false };
    }
  }

  const sortField = ["examDate", "totalMarks", "createdAt"].includes(query.sortBy)
    ? query.sortBy
    : "examDate";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [total, exams] = await Promise.all([
    Exam.countDocuments(filters),
    Exam.find(filters)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name")
      .lean(),
  ]);

  return {
    exams,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const assignExamToClassService = async ({ body, user }) => {
  const exam = await Exam.findById(body.examId).select("schoolId totalMarks passingMarks").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  const assignment = await ExamClass.findOneAndUpdate(
    { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    {
      $set: {
        schoolId: exam.schoolId,
        totalMarks: body.totalMarks ?? exam.totalMarks,
        passingMarks: body.passingMarks ?? exam.passingMarks,
      },
      $setOnInsert: { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    },
    { new: true, upsert: true }
  ).lean();

  return assignment;
};

export const enterMarksBulkService = async ({ body, user }) => {
  const { examId, marks = [] } = body;

  if (!examId || !Array.isArray(marks) || !marks.length) {
    throw new ApiError(400, "examId and non-empty marks array are required");
  }

  // 1. Get Exam
  const exam = await Exam.findById(examId)
    .select("schoolId academicYearId subjectId schoolClassId sectionId")
    .lean();

  if (!exam) throw new ApiError(404, "Exam not found");

  // 2. School Permission Check
  if (
    user.roleId?.name !== "Super Admin" &&
    `${exam.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  // 3. Get student identifiers from payload (can be either User._id or Student._id)
  const studentIdentifiers = [
    ...new Set(marks.map((entry) => `${entry.studentId}`)),
  ];

  // 4. Resolve identifiers to both Student._id and User._id
  const students = await Student.find({
    $or: [
      { userId: { $in: studentIdentifiers } },
      { _id: { $in: studentIdentifiers } },
    ],
  })
    .select("_id userId")
    .lean();

  const identifierToStudent = new Map();
  for (const row of students) {
    identifierToStudent.set(`${row._id}`, {
      studentDocId: `${row._id}`,
      userId: `${row.userId}`,
    });
    identifierToStudent.set(`${row.userId}`, {
      studentDocId: `${row._id}`,
      userId: `${row.userId}`,
    });
  }

  const studentObjectIds = students.map((row) => row._id);

  // 5. Check enrollment
  const enrollments = await StudentEnrollment.find({
    studentId: { $in: studentObjectIds },
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    schoolClassId: exam.schoolClassId,
    ...(exam.sectionId ? { sectionId: exam.sectionId } : {}),
    status: "Active",
  })
    .select("studentId")
    .lean();

  const allowedStudentIds = new Set(
    enrollments.map((row) => `${row.studentId}`)
  );

  // 5b. Block re-entry over marks already finalized — the single-mark PATCH endpoint
  // (updateMarksService) already refuses to edit a mark once isFinalSubmitted, but this bulk
  // upload had no equivalent check at all, so a teacher/admin could silently overwrite marks
  // after publishResultService had already computed and published percentage/grade/rank from the
  // old values, with no audit trail of the discrepancy and a published result that no longer
  // matched the underlying marks.
  const existingFinalized = await Marks.find({
    examId,
    subjectId: { $in: [...new Set(marks.map((entry) => `${entry.subjectId || exam.subjectId}`))] },
    isFinalSubmitted: true,
  })
    .select("studentId subjectId")
    .lean();
  const finalizedKeys = new Set(existingFinalized.map((m) => `${m.studentId}_${m.subjectId}`));

  // 6. VALIDATION + TRANSFORM DATA
  const bulkOps = [];

  for (const entry of marks) {
    const resolvedStudent = identifierToStudent.get(`${entry.studentId}`);

    if (!resolvedStudent) {
      throw new ApiError(400, `Invalid studentId: ${entry.studentId}`);
    }

    if (!allowedStudentIds.has(resolvedStudent.studentDocId)) {
      throw new ApiError(
        400,
        `Student ${entry.studentId} not enrolled in this class/section`
      );
    }

    const subjectId = entry.subjectId || exam.subjectId;
    if (finalizedKeys.has(`${resolvedStudent.userId}_${subjectId}`)) {
      throw new ApiError(
        400,
        `Marks for student ${entry.studentId} (subject ${subjectId}) are already finalized and cannot be re-entered via bulk upload`
      );
    }

    bulkOps.push({
      updateOne: {
        filter: {
          examId,
          studentId: resolvedStudent.userId,
          subjectId,
        },
        update: {
          $set: {
            schoolId: exam.schoolId,
            academicYearId: exam.academicYearId,
            schoolClassId: exam.schoolClassId, // ✅ FIXED
            sectionId: exam.sectionId || null, // ✅ FIXED
            totalMarks: Number(entry.totalMarks) || 0,
            passingMarks: Number(entry.passingMarks) || 0,
            obtainedMarks: Number(entry.obtainedMarks) || 0,
            updatedBy: user._id,
          },
          $setOnInsert: {
            examId,
            studentId: resolvedStudent.userId,
            subjectId,
            enteredBy: user._id,
          },
        },
        upsert: true,
      },
    });
  }

  // 7. Execute Bulk
  const result = await Marks.bulkWrite(bulkOps, { ordered: false });

  return {
    message: "Marks uploaded successfully",
    result,
  };
};

export const updateMarksService = async ({ markId, body, user }) => {
  const mark = await Marks.findById(markId);
  if (!mark) throw new ApiError(404, "Marks not found");
  if (mark.isFinalSubmitted) throw new ApiError(400, "Final marks already submitted");

  if (user.roleId?.name !== "Super Admin" && `${mark.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Not allowed");
  }

  if (body.obtainedMarks !== undefined) mark.obtainedMarks = Number(body.obtainedMarks);
  if (body.totalMarks !== undefined) mark.totalMarks = Number(body.totalMarks);
  if (body.passingMarks !== undefined) mark.passingMarks = Number(body.passingMarks);
  mark.updatedBy = user._id;
  await mark.save();
  return mark.toObject();
};

export const submitFinalMarksService = async ({ body, user }) => {
  const filter = {
    examId: body.examId,
    schoolClassId: body.schoolClassId,
    sectionId: body.sectionId || null,
    schoolId: user.schoolId,
  };

  const update = await Marks.updateMany(filter, { $set: { isFinalSubmitted: true, updatedBy: user._id } });
  return update;
};

export const getExamAnalyticsService = async ({ examId, user }) => {
  const exam = await Exam.findById(examId)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .lean();

  if (!exam) throw new ApiError(404, "Exam not found");
  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  const [attemptStats, marksStats, resultStats] = await Promise.all([
    ExamAttempt.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageScore: { $avg: { $ifNull: ["$totalObtainedMarks", "$totalMarksObtained"] } },
        },
      },
    ]),
    Marks.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: null,
          studentsEvaluated: { $sum: 1 },
          averageObtainedMarks: { $avg: "$obtainedMarks" },
          highestScore: { $max: "$obtainedMarks" },
          lowestScore: { $min: "$obtainedMarks" },
          passCount: {
            $sum: {
              $cond: [{ $gte: ["$obtainedMarks", "$passingMarks"] }, 1, 0],
            },
          },
        },
      },
    ]),
    ExamResult.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: "$isPublished",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const marksSummary = marksStats[0] || {
    studentsEvaluated: 0,
    averageObtainedMarks: 0,
    highestScore: 0,
    lowestScore: 0,
    passCount: 0,
  };
  const attempted = attemptStats.reduce((acc, row) => acc + row.count, 0);
  const passPercentage = marksSummary.studentsEvaluated
    ? Number(((marksSummary.passCount / marksSummary.studentsEvaluated) * 100).toFixed(2))
    : 0;

  return {
    exam,
    attempts: {
      total: attempted,
      statusBreakdown: attemptStats,
    },
    evaluation: {
      ...marksSummary,
      averageObtainedMarks: Number((marksSummary.averageObtainedMarks || 0).toFixed(2)),
      passPercentage,
    },
    resultPublication: resultStats,
    enterpriseInsights: {
      riskLevel: passPercentage < 40 ? "high" : passPercentage < 70 ? "medium" : "low",
      recommendation:
        passPercentage < 40
          ? "Launch remediation batches, difficulty audit, and teacher review."
          : passPercentage < 70
          ? "Run targeted intervention groups and topic-wise re-tests."
          : "Maintain current strategy and scale best practices.",
    },
  };
};

const studentResultPipeline = ({ match }) => [
  { $match: match },
  {
    $lookup: {
      from: "subjects",
      localField: "subjectId",
      foreignField: "_id",
      as: "subject",
    },
  },
  { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: { examId: "$examId", studentId: "$studentId", schoolClassId: "$schoolClassId", sectionId: "$sectionId" },
      schoolId: { $first: "$schoolId" },
      academicYearId: { $first: "$academicYearId" },
      subjects: {
        $push: {
          subjectId: "$subjectId",
          subjectName: "$subject.name",
          obtainedMarks: "$obtainedMarks",
          totalMarks: "$totalMarks",
          passingMarks: "$passingMarks",
          isPassed: { $gte: ["$obtainedMarks", "$passingMarks"] },
        },
      },
      totalObtainedMarks: { $sum: "$obtainedMarks" },
      totalMaximumMarks: { $sum: "$totalMarks" },
      allPassed: { $min: { $gte: ["$obtainedMarks", "$passingMarks"] } },
    },
  },
  {
    $addFields: {
      percentage: {
        $cond: [
          { $gt: ["$totalMaximumMarks", 0] },
          { $round: [{ $multiply: [{ $divide: ["$totalObtainedMarks", "$totalMaximumMarks"] }, 100] }, 2] },
          0,
        ],
      },
    },
  },
];

export const publishResultService = async ({ body, user }) => {
  const baseMatch = {
    examId: new OBJECT_ID(body.examId),
    schoolClassId: new OBJECT_ID(body.schoolClassId),
    schoolId: new OBJECT_ID(user.schoolId),
    isFinalSubmitted: true,
  };

  if (body.sectionId) baseMatch.sectionId = new OBJECT_ID(body.sectionId);

  const aggregated = await Marks.aggregate(studentResultPipeline({ match: baseMatch }));

  if (!aggregated.length) throw new ApiError(404, "No finalized marks found");

  const sorted = [...aggregated].sort((a, b) => b.totalObtainedMarks - a.totalObtainedMarks);
  const rankMap = new Map(sorted.map((item, idx) => [`${item._id.studentId}`, idx + 1]));

  // Every row belongs to the same school (baseMatch.schoolId), so the scale is fetched once and
  // reused for the whole batch rather than re-querying per student.
  const gradeBands = await getGradeBands(user.schoolId);

  const ops = aggregated.map((row) => {
    const percentage = row.percentage || 0;
    const grade = resolveGrade(percentage, gradeBands);
    const resultStatus = row.allPassed ? "PASS" : "FAIL";

    return {
      updateOne: {
        filter: {
          schoolId: row.schoolId,
          examId: row._id.examId,
          studentId: row._id.studentId,
        },
        update: {
          $set: {
            academicYearId: row.academicYearId,
            schoolClassId: row._id.schoolClassId,
            sectionId: row._id.sectionId,
            subjects: row.subjects,
            totalObtainedMarks: row.totalObtainedMarks,
            totalMaximumMarks: row.totalMaximumMarks,
            percentage,
            grade,
            resultStatus,
            rank: rankMap.get(`${row._id.studentId}`) || null,
            isPublished: body.publish !== false,
            publishedAt: body.publish === false ? null : new Date(),
            publishedBy: body.publish === false ? null : user._id,
          },
          $setOnInsert: {
            schoolId: row.schoolId,
            examId: row._id.examId,
            studentId: row._id.studentId,
          },
        },
        upsert: true,
      },
    };
  });

  await ExamResult.bulkWrite(ops, { ordered: false });

  return {
    processed: aggregated.length,
    isPublished: body.publish !== false,
  };
};

export const getStudentResultService = async ({ query, user, studentId }) => {
  const scope = await resolveScope({ user, studentId });
  const filters = { studentId: scope.studentId };
  if (scope.schoolId) filters.schoolId = scope.schoolId;

  if (query.examId) filters.examId = query.examId;
  if (user.roleId?.name === "Student" || user.roleId?.name === "Parent") {
    filters.isPublished = true;
  }

  const data = await ExamResult.find(filters)
    .sort({ createdAt: -1 })
    .populate("examId", "title examDate")
    .populate("schoolClassId", "name")
    .lean();

  return data;
};

export const getClassResultSummaryService = async ({ query, user }) => {
  const match = {
    schoolId: new OBJECT_ID(user.schoolId),
    examId: new OBJECT_ID(query.examId),
    schoolClassId: new OBJECT_ID(query.schoolClassId),
    isPublished: true,
  };

  if (query.sectionId) match.sectionId = new OBJECT_ID(query.sectionId);

  const [summary] = await ExamResult.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$examId",
        students: { $sum: 1 },
        passCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "PASS"] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "FAIL"] }, 1, 0] } },
        averagePercentage: { $avg: "$percentage" },
        topper: {
          $top: {
            output: {
              studentId: "$studentId",
              totalObtainedMarks: "$totalObtainedMarks",
              percentage: "$percentage",
            },
            sortBy: { totalObtainedMarks: -1 },
          },
        },
      },
    },
    {
      $addFields: {
        passPercentage: {
          $cond: [
            { $gt: ["$students", 0] },
            { $round: [{ $multiply: [{ $divide: ["$passCount", "$students"] }, 100] }, 2] },
            0,
          ],
        },
      },
    },
  ]);

  return summary || { students: 0, passCount: 0, failCount: 0, averagePercentage: 0, passPercentage: 0 };
};
