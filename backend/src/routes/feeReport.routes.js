import { Router } from "express";
import { getFeeReport } from "../controllers/feeReport.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const FEE_REPORT_ROLES = [
  "Super Admin", "School Admin", "Accountant",
  "Principal", "Vice Principal",
];

router.use(auth);

router.get("/", roleMiddleware(FEE_REPORT_ROLES), getFeeReport);

export default router;
