// controllers/exam.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Exam } from "../models/Exam.model.js";
import { Attempt } from "../models/ExamAttempts.model.js"; // same file has both schemas
import { Question } from "../models/Questions.model.js";
import {ApiError} from "../utils/ApiError.js";
// =============================
// Create Exam
// =============================


export const createExam = asyncHandler(async (req, res) => {
  const {
    academicYearId,
    title,
    classId,
    sectionId,
    subjectId,
    examType,
    startTime,
    endTime,
    examDate,
    durationMinutes,
    totalMarks,
    passingMarks,
    questionOrder,
    shuffleOptions,
    settings,
    schoolId,
    userId
  } = req.body;

  if (!academicYearId || !title || !startTime || !endTime || !durationMinutes) {
    throw new ApiError(400, "Required fields missing");
  }

  const exam = await Exam.create({
    academicYearId,
    schoolId,
    title,
    classId,
    sectionId,
    subjectId,
    examType,
    startTime,
    endTime,
    examDate,
    durationMinutes,
    totalMarks,
    passingMarks,
    questionOrder,
    shuffleOptions,
    settings,
    createdBy: userId,
    status: "draft"
  });

  return res
    .status(201)
    .json(new ApiResponse(201, exam, "Exam created in draft mode"));
});


// =============================
// Get All Exams (with filters)
// =============================
export const getExams = asyncHandler(async (req, res) => {
  try {
    const filters = {};

    // Multi-tenant: If user is not super-admin, restrict to their school
    if (req.user.role !== "Super Admin") {
      filters.schoolId = req.user.schoolId;
    } else if (req.query.schoolId) {
      filters.schoolId = req.query.schoolId;
    }

    // Optional filters
    if (req.query.status) filters.status = req.query.status;
    if (req.query.classId) filters.classId = req.query.classId;
    if (req.query.sectionId) filters.sectionId = req.query.sectionId;
    if (req.query.subjectId) filters.subjectId = req.query.subjectId;

    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Exam.countDocuments(filters);
    const exams = await Exam.find(filters)
      .populate("schoolId classId sectionId subjectId createdBy")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json(
      new ApiResponse(200, {
        total,
        page,
        limit,
        exams
      }, "Exams fetched successfully")
    );

  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get Exam By ID
// =============================
export const getExamById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id)
      .populate("questions.questionId")
      .populate("createdBy", "name email");

    if (!exam) {
      return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
    }

    return res.status(200).json(new ApiResponse(200, exam, "Exam fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Update Exam
// =============================
export const updateExam = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndUpdate(id, req.body, { new: true });

    if (!exam) {
      return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
    }

    return res.status(200).json(new ApiResponse(200, exam, "Exam updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Delete Exam
// =============================
export const deleteExam = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) {
      return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
    }

    return res.status(200).json(new ApiResponse(200, exam, "Exam deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Publish Exam
// =============================
export const publishExam = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndUpdate(
      id,
      { status: "published" },
      { new: true }
    );
    if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

    return res.status(200).json(new ApiResponse(200, exam, "Exam published successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});


// =============================
// Student: Start Attempt
// =============================
export const startExamAttempt = asyncHandler(async (req, res) => {
  try {
    const { examId, studentId, schoolId } = req.body;

    // check existing attempts
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

    const attempts = await Attempt.countDocuments({ examId, studentId });
    if (attempts >= exam.settings.maxAttempts) {
      return res.status(400).json(new ApiResponse(400, null, "Max attempts reached"));
    }

    const attempt = await Attempt.create({ examId, studentId, schoolId });
    return res.status(201).json(new ApiResponse(201, attempt, "Exam attempt started"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Student: Submit Attempt
// =============================
export const submitExamAttempt = asyncHandler(async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const attempt = await Attempt.findById(attemptId).populate("examId");
    if (!attempt) return res.status(404).json(new ApiResponse(404, null, "Attempt not found"));

    let totalMarks = 0;

    for (let ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) continue;

      let isCorrect = false;
      let marksObtained = 0;

      // auto evaluation only for objective
      if (attempt.examId.examType !== "subjective") {
        if (JSON.stringify(question.correctAnswer) === JSON.stringify(ans.response)) {
          isCorrect = true;
          marksObtained = ans.marks || question.marks || 0;
        } else if (attempt.examId.settings.negativeMarking > 0) {
          marksObtained = -attempt.examId.settings.negativeMarking;
        }
      }

      totalMarks += marksObtained;

      attempt.answers.push({
        questionId: ans.questionId,
        response: ans.response,
        isCorrect,
        marksObtained,
      });
    }

    attempt.totalObtainedMarks = totalMarks;
    attempt.status = "submitted";
    attempt.endedAt = new Date();
    await attempt.save();

    return res.status(200).json(new ApiResponse(200, attempt, "Exam submitted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Teacher: Evaluate Attempt (manual for subjective)
// =============================
export const evaluateAttempt = asyncHandler(async (req, res) => {
  try {
    const { attemptId, evaluations, evaluatorId } = req.body;
    const attempt = await Attempt.findById(attemptId);

    if (!attempt) return res.status(404).json(new ApiResponse(404, null, "Attempt not found"));

    let totalMarks = 0;

    attempt.answers = attempt.answers.map((ans) => {
      const evalData = evaluations.find((e) => e.questionId == ans.questionId.toString());
      if (evalData) {
        ans.isCorrect = evalData.isCorrect ?? ans.isCorrect;
        ans.marksObtained = evalData.marksObtained ?? ans.marksObtained;
      }
      totalMarks += ans.marksObtained;
      return ans;
    });

    attempt.totalObtainedMarks = totalMarks;
    attempt.status = "evaluated";
    attempt.evaluatedBy = evaluatorId;
    await attempt.save();

    return res.status(200).json(new ApiResponse(200, attempt, "Attempt evaluated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
