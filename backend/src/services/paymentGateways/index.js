import * as razorpay from "./razorpay.js";
import * as cashfree from "./cashfree.js";
import * as payu from "./payu.js";
import * as phonepe from "./phonepe.js";
import * as paytm from "./paytm.js";
import * as ccavenue from "./ccavenue.js";
import * as easebuzz from "./easebuzz.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * School fee-collection gateways. (The platform's own SaaS billing — school pays platform — is a
 * separate system in services/paymentGateway/, singular.)
 *
 * Every adapter implements the same four calls, so nothing outside this folder knows which
 * gateway a school uses:
 *
 *   createCheckout({ creds, mode, orderId, amount, customer, urls, description, schoolId })
 *     → { gatewayOrderId, checkout, meta? }      checkout is what the browser needs to pay
 *   fetchStatus({ creds, mode, gatewayOrderId, meta })
 *     → { state: "paid" | "pending" | "failed", amount?, gatewayPaymentId?, raw }
 *   parseWebhook({ creds, headers, rawBody, body })
 *     → { valid, orderId? }                        orderId is our Payment id
 *   testCredentials({ creds, mode }) → { ok, message }
 *
 * The rule every flow keeps: money is applied only after fetchStatus — the server asking the
 * gateway directly — says "paid", for the amount the gateway reports. A browser redirect or a
 * webhook is only ever the prompt to go and ask.
 */
const ADAPTERS = { razorpay, cashfree, payu, phonepe, paytm, ccavenue, easebuzz };

export const getAdapter = (provider) => {
  const adapter = ADAPTERS[provider];
  if (!adapter) throw new ApiError(400, `Unsupported payment gateway: ${provider}`);
  return adapter;
};
