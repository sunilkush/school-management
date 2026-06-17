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
    platformName,
    currency,
    currencySymbol,
    timezone,
    theme,
    logoUrl,
    supportEmail,
    supportPhone,
    maintenanceMode,
    allowRegistration,
    maxSchools,
  } = req.body;

  const config = await GlobalConfig.findOneAndUpdate(
    { key: "global" },
    {
      $set: {
        ...(platformName !== undefined && { platformName }),
        ...(currency !== undefined && { currency }),
        ...(currencySymbol !== undefined && { currencySymbol }),
        ...(timezone !== undefined && { timezone }),
        ...(theme !== undefined && { theme }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(supportEmail !== undefined && { supportEmail }),
        ...(supportPhone !== undefined && { supportPhone }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        ...(allowRegistration !== undefined && { allowRegistration }),
        ...(maxSchools !== undefined && { maxSchools }),
        updatedBy: req.user._id,
      },
    },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, config, "Global config updated successfully"));
});
