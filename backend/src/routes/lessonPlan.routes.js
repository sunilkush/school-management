import { Router } from "express";
import {
  createLessonPlan,
  getLessonPlans,
  getLessonPlanById,
  updateLessonPlan,
  deleteLessonPlan,
} from "../controllers/lessonPlan.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const TEACHER_AND_ABOVE = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher", "Subject Coordinator", "Exam Coordinator"];

router.get("/",    auth, roleMiddleware(TEACHER_AND_ABOVE), getLessonPlans);
router.post("/",   auth, roleMiddleware(TEACHER_AND_ABOVE), createLessonPlan);
router.get("/:id", auth, roleMiddleware(TEACHER_AND_ABOVE), getLessonPlanById);
router.put("/:id", auth, roleMiddleware(TEACHER_AND_ABOVE), updateLessonPlan);
router.delete("/:id", auth, roleMiddleware(TEACHER_AND_ABOVE), deleteLessonPlan);

export default router;
