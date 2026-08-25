import { Router } from "express";
import {
  generateInstallments,
  getFeeInstallmentsByStudent,
} from "../controllers/feeInstallment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/generate",auth, roleMiddleware(["School Admin","Super Admin","Accountant","Student","Parent"]), generateInstallments);
router.get("/",auth, roleMiddleware(["School Admin","Super Admin","Accountant","Student","Parent"]), getFeeInstallmentsByStudent);
// Installment-specific payment now goes through POST /payments (createPayment), which already
// keeps the installment and its parent StudentFee in sync via applyFeePayment — no separate
// /fee-installments/pay/:installmentId path anymore.

export default router;
