import { ApiError } from "../ApiError.js";

export const calculateGrade = (percentage, gradeScale = []) => {
  if (Array.isArray(gradeScale) && gradeScale.length) {
    const match = gradeScale.find((range) => percentage >= range.minPercent && percentage <= range.maxPercent);
    return match?.grade || "N/A";
  }
  if (percentage >= 90) return "A1";
  if (percentage >= 80) return "A2";
  if (percentage >= 70) return "B1";
  if (percentage >= 60) return "B2";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

export const calculateDivision = (percentage) => {
  if (percentage >= 60) return "First";
  if (percentage >= 45) return "Second";
  if (percentage >= 33) return "Third";
  return "Fail";
};

export const normalizeMarks = ({ theory = 0, practical = 0, internal = 0, external = 0, maxMarks = 0 }) => {
  const total = Number(theory) + Number(practical) + Number(internal) + Number(external);
  if (total > Number(maxMarks)) throw new ApiError(400, "Obtained marks cannot exceed max marks");
  return total;
};

export const evaluateObjectiveResponse = ({ question, response, negativeMarkingEnabled }) => {
  const standardAnswer = question.correctAnswer;
  const responseKey = String(response?.selectedOption || response?.answerText || "").trim().toLowerCase();
  const answerKey = String(standardAnswer || "").trim().toLowerCase();

  const isObjective = ["MCQ", "True/False", "Fill in the blanks"].includes(question.questionType);
  if (!isObjective) return { isCorrect: null, marksObtained: 0, evaluationStatus: "pending", negativeMarksApplied: 0 };

  const isCorrect = responseKey && responseKey === answerKey;
  if (isCorrect) {
    return { isCorrect: true, marksObtained: question.marks, evaluationStatus: "auto_checked", negativeMarksApplied: 0 };
  }

  const penalty = negativeMarkingEnabled ? Number(question.negativeMarks || 0) : 0;
  return { isCorrect: false, marksObtained: -penalty, evaluationStatus: "auto_checked", negativeMarksApplied: penalty };
};

export const evaluateExamAvailability = ({ exam, now = new Date() }) => {
  if (!exam.onlineSettings?.enabled) throw new ApiError(400, "Online exam is not enabled for this exam");
  const startWindow = exam.onlineSettings?.startWindow ? new Date(exam.onlineSettings.startWindow) : null;
  const endWindow = exam.onlineSettings?.endWindow ? new Date(exam.onlineSettings.endWindow) : null;
  if (startWindow && now < startWindow) throw new ApiError(400, "Exam window has not started");
  if (endWindow && now > endWindow) throw new ApiError(400, "Exam window has ended");
};

export const getAttemptStatusByTimer = ({ attempt, now = new Date() }) => {
  if (!attempt.startedAt || !attempt.durationMinutes) return { expired: false, remainingSeconds: null };
  const expiryTime = new Date(attempt.startedAt).getTime() + Number(attempt.durationMinutes) * 60 * 1000;
  const remainingMs = expiryTime - now.getTime();
  return {
    expired: remainingMs <= 0,
    remainingSeconds: Math.max(Math.floor(remainingMs / 1000), 0),
  };
};

export const computeRanks = (results = []) => {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage || b.totalObtainedMarks - a.totalObtainedMarks);
  return sorted.map((result, index) => ({ ...result, rank: index + 1 }));
};
