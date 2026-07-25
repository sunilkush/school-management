import { Router } from "express";
import {
  generateInstallments,
  getFeeInstallmentsByStudent,
  payInstallment
} from "../controllers/feeInstallment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/generate",auth, roleMiddleware(["School Admin","Super Admin","Accountant","Student","Parent"]), generateInstallments);
router.get("/",auth, roleMiddleware(["School Admin","Super Admin","Accountant","Student","Parent"]), getFeeInstallmentsByStudent);
router.post("/pay/:installmentId",auth, roleMiddleware(["School Admin","Super Admin","Accountant","Student","Parent"]), payInstallment);

export default router;
