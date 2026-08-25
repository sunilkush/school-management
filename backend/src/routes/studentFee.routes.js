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
const ADMIN_ONLY = ["School Admin", "Accountant"];
const STUDENT_PARENT = ["School Admin","Student", "Parent","Accountant"];
// Self-service (Student/Parent) fee payment now goes exclusively through POST /payments
// (createPayment), which is gateway-verified (Razorpay only, no client-supplied "paid" claim).
// This endpoint records staff-collected payments (cash/cheque/UPI/etc. actually received in
// person), so it must stay staff-only — Student/Parent here previously meant either could submit
// any payment mode with no verification and mark their own fee paid.
const FEE_PAY_ROLES = ADMIN_ONLY;
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
//router.get("/my",auth, roleMiddleware(STUDENT_PARENT), getMyFees);
router.get("/my", auth, roleMiddleware(STUDENT_PARENT), getMyFees);
router.get("/my/:studentId", auth, roleMiddleware(STUDENT_PARENT), getMyFees);

/* =====================================================
   ✅ PAY STUDENT FEE
   Role: Student / Parent
   PUT /api/v1/student-fees/pay/:id
===================================================== */
router.put("/pay/:id", auth, roleMiddleware(FEE_PAY_ROLES), payStudentFee);

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD
   Role: School Admin
   GET /api/v1/student-fees/summary
===================================================== */
router.get("/summary", auth, roleMiddleware(ADMIN_ONLY), studentFeeSummary);

export default router;
