import { Router } from "express";
import {
  assignFeesToStudents,
  getMyFees,
  payStudentFee,
  studentFeeSummary,
} from "../controllers/studentFee.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

/* =====================================================
   🔐 PROTECTED ROUTES
===================================================== */
router.use(auth);

/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS
   Role: School Admin
   POST /api/v1/student-fees/assign
===================================================== */
router.post("/assign", assignFeesToStudents);

/* =====================================================
   ✅ GET MY FEES
   Role:
   - Student → own fees
   - Parent  → studentId via param
   GET /api/v1/student-fees/my
   GET /api/v1/student-fees/my/:studentId
===================================================== */
router.get("/my", getMyFees);
router.get("/my/:studentId", getMyFees);

/* =====================================================
   ✅ PAY STUDENT FEE
   Role: Student / Parent
   PUT /api/v1/student-fees/pay/:id
===================================================== */
router.put("/pay/:id", payStudentFee);

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD
   Role: School Admin
   GET /api/v1/student-fees/summary
===================================================== */
router.get("/summary", studentFeeSummary);

export default router;
