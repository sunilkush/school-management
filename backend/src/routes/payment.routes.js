import { Router } from "express";
import {
  createPayment,
  getPayments,
  paymentSummary,
  verifyRazorpayPayment,
  createRazorpayOrder,
  getRazorpayConfig,
  updateRazorpayConfig,
} from "../controllers/payment.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  createRazorpayOrderSchema,
  paymentListQuerySchema,
  razorpayConfigUpdateSchema,
  verifyRazorpayPaymentSchema,
} from "../validators/payment.validator.js";

const router = Router();

const PAYMENT_ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant"];
const PAYMENT_READ_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];
const PAYMENT_CREATE_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];

router.post("/", requireRoles(PAYMENT_CREATE_ROLES), validateRequest(createPaymentSchema), createPayment);
router.get("/", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);
router.get("/summary", requireRoles(PAYMENT_ADMIN_ROLES), paymentSummary);
router.get("/:id", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);

router.post(
  "/razorpay/verify",
  requireRoles(PAYMENT_CREATE_ROLES),
  validateRequest(verifyRazorpayPaymentSchema),
  verifyRazorpayPayment
);
router.post(
  "/razorpay/create-order",
  requireRoles(PAYMENT_CREATE_ROLES),
  validateRequest(createRazorpayOrderSchema),
  createRazorpayOrder
);
router.get("/razorpay/config", requireRoles(PAYMENT_ADMIN_ROLES), getRazorpayConfig);
router.put(
  "/razorpay/config",
  requireRoles(PAYMENT_ADMIN_ROLES),
  validateRequest(razorpayConfigUpdateSchema),
  updateRazorpayConfig
);

export default router;
