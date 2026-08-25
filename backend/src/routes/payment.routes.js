import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary,
  refundPayment,
  getRefunds,
  getRazorpayConfig,
  updateRazorpayConfig,
} from "../controllers/payment.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  paymentListQuerySchema,
  refundListQuerySchema,
  refundPaymentSchema,
  razorpayConfigUpdateSchema,
} from "../validators/payment.validator.js";

const router = Router();

const PAYMENT_ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant"];
const PAYMENT_READ_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];
const PAYMENT_CREATE_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];

router.post("/", requireRoles(PAYMENT_CREATE_ROLES), validateRequest(createPaymentSchema), createPayment);
router.get("/", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);
router.get("/summary", requireRoles(PAYMENT_ADMIN_ROLES), paymentSummary);
router.get("/refunds", requireRoles(PAYMENT_READ_ROLES), validateRequest(refundListQuerySchema), getRefunds);
router.post("/:id/refund", requireRoles(PAYMENT_ADMIN_ROLES), validateRequest(refundPaymentSchema), refundPayment);
router.get("/:id", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);

router.get("/razorpay/config", requireRoles(PAYMENT_ADMIN_ROLES), getRazorpayConfig);
router.put(
  "/razorpay/config",
  requireRoles(PAYMENT_ADMIN_ROLES),
  validateRequest(razorpayConfigUpdateSchema),
  updateRazorpayConfig
);

export default router;
