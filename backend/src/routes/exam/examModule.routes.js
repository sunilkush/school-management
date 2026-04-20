import express from "express";
import { auth, roleMiddleware } from "../../middlewares/auth.middleware.js";
import {
  analyticsOverview,
  availableOnlineExams,
  bulkSaveMarks,
  classPerformance,
  clearAnswer,
  createExam,
  createGradeScale,
  createPaper,
  createQuestion,
  createSchedule,
  createSubjectConfig,
  deleteExam,
  deletePaper,
  deleteQuestion,
  deleteSchedule,
  deleteSubjectConfig,
  evaluationDetail,
  finalizeEvaluation,
  finalSubmitMarks,
  generateResults,
  getExam,
  getOnlineAttempt,
  getPaper,
  getQuestion,
  gradeSubjective,
  heartbeat,
  listExams,
  listGradeScale,
  listMarks,
  listPaper,
  listQuestion,
  listResults,
  listSchedule,
  listSubjectConfig,
  markReview,
  onlineAttemptResult,
  pendingEvaluation,
  publishResults,
  reportCardByStudent,
  resultByStudent,
  saveAnswer,
  startOnlineExam,
  studentMarks,
  subjectPerformance,
  submitAttempt,
  topperList,
  unpublishResults,
  updateExam,
  updateGradeScale,
  updatePaper,
  updateQuestion,
  updateSchedule,
  updateSubjectConfig,
} from "../../controllers/exam/examModule.controller.js";

const router = express.Router();

const ADMIN = ["Super Admin", "School Admin"];
const EXAM_MANAGER = ["Super Admin", "School Admin", "Teacher"];
const RESULT_VIEW = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];

router.post("/exams", auth, roleMiddleware(EXAM_MANAGER), createExam);
router.get("/exams", auth, roleMiddleware(RESULT_VIEW), listExams);
router.get("/exams/:id", auth, roleMiddleware(RESULT_VIEW), getExam);
router.put("/exams/:id", auth, roleMiddleware(EXAM_MANAGER), updateExam);
router.delete("/exams/:id", auth, roleMiddleware(ADMIN), deleteExam);

router.post("/exam-subject-config", auth, roleMiddleware(EXAM_MANAGER), createSubjectConfig);
router.get("/exam-subject-config", auth, roleMiddleware(EXAM_MANAGER), listSubjectConfig);
router.put("/exam-subject-config/:id", auth, roleMiddleware(EXAM_MANAGER), updateSubjectConfig);
router.delete("/exam-subject-config/:id", auth, roleMiddleware(ADMIN), deleteSubjectConfig);

router.post("/exam-schedules", auth, roleMiddleware(EXAM_MANAGER), createSchedule);
router.get("/exam-schedules", auth, roleMiddleware(RESULT_VIEW), listSchedule);
router.put("/exam-schedules/:id", auth, roleMiddleware(EXAM_MANAGER), updateSchedule);
router.delete("/exam-schedules/:id", auth, roleMiddleware(ADMIN), deleteSchedule);

router.post("/question-bank", auth, roleMiddleware(EXAM_MANAGER), createQuestion);
router.get("/question-bank", auth, roleMiddleware(EXAM_MANAGER), listQuestion);
router.get("/question-bank/:id", auth, roleMiddleware(EXAM_MANAGER), getQuestion);
router.put("/question-bank/:id", auth, roleMiddleware(EXAM_MANAGER), updateQuestion);
router.delete("/question-bank/:id", auth, roleMiddleware(EXAM_MANAGER), deleteQuestion);

router.post("/question-papers", auth, roleMiddleware(EXAM_MANAGER), createPaper);
router.get("/question-papers", auth, roleMiddleware(EXAM_MANAGER), listPaper);
router.get("/question-papers/:id", auth, roleMiddleware(EXAM_MANAGER), getPaper);
router.put("/question-papers/:id", auth, roleMiddleware(EXAM_MANAGER), updatePaper);
router.delete("/question-papers/:id", auth, roleMiddleware(EXAM_MANAGER), deletePaper);

router.post("/exam-marks/bulk-save", auth, roleMiddleware(EXAM_MANAGER), bulkSaveMarks);
router.post("/exam-marks/final-submit", auth, roleMiddleware(EXAM_MANAGER), finalSubmitMarks);
router.get("/exam-marks", auth, roleMiddleware(EXAM_MANAGER), listMarks);
router.get("/exam-marks/student/:studentId", auth, roleMiddleware(RESULT_VIEW), studentMarks);

router.post("/exam-results/generate", auth, roleMiddleware(EXAM_MANAGER), generateResults);
router.get("/exam-results", auth, roleMiddleware(RESULT_VIEW), listResults);
router.get("/exam-results/student/:studentId", auth, roleMiddleware(RESULT_VIEW), resultByStudent);
router.get("/exam-results/report-card", auth, roleMiddleware(RESULT_VIEW), reportCardByStudent);
router.get("/exam-results/report-card/:studentId", auth, roleMiddleware(RESULT_VIEW), reportCardByStudent);
router.post("/exam-results/publish", auth, roleMiddleware(ADMIN), publishResults);
router.post("/exam-results/unpublish", auth, roleMiddleware(ADMIN), unpublishResults);

router.get("/exam-analytics/overview", auth, roleMiddleware(EXAM_MANAGER), analyticsOverview);
router.get("/exam-analytics/class-performance", auth, roleMiddleware(EXAM_MANAGER), classPerformance);
router.get("/exam-analytics/subject-performance", auth, roleMiddleware(EXAM_MANAGER), subjectPerformance);
router.get("/exam-analytics/topper-list", auth, roleMiddleware(EXAM_MANAGER), topperList);

router.post("/grade-scale", auth, roleMiddleware(ADMIN), createGradeScale);
router.get("/grade-scale", auth, roleMiddleware(EXAM_MANAGER), listGradeScale);
router.put("/grade-scale/:id", auth, roleMiddleware(ADMIN), updateGradeScale);

router.get("/online-exams/available", auth, roleMiddleware(["Student"]), availableOnlineExams);
router.post("/online-exams/:examId/start", auth, roleMiddleware(["Student"]), startOnlineExam);
router.get("/online-exams/attempt/:attemptId", auth, roleMiddleware(["Student", "Teacher", "School Admin", "Super Admin"]), getOnlineAttempt);
router.post("/online-exams/attempt/:attemptId/save-answer", auth, roleMiddleware(["Student"]), saveAnswer);
router.post("/online-exams/attempt/:attemptId/mark-review", auth, roleMiddleware(["Student"]), markReview);
router.post("/online-exams/attempt/:attemptId/clear-answer", auth, roleMiddleware(["Student"]), clearAnswer);
router.post("/online-exams/attempt/:attemptId/submit", auth, roleMiddleware(["Student"]), submitAttempt);
router.post("/online-exams/attempt/:attemptId/heartbeat", auth, roleMiddleware(["Student"]), heartbeat);
router.get("/online-exams/attempt/:attemptId/result", auth, roleMiddleware(["Student", "Teacher", "School Admin", "Super Admin"]), onlineAttemptResult);

router.get("/online-exams/evaluation/pending", auth, roleMiddleware(EXAM_MANAGER), pendingEvaluation);
router.get("/online-exams/evaluation/:attemptId", auth, roleMiddleware(EXAM_MANAGER), evaluationDetail);
router.post("/online-exams/evaluation/:attemptId/grade-subjective", auth, roleMiddleware(EXAM_MANAGER), gradeSubjective);
router.post("/online-exams/evaluation/:attemptId/finalize", auth, roleMiddleware(EXAM_MANAGER), finalizeEvaluation);

export default router;
