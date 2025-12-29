import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary
} from "../controllers/payment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), createPayment);
router.get("/", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), getPayments);
router.get("/:id", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), getPayments);
router.get('/summary', auth,roleMiddleware(['Super Admin','School Admin','Student','Parent']), paymentSummary)

export default router;
