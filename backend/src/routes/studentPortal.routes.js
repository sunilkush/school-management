import { Router } from "express";
import {
  assignStudentTransport,
  createTimetableEntry,
  getMyGrades,
  getMyLibraryBooks,
  getMyTimetable,
  getMyTransport,
} from "../controllers/studentPortal.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const STUDENT_ONLY = ["Student"];
const ADMIN_AND_TEACHER = ["Super Admin", "School Admin", "Teacher"];

router.get("/me/grades", auth, roleMiddleware(STUDENT_ONLY), getMyGrades);
router.get("/me/timetable", auth, roleMiddleware(STUDENT_ONLY), getMyTimetable);
router.get("/me/transport", auth, roleMiddleware(STUDENT_ONLY), getMyTransport);
router.get("/me/library-books", auth, roleMiddleware(STUDENT_ONLY), getMyLibraryBooks);

router.post(
  "/timetable",
  auth,
  roleMiddleware(ADMIN_AND_TEACHER),
  createTimetableEntry
);
router.post(
  "/transport/assign",
  auth,
  roleMiddleware(["Super Admin", "School Admin"]),
  assignStudentTransport
);

export default router;
