import { DeviceToken } from "../models/DeviceToken.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const PLATFORMS = ["android", "ios"];

/**
 * POST /device-tokens/register
 * Upserts by token (not by user) — a token can be reassigned across accounts on a shared or
 * factory-reset device, so a stale row from a previous owner must be re-pointed at the current
 * user rather than duplicated.
 */
export const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token, platform, deviceId } = req.body || {};

  if (!token?.trim()) throw new ApiError(400, "token is required");
  if (!PLATFORMS.includes(platform)) throw new ApiError(400, `platform must be one of: ${PLATFORMS.join(", ")}`);

  const schoolId = req.user?.schoolId?._id || req.user?.schoolId || null;

  const record = await DeviceToken.findOneAndUpdate(
    { token: token.trim() },
    {
      userId: req.user._id,
      schoolId,
      platform,
      deviceId: deviceId || undefined,
      isActive: true,
      lastActiveAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: "Device registered for push notifications",
    data: record,
  });
});

/** POST /device-tokens/unregister — called on logout so a signed-out device stops receiving push. */
export const unregisterDeviceToken = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token?.trim()) throw new ApiError(400, "token is required");

  await DeviceToken.updateOne({ token: token.trim(), userId: req.user._id }, { isActive: false });

  return sendSuccess(res, { message: "Device unregistered" });
});
