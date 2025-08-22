import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Attempt } from "../models/ExamAttempts.model.js";
import { Exam } from "../models/Exam.model.js";
import { Question } from "../models/Questions.model.js";
import mongoose from "mongoose";

// =============================
// Start Exam Attempt
// =============================
export const startAttempt = asyncHandler(async (req, res) => {
  try {
    const { examId, studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid IDs"));
    }

    const exam = await Exam.findById(examId).populate("questions.questionId");
    if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

    // Check if student already has a running attempt
    const existing = await Attempt.findOne({ examId, studentId, status: "in_progress" });
    if (existing) return res.status(400).json(new ApiResponse(400, existing, "You already have an active attempt"));

    // Snapshot all questions
    const answers = exam.questions.map(q => ({
      questionRef: q.questionId._id,
      snapshot: q.questionId.toObject(),
      answer: null,
      marksObtained: 0,
      isCorrect: null,
      flagged: false
    }));

    const attempt = await Attempt.create({
      examId,
      studentId,
      answers
    });

    return res.status(201).json(new ApiResponse(201, attempt, "Exam attempt started"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Submit Exam Attempt
// =============================
export const submitAttempt = asyncHandler(async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json(new ApiResponse(404, null, "Attempt not found"));
    if (attempt.status !== "in_progress") return res.status(400).json(new ApiResponse(400, null, "Attempt already submitted"));

    // Update answers
    attempt.answers = attempt.answers.map((ans) => {
      const submitted = answers.find(a => a.questionRef === ans.questionRef.toString());
      if (submitted) {
        ans.answer = submitted.answer;
        ans.flagged = submitted.flagged ?? ans.flagged;

        // Auto-evaluate objective questions
        const qType = ans.snapshot.questionType;
        if (["mcq_single", "mcq_multi", "true_false"].includes(qType)) {
          const correct = ans.snapshot.correctAnswers.sort().toString();
          const userAns = Array.isArray(ans.answer) ? ans.answer.sort().toString() : ans.answer;
          ans.isCorrect = correct === userAns;
          ans.marksObtained = ans.isCorrect ? ans.snapshot.marks : -ans.snapshot.negativeMarks || 0;
        }
      }
      return ans;
    });

    // Calculate total marks
    attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
    attempt.status = "submitted";
    attempt.submittedAt = new Date();

    await attempt.save();
    return res.status(200).json(new ApiResponse(200, attempt, "Attempt submitted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Evaluate Attempt (for subjective questions)
// =============================
export const evaluateAttempt = asyncHandler(async (req, res) => {
  try {
    const { attemptId, evaluations, evaluatorId } = req.body;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json(new ApiResponse(404, null, "Attempt not found"));

    // Update answers with evaluation
    attempt.answers = attempt.answers.map(ans => {
      const evalData = evaluations.find(e => e.questionRef === ans.questionRef.toString());
      if (evalData) {
        ans.marksObtained = evalData.marksObtained ?? ans.marksObtained;
        ans.isCorrect = evalData.isCorrect ?? ans.isCorrect;
        ans.reviewComments = evalData.reviewComments ?? ans.reviewComments;
      }
      return ans;
    });

    attempt.totalMarksObtained = attempt.answers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
    attempt.status = "evaluated";
    attempt.grade = req.body.grade ?? attempt.grade;

    await attempt.save();
    return res.status(200).json(new ApiResponse(200, attempt, "Attempt evaluated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get Attempt By ID
// =============================
export const getAttemptById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = await Attempt.findById(id)
      .populate("examId studentId answers.questionRef");
    if (!attempt) return res.status(404).json(new ApiResponse(404, null, "Attempt not found"));

    return res.status(200).json(new ApiResponse(200, attempt, "Attempt fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get All Attempts (with filters + pagination)
// =============================
export const getAttempts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      examId,
      status,
      sort = "-createdAt"
    } = req.query;

    const filters = {};
    if (studentId) filters.studentId = studentId;
    if (examId) filters.examId = examId;
    if (status) filters.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [attempts, total] = await Promise.all([
      Attempt.find(filters)
        .populate("examId studentId answers.questionRef")
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sort),
      Attempt.countDocuments(filters)
    ]);

    return res.status(200).json(new ApiResponse(200, {
      attempts,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    }, "Attempts fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
