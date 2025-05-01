import { Router } from "express";
import {
    registerSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    activateSchool,
    deactivateSchool,
    deleteSchool
} from "../controllers/school.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const STUDENT_ROLE = ["Super Admin", "School Admin", "Teacher", "Student"];

// ✅ Register a School (Super Admin & Admin)
router.post(
    "/register",
  
    upload.fields([{ name: "logo", maxCount: 1 }]),
    registerSchool
);

// ✅ Update School Details (Super Admin & Admin)
router.post(
    "/update/:id",
    auth,
    roleMiddleware(ADMIN_ROLE),
    upload.fields([{ name: "logo", maxCount: 1 }]),
    updateSchool
);

// ✅ Get All Schools (Super Admin, Admin, Teacher)
router.get("/", auth, roleMiddleware(TEACHER_ROLE), getAllSchools);
router.get("/getAllSchool", auth, roleMiddleware(ADMIN_ROLE), getAllSchools);

// ✅ Get School by ID (Super Admin, Admin, Teacher, Student)
router.get("/:id", auth, roleMiddleware(STUDENT_ROLE), getSchoolById);

// ✅ Activate School (Super Admin & Admin)
router.put("/activate/:id", auth, roleMiddleware(ADMIN_ROLE), activateSchool);

// ✅ Deactivate School (Super Admin & Admin)
router.put("/deactivate/:id", auth, roleMiddleware(ADMIN_ROLE), deactivateSchool);

// ✅ Delete School (Super Admin & Admin)
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteSchool);

export default router;
