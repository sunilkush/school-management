import crypto from "crypto";
import { School } from "../models/school.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { recordPayment } from "./payment.controllers.js";
import { recordSubscriptionPayment } from "./superAdminBilling.controllers.js";
import { verifyWebhookSignature as verifyPlatformWebhookSignature } from "../services/paymentGateway/razorpayGateway.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Verifies a fee-collection (Parent→School) webhook against that specific school's own
 * Razorpay webhook secret — each school has its own Razorpay account (School.razorpay), so
 * there's no single platform-wide secret to check against for this side.
 */
const verifySchoolWebhookSignature = async ({ rawBody, signature, schoolId }) => {
  if (!schoolId) return false;
  const school = await School.findById(schoolId).select("+razorpay.webhookSecret");
  const secret = school?.razorpay?.webhookSecret;
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
};

/**
 * Single Razorpay webhook endpoint for both payment systems (see the plan's separation
 * principle — SaaS billing and fee collection stay two systems, but a School's Razorpay
 * account and the platform's Razorpay account both post to Razorpay's one webhook-URL-per-app
 * concept, so one receiver route multiplexes by inspecting the payment's `notes`, which both
 * order-creation call sites already populate: fee-collection notes carry
 * `installmentId`/`schoolId`, SaaS billing notes carry `invoiceId`/`schoolId`).
 *
 * Never trust `notes` for anything until the signature check below passes — they're read only
 * to decide *which* secret to verify against, not acted on beforehand.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature || !req.rawBody) {
    throw new ApiError(400, "Missing webhook signature or body");
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const notes = paymentEntity?.notes || {};

  const isFeeCollection = Boolean(notes.installmentId);
  const isSaasBilling = Boolean(notes.invoiceId);

  if (!isFeeCollection && !isSaasBilling) {
    // Not a payment we originated (or an event type carrying no notes, e.g. a test ping) —
    // acknowledge so Razorpay doesn't retry, but there's nothing for us to reconcile.
    return sendSuccess(res, { message: "Webhook received (no matching context)" });
  }

  const isValid = isFeeCollection
    ? await verifySchoolWebhookSignature({ rawBody: req.rawBody, signature, schoolId: notes.schoolId })
    : await verifyPlatformWebhookSignature({ rawBody: req.rawBody, signature });

  if (!isValid) {
    throw new ApiError(400, "Invalid webhook signature");
  }

  // Signature confirmed authentic — now safe to act on the payload.
  if (event === "payment.captured") {
    if (isFeeCollection) {
      const installment = await FeeInstallment.findById(notes.installmentId);
      if (!installment) {
        throw new ApiError(404, `Webhook payment.captured for unknown installment ${notes.installmentId}`);
      }
      await recordPayment({
        installment,
        paymentData: {
          schoolId: installment.schoolId,
          studentId: installment.studentId,
          installmentId: installment._id,
          amountPaid: paymentEntity.amount / 100,
          paymentMode: "razorpay",
          status: "success",
          transactionId: paymentEntity.id,
          razorpay: { razorpay_order_id: paymentEntity.order_id, razorpay_payment_id: paymentEntity.id },
          receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      });
    } else {
      await recordSubscriptionPayment({
        invoiceId: notes.invoiceId,
        amount: paymentEntity.amount / 100,
        transactionId: paymentEntity.id,
        gatewayOrderId: paymentEntity.order_id,
      });
    }
  }
  // payment.failed and anything else: nothing to reverse — the fee/invoice simply stays
  // unpaid/due, which is itself the retry path (the payer just tries again from the pay page).

  return sendSuccess(res, { message: "Webhook processed" });
});
