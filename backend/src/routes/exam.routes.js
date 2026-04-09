import express from "express";
import {
  assignExamToClass,
  createExam,
  deleteExam,
  enterMarksBulk,
  evaluateAttempt,
  getClassResultSummary,
  getExamById,
  getExamAnalytics,
  getExams,
  getParentViewResult,
  getStudentResult,
  publishExam,
  publishResult,
  startExamAttempt,
  submitExamAttempt,
  submitFinalMarks,
  updateExam,
  updateMarks,
} from "../controllers/exam.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const ADMIN_ROLES = ["Super Admin", "School Admin"];
const TEACHER_ROLES = ["Super Admin", "School Admin", "Teacher"];
const READ_ROLES = [...TEACHER_ROLES, "Student", "Parent"];
const STUDENT_RESULT_ROLES = ["Super Admin", "School Admin", "Teacher", "Student"];
const PARENT_RESULT_ROLES = ["Super Admin", "School Admin", "Teacher", "Parent"];

router.post(
  "/",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({
    body: {
      academicYearId: { required: true, type: "objectId" },
      schoolClassId: { required: true, type: "objectId" },
      subjectId: { required: true, type: "objectId" },
      title: { required: false, type: "string" },
      name: { required: false, type: "string" },
    },
  }),
  createExam
);

router.get("/", auth, roleMiddleware(READ_ROLES), getExams);
router.get("/:id", auth, roleMiddleware(READ_ROLES), getExamById);
router.get("/:id/analytics", auth, roleMiddleware(READ_ROLES), getExamAnalytics);
router.put("/:id", auth, roleMiddleware(ADMIN_ROLES), updateExam);
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLES), deleteExam);
router.put("/:id/publish", auth, roleMiddleware(ADMIN_ROLES), publishExam);

router.post(
  "/assign-class",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({
    body: {
      examId: { required: true, type: "objectId" },
      schoolClassId: { required: true, type: "objectId" },
    },
  }),
  assignExamToClass
);

router.post("/marks/bulk", auth, roleMiddleware(TEACHER_ROLES), enterMarksBulk);
router.patch("/marks/:id", auth, roleMiddleware(TEACHER_ROLES), updateMarks);
router.post(
  "/marks/submit",
  auth,
  roleMiddleware(TEACHER_ROLES),
  validate({
    body: {
      examId: { required: true, type: "objectId" },
      schoolClassId: { required: true, type: "objectId" },
    },
  }),
  submitFinalMarks
);

router.post(
  "/results/publish",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({
    body: {
      examId: { required: true, type: "objectId" },
      schoolClassId: { required: true, type: "objectId" },
    },
  }),
  publishResult
);

router.get("/results/student", auth, roleMiddleware(STUDENT_RESULT_ROLES), getStudentResult);
router.get("/results/student/:studentId", auth, roleMiddleware(STUDENT_RESULT_ROLES), getStudentResult);
router.get("/results/parent", auth, roleMiddleware(PARENT_RESULT_ROLES), getParentViewResult);
router.get("/results/parent/:studentId", auth, roleMiddleware(PARENT_RESULT_ROLES), getParentViewResult);
router.get(
  "/results/class-summary",
  auth,
  roleMiddleware(TEACHER_ROLES),
  validate({ query: { examId: { required: true, type: "objectId" }, schoolClassId: { required: true, type: "objectId" } } }),
  getClassResultSummary
);

router.post("/attempt/start", auth, roleMiddleware(["Super Admin", "Teacher", "School Admin", "Student"]), startExamAttempt);
router.post("/attempt/submit", auth, roleMiddleware(["Super Admin", "Teacher", "School Admin", "Student"]), submitExamAttempt);
router.post("/attempt/evaluate", auth, roleMiddleware(["Super Admin", "Teacher", "School Admin"]), evaluateAttempt);

export default router;
