import express from "express";
import {
  createQuestion,
  bulkCreateQuestionsFromExcel,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus
} from "../controllers/question.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Create
router.post("/create", createQuestion);
router.post("/bulk",upload.single("file"), bulkCreateQuestionsFromExcel );

// Read
router.get("/getQuestions", getQuestions);
router.get("/:id", getQuestionById);

// Update
router.put("/:id", updateQuestion);

// Delete
router.delete("/:id", deleteQuestion);

// Toggle Active
router.patch("/:id/toggle", toggleQuestionStatus);

export default router;
