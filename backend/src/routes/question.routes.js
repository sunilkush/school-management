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

// Create
router.post("/create",auth,roleMiddleware(["Teacher", "School Admin"]), createQuestion);
router.post("/bulk",auth,roleMiddleware(["Teacher", "School Admin"]),upload.single("file"), bulkCreateQuestionsFromExcel );

// Read
router.get("/getQuestions",auth,roleMiddleware(["Teacher", "School Admin"]), getQuestions);
router.get("/:id",auth,roleMiddleware(["Teacher", "School Admin"]), getQuestionById);

// Update
router.put("/:id",auth,roleMiddleware(["Teacher", "School Admin"]), updateQuestion);

// Delete
router.delete("/:id",auth,roleMiddleware(["Teacher", "School Admin"]), deleteQuestion);

// Toggle Active
router.patch("/:id/toggle",auth,roleMiddleware(["Teacher", "School Admin"]), toggleQuestionStatus);

export default router;
