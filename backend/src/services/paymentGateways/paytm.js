import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, rupees, sha256Hex } from "./gatewayHttp.js";

/** Paytm Payment Gateway — Initiate Transaction + hosted payment page. https://business.paytm.com/docs/ */
const NAME = "Paytm";
const host = (mode) => (mode === "live" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in");

/* ── Paytm checksum (their PaytmChecksum library, reimplemented) ────────────────────────────── */
const IV = "@@@@&&&&####$$$$";

const cipherFor = (key) => {
  const bytes = Buffer.byteLength(key, "utf8");
  if (bytes === 16) return "aes-128-cbc";
  if (bytes === 24) return "aes-192-cbc";
  if (bytes === 32) return "aes-256-cbc";
  throw new ApiError(400, "Paytm Merchant Key must be 16, 24 or 32 characters");
};

const encrypt = (input, key) => {
  const c = crypto.createCipheriv(cipherFor(key), Buffer.from(key, "utf8"), Buffer.from(IV, "utf8"));
  return Buffer.concat([c.update(input, "utf8"), c.final()]).toString("base64");
};

const decrypt = (input, key) => {
  const d = crypto.createDecipheriv(cipherFor(key), Buffer.from(key, "utf8"), Buffer.from(IV, "utf8"));
  return Buffer.concat([d.update(Buffer.from(input, "base64")), d.final()]).toString("utf8");
};

const SALT_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateSignature = (body, key) => {
  const salt = Array.from(crypto.randomBytes(4), (b) => SALT_CHARS[b % SALT_CHARS.length]).join("");
  return encrypt(`${sha256Hex(`${body}|${salt}`)}${salt}`, key);
};

export const verifySignature = (body, key, checksum) => {
  try {
    const decrypted = decrypt(checksum, key);
    const salt = decrypted.slice(-4);
    return decrypted === `${sha256Hex(`${body}|${salt}`)}${salt}`;
  } catch {
    return false;
  }
};

/** Form-param callbacks are signed over the values of the sorted keys joined with "|". */
const stringFromParams = (params) =>
  Object.keys(params)
    .filter((k) => k !== "CHECKSUMHASH")
    .sort()
    .map((k) => (params[k] == null || params[k] === "null" ? "" : String(params[k])))
    .join("|");

/* ── Adapter ─────────────────────────────────────────────────────── */

export const createCheckout = async ({ creds, mode, orderId, amount, customer, urls }) => {
  const body = {
    requestType: "Payment",
    mid: creds.merchantId,
    websiteName: creds.websiteName || (mode === "live" ? "DEFAULT" : "WEBSTAGING"),
    orderId,
    callbackUrl: urls.returnUrl,
    txnAmount: { value: rupees(amount), currency: "INR" },
    userInfo: { custId: `CUST_${customer.id}`.slice(0, 64) },
  };
  const signature = generateSignature(JSON.stringify(body), creds.merchantKey);

  const res = await gatewayRequest(
    NAME,
    `${host(mode)}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(creds.merchantId)}&orderId=${encodeURIComponent(orderId)}`,
    { method: "POST", json: { body, head: { signature } } }
  );
  const result = res.data?.body?.resultInfo;
  if (!res.ok || result?.resultStatus !== "S" || !res.data?.body?.txnToken) {
    throw new ApiError(502, `${NAME} could not start the payment: ${result?.resultMsg || `HTTP ${res.status}`}`);
  }

  return {
    gatewayOrderId: orderId,
    checkout: {
      type: "form",
      action: `${host(mode)}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(creds.merchantId)}&orderId=${encodeURIComponent(orderId)}`,
      method: "POST",
      fields: { mid: creds.merchantId, orderId, txnToken: res.data.body.txnToken },
    },
  };
};

const statusCall = ({ creds, mode, orderId }) => {
  const body = { mid: creds.merchantId, orderId };
  return gatewayRequest(NAME, `${host(mode)}/v3/order/status`, {
    method: "POST",
    json: { body, head: { signature: generateSignature(JSON.stringify(body), creds.merchantKey) } },
  });
};

export const fetchStatus = async ({ creds, mode, gatewayOrderId }) => {
  const res = await statusCall({ creds, mode, orderId: gatewayOrderId });
  const b = res.data?.body;
  if (!res.ok || !b) throw new ApiError(502, `${NAME} could not fetch the transaction (HTTP ${res.status})`);

  const status = b.resultInfo?.resultStatus;
  if (status === "TXN_SUCCESS") return { state: "paid", amount: Number(b.txnAmount), gatewayPaymentId: b.txnId || null, raw: b };
  if (status === "TXN_FAILURE") return { state: "failed", raw: b };
  return { state: "pending", raw: b };
};

export const parseWebhook = ({ creds, body }) => {
  if (!body?.CHECKSUMHASH || !body?.ORDERID || body.MID !== creds.merchantId) return { valid: false };
  return { valid: verifySignature(stringFromParams(body), creds.merchantKey, body.CHECKSUMHASH), orderId: body.ORDERID };
};

export const testCredentials = async ({ creds, mode }) => {
  try {
    const res = await statusCall({ creds, mode, orderId: `CONNCHECK${Date.now()}` });
    const info = res.data?.body?.resultInfo;
    if (!info) return { ok: false, message: `Paytm returned HTTP ${res.status}` };
    if (/checksum|invalid mid|merchant/i.test(info.resultMsg || "") && info.resultStatus === "F") {
      return { ok: false, message: `Paytm rejected the MID / Merchant Key: ${info.resultMsg}` };
    }
    return { ok: true, message: `Connected to Paytm (${mode})` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
