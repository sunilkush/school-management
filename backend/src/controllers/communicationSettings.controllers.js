import { CommunicationSettings } from "../models/CommunicationSettings.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolIdFromReq } from "../utils/resolveSchoolId.js";

// Same tenant-trust rule used across dashboard/report endpoints: the query param only wins for
// Super Admin (who has no school of their own), otherwise every caller reads/writes their own
// school's settings regardless of what they pass in the query string.
const resolveTargetSchoolId = (req) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin" || req.user?.roleId?.name === "Super Admin";
  const ownSchoolId = resolveSchoolIdFromReq(req);
  return isSuperAdmin ? (req.query.schoolId || ownSchoolId) : ownSchoolId;
};

// Never echo the auth token back in full — this endpoint is reachable by every school's own
// admin, not just one platform Super Admin, so a casual network-tab glance shouldn't leak it.
const maskToken = (token) => (token && token.length > 4 ? `${"•".repeat(Math.max(token.length - 4, 4))}${token.slice(-4)}` : token ? "••••" : "");

const toClientShape = (doc) => ({
  _id: doc._id,
  schoolId: doc.schoolId,
  provider: doc.provider,
  accountSid: doc.accountSid || "",
  authToken: maskToken(doc.authToken),
  hasAuthToken: Boolean(doc.authToken),
  smsFromNumber: doc.smsFromNumber || "",
  whatsappFromNumber: doc.whatsappFromNumber || "",
  isSmsEnabled: doc.isSmsEnabled,
  isWhatsappEnabled: doc.isWhatsappEnabled,
  updatedAt: doc.updatedAt,
});

export const getCommunicationSettings = asyncHandler(async (req, res) => {
  const schoolId = resolveTargetSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const doc = await CommunicationSettings.findOne({ schoolId }).lean();
  if (!doc) {
    return res.status(200).json(
      new ApiResponse(200, {
        schoolId, provider: "none", accountSid: "", authToken: "", hasAuthToken: false,
        smsFromNumber: "", whatsappFromNumber: "", isSmsEnabled: false, isWhatsappEnabled: false,
        isConfigured: false,
      }, "No custom sender configured — using the platform default account")
    );
  }

  res.status(200).json(new ApiResponse(200, { ...toClientShape(doc), isConfigured: true }, "Communication settings fetched"));
});

export const updateCommunicationSettings = asyncHandler(async (req, res) => {
  const schoolId = resolveTargetSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const { provider, accountSid, authToken, smsFromNumber, whatsappFromNumber, isSmsEnabled, isWhatsappEnabled } = req.body;

  if (provider && !["twilio", "none"].includes(provider)) {
    throw new ApiError(400, "provider must be 'twilio' or 'none'");
  }

  const existing = await CommunicationSettings.findOne({ schoolId }).lean();

  const $set = { updatedBy: req.user._id };
  if (provider !== undefined) $set.provider = provider;
  if (accountSid !== undefined) $set.accountSid = String(accountSid).trim();
  if (smsFromNumber !== undefined) $set.smsFromNumber = String(smsFromNumber).trim();
  if (whatsappFromNumber !== undefined) $set.whatsappFromNumber = String(whatsappFromNumber).trim();
  if (isSmsEnabled !== undefined) $set.isSmsEnabled = Boolean(isSmsEnabled);
  if (isWhatsappEnabled !== undefined) $set.isWhatsappEnabled = Boolean(isWhatsappEnabled);

  // Only overwrite the stored secret when the caller actually sent a new one — the GET response
  // never returns the real token, so a re-save of the other fields must not wipe it out with the
  // masked placeholder that came back from the form.
  if (authToken && !authToken.includes("•")) {
    $set.authToken = String(authToken).trim();
  }

  const finalProvider = $set.provider ?? existing?.provider ?? "none";
  const finalSmsEnabled = $set.isSmsEnabled ?? existing?.isSmsEnabled ?? false;
  const finalWhatsappEnabled = $set.isWhatsappEnabled ?? existing?.isWhatsappEnabled ?? false;
  if (finalProvider === "twilio" && (finalSmsEnabled || finalWhatsappEnabled)) {
    const finalAccountSid = $set.accountSid ?? existing?.accountSid;
    const finalAuthToken = $set.authToken ?? existing?.authToken;
    if (!finalAccountSid || !finalAuthToken) {
      throw new ApiError(400, "accountSid and authToken are required to enable Twilio SMS/WhatsApp");
    }
  }

  const doc = await CommunicationSettings.findOneAndUpdate(
    { schoolId },
    { $set },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(new ApiResponse(200, { ...toClientShape(doc), isConfigured: true }, "Communication settings updated"));
});
