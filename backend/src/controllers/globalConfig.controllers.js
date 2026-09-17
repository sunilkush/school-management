import { GlobalConfig } from "../models/GlobalConfig.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * Secrets are never sent to the browser (select: false on the model). The settings page cannot
 * show them, so it sends them back blank — and a blank used to be written over the saved value,
 * which meant saving any setting on the page erased the Razorpay key secret, the SMTP password and
 * the SMS API key. A blank secret now means "keep what is saved"; removing one is asked for by name.
 */
const SECRETS = ["smtpPassword", "smsApiKey", "razorpayKeySecret", "razorpayWebhookSecret"];

const PLAIN_FIELDS = [
  "platformName", "currency", "currencySymbol", "timezone", "theme",
  "supportEmail", "supportPhone", "maintenanceMode", "allowRegistration", "maxSchools",
  "smtpHost", "smtpPort", "smtpUser", "smtpFromEmail", "smtpFromName",
  "smsProvider", "smsSenderId",
  "paymentGateway", "razorpayKeyId",
];

/** The config as the page sees it: no secret values, but whether each one is saved. */
async function readForPage() {
  const config = await GlobalConfig.findOne({ key: "global" }).select(SECRETS.map((s) => `+${s}`).join(" ")).lean();
  if (!config) return null;
  const out = { ...config };
  for (const secret of SECRETS) {
    out[`has${secret[0].toUpperCase()}${secret.slice(1)}`] = Boolean(config[secret]);
    delete out[secret];
  }
  return out;
}

/* ── GET CONFIG ──────────────────────────────────────────────────────────── */
export const getGlobalConfig = asyncHandler(async (req, res) => {
  const exists = await GlobalConfig.exists({ key: "global" });
  if (!exists) {
    await GlobalConfig.create({ key: "global", updatedBy: req.user._id });
  }

  res.status(200).json(new ApiResponse(200, await readForPage(), "Global config fetched"));
});

/* ── UPDATE CONFIG ───────────────────────────────────────────────────────── */
export const updateGlobalConfig = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const $set = { updatedBy: req.user._id };
  const $unset = {};

  for (const field of PLAIN_FIELDS) {
    if (body[field] !== undefined) $set[field] = body[field];
  }

  for (const secret of SECRETS) {
    const value = typeof body[secret] === "string" ? body[secret].trim() : body[secret];
    if (value) $set[secret] = value;
  }

  // Sent as an array from JSON, or as a comma-separated string from a multipart form.
  const clear = Array.isArray(body.clearSecrets)
    ? body.clearSecrets
    : String(body.clearSecrets || "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const secret of clear) {
    if (!SECRETS.includes(secret)) throw new ApiError(400, `Unknown secret: ${secret}`);
    delete $set[secret];
    $unset[secret] = "";
  }

  // The page offered a logo upload, but the file was sent inside a JSON body and never stored.
  if (req.files?.logo?.[0]?.path) {
    const uploaded = await uploadOnCloudinary(req.files.logo[0].path);
    if (!uploaded?.url) throw new ApiError(502, "The logo could not be uploaded");
    $set.logoUrl = uploaded.url;
  } else if (body.removeLogo === true || body.removeLogo === "true") {
    delete $set.logoUrl;
    $unset.logoUrl = "";
  }

  await GlobalConfig.findOneAndUpdate(
    { key: "global" },
    { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json(new ApiResponse(200, await readForPage(), "Global config updated successfully"));
});
