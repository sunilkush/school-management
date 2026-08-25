import { Router } from "express";
import {
  addManualPayment,
  assignPlanToSchool,
  cancelSubscription,
  changeSchoolPlan,
  createGatewayPaymentIntent,
  verifyRazorpayPayment,
  refundSubscriptionPayment,
  createPlanV2,
  deactivatePlan,
  downloadInvoicePdf,
  generateInvoice,
  getFeatureAccessControl,
  getSchoolInvoices,
  getSchoolSubscription,
  getSchoolUsage,
  getRevenueSummary,
  listAllInvoices,
  listAllPayments,
  reactivateSubscription,
  renewSubscription,
  suspendSubscription,
  updatePlanV2,
  upsertSchoolUsage,
} from "../controllers/superAdminBilling.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const SUPER_ADMIN = ["Super Admin"];

router.use(auth, roleMiddleware(SUPER_ADMIN));

router.post("/plans", createPlanV2);
router.put("/plans/:planId", updatePlanV2);
router.delete("/plans/:planId", deactivatePlan);

router.post("/schools/:schoolId/assign-plan", assignPlanToSchool);
router.post("/schools/:schoolId/change-plan", changeSchoolPlan); // action: upgrade/downgrade
router.post("/schools/:schoolId/renew", renewSubscription);
router.post("/schools/:schoolId/cancel", cancelSubscription);
router.post("/schools/:schoolId/suspend", suspendSubscription);
router.post("/schools/:schoolId/reactivate", reactivateSubscription);
router.get("/schools/:schoolId/subscription", getSchoolSubscription);

router.post("/schools/:schoolId/invoices", generateInvoice);
router.get("/schools/:schoolId/invoices", getSchoolInvoices);
router.get("/invoices", listAllInvoices);
router.get("/payments", listAllPayments);
router.get("/revenue/summary", getRevenueSummary);
router.get("/invoices/:invoiceId/pdf", downloadInvoicePdf);

router.post("/invoices/:invoiceId/payments/manual", addManualPayment);
router.post("/invoices/:invoiceId/payments/gateway-intent", createGatewayPaymentIntent);
router.post("/invoices/:invoiceId/payments/verify", verifyRazorpayPayment);
router.post("/payments/:paymentId/refund", refundSubscriptionPayment);

router.put("/schools/:schoolId/usage", upsertSchoolUsage);
router.get("/schools/:schoolId/usage", getSchoolUsage);

router.get("/schools/:schoolId/feature-access", getFeatureAccessControl);

export default router;
