import { asyncHandler } from "../utils/asyncHandler.js";
import { ExamAttempt } from "../models/ExamAttempts.model.js";
import { Exam } from "../models/Exam.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

const assertObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, `Invalid ${label}`);
};

const isWithinExamWindow = (now, startTime, endTime) => {
  if (!startTime || !endTime) return false;

  const nowTs = now.getTime();
  const startTs = new Date(startTime).getTime();
  const endTs = new Date(endTime).getTime();

  return nowTs >= startTs && nowTs <= endTs;
};

const enforceAttemptReadAccess = async (attempt, req) => {
 const role = req.userRole?.name || req.user?.roleId?.name;
  const isPrivileged = ["Super Admin", "School Admin", "Teacher", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator"].includes(role);
  if (isPrivileged) {
    if (role !== "Super Admin" && `${attempt.schoolId}` !== `${req.user.schoolId}`) {
      throw new ApiError(403, "Forbidden access outside your school");
    }
    return;
  }

  if (role === "Parent") {
    const child = await Student.findOne({
      userId: attempt.studentId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    })
      .select("_id")
      .lean();
    if (!child) throw new ApiError(403, "Forbidden access to this attempt");
    return;
  }

  if (attempt.studentId?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden access to this attempt");
  }
};

export const startAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const studentUserId = req.user._id;
  assertObjectId(examId, "examId");

  const exam = await Exam.findById(examId).populate("questions.questionId");
  if (!exam) throw new ApiError(404, "Exam not found");
  if (exam.status !== "published") throw new ApiError(400, "This exam is not published yet");

  const now = new Date();
  if (!isWithinExamWindow(now, exam.startTime, exam.endTime)) {
    if (now < exam.startTime) {
      throw new ApiError(400, "Exam has not started yet");
    }
    throw new ApiError(400, "Exam window is closed");
  }

  const student = await Student.findOne({ userId: studentUserId }).select("_id").lean();
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const enrollQuery = {
    studentId: student._id,
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    schoolClassId: exam.schoolClassId,
    ...(exam.sectionId ? { sectionId: exam.sectionId } : {}),
    status: "Active",
  };
  const enrollment = await StudentEnrollment.findOne(enrollQuery).select("_id").lean();

  if (!enrollment) {
    throw new ApiError(403, "Student is not enrolled in the exam class/section for this academic year");
  }
  const existing = await ExamAttempt.findOne({ examId, studentId: studentUserId, status: "in_progress" });
  if (existing) throw new ApiError(400, "You already have an active attempt");

  const maxAttempts = Number(exam?.settings?.maxAttempts || 1);
  const usedAttempts = await ExamAttempt.countDocuments({
    examId,
    studentId: studentUserId,
    status: { $in: ["submitted", "evaluated"] },
  });
  if (usedAttempts >= maxAttempts) {
    throw new ApiError(400, "Maximum attempts reached for this exam");
  }

  const answers = exam.questions.map((q) => ({
    questionId:       q.questionId?._id,
    questionSnapshot: {
      statement:      q.questionId?.statement      || "",
      questionType:   q.questionId?.questionType   || "",
      options:        q.questionId?.options        || [],
      marks:          q.marks                      ?? q.questionId?.marks ?? 1,
      negativeMarks:  q.questionId?.negativeMarks  ?? 0,
      correctAnswers: q.questionId?.correctAnswers ?? null,
    },
    response:      null,
    marksObtained: 0,
    isCorrect:     null,
    flagged:       false,
  }));

  const schoolId = exam.schoolId 
  if (!schoolId) throw new ApiError(400, "schoolId could not be resolved for this attempt");

  const attemptNumber = usedAttempts + 1;
  const attempt = await ExamAttempt.create({
    examId,
    studentId: studentUserId,
    schoolId,
    answers,
    attemptNumber,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Exam attempt started",
    data: attempt,
  });
});

/* Types that can be graded without human review */
const AUTO_EVAL_TYPES = new Set(["mcq_single", "mcq_multi", "true_false", "fill_blank"]);

const normalise  = (v) => (typeof v === "string" ? v.trim().toLowerCase() : String(v ?? "").trim().toLowerCase());
const sortedStr  = (arr) => (Array.isArray(arr) ? [...arr].map(normalise).sort().join(",") : normalise(arr));

const calcGrade = (pct) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId, answers = [] } = req.body;
  assertObjectId(attemptId, "attemptId");

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.studentId.toString() !== req.user._id.toString()) throw new ApiError(403, "Forbidden");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt already submitted");

  let allAutoEvaluatable = true;

  attempt.answers = attempt.answers.map((ans) => {
    const questionId = ans.questionId?.toString?.();
    const submitted  = answers.find((a) => `${a.questionRef || a.questionId}` === `${questionId}`);

    if (submitted) {
      ans.response = submitted.answer ?? submitted.response ?? null;
      ans.flagged  = submitted.flagged ?? ans.flagged;
    }

    const snapshot = ans.questionSnapshot || {};
    const qType    = snapshot.questionType;

    if (AUTO_EVAL_TYPES.has(qType)) {
      const correctRaw = snapshot.correctAnswers;
      const userRaw    = ans.response;

      if (qType === "fill_blank") {
        /* case-insensitive trim match */
        ans.isCorrect     = normalise(userRaw) === normalise(correctRaw);
      } else {
        /* mcq_single / mcq_multi / true_false — sort so A,B === B,A */
        const correctStr = sortedStr(correctRaw);
        const userStr    = sortedStr(userRaw);
        ans.isCorrect    = correctStr === userStr && correctStr !== "";
      }

      const marks    = Number(snapshot.marks        ?? 1);
      const negMarks = Number(snapshot.negativeMarks ?? 0);
      ans.marksObtained = ans.isCorrect ? marks : (negMarks > 0 ? -negMarks : 0);

    } else {
      /* subjective question — needs human review */
      allAutoEvaluatable = false;
    }

    return ans;
  });

  attempt.submittedAt       = new Date();
  attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (Number(a.marksObtained) || 0), 0);

  if (allAutoEvaluatable) {
    /* fetch total marks from exam to compute percentage + grade */
    const exam = await Exam.findById(attempt.examId).select("totalMarks").lean();
    const total = Number(exam?.totalMarks || 0);
    const pct   = total > 0 ? Math.round((attempt.totalMarksObtained / total) * 100) : 0;

    attempt.status        = "evaluated";
    attempt.autoEvaluated = true;
    attempt.grade         = calcGrade(pct);
  } else {
    attempt.status = "submitted";
  }

  await attempt.save();

  return sendSuccess(res, {
    message: attempt.autoEvaluated
      ? "Attempt submitted and auto-evaluated successfully"
      : "Attempt submitted successfully — awaiting teacher evaluation",
    data: attempt,
  });
});
export const autosaveAttemptAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionRef, questionId, answer, response, flagged } = req.body;
  assertObjectId(attemptId, "attemptId");

  const resolvedQuestionId = questionRef || questionId;
  assertObjectId(resolvedQuestionId, "questionId");

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.studentId.toString() !== req.user._id.toString()) throw new ApiError(403, "Forbidden");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt is not active");

  const answerIndex = attempt.answers.findIndex(
    (item) => `${item.questionId}` === `${resolvedQuestionId}`
  );
  if (answerIndex === -1) throw new ApiError(404, "Question not found in attempt");

  attempt.answers[answerIndex].response = answer ?? response ?? null;
  if (typeof flagged === "boolean") {
    attempt.answers[answerIndex].flagged = flagged;
  }

  await attempt.save();

  return sendSuccess(res, {
    message: "Answer autosaved successfully",
    data: {
      attemptId: attempt._id,
      questionId: resolvedQuestionId,
      savedAt: new Date().toISOString(),
    },
  });
});

export const getActiveAttemptByExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  assertObjectId(examId, "examId");

  const attempt = await ExamAttempt.findOne({
    examId,
    studentId: req.user._id,
    status: "in_progress",
  })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Active attempt fetched successfully",
    data: attempt || null,
  });
});

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId, evaluations = [] } = req.body;
  assertObjectId(attemptId, "attemptId");

   const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");

  attempt.answers = attempt.answers.map((ans) => {
    const questionId = ans.questionId?.toString?.() || ans.questionRef?.toString?.();
    const evalData = evaluations.find((e) => {
      const evaluationQuestionId = e.questionRef || e.questionId;
      return `${evaluationQuestionId}` === `${questionId}`;
    });
    if (!evalData) return ans;

    ans.marksObtained = evalData.marksObtained ?? ans.marksObtained;
    ans.isCorrect = evalData.isCorrect ?? ans.isCorrect;
    ans.reviewComments = evalData.reviewComments ?? ans.reviewComments;
    return ans;
  });

  attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
  attempt.status = "evaluated";
  attempt.grade = req.body.grade ?? attempt.grade;

  await attempt.save();
  return sendSuccess(res, { message: "Attempt evaluated successfully", data: attempt });
});

export const getAttemptById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "id");

  const attempt = await ExamAttempt.findById(id).populate("examId studentId answers.questionId");
  if (!attempt) throw new ApiError(404, "Attempt not found");

  await enforceAttemptReadAccess(attempt, req);

  return sendSuccess(res, { message: "Attempt fetched successfully", data: attempt });
});

export const getAttempts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, studentId, examId, status, sort = "-createdAt" } = req.query;

  const filters = {};
  if (req.userRole?.name !== "Super Admin" && req.user?.schoolId) filters.schoolId = req.user.schoolId;
  if (studentId) filters.studentId = studentId;
  if (examId) filters.examId = examId;
  if (status) filters.status = status;

  if (req.userRole?.name === "Student") {
    filters.studentId = req.user._id;
  }
  if (req.userRole?.name === "Parent") {
    const childQuery = {
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    };
    if (studentId) childQuery.userId = studentId;
    const child = await Student.findOne(childQuery).select("userId").populate("userId", "schoolId").lean();
    if (!child || `${child.userId?.schoolId}` !== `${req.user.schoolId}`) {
      throw new ApiError(403, "Forbidden child scope");
    }
    filters.studentId = child.userId?._id || child.userId;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [attempts, total] = await Promise.all([
    ExamAttempt.find(filters)
      .populate("examId studentId answers.questionId")
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort(sort),
    ExamAttempt.countDocuments(filters),
  ]);

  return sendSuccess(res, {
    message: "Attempts fetched successfully",
    data: attempts,
    meta: { page: Number(page), total },
  });
});
