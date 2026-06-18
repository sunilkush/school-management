import { GlobalConfig } from "../models/GlobalConfig.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ── GET CONFIG ──────────────────────────────────────────────────────────── */
export const getGlobalConfig = asyncHandler(async (req, res) => {
  let config = await GlobalConfig.findOne({ key: "global" });

  if (!config) {
    config = await GlobalConfig.create({
      key: "global",
      updatedBy: req.user._id,
    });
  }

  res.status(200).json(new ApiResponse(200, config, "Global config fetched"));
});

/* ── UPDATE CONFIG ───────────────────────────────────────────────────────── */
export const updateGlobalConfig = asyncHandler(async (req, res) => {
  const {
    platformName, currency, currencySymbol, timezone, theme,
    logoUrl, supportEmail, supportPhone, maintenanceMode, allowRegistration, maxSchools,
    // SMTP
    smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName,
    // SMS
    smsProvider, smsApiKey, smsSenderId,
    // Payment
    paymentGateway, razorpayKeyId, razorpayKeySecret,
  } = req.body;

  const fields = {
    platformName, currency, currencySymbol, timezone, theme,
    logoUrl, supportEmail, supportPhone, maintenanceMode, allowRegistration, maxSchools,
    smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName,
    smsProvider, smsApiKey, smsSenderId,
    paymentGateway, razorpayKeyId, razorpayKeySecret,
  };

  const $set = { updatedBy: req.user._id };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) $set[k] = v;
  }

  const config = await GlobalConfig.findOneAndUpdate(
    { key: "global" },
    { $set },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, config, "Global config updated successfully"));
});
