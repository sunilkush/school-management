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
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const QUESTION_ROLES = ["Teacher", "School Admin", "Super Admin", "Exam Coordinator", "Principal", "Vice Principal"];

// Create
router.post("/create",auth,roleMiddleware(QUESTION_ROLES), createQuestion);
router.post("/bulk",auth,roleMiddleware(QUESTION_ROLES),upload.single("file"), bulkCreateQuestionsFromExcel );

// Read
router.get("/getQuestions",auth,roleMiddleware(QUESTION_ROLES), getQuestions);
router.get("/:id",auth,roleMiddleware(QUESTION_ROLES), getQuestionById);

// Update
router.put("/:id",auth,roleMiddleware(QUESTION_ROLES), updateQuestion);

// Delete
router.delete("/:id",auth,roleMiddleware(QUESTION_ROLES), deleteQuestion);

// Toggle Active
router.patch("/:id/toggle",auth,roleMiddleware(QUESTION_ROLES), toggleQuestionStatus);

export default router;
