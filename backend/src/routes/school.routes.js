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

const ADMIN_ROLE = ["Super Admin", "School Admin","Accountant"];

const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const STUDENT_ROLE = ["Super Admin", "School Admin", "Teacher", "Student"];

// ✅ Register a School (Super Admin)
router.post(
    "/register",
    auth,
     roleMiddleware("Super Admin"),
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
router.get("/getAllSchool", auth, roleMiddleware(ADMIN_ROLE), getAllSchools);

// ✅ Get School by ID (Super Admin, Admin, Teacher, Student)
router.get("/:id", auth, roleMiddleware(STUDENT_ROLE), getSchoolById);
router.get("/getRoleBySchool:id", auth,roleMiddleware("Super Admin"), getSchoolById);

// ✅ Activate School (Super Admin & Admin)
// Route param must be named `schoolId` — activateSchool reads req.params.schoolId, so a mismatched
// `:id` here silently made every activate request 404 ("School not found").
router.put("/activate/:schoolId", auth, roleMiddleware(ADMIN_ROLE), activateSchool);

// ✅ Deactivate School (Super Admin only)
router.put("/deactivate/:schoolId", auth, roleMiddleware(["Super Admin"]), deactivateSchool);

// ✅ Delete School (Super Admin only)
router.delete("/delete/:schoolId", auth, roleMiddleware(["Super Admin"]), deleteSchool);

export default router;
