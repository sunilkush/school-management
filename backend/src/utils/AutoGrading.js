import { Exam } from "./exam.model.js";
import { Attempt } from "./attempt.model.js";

/**
 * Auto-grades an attempt for objective questions and assigns a grade
 * @param {ObjectId} attemptId - ID of the Attempt
 */
export const autoGradeAttempt = async (attemptId) => {
  const attempt = await Attempt.findById(attemptId).populate("examId");
  if (!attempt) throw new Error("Attempt not found");

  const exam = attempt.examId;
  if (!exam) throw new Error("Exam not found");

  let totalMarks = 0;

  for (let ans of attempt.answers) {
    const qSnap = ans.snapshot; // immutable snapshot
    const qType = qSnap?.questionType;
    const correctAnswers = qSnap?.correctAnswers || [];

    let awardedMarks = 0;
    let isCorrect = false;

    // --- MCQ Single ---
    if (qType === "mcq_single") {
      if (ans.answer?.length === 1 && correctAnswers.includes(ans.answer[0])) {
        isCorrect = true;
        awardedMarks = qSnap.marks || 1;
      } else {
        awardedMarks = exam.settings?.negativeMarking || 0;
      }
    }

    // --- MCQ Multi ---
    if (qType === "mcq_multi") {
      const correctSet = new Set(correctAnswers);
      const givenSet = new Set(ans.answer || []);

      if (exam.settings?.allowPartialScoring) {
        let correctChosen = 0;
        for (let choice of givenSet) {
          if (correctSet.has(choice)) correctChosen++;
        }
        awardedMarks = (qSnap.marks || 1) * (correctChosen / correctSet.size);
        isCorrect = correctChosen === correctSet.size && givenSet.size === correctSet.size;
      } else {
        if (
          correctSet.size === givenSet.size &&
          [...correctSet].every((opt) => givenSet.has(opt))
        ) {
          isCorrect = true;
          awardedMarks = qSnap.marks || 1;
        } else {
          awardedMarks = exam.settings?.negativeMarking || 0;
        }
      }
    }

    // --- True/False ---
    if (qType === "true_false") {
      if (ans.answer?.[0]?.toLowerCase() === correctAnswers[0]?.toLowerCase()) {
        isCorrect = true;
        awardedMarks = qSnap.marks || 1;
      } else {
        awardedMarks = exam.settings?.negativeMarking || 0;
      }
    }

    // --- Fill in the Blank ---
    if (qType === "fill_blank") {
      if (
        correctAnswers.some(
          (ca) => ca.toLowerCase().trim() === (ans.answer?.[0] || "").toLowerCase().trim()
        )
      ) {
        isCorrect = true;
        awardedMarks = qSnap.marks || 1;
      }
    }

    // --- Match the Following ---
    if (qType === "match") {
      const correctPairs = correctAnswers;
      const givenPairs = ans.answer || [];

      if (exam.settings?.allowPartialScoring) {
        let correctCount = 0;
        for (let gp of givenPairs) {
          if (correctPairs.some((cp) => cp.key === gp.key && cp.value === gp.value)) {
            correctCount++;
          }
        }
        awardedMarks = (qSnap.marks || 1) * (correctCount / correctPairs.length);
        isCorrect = correctCount === correctPairs.length;
      } else {
        const allCorrect =
          correctPairs.length === givenPairs.length &&
          correctPairs.every((cp) =>
            givenPairs.some((gp) => gp.key === cp.key && gp.value === cp.value)
          );

        if (allCorrect) {
          isCorrect = true;
          awardedMarks = qSnap.marks || 1;
        } else {
          awardedMarks = exam.settings?.negativeMarking || 0;
        }
      }
    }

    // ✅ Update answer record
    ans.isCorrect = isCorrect;
    ans.marksObtained = Math.max(0, awardedMarks);
    totalMarks += ans.marksObtained;
  }

  // ✅ Update attempt
  attempt.totalMarksObtained = totalMarks;
  attempt.status = "evaluated";

  // ✅ Assign grade
  const percentage = (totalMarks / exam.totalMarks) * 100;
  let grade = "F";

  // Use grading thresholds from exam settings (if defined)
  const grading = exam.settings?.grading || {
    A: 85,
    B: 70,
    C: 50,
    D: 35
  };

  if (percentage >= grading.A) grade = "A";
  else if (percentage >= grading.B) grade = "B";
  else if (percentage >= grading.C) grade = "C";
  else if (percentage >= grading.D) grade = "D";
  else grade = "F";

  attempt.grade = grade;

  await attempt.save();
  return attempt;
};
