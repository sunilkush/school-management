import * as razorpayGateway from "./razorpayGateway.js";
import * as cashfreeGateway from "./cashfreeGateway.js";
import { GlobalConfig } from "../../models/GlobalConfig.model.js";
import { ApiError } from "../../utils/ApiError.js";

const GATEWAYS = {
  razorpay: razorpayGateway,
  cashfree: cashfreeGateway,
};

/** Returns the gateway module for a given name (each exposes createOrder/verifyPaymentSignature/
 * verifyWebhookSignature/refundPayment — see razorpayGateway.js for the reference implementation). */
export const getGateway = (name) => {
  const gateway = GATEWAYS[name];
  if (!gateway) throw new ApiError(400, `Unknown or unconfigured payment gateway: ${name}`);
  return gateway;
};

/** Returns the platform's currently-configured default gateway (GlobalConfig.paymentGateway). */
export const getActiveGateway = async () => {
  const config = await GlobalConfig.findOne({ key: "global" }).select("paymentGateway");
  const name = config?.paymentGateway && config.paymentGateway !== "none" ? config.paymentGateway : "razorpay";
  return { name, gateway: getGateway(name) };
};
