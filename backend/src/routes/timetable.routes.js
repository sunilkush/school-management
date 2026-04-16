import { Router } from "express";
import {
  createClassTimetableEntry,
  deleteClassTimetableEntry,
  listClassTimetable,
  listTeacherTimetable,
  updateClassTimetableEntry,
} from "../controllers/timetable.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_AND_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

router.get("/class", auth, roleMiddleware(ADMIN_AND_TEACHER), listClassTimetable);
router.get("/teacher", auth, roleMiddleware(ADMIN_AND_TEACHER), listTeacherTimetable);
router.post("/", auth, roleMiddleware(ADMIN_ONLY), createClassTimetableEntry);
router.put("/:id", auth, roleMiddleware(ADMIN_ONLY), updateClassTimetableEntry);
router.delete("/:id", auth, roleMiddleware(ADMIN_ONLY), deleteClassTimetableEntry);

export default router;
