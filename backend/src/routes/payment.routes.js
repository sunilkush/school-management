import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary,
  verifyRazorpayPayment,
  createRazorpayOrder,
} from "../controllers/payment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), createPayment);
router.get("/", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), getPayments);
router.get("/:id", auth, roleMiddleware(['Super Admin','School Admin','Student','Parent']), getPayments);
router.get('/summary', auth,roleMiddleware(['Super Admin','School Admin','Student','Parent']), paymentSummary)


router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/razorpay/create-order", createRazorpayOrder);

export default router;
