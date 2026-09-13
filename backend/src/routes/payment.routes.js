import { Router } from "express";
import {
  createPayment,
  verifyPayment,
  returnFromGateway,
  getPayments,
  paymentSummary,
  refundPayment,
  getRefunds,
} from "../controllers/payment.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  paymentListQuerySchema,
  refundListQuerySchema,
  refundPaymentSchema,
  verifyPaymentSchema,
} from "../validators/payment.validator.js";

const router = Router();

const PAYMENT_ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant"];
const PAYMENT_READ_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];
const PAYMENT_CREATE_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];

// PUBLIC (see PUBLIC_API_ROUTE_PATTERNS): the gateway sends the payer's browser back here, with no
// login token. It only prompts a server-to-server status check — see returnFromGateway.
router.all("/return/:paymentId", returnFromGateway);

router.post("/", requireRoles(PAYMENT_CREATE_ROLES), validateRequest(createPaymentSchema), createPayment);
// Asks the gateway about an online checkout started by POST / with paymentMode "gateway".
router.post("/:id/verify", requireRoles(PAYMENT_CREATE_ROLES), validateRequest(verifyPaymentSchema), verifyPayment);
router.get("/", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);
router.get("/summary", requireRoles(PAYMENT_ADMIN_ROLES), paymentSummary);
router.get("/refunds", requireRoles(PAYMENT_READ_ROLES), validateRequest(refundListQuerySchema), getRefunds);
router.post("/:id/refund", requireRoles(PAYMENT_ADMIN_ROLES), validateRequest(refundPaymentSchema), refundPayment);
router.get("/:id", requireRoles(PAYMENT_READ_ROLES), validateRequest(paymentListQuerySchema), getPayments);

// Gateway credentials and the active gateway are managed under /payment-gateways.

export default router;
