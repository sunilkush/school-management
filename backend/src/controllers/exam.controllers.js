import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { Exam } from "../models/Exam.model.js";
import { Attempt } from "../models/ExamAttempts.model.js";
import { Question } from "../models/Questions.model.js";
import {
  assignExamToClassService,
  createExamService,
  enterMarksBulkService,
  getClassResultSummaryService,
  getExamsService,
  getExamAnalyticsService,
  getStudentResultService,
  publishResultService,
  submitFinalMarksService,
  updateMarksService,
} from "../services/exam.service.js";

const ensureExamAccess = (exam, user) => {
  if (!exam) throw new ApiError(404, "Exam not found");
  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }
};

export const createExam = asyncHandler(async (req, res) => {
  const exam = await createExamService({ body: req.body, user: req.user });
  return res.status(201).json(new ApiResponse(201, exam, "Exam created successfully"));
});

export const getExams = asyncHandler(async (req, res) => {
  const data = await getExamsService({ query: req.query, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Exams fetched successfully"));
});

export const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .populate("createdBy", "name email")
    .lean();

  ensureExamAccess(exam, req.user);
  return res.status(200).json(new ApiResponse(200, exam, "Exam fetched successfully"));
});

export const getExamAnalytics = asyncHandler(async (req, res) => {
  const data = await getExamAnalyticsService({ examId: req.params.id, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Exam analytics fetched successfully"));
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  ensureExamAccess(exam, req.user);

  const payload = {
    ...req.body,
    title: req.body.name || req.body.title,
    totalMarks: req.body.totalMarks !== undefined ? Number(req.body.totalMarks) : undefined,
    passingMarks: req.body.passingMarks !== undefined ? Number(req.body.passingMarks) : undefined,
  };

  const effectiveTotal = payload.totalMarks !== undefined ? payload.totalMarks : exam.totalMarks;
  const effectivePassing = payload.passingMarks !== undefined ? payload.passingMarks : exam.passingMarks;

  if (effectiveTotal !== undefined && effectivePassing !== undefined && effectivePassing > effectiveTotal) {
    throw new ApiError(400, "Passing marks cannot exceed total marks");
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      exam[key] = value;
    }
  });

  await exam.save();

  return res.status(200).json(new ApiResponse(200, exam.toObject(), "Exam updated successfully"));
});

export const deleteExam = asyncHandler(async (req, res) => {
  const existing = await Exam.findById(req.params.id).select("schoolId").lean();
  ensureExamAccess(existing, req.user);

  const exam = await Exam.findByIdAndDelete(req.params.id).lean();
  return res.status(200).json(new ApiResponse(200, exam, "Exam deleted successfully"));
});

export const publishExam = asyncHandler(async (req, res) => {
  const status = req.body?.status || "published";
  if (!["published", "draft"].includes(status)) {
    throw new ApiError(400, "status must be published or draft");
  }

  const existing = await Exam.findById(req.params.id).select("schoolId").lean();
  ensureExamAccess(existing, req.user);

  const exam = await Exam.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();

  return res.status(200).json(new ApiResponse(200, exam, `Exam ${status} successfully`));
});

export const assignExamToClass = asyncHandler(async (req, res) => {
  const data = await assignExamToClassService({ body: req.body, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Exam assigned to class successfully"));
});

export const enterMarksBulk = asyncHandler(async (req, res) => {
  const data = await enterMarksBulkService({ body: req.body, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Marks saved successfully"));
});

export const updateMarks = asyncHandler(async (req, res) => {
  const data = await updateMarksService({ markId: req.params.id, body: req.body, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Marks updated successfully"));
});

export const submitFinalMarks = asyncHandler(async (req, res) => {
  const data = await submitFinalMarksService({ body: req.body, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Final marks submitted successfully"));
});

export const publishResult = asyncHandler(async (req, res) => {
  const data = await publishResultService({ body: req.body, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Result publish state updated"));
});

export const getStudentResult = asyncHandler(async (req, res) => {
  const data = await getStudentResultService({
    query: req.query,
    user: req.user,
    studentId: req.params.studentId,
  });
  return res.status(200).json(new ApiResponse(200, data, "Result fetched successfully"));
});

export const getParentViewResult = asyncHandler(async (req, res) => {
  const data = await getStudentResultService({
    query: req.query,
    user: req.user,
    studentId: req.params.studentId,
  });
  return res.status(200).json(new ApiResponse(200, data, "Parent result fetched successfully"));
});

export const getClassResultSummary = asyncHandler(async (req, res) => {
  const data = await getClassResultSummaryService({ query: req.query, user: req.user });
  return res.status(200).json(new ApiResponse(200, data, "Class summary fetched successfully"));
});

export const startExamAttempt = asyncHandler(async (req, res) => {
  const { examId, studentId: requestedStudentId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(examId)) throw new ApiError(400, "Invalid examId");

  const exam = await Exam.findById(examId).select("settings schoolId").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  const role = req.userRole?.name;
  const isStudent = role === "Student";
  const resolvedStudentId = isStudent ? req.user._id : requestedStudentId;

  if (!resolvedStudentId || !mongoose.Types.ObjectId.isValid(resolvedStudentId)) {
    throw new ApiError(400, "Valid studentId is required");
  }

  if (role !== "Super Admin" && `${exam.schoolId}` !== `${req.user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  const attempts = await Attempt.countDocuments({ examId, studentId: resolvedStudentId });
  if (attempts >= (exam.settings?.maxAttempts || 1)) {
    throw new ApiError(400, "Max attempts reached");
  }

  const attempt = await Attempt.create({
    examId,
    studentId: resolvedStudentId,
    schoolId: exam.schoolId,
  });
  return res.status(201).json(new ApiResponse(201, attempt, "Exam attempt started"));
});

export const submitExamAttempt = asyncHandler(async (req, res) => {
  const { attemptId, answers = [] } = req.body;
  if (!mongoose.Types.ObjectId.isValid(attemptId)) throw new ApiError(400, "Invalid attemptId");
  const attempt = await Attempt.findById(attemptId).populate("examId", "examType settings");
  if (!attempt) throw new ApiError(404, "Attempt not found");
  const role = req.userRole?.name;
  if (role === "Student" && `${attempt.studentId}` !== `${req.user._id}`) {
    throw new ApiError(403, "Forbidden to submit another student's attempt");
  }
  if (role !== "Super Admin" && `${attempt.schoolId}` !== `${req.user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school attempt");
  }

  const questionIds = answers.map((item) => item.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } })
    .select("correctAnswer marks")
    .lean();
  const questionMap = new Map(questions.map((q) => [`${q._id}`, q]));

  let totalMarks = 0;
  const evaluatedAnswers = answers.map((ans) => {
    const question = questionMap.get(`${ans.questionId}`);
    if (!question) return null;

    let isCorrect = false;
    let marksObtained = 0;
    if (attempt.examId.examType !== "subjective") {
      if (JSON.stringify(question.correctAnswer) === JSON.stringify(ans.response)) {
        isCorrect = true;
        marksObtained = ans.marks || question.marks || 0;
      } else if ((attempt.examId.settings?.negativeMarking || 0) > 0) {
        marksObtained = -(attempt.examId.settings?.negativeMarking || 0);
      }
    }

    totalMarks += marksObtained;
    return {
      questionId: ans.questionId,
      response: ans.response,
      isCorrect,
      marksObtained,
    };
  }).filter(Boolean);

  attempt.answers = evaluatedAnswers;
  attempt.totalObtainedMarks = totalMarks;
  attempt.status = "submitted";
  attempt.endedAt = new Date();
  await attempt.save();

  return res.status(200).json(new ApiResponse(200, attempt, "Exam submitted successfully"));
});

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId, evaluations = [] } = req.body;
  if (!mongoose.Types.ObjectId.isValid(attemptId)) throw new ApiError(400, "Invalid attemptId");
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (req.userRole?.name !== "Super Admin" && `${attempt.schoolId}` !== `${req.user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school attempt");
  }

  let totalMarks = 0;
  attempt.answers = attempt.answers.map((ans) => {
    const evalData = evaluations.find((e) => e.questionId === ans.questionId.toString());
    if (evalData) {
      ans.isCorrect = evalData.isCorrect ?? ans.isCorrect;
      ans.marksObtained = evalData.marksObtained ?? ans.marksObtained;
    }
    totalMarks += ans.marksObtained;
    return ans;
  });

  attempt.totalObtainedMarks = totalMarks;
  attempt.status = "evaluated";
  attempt.evaluatedBy = req.user._id;
  await attempt.save();

  return res.status(200).json(new ApiResponse(200, attempt, "Attempt evaluated successfully"));
});
