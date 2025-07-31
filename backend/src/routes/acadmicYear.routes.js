import { Router } from "express";
import {
 createAcademicYear,
 getAcademicYearsBySchool,
 getSingleAcademicYear,
 updateAcademicYear,
 deleteAcademicYear,
 setActiveAcademicYear,
 getActiveAcademicYearBySchool

} from "../controllers/academicYear.controller.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];

// 💡 Routes
router.post("/create", auth, roleMiddleware(ADMIN_ROLE), createAcademicYear);
router.get("/:schoolId", auth, roleMiddleware(ALL_USERS), getAcademicYearsBySchool);
router.get("/single/:id", auth, roleMiddleware(ALL_USERS), getSingleAcademicYear);
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateAcademicYear);
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteAcademicYear);
router.put("/active/:id", auth, roleMiddleware(ADMIN_ROLE), setActiveAcademicYear);
router.get("/active/school/:schoolId", auth, roleMiddleware(ALL_USERS), getActiveAcademicYearBySchool);

export default router;
