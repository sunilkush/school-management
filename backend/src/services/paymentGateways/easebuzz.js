import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, rupees, safeEqual, sha512Hex } from "./gatewayHttp.js";

/** Easebuzz — Initiate Payment API + hosted payment page, Transaction API for status. https://docs.easebuzz.in/ */
const NAME = "Easebuzz";
const payBase = (mode) => (mode === "live" ? "https://pay.easebuzz.in" : "https://testpay.easebuzz.in");
const dashBase = (mode) => (mode === "live" ? "https://dashboard.easebuzz.in" : "https://testdashboard.easebuzz.in");

const PRODUCT = "School Fee";
const UDF_KEYS = ["udf1", "udf2", "udf3", "udf4", "udf5", "udf6", "udf7", "udf8", "udf9", "udf10"];

/** sha512(key|txnid|amount|productinfo|firstname|email|udf1|…|udf10|salt) */
export const requestHash = (f, salt) =>
  sha512Hex([f.key, f.txnid, f.amount, f.productinfo, f.firstname, f.email, ...UDF_KEYS.map((k) => f[k] || ""), salt].join("|"));

/** sha512(salt|status|udf10|…|udf1|email|firstname|productinfo|amount|txnid|key) */
export const responseHash = (p, salt) =>
  sha512Hex([salt, p.status, ...[...UDF_KEYS].reverse().map((k) => p[k] || ""), p.email, p.firstname, p.productinfo, p.amount, p.txnid, p.key].join("|"));

export const createCheckout = async ({ creds, mode, orderId, amount, customer, urls }) => {
  const fields = {
    key: creds.merchantKey,
    txnid: orderId,
    amount: rupees(amount),
    productinfo: PRODUCT,
    firstname: (customer.name || "Parent").split(" ")[0].slice(0, 60),
    phone: String(customer.phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
    email: customer.email || "noreply@example.com",
    surl: urls.returnUrl,
    furl: urls.returnUrl,
    udf1: orderId,
  };
  fields.hash = requestHash(fields, creds.merchantSalt);

  const res = await gatewayRequest(NAME, `${payBase(mode)}/payment/initiateLink`, { method: "POST", form: fields });
  if (!res.ok || Number(res.data?.status) !== 1 || !res.data?.data) {
    throw new ApiError(502, `${NAME} could not start the payment: ${res.data?.error_desc || res.data?.data || `HTTP ${res.status}`}`);
  }

  return {
    gatewayOrderId: orderId,
    // The Transaction API needs the same email and phone the payment was started with.
    meta: { email: fields.email, phone: fields.phone, amount: fields.amount },
    checkout: { type: "redirect", url: `${payBase(mode)}/pay/${res.data.data}` },
  };
};

const retrieveCall = ({ creds, mode, txnid, amount, email, phone }) =>
  gatewayRequest(NAME, `${dashBase(mode)}/transaction/v1/retrieve`, {
    method: "POST",
    form: {
      txnid,
      key: creds.merchantKey,
      amount,
      email,
      phone,
      hash: sha512Hex(`${creds.merchantKey}|${txnid}|${amount}|${email}|${phone}|${creds.merchantSalt}`),
    },
  });

export const fetchStatus = async ({ creds, mode, gatewayOrderId, meta }) => {
  const res = await retrieveCall({ creds, mode, txnid: gatewayOrderId, amount: meta?.amount, email: meta?.email, phone: meta?.phone });
  if (!res.ok || !res.data) throw new ApiError(502, `${NAME} could not fetch the transaction (HTTP ${res.status})`);

  const msg = Array.isArray(res.data.msg) ? res.data.msg[0] : res.data.msg;
  const status = String(msg?.status || "").toLowerCase();
  if (res.data.status && status === "success") {
    return { state: "paid", amount: Number(msg.amount), gatewayPaymentId: msg.easepayid ? String(msg.easepayid) : null, raw: msg };
  }
  if (["failure", "usercancelled", "dropped", "bounced"].includes(status)) return { state: "failed", raw: msg };
  return { state: "pending", raw: res.data };
};

export const parseWebhook = ({ creds, body }) => {
  if (!body?.hash || !body?.txnid || body.key !== creds.merchantKey) return { valid: false };
  return { valid: safeEqual(responseHash(body, creds.merchantSalt), String(body.hash).toLowerCase()), orderId: body.txnid };
};

export const testCredentials = async ({ creds, mode }) => {
  try {
    const res = await retrieveCall({ creds, mode, txnid: `conncheck${Date.now()}`, amount: "1.00", email: "check@example.com", phone: "9999999999" });
    const msg = String(Array.isArray(res.data?.msg) ? res.data.msg[0] : res.data?.msg ?? res.text ?? "");
    if (!res.ok || /invalid|hash mismatch/i.test(msg)) return { ok: false, message: `Easebuzz rejected the Key / Salt for ${mode} mode${msg ? ` (${msg.slice(0, 80)})` : ""}` };
    return { ok: true, message: `Connected to Easebuzz (${mode})` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};
