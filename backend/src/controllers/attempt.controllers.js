import mongoose from "mongoose";
import { Attempt } from "../models/ExamAttempts.model.js";
import { Exam } from "../models/Exam.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const startAttempt = asyncHandler(async (req, res) => {
  const { examId, studentId, examSubjectId } = req.body;

  if (![examId, studentId, examSubjectId].every((id) => mongoose.Types.ObjectId.isValid(id))) {
    throw new ApiError(400, "Invalid IDs provided");
  }

  const exam = await Exam.findById(examId).populate("questions.questionId");
  if (!exam) throw new ApiError(404, "Exam not found");

  const existing = await Attempt.findOne({ examId, studentId, examSubjectId, status: "in_progress" });
  if (existing) throw new ApiError(400, "You already have an active attempt");

  const answers = (exam.questions || []).map((q) => ({
    questionId: q.questionId?._id,
    questionSnapshot: {
      statement: q.questionId?.statement,
      questionType: q.questionId?.questionType,
      options: q.questionId?.options,
      marks: q.questionId?.marks,
      negativeMarks: q.questionId?.negativeMarks,
    },
    answer: null,
    marksObtained: 0,
    isCorrect: null,
    flagged: false,
  }));

  const attempt = await Attempt.create({
    schoolId: req.user.schoolId,
    examId,
    examSubjectId,
    studentId,
    answers,
  });

  return res.status(201).json(new ApiResponse(201, attempt, "Exam attempt started"));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId, answers = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(attemptId)) {
    throw new ApiError(400, "Invalid attempt ID");
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt already submitted");

  attempt.answers = (attempt.answers || []).map((ans) => {
    const submitted = answers.find((a) => a.questionId === ans.questionId.toString());
    if (!submitted) return ans;

    ans.answer = submitted.answer;
    ans.flagged = submitted.flagged ?? ans.flagged;

    const qType = ans.questionSnapshot?.questionType;
    if (["mcq_single", "mcq_multi", "true_false"].includes(qType)) {
      const expected = Array.isArray(ans.questionSnapshot?.correctAnswers)
        ? [...ans.questionSnapshot.correctAnswers].sort().toString()
        : ans.questionSnapshot?.correctAnswers;
      const actual = Array.isArray(ans.answer) ? [...ans.answer].sort().toString() : ans.answer;
      ans.isCorrect = expected === actual;
      ans.marksObtained = ans.isCorrect
        ? Number(ans.questionSnapshot?.marks || 0)
        : Math.max(0, Number(ans.questionSnapshot?.negativeMarks || 0));
    }

    return ans;
  });

  attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (Number(a.marksObtained) || 0), 0);
  attempt.status = "submitted";
  attempt.submittedAt = new Date();

  await attempt.save();
  return res.status(200).json(new ApiResponse(200, attempt, "Attempt submitted successfully"));
});

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId, evaluations = [], grade } = req.body;
  if (!mongoose.Types.ObjectId.isValid(attemptId)) throw new ApiError(400, "Invalid attempt ID");

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");

  attempt.answers = (attempt.answers || []).map((ans) => {
    const evaluation = evaluations.find((e) => e.questionId === ans.questionId.toString());
    if (!evaluation) return ans;
    ans.marksObtained = Number(evaluation.marksObtained ?? ans.marksObtained);
    ans.isCorrect = evaluation.isCorrect ?? ans.isCorrect;
    return ans;
  });

  attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (Number(a.marksObtained) || 0), 0);
  attempt.status = "evaluated";
  attempt.grade = grade ?? attempt.grade;

  await attempt.save();
  return res.status(200).json(new ApiResponse(200, attempt, "Attempt evaluated successfully"));
});

export const getAttemptById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid attempt ID");

  const attempt = await Attempt.findById(id).populate("examId studentId answers.questionId");
  if (!attempt) throw new ApiError(404, "Attempt not found");

  return res.status(200).json(new ApiResponse(200, attempt, "Attempt fetched successfully"));
});

export const getAttempts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const filters = {};
  if (req.query.studentId) filters.studentId = req.query.studentId;
  if (req.query.examId) filters.examId = req.query.examId;
  if (req.query.status) filters.status = req.query.status;

  const [attempts, total] = await Promise.all([
    Attempt.find(filters).populate("examId studentId answers.questionId").skip(skip).limit(limit).sort({ createdAt: -1 }),
    Attempt.countDocuments(filters),
  ]);

  return res.status(200).json(new ApiResponse(200, attempts, "Attempts fetched successfully", { page, total, limit }));
});
