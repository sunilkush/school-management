import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, header, paise, safeEqual, sha256Hex } from "./gatewayHttp.js";

/** PhonePe Payment Gateway — Standard Checkout v2 (OAuth client credentials). https://developer.phonepe.com/ */
const NAME = "PhonePe";
const tokenUrl = (mode) =>
  mode === "live"
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const pgBase = (mode) => (mode === "live" ? "https://api.phonepe.com/apis/pg" : "https://api-preprod.phonepe.com/apis/pg-sandbox");

// Access tokens are valid for a while; don't fetch one per request.
const tokenCache = new Map(); // `${mode}:${clientId}` -> { token, expiresAt }

const getToken = async ({ creds, mode }) => {
  const cacheKey = `${mode}:${creds.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await gatewayRequest(NAME, tokenUrl(mode), {
    method: "POST",
    form: {
      client_id: creds.clientId,
      client_version: creds.clientVersion || "1",
      client_secret: creds.clientSecret,
      grant_type: "client_credentials",
    },
  });
  if (!res.ok || !res.data?.access_token) {
    throw new ApiError(res.status === 401 || res.status === 400 ? 400 : 502, `${NAME} rejected the client credentials (HTTP ${res.status})`);
  }

  const expiresAt = res.data.expires_at ? Number(res.data.expires_at) * 1000 : Date.now() + 15 * 60_000;
  tokenCache.set(cacheKey, { token: res.data.access_token, expiresAt });
  return res.data.access_token;
};

export const createCheckout = async ({ creds, mode, orderId, amount, urls, description }) => {
  const token = await getToken({ creds, mode });
  const res = await gatewayRequest(NAME, `${pgBase(mode)}/checkout/v2/pay`, {
    method: "POST",
    headers: { Authorization: `O-Bearer ${token}` },
    json: {
      merchantOrderId: orderId,
      amount: paise(amount),
      expireAfter: 1800,
      metaInfo: { udf1: orderId },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: (description || "School fee").slice(0, 100),
        merchantUrls: { redirectUrl: urls.returnUrl },
      },
    },
  });
  if (!res.ok || !res.data?.redirectUrl) {
    throw new ApiError(502, `${NAME} could not create the payment: ${res.data?.message || `HTTP ${res.status}`}`);
  }

  return { gatewayOrderId: orderId, checkout: { type: "redirect", url: res.data.redirectUrl } };
};

export const fetchStatus = async ({ creds, mode, gatewayOrderId }) => {
  const token = await getToken({ creds, mode });
  const res = await gatewayRequest(NAME, `${pgBase(mode)}/checkout/v2/order/${encodeURIComponent(gatewayOrderId)}/status`, {
    headers: { Authorization: `O-Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(502, `${NAME} could not fetch the order (HTTP ${res.status})`);

  const state = res.data?.state;
  if (state === "COMPLETED") {
    const done = (res.data.paymentDetails || []).find((p) => p.state === "COMPLETED");
    return { state: "paid", amount: Number(res.data.amount) / 100, gatewayPaymentId: done?.transactionId || res.data.orderId || null, raw: res.data };
  }
  if (state === "FAILED") return { state: "failed", raw: res.data };
  return { state: "pending", raw: res.data };
};

/** PhonePe sends Authorization: sha256("username:password") configured in its dashboard. */
export const parseWebhook = ({ creds, headers, body }) => {
  const given = header(headers, "authorization");
  if (!creds.webhookUsername || !creds.webhookPassword || !given) return { valid: false };
  const expected = sha256Hex(`${creds.webhookUsername}:${creds.webhookPassword}`);
  return { valid: safeEqual(expected, String(given).replace(/^SHA256\s*/i, "").trim()), orderId: body?.payload?.merchantOrderId };
};

export const testCredentials = async ({ creds, mode }) => {
  try {
    tokenCache.delete(`${mode}:${creds.clientId}`);
    await getToken({ creds, mode });
    return { ok: true, message: `Connected to PhonePe (${mode})` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
