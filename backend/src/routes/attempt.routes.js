import express from "express";
import {
  startAttempt,
  submitAttempt,
  evaluateAttempt,
  getAttemptById,
  getAttempts,
  autosaveAttemptAnswer,
  getActiveAttemptByExam,
} from "../controllers/attempt.controllers.js";
import { roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/start", roleMiddleware(["Student"]), startAttempt);
router.get("/active/:examId", roleMiddleware(["Student"]), getActiveAttemptByExam);
router.patch("/:attemptId/answer", roleMiddleware(["Student"]), autosaveAttemptAnswer);
router.post("/submit", roleMiddleware(["Student"]), submitAttempt);
router.post("/evaluate", roleMiddleware(["Super Admin", "School Admin", "Teacher", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator"]), evaluateAttempt);
router.get("/", roleMiddleware(["Super Admin", "School Admin", "Teacher", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator", "Student", "Parent"]), getAttempts);
router.get("/:id", roleMiddleware(["Super Admin", "School Admin", "Teacher", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator", "Student", "Parent"]), getAttemptById);


export default router;
