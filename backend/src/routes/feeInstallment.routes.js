import { Router } from "express";
import {
  generateInstallments,
  getFeeInstallmentsByStudent,
  quoteInstallments,
} from "../controllers/feeInstallment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

// Installments are generated automatically when a fee is assigned. This only back-fills fee
// records assigned before that, so it is staff-only — a parent or student has nothing to generate.
router.post("/generate", roleMiddleware(["School Admin", "Super Admin", "Accountant"]), generateInstallments);
router.get("/", roleMiddleware(["School Admin", "Super Admin", "Accountant", "Student", "Parent"]), getFeeInstallmentsByStudent);
router.post("/quote", roleMiddleware(["School Admin", "Super Admin", "Accountant", "Student", "Parent"]), quoteInstallments);

// Paying installments goes through POST /payments (payment.routes.js).

export default router;
