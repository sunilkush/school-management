import { Router } from "express";
import { getFeeReport } from "../controllers/feeReport.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

/*
Examples:
GET /fees/report?type=daily
GET /fees/report?type=monthly&month=May
GET /fees/report?type=class-wise&classId=123
GET /fees/report?type=pending
*/
router.get("/", getFeeReport);

export default router;
