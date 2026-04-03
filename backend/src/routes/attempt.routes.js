import express from "express";
import {
  startAttempt,
  submitAttempt,
  evaluateAttempt,
  getAttemptById,
  getAttempts,
} from "../controllers/attempt.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const READ_ROLES = ["Super Admin", "School Admin", "Teacher"];
const STUDENT_ROLES = ["Student"];

router.post(
  "/start",
  auth,
  roleMiddleware(STUDENT_ROLES),
  validate({
    body: {
      examId: { required: true, type: "objectId" },
      studentId: { required: true, type: "objectId" },
      examSubjectId: { required: true, type: "objectId" },
    },
  }),
  startAttempt
);

router.post(
  "/submit",
  auth,
  roleMiddleware(STUDENT_ROLES),
  validate({ body: { attemptId: { required: true, type: "objectId" } } }),
  submitAttempt
);

router.post(
  "/evaluate",
  auth,
  roleMiddleware(READ_ROLES),
  validate({ body: { attemptId: { required: true, type: "objectId" } } }),
  evaluateAttempt
);

router.get(
  "/:id",
  auth,
  roleMiddleware([...READ_ROLES, ...STUDENT_ROLES]),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getAttemptById
);

router.get("/", auth, roleMiddleware([...READ_ROLES, ...STUDENT_ROLES]), getAttempts);

export default router;
