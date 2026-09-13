import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, header, hmacSha256, safeEqual } from "./gatewayHttp.js";

/** Cashfree Payment Gateway, API version 2023-08-01. https://www.cashfree.com/docs/api-reference/payments/latest */
const NAME = "Cashfree";
const API_VERSION = "2023-08-01";
const base = (mode) => (mode === "live" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

const headers = (creds) => ({
  "x-client-id": creds.appId,
  "x-client-secret": creds.secretKey,
  "x-api-version": API_VERSION,
});

const fail = (res, action) => {
  const reason = res.data?.message || `HTTP ${res.status}`;
  throw new ApiError(res.status === 401 ? 400 : 502, `${NAME} could not ${action}: ${reason}`);
};

/** Cashfree requires a 10-digit phone; a school record without one should not block payment. */
const phoneOf = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? digits : "9999999999";
};

export const createCheckout = async ({ creds, mode, orderId, amount, customer, urls, description }) => {
  const res = await gatewayRequest(NAME, `${base(mode)}/orders`, {
    method: "POST",
    headers: headers(creds),
    json: {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: "INR",
      order_note: description?.slice(0, 200),
      customer_details: {
        customer_id: `cust_${customer.id}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50),
        customer_name: customer.name?.slice(0, 100) || undefined,
        customer_email: customer.email || undefined,
        customer_phone: phoneOf(customer.phone),
      },
      order_meta: { return_url: urls.returnUrl, notify_url: urls.webhookUrl },
    },
  });
  if (!res.ok) fail(res, "create the order");

  return {
    gatewayOrderId: res.data.order_id,
    checkout: {
      type: "cashfree",
      mode: mode === "live" ? "production" : "sandbox",
      paymentSessionId: res.data.payment_session_id,
    },
  };
};

export const fetchStatus = async ({ creds, mode, gatewayOrderId }) => {
  const res = await gatewayRequest(NAME, `${base(mode)}/orders/${encodeURIComponent(gatewayOrderId)}`, { headers: headers(creds) });
  if (!res.ok) fail(res, "fetch the order");

  const status = res.data?.order_status;
  if (status === "PAID") {
    const pays = await gatewayRequest(NAME, `${base(mode)}/orders/${encodeURIComponent(gatewayOrderId)}/payments`, { headers: headers(creds) });
    const success = Array.isArray(pays.data) ? pays.data.find((p) => p.payment_status === "SUCCESS") : null;
    return {
      state: "paid",
      amount: Number(success?.payment_amount ?? res.data.order_amount),
      gatewayPaymentId: success?.cf_payment_id ? String(success.cf_payment_id) : null,
      raw: res.data,
    };
  }
  if (["EXPIRED", "TERMINATED"].includes(status)) return { state: "failed", raw: res.data };
  return { state: "pending", raw: res.data };
};

/** Signature = base64(HMAC-SHA256(timestamp + rawBody, secretKey)). */
export const parseWebhook = ({ creds, headers: h, rawBody, body }) => {
  const signature = header(h, "x-webhook-signature");
  const timestamp = header(h, "x-webhook-timestamp");
  if (!signature || !timestamp || !rawBody) return { valid: false };
  const expected = hmacSha256(creds.secretKey, `${timestamp}${rawBody.toString("utf8")}`, "base64");
  return { valid: safeEqual(expected, signature), orderId: body?.data?.order?.order_id };
};

export const testCredentials = async ({ creds, mode }) => {
  const res = await gatewayRequest(NAME, `${base(mode)}/orders/connection_check_${Date.now()}`, { headers: headers(creds) });
  if (res.status === 401 || res.status === 403) return { ok: false, message: `Cashfree rejected the App ID / Secret Key for ${mode} mode` };
  if (res.status === 404) return { ok: true, message: `Connected to Cashfree (${mode})` };
  if (res.ok) return { ok: true, message: `Connected to Cashfree (${mode})` };
  return { ok: false, message: res.data?.message || `Cashfree returned HTTP ${res.status}` };
};
