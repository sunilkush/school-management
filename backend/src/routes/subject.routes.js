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
import { requireRoles,auth,roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const SUPER_ADMIN = "Super Admin";
const SCHOOL_ADMIN = "School Admin";
const TEACHER = "Teacher";
const STUDENT = "Student";
const ALL_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT];
const ADMIN_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN];
const TEACHER_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER];

router.post(
  "/create",
  auth,
  roleMiddleware(ADMIN_ROLES),
  validate({ body: { name: { required: true, type: "string" } } }),
  createSubject
);

router.post("/", requireRoles(ADMIN_ROLES), createSubject);
router.get("/", requireRoles(TEACHER_ROLES), getAllSubjects);
router.get("/all", requireRoles(TEACHER_ROLES), getAllSubjects);
router.get("/:id", requireRoles(ALL_ROLES), getSubject);
router.put("/:id", requireRoles(ADMIN_ROLES), updateSubject);
router.delete("/:id", requireRoles(ADMIN_ROLES), deleteSubject);

// Backward-compatible aliases
router.post("/create", requireRoles(ADMIN_ROLES), createSubject);
router.put("/:id/assign-teachers", requireRoles(ADMIN_ROLES), updateSubject);
router.put("/assign-schools/:id", requireRoles(ADMIN_ROLES), assignSchoolsToSubject);
router.put("/assign-teachers/:id", requireRoles(ADMIN_ROLES), assignTeachersToSubject);

export default router;
