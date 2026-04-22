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
import { requireRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/start", requireRoles(["Student"]), startAttempt);
router.get("/active/:examId", requireRoles(["Student"]), getActiveAttemptByExam);
router.patch("/:attemptId/answer", requireRoles(["Student"]), autosaveAttemptAnswer);
router.post("/submit", requireRoles(["Student"]), submitAttempt);
router.post("/evaluate", requireRoles(["Super Admin", "School Admin", "Teacher"]), evaluateAttempt);
router.get("/", requireRoles(["Super Admin", "School Admin", "Teacher", "Student", "Parent"]), getAttempts);
router.get("/:id", requireRoles(["Super Admin", "School Admin", "Teacher", "Student", "Parent"]), getAttemptById);


export default router;
