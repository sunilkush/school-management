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
router.post("/create",auth,roleMiddleware("Teacher"), createQuestion);
router.post("/bulk",auth,roleMiddleware("Teacher"),upload.single("file"), bulkCreateQuestionsFromExcel );

// Read
router.get("/getQuestions",auth,roleMiddleware("Teacher"), getQuestions);
router.get("/:id",auth,roleMiddleware("Teacher"), getQuestionById);

// Update
router.put("/:id",auth,roleMiddleware("Teacher"), updateQuestion);

// Delete
router.delete("/:id",auth,roleMiddleware("Teacher"), deleteQuestion);

// Toggle Active
router.patch("/:id/toggle",auth,roleMiddleware("Teacher"), toggleQuestionStatus);

export default router;
