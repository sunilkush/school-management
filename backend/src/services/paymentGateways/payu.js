import { ApiError } from "../../utils/ApiError.js";
import { gatewayRequest, rupees, safeEqual, sha512Hex } from "./gatewayHttp.js";

/** PayU India hosted checkout. https://docs.payu.in/docs/generate-hash-payu-hosted */
const NAME = "PayU";
const payUrl = (mode) => (mode === "live" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment");
const infoUrl = (mode) =>
  mode === "live" ? "https://info.payu.in/merchant/postservice.php?form=2" : "https://test.payu.in/merchant/postservice.php?form=2";

const PRODUCT = "School Fee";

/** sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT) */
export const requestHash = ({ key, txnid, amount, productinfo, firstname, email, udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "" }, salt) =>
  sha512Hex([key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, "", "", "", "", "", salt].join("|"));

/** Reverse hash PayU sends back: sha512([additionalCharges|]SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key) */
export const responseHash = (p, salt) => {
  const parts = [salt, p.status, "", "", "", "", "", p.udf5 || "", p.udf4 || "", p.udf3 || "", p.udf2 || "", p.udf1 || "", p.email, p.firstname, p.productinfo, p.amount, p.txnid, p.key];
  const joined = parts.map((v) => (v == null ? "" : v)).join("|");
  return sha512Hex(p.additionalCharges ? `${p.additionalCharges}|${joined}` : joined);
};

export const createCheckout = async ({ creds, mode, orderId, amount, customer, urls }) => {
  const fields = {
    key: creds.merchantKey,
    txnid: orderId,
    amount: rupees(amount),
    productinfo: PRODUCT,
    firstname: (customer.name || "Parent").split(" ")[0].slice(0, 60),
    email: customer.email || "noreply@example.com",
    phone: String(customer.phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
    surl: urls.returnUrl,
    furl: urls.returnUrl,
    udf1: orderId,
  };
  fields.hash = requestHash(fields, creds.merchantSalt);

  return { gatewayOrderId: orderId, checkout: { type: "form", action: payUrl(mode), method: "POST", fields } };
};

const verifyCall = ({ creds, mode, txnid }) =>
  gatewayRequest(NAME, infoUrl(mode), {
    method: "POST",
    form: {
      key: creds.merchantKey,
      command: "verify_payment",
      var1: txnid,
      hash: sha512Hex(`${creds.merchantKey}|verify_payment|${txnid}|${creds.merchantSalt}`),
    },
  });

export const fetchStatus = async ({ creds, mode, gatewayOrderId }) => {
  const res = await verifyCall({ creds, mode, txnid: gatewayOrderId });
  if (!res.ok || !res.data) throw new ApiError(502, `${NAME} could not verify the payment (HTTP ${res.status})`);

  const txn = res.data.transaction_details?.[gatewayOrderId];
  const status = String(txn?.status || "").toLowerCase();
  if (status === "success") return { state: "paid", amount: Number(txn.amt), gatewayPaymentId: txn.mihpayid ? String(txn.mihpayid) : null, raw: txn };
  if (["failure", "failed", "usercancelled"].includes(status)) return { state: "failed", raw: txn };
  return { state: "pending", raw: res.data };
};

/** PayU webhooks and the browser return carry the same fields and reverse hash. */
export const parseWebhook = ({ creds, body }) => {
  if (!body?.hash || !body?.txnid || body.key !== creds.merchantKey) return { valid: false };
  return { valid: safeEqual(responseHash(body, creds.merchantSalt), String(body.hash).toLowerCase()), orderId: body.txnid };
};

export const testCredentials = async ({ creds, mode }) => {
  const res = await verifyCall({ creds, mode, txnid: `conncheck${Date.now()}` });
  const msg = String(res.data?.msg || res.text || "");
  if (!res.ok || /invalid|not authori[sz]ed/i.test(msg)) return { ok: false, message: `PayU rejected the Merchant Key / Salt for ${mode} mode${msg ? ` (${msg.slice(0, 80)})` : ""}` };
  return { ok: true, message: `Connected to PayU (${mode})` };
};
