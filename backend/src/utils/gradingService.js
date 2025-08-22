// services/grading.service.js
import { Attempt } from "../models/Attempt.model.js";
import { Question } from "../models/Questions.model.js";

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
      const isCorrect = JSON.stringify(ans.response) === JSON.stringify(question.correctAnswer);
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
    const evalData = evaluations.find((e) => e.questionId.toString() === ans.questionId.toString());
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
