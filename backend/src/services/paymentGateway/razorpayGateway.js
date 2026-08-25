import Razorpay from "razorpay";
import crypto from "crypto";
import { GlobalConfig } from "../../models/GlobalConfig.model.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Platform-level Razorpay credentials for SaaS billing (School pays platform) — distinct from
 * the per-school School.razorpay credentials used by student-fee collection (Parent pays
 * School), which are resolved separately in payment.controllers.js and untouched by this file.
 *
 * Reads GlobalConfig first (the Super Admin Settings UI field that, before this, silently had
 * no effect), falling back to legacy env vars so an existing .env-only deployment doesn't break.
 */
export const resolvePlatformRazorpayCredentials = async () => {
  const config = await GlobalConfig.findOne({ key: "global" }).select(
    "+razorpayKeyId +razorpayKeySecret +razorpayWebhookSecret"
  );

  const keyId = config?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = config?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = config?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

  return { keyId, keySecret, webhookSecret };
};

const getClient = async () => {
  const { keyId, keySecret } = await resolvePlatformRazorpayCredentials();
  if (!keyId || !keySecret) {
    throw new ApiError(500, "Razorpay is not configured for platform billing. Set it in Super Admin → Settings.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

/** Creates a Razorpay order. `amount` is in rupees (converted to paisa here). */
export const createOrder = async ({ amount, currency = "INR", receipt, notes }) => {
  const client = await getClient();
  const { keyId } = await resolvePlatformRazorpayCredentials();

  const order = await client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
};

/** Verifies the checkout-flow signature (order_id|payment_id, HMAC-SHA256 with the API key secret). */
export const verifyPaymentSignature = async ({ orderId, paymentId, signature }) => {
  const { keySecret } = await resolvePlatformRazorpayCredentials();
  if (!keySecret) throw new ApiError(500, "Razorpay secret not configured for platform billing.");

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
};

/** Verifies a webhook payload signature (X-Razorpay-Signature, HMAC-SHA256 over the raw body with the webhook secret). */
export const verifyWebhookSignature = async ({ rawBody, signature }) => {
  const { webhookSecret } = await resolvePlatformRazorpayCredentials();
  if (!webhookSecret) return false;

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return expected === signature;
};

/** Issues a refund for a captured payment. `amount` in rupees, omit for a full refund. */
export const refundPayment = async ({ paymentId, amount, notes }) => {
  const client = await getClient();
  return client.payments.refund(paymentId, {
    ...(amount !== undefined ? { amount: Math.round(amount * 100) } : {}),
    notes,
  });
};
