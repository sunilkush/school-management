import { ApiError } from "../../utils/ApiError.js";

/**
 * Cashfree gateway stub — implements the same interface as razorpayGateway.js
 * (createOrder/verifyPaymentSignature/verifyWebhookSignature/refundPayment) so
 * gatewayFactory.js has a real second implementation to select, and adding actual Cashfree
 * support later is a matter of filling these in against the `cashfree-pg` SDK, not redesigning
 * the call sites that use them. Not wired up: no SDK installed, no credentials configured, and
 * nothing to test it against yet — every method throws until that changes.
 */
const notConfigured = () => {
  throw new ApiError(501, "Cashfree is not yet configured for this platform.");
};

export const createOrder = async () => notConfigured();
export const verifyPaymentSignature = async () => notConfigured();
export const verifyWebhookSignature = async () => notConfigured();
export const refundPayment = async () => notConfigured();
