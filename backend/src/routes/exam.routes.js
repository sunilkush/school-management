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
const SUPER_ADMIN = ['Super Admin','Teacher','School Admin']
// Exam CRUD
router.post("/",auth,roleMiddleware(SUPER_ADMIN), createExam);
router.get("/",auth,roleMiddleware(SUPER_ADMIN), getExams);

// Attempts
router.post("/attempt/start",auth,roleMiddleware(SUPER_ADMIN), startExamAttempt);
router.post("/attempt/submit",auth,roleMiddleware(SUPER_ADMIN), submitExamAttempt);
router.post("/attempt/evaluate",auth,roleMiddleware(SUPER_ADMIN), evaluateAttempt);

router.get("/:id",auth,roleMiddleware(SUPER_ADMIN), getExamById);
router.put("/:id",auth,roleMiddleware(SUPER_ADMIN), updateExam);
router.delete("/:id",auth,roleMiddleware(SUPER_ADMIN), deleteExam);

// Publish
router.put("/:id/publish",auth,roleMiddleware(SUPER_ADMIN), publishExam);



export default router;
