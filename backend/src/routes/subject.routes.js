import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  assignSchoolsToSubject
} from "../controllers/subject.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Define roles
const SUPER_ADMIN = "Super Admin";
const SCHOOL_ADMIN = "School Admin";
const TEACHER = "Teacher";
const STUDENT = "Student";

const ADMIN_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN];
const TEACHER_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER];
const ALL_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT];

// ✅ Create Subject (Super Admin & School Admin)
router.post("/create", auth, roleMiddleware(ADMIN_ROLES), createSubject);

// ✅ Get All Subjects (Super Admin, School Admin, Teacher)
router.get("/all", auth, roleMiddleware(TEACHER_ROLES), getAllSubjects);

// ✅ Get Subject by ID (All Roles)
router.get("/:id", auth, roleMiddleware(ALL_ROLES), getSubject);

// ✅ Update Subject (Super Admin & School Admin)
router.put("/:id", auth, roleMiddleware(ADMIN_ROLES), updateSubject);


// ✅ Delete Subject (Super Admin & School Admin)
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLES), deleteSubject);


router.put("/:id", auth, roleMiddleware(ADMIN_ROLES), assignSchoolsToSubject);



export default router;
