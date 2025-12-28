import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary
} from "../controllers/payment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPayments);
router.get('/summary',paymentSummary)

export default router;
