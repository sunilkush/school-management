import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  assignSchoolsToSubject,
  assignTeachersToSubject,
} from "../controllers/subject.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const ADMIN_ROLES = ["Super Admin", "School Admin"];
const TEACHER_ROLES = ["Super Admin", "School Admin", "Teacher"];
const ALL_ROLES = ["Super Admin", "School Admin", "Teacher", "Student"];

router.post(
  "/create",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ body: { name: { required: true, type: "string" } } }),
  createSubject
);

router.get(
  "/all",
  auth,
  roleMiddleware(TEACHER_ROLES),
  validate({ query: { page: { type: "positiveInt" }, limit: { type: "positiveInt" } } }),
  getAllSubjects
);

router.get(
  "/:id",
  auth,
  roleMiddleware(ALL_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getSubject
);

router.put(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateSubject
);

router.put(
  "/assign-schools/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  assignSchoolsToSubject
);

router.put(
  "/assign-teachers/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  assignTeachersToSubject
);

router.delete(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  deleteSubject
);

export default router;
