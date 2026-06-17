import { Router } from "express";
import {
  getAttendanceSummary,
  getFinanceSummary,
  getAcademicSummary,
  getPlatformOverview,
} from "../controllers/analytics.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/attendance", auth, roleMiddleware(["Super Admin", "School Admin", "Principal"]), getAttendanceSummary);
router.get("/finance", auth, roleMiddleware("Super Admin"), getFinanceSummary);
router.get("/academic", auth, roleMiddleware("Super Admin"), getAcademicSummary);
router.get("/overview", auth, roleMiddleware("Super Admin"), getPlatformOverview);

export default router;
