import express from "express";
import {
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus
} from "../controllers/question.controllers.js";

const router = express.Router();

// Create
router.post("/", createQuestion);
router.post("/bulk", bulkCreateQuestions);

// Read
router.get("/", getQuestions);
router.get("/:id", getQuestionById);

// Update
router.put("/:id", updateQuestion);

// Delete
router.delete("/:id", deleteQuestion);

// Toggle Active
router.patch("/:id/toggle", toggleQuestionStatus);

export default router;
