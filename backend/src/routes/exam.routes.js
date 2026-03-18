// routes/exam.routes.js
import express from "express";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  startExamAttempt,
  submitExamAttempt,
  evaluateAttempt
} from "../controllers/exam.controllers.js";
import {auth, roleMiddleware} from "../middlewares/auth.middleware.js";
const router = express.Router();
const EXAM_MANAGERS = ['Super Admin', 'Teacher', 'School Admin'];
const EXAM_READERS = [...EXAM_MANAGERS, 'Student', 'Parent'];
const EXAM_ATTEMPT_ROLES = [...EXAM_MANAGERS, 'Student'];
// Exam CRUD
router.post("/", auth, roleMiddleware(EXAM_MANAGERS), createExam);
router.get("/", auth, roleMiddleware(EXAM_READERS), getExams);

// Attempts
router.post("/attempt/start", auth, roleMiddleware(EXAM_ATTEMPT_ROLES), startExamAttempt);
router.post("/attempt/submit", auth, roleMiddleware(EXAM_ATTEMPT_ROLES), submitExamAttempt);
router.post("/attempt/evaluate", auth, roleMiddleware(EXAM_MANAGERS), evaluateAttempt);

router.get("/:id", auth, roleMiddleware(EXAM_READERS), getExamById);
router.put("/:id", auth, roleMiddleware(EXAM_MANAGERS), updateExam);
router.delete("/:id", auth, roleMiddleware(EXAM_MANAGERS), deleteExam);

// Publish
router.put("/:id/publish", auth, roleMiddleware(EXAM_MANAGERS), publishExam);



export default router;
