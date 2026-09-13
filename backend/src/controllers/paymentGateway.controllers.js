import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { requireSchoolId } from "../utils/resolveSchoolId.js";
import { gatewayLabel } from "../services/paymentGateways/providers.js";
import {
  activateGateway,
  deactivateGateway,
  listSchoolGateways,
  saveGatewayCredentials,
  testGateway,
} from "../services/schoolPaymentGateway.service.js";
import { apiBaseUrl, gatewayWebhookUrl } from "../services/onlinePayment.service.js";

/**
 * A school's online payment gateways. Always the caller's own school — there is no schoolId in any
 * request to point at another. Secrets are write-only: responses say which fields are filled, never
 * what they are.
 */

const withUrls = (req, schoolId, gateways) =>
  gateways.map((g) => ({
    ...g,
    webhookUrl: gatewayWebhookUrl(req, g.provider, schoolId),
    returnUrlPattern: `${apiBaseUrl(req)}/api/v1/payments/return/<payment id>`,
  }));

/** GET /payment-gateways */
export const getSchoolGateways = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const gateways = withUrls(req, schoolId, await listSchoolGateways(schoolId));
  return sendSuccess(res, {
    message: "Payment gateways",
    data: { gateways, active: gateways.find((g) => g.isActive)?.provider || null },
  });
});

/** PUT /payment-gateways/:provider  { mode, credentials: { … } } — blank secret fields keep their saved value. */
export const saveSchoolGateway = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { provider } = req.params;
  await saveGatewayCredentials({
    schoolId,
    provider,
    mode: req.body.mode,
    values: req.body.credentials || {},
    userId: req.user._id,
  });
  const gateways = withUrls(req, schoolId, await listSchoolGateways(schoolId));
  return sendSuccess(res, { message: `${gatewayLabel(provider)} details saved`, data: { gateways } });
});

/** POST /payment-gateways/:provider/test — makes a harmless call to the gateway with the saved credentials. */
export const testSchoolGateway = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const result = await testGateway({ schoolId, provider: req.params.provider });
  return sendSuccess(res, { message: result.message, data: result });
});

/** POST /payment-gateways/:provider/activate — becomes the only active gateway; any other is disabled. */
export const activateSchoolGateway = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { provider } = req.params;
  const gateways = withUrls(req, schoolId, await activateGateway({ schoolId, provider, userId: req.user._id }));
  return sendSuccess(res, {
    message: `${gatewayLabel(provider)} is now the school's payment gateway. Other gateways are disabled.`,
    data: { gateways, active: provider },
  });
});

/** POST /payment-gateways/:provider/deactivate — turns online payment off; credentials stay saved. */
export const deactivateSchoolGateway = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { provider } = req.params;
  const gateways = withUrls(req, schoolId, await deactivateGateway({ schoolId, provider, userId: req.user._id }));
  return sendSuccess(res, {
    message: `${gatewayLabel(provider)} disabled. Online fee payment is off until a gateway is activated.`,
    data: { gateways, active: null },
  });
});
