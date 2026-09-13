import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";

/** Small shared helpers for the gateway adapters. */

export const sha256Hex = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const sha512Hex = (s) => crypto.createHash("sha512").update(s).digest("hex");
export const hmacSha256 = (secret, s, encoding = "hex") => crypto.createHmac("sha256", secret).update(s).digest(encoding);

export const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
};

/** Rupees as the two-decimal string most gateways sign ("2000.00"). */
export const rupees = (amount) => Number(amount).toFixed(2);
export const paise = (amount) => Math.round(Number(amount) * 100);

/**
 * fetch with a timeout, returning { status, ok, data, text }. Network failures become a 502 with
 * the gateway's name, so a school admin sees "PayU did not respond" rather than a stack trace.
 */
export const gatewayRequest = async (gateway, url, { method = "GET", headers = {}, json, form, timeoutMs = 20000 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init = { method, headers: { Accept: "application/json", ...headers }, signal: controller.signal };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
    init.headers["Content-Type"] = "application/json";
  } else if (form !== undefined) {
    init.body = new URLSearchParams(Object.entries(form).map(([k, v]) => [k, v == null ? "" : String(v)])).toString();
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data, text };
  } catch (err) {
    const reason = err?.name === "AbortError" ? "did not respond in time" : "could not be reached";
    throw new ApiError(502, `${gateway} ${reason}. Please try again.`);
  } finally {
    clearTimeout(timer);
  }
};

/** Lower-cased header lookup that works for Express `req.headers` and plain objects. */
export const header = (headers, name) => {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  const found = Object.keys(headers).find((k) => k.toLowerCase() === wanted);
  return found ? headers[found] : undefined;
};
