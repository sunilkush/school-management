import { Router } from "express";
import {
  createPayment,
  getPayments,
} from "../controllers/payment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", createPayment);
router.get("/", getPayments);

export default router;
