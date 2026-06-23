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

// Lesson plans are created and managed by teaching staff
const LP_WRITE = [
  "Super Admin", "School Admin",
  "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator",
];

// Leadership + teaching staff can read lesson plans
const LP_READ = [
  ...LP_WRITE,
  "Exam Coordinator",   // needs visibility for scheduling exams around syllabus
];

router.get("/",    auth, roleMiddleware(LP_READ),  getLessonPlans);
router.post("/",   auth, roleMiddleware(LP_WRITE), createLessonPlan);
router.get("/:id", auth, roleMiddleware(LP_READ),  getLessonPlanById);
router.put("/:id", auth, roleMiddleware(LP_WRITE), updateLessonPlan);
router.delete("/:id", auth, roleMiddleware(LP_WRITE), deleteLessonPlan);

export default router;
