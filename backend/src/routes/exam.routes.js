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

const router = express.Router();

// Exam CRUD
router.post("/", createExam);
router.get("/", getExams);
router.get("/:id", getExamById);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

// Publish
router.put("/:id/publish", publishExam);

// Attempts
router.post("/attempt/start", startExamAttempt);
router.post("/attempt/submit", submitExamAttempt);
router.post("/attempt/evaluate", evaluateAttempt);

export default router;
