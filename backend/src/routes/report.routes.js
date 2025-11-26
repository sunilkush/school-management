
import { Router } from "express";
import {
    getReport as getReports,
    createReport,
    deleteReport,
    viewReport,
    getSchoolOverviewReport 
} from "../controllers/report.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const SUPER_ADMIN_ROLE = ["Super Admin"];

const router = Router();


// ✅ Public Routes
router.get("/getReport", auth, roleMiddleware(SUPER_ADMIN_ROLE), getReports);
router.post("/create", auth, roleMiddleware(ADMIN_ROLE), createReport);

router.delete("delete/:id", auth, roleMiddleware(SUPER_ADMIN_ROLE), deleteReport);
router.get("view/:id", auth, roleMiddleware(SUPER_ADMIN_ROLE), viewReport);



router.get('/school/:schoolId/academic-year/:academicYearId', getSchoolOverviewReport);

export default router;