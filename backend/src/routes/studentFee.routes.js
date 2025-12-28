import { Router } from "express";
import {
  assignFeesToStudents,
  getMyFees,
  payStudentFee,
  studentFeeSummary,
} from "../controllers/studentFee.controllers.js";
import { auth , roleMiddleware} from "../middlewares/auth.middleware.js";

const router = Router();

/* =====================================================
   🔐 PROTECTED ROUTES
===================================================== */
router.use(auth);
const ADMIN_ONLY = ["School Admin"];
const STUDENT_PARENT = ["Student", "Parent"];
/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS
   Role: School Admin
   POST /api/v1/student-fees/assign
===================================================== */
router.post("/assign",auth, roleMiddleware(ADMIN_ONLY), assignFeesToStudents);

/* =====================================================
   ✅ GET MY FEES
   Role:
   - Student → own fees
   - Parent  → studentId via param
   GET /api/v1/student-fees/my
   GET /api/v1/student-fees/my/:studentId
===================================================== */
router.get("/my",auth, roleMiddleware(STUDENT_PARENT), getMyFees);
router.get("/my/:studentId", auth, roleMiddleware(STUDENT_PARENT), getMyFees);

/* =====================================================
   ✅ PAY STUDENT FEE
   Role: Student / Parent
   PUT /api/v1/student-fees/pay/:id
===================================================== */
router.put("/pay/:id", auth, roleMiddleware(STUDENT_PARENT), payStudentFee);

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD
   Role: School Admin
   GET /api/v1/student-fees/summary
===================================================== */
router.get("/summary", auth, roleMiddleware(ADMIN_ONLY), studentFeeSummary);

export default router;
