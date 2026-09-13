import { Router } from "express";
import {
  assignFeesToStudents,
  previewFeeAssignment,
  getMyFees,
  studentFeeSummary,
} from "../controllers/studentFee.controllers.js";
import { auth , roleMiddleware} from "../middlewares/auth.middleware.js";

const router = Router();

/* =====================================================
   🔐 PROTECTED ROUTES
===================================================== */
router.use(auth);
const ADMIN_ONLY = ["School Admin", "Accountant"];
const STUDENT_PARENT = ["School Admin","Student", "Parent","Accountant"];
// Paying fees — at the counter or online — goes through POST /payments against the student's
// installments (payment.routes.js). There is no per-fee-head pay endpoint here any more.
/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS
   Role: School Admin
   POST /api/v1/student-fees/assign
===================================================== */
router.post("/assign",auth, roleMiddleware(ADMIN_ONLY), assignFeesToStudents);
router.post("/assign/preview", auth, roleMiddleware(ADMIN_ONLY), previewFeeAssignment);

/* =====================================================
   ✅ GET MY FEES
   Role:
   - Student → own fees
   - Parent  → studentId via param
   GET /api/v1/student-fees/my
   GET /api/v1/student-fees/my/:studentId
===================================================== */
//router.get("/my",auth, roleMiddleware(STUDENT_PARENT), getMyFees);
router.get("/my", auth, roleMiddleware(STUDENT_PARENT), getMyFees);
router.get("/my/:studentId", auth, roleMiddleware(STUDENT_PARENT), getMyFees);

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD
   Role: School Admin
   GET /api/v1/student-fees/summary
===================================================== */
router.get("/summary", auth, roleMiddleware(ADMIN_ONLY), studentFeeSummary);

export default router;
