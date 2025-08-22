import express from "express";
import {
  startAttempt,
  submitAttempt,
  evaluateAttempt,
  getAttemptById,
  getAttempts
} from "../controllers/attempt.controllers.js";

const router = express.Router();

// Start a new attempt
router.post("/start", startAttempt);

// Submit attempt
router.post("/submit", submitAttempt);

// Evaluate subjective answers
router.post("/evaluate", evaluateAttempt);

// Fetch single attempt
router.get("/:id", getAttemptById);

// Fetch all attempts (filters + pagination)
router.get("/", getAttempts);

export default router;
