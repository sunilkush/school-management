import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { recordSubscriptionPayment } from "./superAdminBilling.controllers.js";
import { verifyWebhookSignature as verifyPlatformWebhookSignature } from "../services/paymentGateway/razorpayGateway.js";
import { getAdapter } from "../services/paymentGateways/index.js";
import { GATEWAY_CATALOG } from "../services/paymentGateways/providers.js";
import { getGatewayForSettlement } from "../services/schoolPaymentGateway.service.js";
import { confirmOnlinePayment } from "../services/onlinePayment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

/** Tag the fee-checkout Razorpay orders carry in their notes (services/paymentGateways/razorpay.js). */
const FEE_CHECKOUT_PURPOSE = "fee_checkout";

/**
 * Settles the fee checkout a verified webhook points at. The Payment must belong to the school
 * whose credentials verified the webhook and to that gateway — a school admin types in their own
 * webhook secret, so a valid signature only ever speaks for that one school. Even then the amount
 * is not taken from the webhook: confirmOnlinePayment asks the gateway.
 */
const settleFromWebhook = async ({ schoolId, provider, orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return "unknown payment";

  const payment = await Payment.findOne({
    _id: orderId,
    schoolId,
    $or: [{ gateway: provider }, ...(provider === "razorpay" ? [{ gateway: null, paymentMode: "razorpay" }] : [])],
  });
  if (!payment) {
    console.warn(`[webhook] ${provider}: no checkout ${orderId} in school ${schoolId}`);
    return "unknown payment";
  }

  const { state } = await confirmOnlinePayment(payment);
  return state;
};

/**
 * POST /webhooks/gateway/:provider/:schoolId — every school fee gateway posts here. The URL is
 * shown on the school's gateway settings screen for pasting into the gateway's dashboard.
 */
export const handleGatewayWebhook = asyncHandler(async (req, res) => {
  const { provider, schoolId } = req.params;
  if (!GATEWAY_CATALOG[provider] || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(404, "Unknown webhook");
  }

  let gw;
  try {
    gw = await getGatewayForSettlement(schoolId, provider);
  } catch {
    // Not configured here: acknowledge so the gateway stops retrying, there is nothing to do.
    return sendSuccess(res, { message: "Webhook received (gateway not configured)" });
  }

  const { valid, orderId } = getAdapter(provider).parseWebhook({
    creds: gw.creds,
    headers: req.headers,
    rawBody: req.rawBody,
    body: req.body,
  });
  if (!valid) throw new ApiError(400, "Invalid webhook signature");
  if (!orderId) return sendSuccess(res, { message: "Webhook received (no payment reference)" });

  const outcome = await settleFromWebhook({ schoolId, provider, orderId });
  return sendSuccess(res, { message: `Webhook processed (${outcome})` });
});

/**
 * POST /webhooks/razorpay — the original single Razorpay endpoint, still used by the platform's own
 * SaaS billing and by schools whose Razorpay dashboards point here. Multiplexes on the payment's
 * notes: fee checkouts carry purpose/schoolId/paymentId, SaaS billing carries invoiceId.
 *
 * Never trust `notes` until a signature check passes — they only decide which secret to check.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature || !req.rawBody) {
    throw new ApiError(400, "Missing webhook signature or body");
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const notes = paymentEntity?.notes || {};

  const isFeeCheckout = notes.purpose === FEE_CHECKOUT_PURPOSE && Boolean(notes.paymentId);
  const isSaasBilling = Boolean(notes.invoiceId);

  if (!isFeeCheckout && !isSaasBilling) {
    if (notes.installmentId) {
      console.warn(`[webhook] Razorpay payment ${paymentEntity?.id} uses the retired installment-order format — reconcile manually`);
    }
    return sendSuccess(res, { message: "Webhook received (no matching context)" });
  }

  if (isFeeCheckout) {
    if (!mongoose.Types.ObjectId.isValid(notes.schoolId)) throw new ApiError(400, "Invalid webhook signature");
    let gw;
    try {
      gw = await getGatewayForSettlement(notes.schoolId, "razorpay");
    } catch {
      throw new ApiError(400, "Invalid webhook signature");
    }
    const { valid } = getAdapter("razorpay").parseWebhook({ creds: gw.creds, headers: req.headers, rawBody: req.rawBody, body: req.body });
    if (!valid) throw new ApiError(400, "Invalid webhook signature");

    if (event === "payment.captured") {
      const outcome = await settleFromWebhook({ schoolId: notes.schoolId, provider: "razorpay", orderId: notes.paymentId });
      return sendSuccess(res, { message: `Webhook processed (${outcome})` });
    }
    return sendSuccess(res, { message: "Webhook processed" });
  }

  if (!(await verifyPlatformWebhookSignature({ rawBody: req.rawBody, signature }))) {
    throw new ApiError(400, "Invalid webhook signature");
  }
  if (event === "payment.captured") {
    await recordSubscriptionPayment({
      invoiceId: notes.invoiceId,
      amount: paymentEntity.amount / 100,
      transactionId: paymentEntity.id,
      gatewayOrderId: paymentEntity.order_id,
    });
  }
  return sendSuccess(res, { message: "Webhook processed" });
});
