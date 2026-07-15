import { Router } from "express";
import {
  assignStudentTransport,
  createTeacherHomework,
  createTimetableEntry,
  deleteTeacherHomework,
  getHomeworkSubmissions,
  getMyGrades,
  getMyHomework,
  getMyHostel,
  getMyProfile,
  getMyLibraryBooks,
  getMyTimetable,
  getMyTransport,
  getTeacherHomework,
  gradeSubmission,
  submitHomework,
  updateMyProfile,
  updateTeacherHomework,
  getChildHomework,
  getChildTransport,
  getChildHostel,
  getChildLibrary,
} from "../controllers/studentPortal.controllers.js";
import {
  getMyChildren,
  getMyStudentEnrollmentId,
} from "../controllers/student.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const STUDENT_ONLY = ["Student"];
const ADMIN_AND_TEACHER = ["Super Admin", "School Admin", "Teacher", "Sports Teacher", "Class Teacher"];

router.get("/me/grades", auth, roleMiddleware(STUDENT_ONLY), getMyGrades);
router.get("/me/profile", auth, roleMiddleware(STUDENT_ONLY), getMyProfile);
router.put("/me/profile", auth, roleMiddleware(STUDENT_ONLY), updateMyProfile);
router.get("/my/profile", auth, roleMiddleware(STUDENT_ONLY), getMyProfile);
router.put("/my/profile", auth, roleMiddleware(STUDENT_ONLY), updateMyProfile);
router.get(
  "/my/enrollment-id",
  auth,
  roleMiddleware(["Student", "Parent"]),
  getMyStudentEnrollmentId
);
router.get("/my-children", auth, roleMiddleware(["Parent"]), getMyChildren);
router.get("/me/timetable", auth, roleMiddleware(STUDENT_ONLY), getMyTimetable);
router.get("/me/homework", auth, roleMiddleware(STUDENT_ONLY), getMyHomework);
router.post("/me/homework/:assignmentId/submit", auth, roleMiddleware(STUDENT_ONLY), upload.fields([{ name: "attachments", maxCount: 2 }]), submitHomework);
router.get("/me/transport", auth, roleMiddleware(STUDENT_ONLY), getMyTransport);
router.get("/me/library-books", auth, roleMiddleware(STUDENT_ONLY), getMyLibraryBooks);
router.get("/teacher/homework", auth, roleMiddleware(ADMIN_AND_TEACHER), getTeacherHomework);
router.post("/teacher/homework", auth, roleMiddleware(ADMIN_AND_TEACHER), createTeacherHomework);
router.get(
  "/teacher/homework/:assignmentId/submissions",
  auth,
  roleMiddleware(ADMIN_AND_TEACHER),
  getHomeworkSubmissions
);
router.put("/teacher/homework/:id", auth, roleMiddleware(ADMIN_AND_TEACHER), updateTeacherHomework);
router.delete("/teacher/homework/:id", auth, roleMiddleware(ADMIN_AND_TEACHER), deleteTeacherHomework);
router.put(
  "/teacher/homework/submissions/:submissionId/grade",
  auth,
  roleMiddleware(ADMIN_AND_TEACHER),
  gradeSubmission
);
router.get("/me/hostel", auth, roleMiddleware(STUDENT_ONLY), getMyHostel);

// Parent child endpoints
router.get("/child/:childId/homework",  auth, roleMiddleware(["Parent"]), getChildHomework);
router.get("/child/:childId/transport", auth, roleMiddleware(["Parent"]), getChildTransport);
router.get("/child/:childId/hostel",    auth, roleMiddleware(["Parent"]), getChildHostel);
router.get("/child/:childId/library",   auth, roleMiddleware(["Parent"]), getChildLibrary);

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
