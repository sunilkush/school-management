import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, hmacSha256, header, paise, safeEqual } from "./gatewayHttp.js";

/** Razorpay Standard Checkout, via the REST API. https://razorpay.com/docs/api/ */
const BASE = "https://api.razorpay.com/v1";
const NAME = "Razorpay";

const auth = (creds) => ({ Authorization: `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64")}` });

const fail = (res, action) => {
  const reason = res.data?.error?.description || `HTTP ${res.status}`;
  throw new ApiError(res.status === 401 ? 400 : 502, `${NAME} could not ${action}: ${reason}`);
};

export const createCheckout = async ({ creds, orderId, amount, schoolId }) => {
  const res = await gatewayRequest(NAME, `${BASE}/orders`, {
    method: "POST",
    headers: auth(creds),
    json: {
      amount: paise(amount),
      currency: "INR",
      receipt: orderId,
      // purpose/paymentId/schoolId let the shared /webhooks/razorpay endpoint find this checkout.
      notes: { purpose: "fee_checkout", paymentId: orderId, schoolId: String(schoolId) },
    },
  });
  if (!res.ok) fail(res, "create the order");

  return {
    gatewayOrderId: res.data.id,
    checkout: {
      type: "razorpay",
      keyId: creds.keyId,
      orderId: res.data.id,
      amount: res.data.amount,
      currency: res.data.currency,
      notes: res.data.notes,
    },
  };
};

/** Asks Razorpay what happened to the order. Captures an authorized payment on accounts without auto-capture. */
export const fetchStatus = async ({ creds, gatewayOrderId }) => {
  const res = await gatewayRequest(NAME, `${BASE}/orders/${encodeURIComponent(gatewayOrderId)}/payments`, { headers: auth(creds) });
  if (!res.ok) fail(res, "fetch the payment");

  const items = res.data?.items || [];
  let payment = items.find((p) => p.status === "captured");

  if (!payment) {
    const authorized = items.find((p) => p.status === "authorized");
    if (authorized) {
      const cap = await gatewayRequest(NAME, `${BASE}/payments/${authorized.id}/capture`, {
        method: "POST",
        headers: auth(creds),
        json: { amount: authorized.amount, currency: authorized.currency },
      });
      if (cap.ok && cap.data?.status === "captured") payment = cap.data;
    }
  }

  if (payment) return { state: "paid", amount: payment.amount / 100, gatewayPaymentId: payment.id, raw: payment };
  if (items.length && items.every((p) => p.status === "failed")) return { state: "failed", raw: items };
  return { state: "pending", raw: items };
};

export const parseWebhook = ({ creds, headers, rawBody, body }) => {
  const signature = header(headers, "x-razorpay-signature");
  if (!creds.webhookSecret || !signature || !rawBody) return { valid: false };
  const valid = safeEqual(hmacSha256(creds.webhookSecret, rawBody), signature);
  return { valid, orderId: body?.payload?.payment?.entity?.notes?.paymentId };
};

export const testCredentials = async ({ creds, mode }) => {
  const res = await gatewayRequest(NAME, `${BASE}/orders?count=1`, { headers: auth(creds) });
  if (res.status === 401) return { ok: false, message: "Razorpay rejected the Key ID / Key Secret" };
  if (!res.ok) return { ok: false, message: `Razorpay returned HTTP ${res.status}` };

  const isTestKey = String(creds.keyId).startsWith("rzp_test_");
  if (mode === "live" && isTestKey) return { ok: true, message: "Connected — note these are TEST keys; no real money will be collected" };
  return { ok: true, message: isTestKey ? "Connected with test keys" : "Connected with live keys" };
};
