// services/grading.service.js
import { Attempt } from "../models/ExamAttempts.model.js";
import { Question } from "../models/Questions.model.js";
import { Exam } from "../models/Exam.model.js";
import { ApiError } from "./ApiError.js";

/**
 * Auto-grade objective (MCQ/True-False) questions
 * @param {Object} attempt - Attempt object
 * @returns {Object} gradedAttempt
 */
export const autoGradeAttempt = async (attempt) => {
  let score = 0;
  const gradedAnswers = [];

  for (const ans of attempt.answers) {
    const question = await Question.findById(ans.questionId);

    if (!question) continue;

    // Auto-grade only objective questions
    if (["mcq", "true_false"].includes(question.type)) {
      const isCorrect =
        JSON.stringify(ans.response) === JSON.stringify(question.correctAnswer);
      gradedAnswers.push({
        ...ans,
        isCorrect,
        marksObtained: isCorrect ? question.marks : 0,
      });

      if (isCorrect) score += question.marks;
    } else {
      // For subjective - wait for manual evaluation
      gradedAnswers.push({
        ...ans,
        isCorrect: null,
        marksObtained: null,
      });
    }
  }

  attempt.score = score;
  attempt.answers = gradedAnswers;
  attempt.status = "graded";
  await attempt.save();

  return attempt;
};

/**
 * Manual evaluation for subjective questions
 */
export const manualGrade = async (attemptId, evaluations) => {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new Error("Attempt not found");

  let totalScore = attempt.score || 0;

  attempt.answers = attempt.answers.map((ans) => {
    const evalData = evaluations.find(
      (e) => e.questionId.toString() === ans.questionId.toString()
    );
    if (evalData) {
      ans.isCorrect = evalData.isCorrect;
      ans.marksObtained = evalData.marksObtained;
      totalScore += evalData.marksObtained;
    }
    return ans;
  });

  attempt.score = totalScore;
  attempt.status = "evaluated";
  await attempt.save();

  return attempt;
};

const toDisplayStatus = (attempt, exam) => {
  const marks = attempt.totalMarksObtained ?? attempt.score ?? 0;
  if (typeof exam?.passingMarks === "number") {
    return marks >= exam.passingMarks ? "Pass" : "Fail";
  }

  return attempt.status || "Pending";
};

export const generateGradingReport = async ({ examId, schoolId, type } = {}) => {
  const filter = {};

  if (examId) {
    const exam = await Exam.findById(examId).select("schoolId").lean();
    if (!exam) throw new ApiError(404, "Exam not found");
    if (schoolId && `${exam.schoolId}` !== `${schoolId}`) {
      throw new ApiError(403, "Exam does not belong to requested school");
    }
    filter.examId = examId;
    filter.schoolId = exam.schoolId;
  }

  if (schoolId && !filter.schoolId) {
    filter.schoolId = schoolId;
  }

  const attempts = await Attempt.find(filter)
    .populate("examId", "title totalMarks passingMarks examDate")
    .populate("studentId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  let reports = attempts.map((attempt) => {
    const score = attempt.totalMarksObtained ?? attempt.score ?? 0;
    const totalMarks = attempt.examId?.totalMarks ?? 0;
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;

    return {
      _id: attempt._id,
      examId: attempt.examId?._id ?? null,
      studentId: attempt.studentId?._id ?? null,
      examTitle: attempt.examId?.title ?? "-",
      studentName: attempt.studentId?.name ?? "-",
      studentEmail: attempt.studentId?.email ?? "-",
      score,
      totalMarks,
      passingMarks: attempt.examId?.passingMarks ?? null,
      percentage,
      status: toDisplayStatus(attempt, attempt.examId),
      attemptStatus: attempt.status ?? "Pending",
      examDate: attempt.examId?.examDate ?? null,
      submittedAt: attempt.submittedAt ?? null,
      createdAt: attempt.createdAt,
    };
  });

  if (type === "pass" || type === "passed") {
    reports = reports.filter((report) => report.status === "Pass");
  }

  if (type === "fail" || type === "failed") {
    reports = reports.filter((report) => report.status === "Fail");
  }

  return reports;
}
