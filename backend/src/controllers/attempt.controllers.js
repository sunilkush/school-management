import { asyncHandler } from "../utils/asyncHandler.js";
import { Attempt } from "../models/ExamAttempts.model.js";
import { Exam } from "../models/Exam.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { Student } from "../models/student.model.js";

const assertObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, `Invalid ${label}`);
};

const enforceAttemptReadAccess = async (attempt, req) => {
  const role = req.userRole?.name;
  const isPrivileged = ["Super Admin", "School Admin", "Teacher"].includes(role);
  if (isPrivileged) return;

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
  const studentId = req.user._id;
  


  assertObjectId(examId, "examId");

  const exam = await Exam.findById(examId).populate("questions.questionId");
  if (!exam) throw new ApiError(404, "Exam not found");
  if (exam.status !== "published") throw new ApiError(400, "This exam is not published yet");

  const now = new Date();
  if (exam.startTime && now < exam.startTime) {
    throw new ApiError(400, "Exam has not started yet");
  }
  if (exam.endTime && now > exam.endTime) {
    throw new ApiError(400, "Exam window is closed");
  }

  const existing = await Attempt.findOne({ examId, studentId, status: "in_progress" });
  if (existing) throw new ApiError(400, "You already have an active attempt");

  const maxAttempts = Number(exam?.settings?.maxAttempts || 1);
  const usedAttempts = await Attempt.countDocuments({
    examId,
    studentId,
    status: { $in: ["submitted", "evaluated"] },
  });
  if (usedAttempts >= maxAttempts) {
    throw new ApiError(400, "Maximum attempts reached for this exam");
  }

  const answers = exam.questions.map((q) => ({
    questionId: q.questionId?._id,
    questionSnapshot: q.questionId?.toObject?.(),
    response: null,
    marksObtained: 0,
    isCorrect: null,
    flagged: false,
  }));

  const schoolId = exam.schoolId 
  if (!schoolId) throw new ApiError(400, "schoolId could not be resolved for this attempt");

  const attempt = await Attempt.create({ examId, studentId, schoolId, answers });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Exam attempt started",
    data: attempt,
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId, answers = [] } = req.body;
  assertObjectId(attemptId, "attemptId");

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.studentId.toString() !== req.user._id.toString()) throw new ApiError(403, "Forbidden");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt already submitted");

  attempt.answers = attempt.answers.map((ans) => {
    const questionId = ans.questionId?.toString?.();
    const submitted = answers.find((a) => {
      const submittedQuestionId = a.questionRef || a.questionId;
      return `${submittedQuestionId}` === `${questionId}`;
    });
    if (!submitted) return ans;

    ans.response = submitted.answer ?? submitted.response ?? null;
    ans.flagged = submitted.flagged ?? ans.flagged;

    const snapshot = ans.questionSnapshot || ans.snapshot || {};
    const qType = snapshot.questionType;
    if (["mcq_single", "mcq_multi", "true_false"].includes(qType)) {
      const correct = Array.isArray(snapshot.correctAnswers)
        ? [...snapshot.correctAnswers].sort().toString()
        : snapshot.correctAnswers;
      const userAns = Array.isArray(ans.response) ? [...ans.response].sort().toString() : ans.response;
      ans.isCorrect = correct === userAns;
      ans.marksObtained = ans.isCorrect ? snapshot.marks : -(snapshot.negativeMarks || 0);
    }

    return ans;
  });

  attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
  attempt.status = "submitted";
  attempt.submittedAt = new Date();

  await attempt.save();

  return sendSuccess(res, { message: "Attempt submitted successfully", data: attempt });
});

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId, evaluations = [] } = req.body;
  assertObjectId(attemptId, "attemptId");

  const attempt = await Attempt.findById(attemptId);
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

  const attempt = await Attempt.findById(id).populate("examId studentId answers.questionId");
  if (!attempt) throw new ApiError(404, "Attempt not found");

  await enforceAttemptReadAccess(attempt, req);

  return sendSuccess(res, { message: "Attempt fetched successfully", data: attempt });
});

export const getAttempts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, studentId, examId, status, sort = "-createdAt" } = req.query;

  const filters = {};
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
    Attempt.find(filters)
      .populate("examId studentId answers.questionId")
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort(sort),
    Attempt.countDocuments(filters),
  ]);

  return sendSuccess(res, {
    message: "Attempts fetched successfully",
    data: attempts,
    meta: { page: Number(page), total },
  });
});
