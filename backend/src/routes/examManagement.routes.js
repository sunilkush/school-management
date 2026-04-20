import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  cloneExamPaper,
  createManagedExam,
  createQuestionBankItem,
  evaluateSubjectiveAnswer,
  finalizeEvaluation,
  getActiveAttempt,
  getExamAnalyticsDashboard,
  getExamPaper,
  getExamSettings,
  getMyResult,
  getPendingEvaluations,
  getReportCard,
  getResultsByExam,
  importQuestionBank,
  listManagedExams,
  listQuestionBank,
  listStudentOnlineExams,
  processExamResults,
  publishExamResults,
  saveOnlineAnswer,
  startOnlineAttempt,
  submitOnlineAttempt,
  transitionExamStatus,
  updateManagedExam,
  upsertExamSettings,
  upsertExamPaper,
} from "../controllers/examManagement.controllers.js";

const router = express.Router();

const ADMIN_MANAGERS = ["Super Admin", "School Admin", "Exam Coordinator"];
const TEACHER_MANAGERS = [...ADMIN_MANAGERS, "Teacher", "Class Teacher"];

router.use(auth);

router
  .route("/settings")
  .get(roleMiddleware(TEACHER_MANAGERS), getExamSettings)
  .put(roleMiddleware(ADMIN_MANAGERS), upsertExamSettings);

router
  .route("/exams")
  .get(roleMiddleware(TEACHER_MANAGERS), listManagedExams)
  .post(roleMiddleware(TEACHER_MANAGERS), createManagedExam);
router.put("/exams/:id", roleMiddleware(TEACHER_MANAGERS), updateManagedExam);
router.patch("/exams/:id/status", roleMiddleware(TEACHER_MANAGERS), transitionExamStatus);

router
  .route("/question-bank")
  .get(roleMiddleware(TEACHER_MANAGERS), listQuestionBank)
  .post(roleMiddleware(TEACHER_MANAGERS), createQuestionBankItem);
router.post("/question-bank/import", roleMiddleware(TEACHER_MANAGERS), importQuestionBank);

router
  .route("/papers")
  .post(roleMiddleware(TEACHER_MANAGERS), upsertExamPaper);
router.get("/papers/:examId", roleMiddleware(TEACHER_MANAGERS), getExamPaper);
router.post("/papers/:id/clone", roleMiddleware(TEACHER_MANAGERS), cloneExamPaper);

router.get("/student/online-exams", roleMiddleware(["Student"]), listStudentOnlineExams);
router.post("/student/attempt/start", roleMiddleware(["Student"]), startOnlineAttempt);
router.get("/student/attempt/:examId/active", roleMiddleware(["Student"]), getActiveAttempt);
router.post("/student/attempt/answer", roleMiddleware(["Student"]), saveOnlineAnswer);
router.post("/student/attempt/submit", roleMiddleware(["Student"]), submitOnlineAttempt);

router.get("/evaluation/pending", roleMiddleware(TEACHER_MANAGERS), getPendingEvaluations);
router.patch("/evaluation/answer/:answerId", roleMiddleware(TEACHER_MANAGERS), evaluateSubjectiveAnswer);
router.post("/evaluation/finalize", roleMiddleware(TEACHER_MANAGERS), finalizeEvaluation);

router.post("/results/process", roleMiddleware(ADMIN_MANAGERS), processExamResults);
router.post("/results/publish", roleMiddleware(ADMIN_MANAGERS), publishExamResults);
router.get("/results/exam/:examId", roleMiddleware(TEACHER_MANAGERS), getResultsByExam);
router.get("/results/me", roleMiddleware(["Student", "Parent", ...TEACHER_MANAGERS]), getMyResult);
router.get("/results/student/:studentId", roleMiddleware(["Parent", ...TEACHER_MANAGERS]), getMyResult);

router.get("/report-card/me", roleMiddleware(["Student", "Parent", ...TEACHER_MANAGERS]), getReportCard);
router.get("/report-card/student/:studentId", roleMiddleware(["Parent", ...TEACHER_MANAGERS]), getReportCard);

router.get("/analytics", roleMiddleware(TEACHER_MANAGERS), getExamAnalyticsDashboard);

export default router;
