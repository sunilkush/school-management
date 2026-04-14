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
      examDate: { required: true, validate: (value) => !Number.isNaN(new Date(value).getTime()), message: "body.examDate must be a valid date" },
      startTime: { required: true, validate: (value) => !Number.isNaN(new Date(value).getTime()), message: "body.startTime must be a valid date" },
      endTime: { required: true, validate: (value) => !Number.isNaN(new Date(value).getTime()), message: "body.endTime must be a valid date" },
      totalMarks: { required: true, validate: (value) => Number(value) > 0, message: "body.totalMarks must be greater than 0" },
      passingMarks: { required: true, validate: (value) => Number(value) >= 0, message: "body.passingMarks must be zero or positive" },
    },
  }),
  createExam
);

router.get("/", auth, roleMiddleware(READ_ROLES), getExams);

// Keep all static and nested endpoints before `/:id` routes.
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

router.get("/:id", auth, roleMiddleware(READ_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), getExamById);
router.get(
  "/:id/analytics",
  auth,
  roleMiddleware(READ_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getExamAnalytics
);
router.put(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      title: { required: false, type: "string" },
      name: { required: false, type: "string" },
      totalMarks: { required: false, validate: (value) => Number(value) > 0, message: "body.totalMarks must be greater than 0" },
      passingMarks: { required: false, validate: (value) => Number(value) >= 0, message: "body.passingMarks must be zero or positive" },
    },
  }),
  updateExam
);
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), deleteExam);
router.put("/:id/publish", auth, roleMiddleware(ADMIN_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), publishExam);

export default router;
