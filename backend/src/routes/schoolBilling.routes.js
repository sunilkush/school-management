import { Router } from "express";
import {
  getMySubscription,
  getMyInvoices,
  downloadMyInvoicePdf,
  createMyPaymentIntent,
  verifyMyPayment,
} from "../controllers/schoolBilling.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// School Admin only — every handler forces schoolId from the session (see
// schoolBilling.controllers.js), never trusting a param, so this stays scoped to the caller's
// own school even though the role check alone wouldn't prevent them from guessing another
// school's invoice id.
router.use(auth, roleMiddleware(["School Admin"]));

router.get("/subscription", getMySubscription);
router.get("/invoices", getMyInvoices);
router.get("/invoices/:invoiceId/pdf", downloadMyInvoicePdf);
router.post("/invoices/:invoiceId/pay/intent", createMyPaymentIntent);
router.post("/invoices/:invoiceId/pay/verify", verifyMyPayment);

export default router;
