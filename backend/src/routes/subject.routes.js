import { Router } from "express";
import {
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject
} from "../controllers/subject.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Define Role-Based Access
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_ROLES = ["Super Admin", "School Admin", "Teacher", "Student"];

// ✅ Create Subject (Super Admin & Admin)
router.post("/create", auth, roleMiddleware(ADMIN_ROLE), createSubject);

// ✅ Get All Subjects (Admin & Teacher)
router.get("/all", auth, roleMiddleware(TEACHER_ROLE), getAllSubjects);

// ✅ Get Subject by ID (All Users)
router.get("/:id", auth, roleMiddleware(ALL_ROLES), getSubject);

// ✅ Update Subject (Super Admin & Admin)
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateSubject);

// ✅ Delete Subject (Super Admin & Admin)
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteSubject);

export default router;
