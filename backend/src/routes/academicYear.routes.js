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

// 💡 Routes

// ✅ Create Academic Year
router.post("/create", auth, roleMiddleware(ADMIN_ROLE), createAcademicYear);

// ✅ Get All Academic Years for a School (any authenticated user)
router.get("/school/:schoolId", auth, getAcademicYearsBySchool);

// ✅ Get Active Academic Year by School (any authenticated user)
router.get("/active/:schoolId", auth, getActiveAcademicYearBySchool);

// ✅ Get Single Academic Year by ID (any authenticated user)
router.get("/:id", auth, getSingleAcademicYear);

// ✅ Update Academic Year by ID
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateAcademicYear);

// ✅ Delete Academic Year by ID
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteAcademicYear);

// ✅ Set Academic Year as Active
router.post("/activate/:id", auth, roleMiddleware(ADMIN_ROLE), setActiveAcademicYear);

// ✅ Archive Academic Year
router.post("/archive/:id", auth, roleMiddleware(ADMIN_ROLE), archiveAcademicYear);

export default router;
