import { Router } from "express";
import {
    createAcademicYear,
    getAcademicYearsBySchool,
    getSingleAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setActiveAcademicYear,
    archiveAcademicYear,
    getActiveAcademicYearBySchool,
} from "../controllers/academicYear.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Role Groups
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent","Accountant"];

// 💡 Routes


// ✅ Create Academic Year
router.post("/create", auth, roleMiddleware(ADMIN_ROLE), createAcademicYear);

// ✅ Get All Academic Years for a School
router.get("/school/:schoolId", auth, roleMiddleware(ALL_USERS), getAcademicYearsBySchool);

// ✅ Get Active Academic Year by School
router.get("/active/:schoolId", auth, roleMiddleware(ALL_USERS), getActiveAcademicYearBySchool);

// ✅ Get Single Academic Year by ID
router.get("/:id", auth, roleMiddleware(ALL_USERS), getSingleAcademicYear);

// ✅ Update Academic Year by ID
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateAcademicYear);

// ✅ Delete Academic Year by ID
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteAcademicYear);

// ✅ Set Academic Year as Active
router.post("/activate/:id", auth, roleMiddleware(ADMIN_ROLE), setActiveAcademicYear);

// ✅ Archive Academic Year
router.post("/archive/:id", auth, roleMiddleware(ADMIN_ROLE), archiveAcademicYear);

export default router;
