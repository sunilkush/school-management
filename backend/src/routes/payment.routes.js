import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary,
  verifyRazorpayPayment,
  createRazorpayOrder,
} from "../controllers/payment.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  createRazorpayOrderSchema,
  paymentListQuerySchema,
  verifyRazorpayPaymentSchema,
} from "../validators/payment.validator.js";

const router = Router();

const PAYMENT_ADMIN_ROLES = ["Super Admin", "School Admin"];
const PAYMENT_READ_ROLES = ["Super Admin", "School Admin", "Student", "Parent"];

router.post("/", requireRoles(PAYMENT_ADMIN_ROLES), validateRequest(createPaymentSchema), createPayment);
router.get("/", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);
router.get("/summary", requireRoles(PAYMENT_ADMIN_ROLES), paymentSummary);
router.get("/:id", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);

router.post(
  "/razorpay/verify",
  requireRoles(PAYMENT_ADMIN_ROLES),
  validateRequest(verifyRazorpayPaymentSchema),
  verifyRazorpayPayment
);
router.post(
  "/razorpay/create-order",
  requireRoles(PAYMENT_ADMIN_ROLES),
  validateRequest(createRazorpayOrderSchema),
  createRazorpayOrder
);

export default router;
