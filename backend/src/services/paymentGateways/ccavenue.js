import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, rupees } from "./gatewayHttp.js";

/**
 * CCAvenue — hosted checkout with AES-encrypted requests, and the Status API (orderStatusTracker).
 * Integration kit: CCAvenue merchant dashboard → Resources → Web Integration Kit.
 */
const NAME = "CCAvenue";
const txnUrl = (mode) =>
  mode === "live"
    ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
const apiUrl = (mode) => (mode === "live" ? "https://api.ccavenue.com/apis/servlet/DoWebTrans" : "https://apitest.ccavenue.com/apis/servlet/DoWebTrans");

/* ── CCAvenue crypto: AES-128-CBC, key = md5(workingKey), IV = bytes 0x00…0x0f, hex text ───── */
const IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
const keyOf = (workingKey) => crypto.createHash("md5").update(workingKey).digest();

export const encrypt = (plain, workingKey) => {
  const c = crypto.createCipheriv("aes-128-cbc", keyOf(workingKey), IV);
  return Buffer.concat([c.update(plain, "utf8"), c.final()]).toString("hex");
};

export const decrypt = (hex, workingKey) => {
  const d = crypto.createDecipheriv("aes-128-cbc", keyOf(workingKey), IV);
  return Buffer.concat([d.update(Buffer.from(String(hex).trim(), "hex")), d.final()]).toString("utf8");
};

/* ── Adapter ─────────────────────────────────────────────────────── */

export const createCheckout = async ({ creds, mode, orderId, amount, customer, urls }) => {
  const request = new URLSearchParams({
    merchant_id: creds.merchantId,
    order_id: orderId,
    currency: "INR",
    amount: rupees(amount),
    redirect_url: urls.returnUrl,
    cancel_url: urls.returnUrl,
    language: "EN",
    billing_name: customer.name || "",
    billing_email: customer.email || "",
    billing_tel: String(customer.phone || "").replace(/\D/g, "").slice(-10),
    merchant_param1: orderId,
  }).toString();

  return {
    gatewayOrderId: orderId,
    checkout: {
      type: "form",
      action: txnUrl(mode),
      method: "POST",
      fields: { encRequest: encrypt(request, creds.workingKey), access_code: creds.accessCode },
    },
  };
};

const statusCall = async ({ creds, mode, orderId }) => {
  const res = await gatewayRequest(NAME, apiUrl(mode), {
    method: "POST",
    form: {
      enc_request: encrypt(JSON.stringify({ order_no: orderId }), creds.workingKey),
      access_code: creds.accessCode,
      command: "orderStatusTracker",
      request_type: "JSON",
      response_type: "JSON",
      version: "1.2",
    },
  });
  // Response body is itself form-encoded: status=0&enc_response=… (status 1 = error, message in enc_response).
  const parsed = Object.fromEntries(new URLSearchParams(res.text || ""));
  if (parsed.status !== "0") return { error: parsed.enc_response || `HTTP ${res.status}` };
  try {
    return { data: JSON.parse(decrypt(parsed.enc_response, creds.workingKey).replace(/[\x00-\x1f]+$/g, "")) };
  } catch {
    return { error: "could not decrypt the response — check the Working Key" };
  }
};

export const fetchStatus = async ({ creds, mode, gatewayOrderId }) => {
  const { data, error } = await statusCall({ creds, mode, orderId: gatewayOrderId });
  if (error) throw new ApiError(502, `${NAME} could not fetch the order: ${error}`);

  const status = String(data.order_status || "");
  if (["Successful", "Shipped"].includes(status)) {
    return { state: "paid", amount: Number(data.order_amt), gatewayPaymentId: data.reference_no ? String(data.reference_no) : null, raw: data };
  }
  if (["Aborted", "Unsuccessful", "Cancelled", "Invalid", "Fraud", "Timeout", "Auto-Cancelled", "Refunded"].includes(status)) {
    return { state: "failed", raw: data };
  }
  return { state: "pending", raw: data };
};

/**
 * CCAvenue's notification (and browser return) is encResp encrypted with the school's working
 * key; decrypting it into a response naming an order is the proof it came from CCAvenue.
 */
export const parseWebhook = ({ creds, body }) => {
  if (!body?.encResp) return { valid: false };
  try {
    const fields = Object.fromEntries(new URLSearchParams(decrypt(body.encResp, creds.workingKey)));
    return { valid: Boolean(fields.order_id), orderId: fields.order_id };
  } catch {
    return { valid: false };
  }
};

export const testCredentials = async ({ creds, mode }) => {
  try {
    const { error } = await statusCall({ creds, mode, orderId: `conncheck${Date.now()}` });
    if (error && /access code|merchant|decrypt|invalid/i.test(error)) return { ok: false, message: `CCAvenue: ${error}` };
    return { ok: true, message: `Connected to CCAvenue (${mode})` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
