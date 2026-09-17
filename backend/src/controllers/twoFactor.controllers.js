import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { issueOtp, useOtp } from "../utils/otpCodes.js";
import { recordLoginEvent } from "./loginLog.controllers.js";
import { billingOnlyMessage, canUseBillingOnly, findSchoolAccessProblem, isSuperAdminUser } from "../utils/schoolAccess.js";

/*
 * Each step has its own code (utils/otpCodes.js): "login" for signing in, "enable_2fa" and
 * "disable_2fa" for changing the setting. They used to share one, so asking to turn 2FA off on one
 * device replaced the sign-in code another device was waiting on.
 */

/* ── Enable 2FA — step 1: send a code to the user's email ──────────────── */
export const enable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.twoFactorEnabled) throw new ApiError(400, "2FA is already enabled");

  await issueOtp({
    email: user.email,
    purpose: "enable_2fa",
    subject: "Turn on two-factor authentication — your code",
    intro: "You asked to turn on two-factor authentication for your account.",
  });

  res.status(200).json(new ApiResponse(200, null, `A code has been sent to ${user.email}. Enter it to turn on 2FA.`));
});

/* ── Enable 2FA — step 2: check the code and switch it on ──────────────── */
export const confirm2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.twoFactorEnabled) throw new ApiError(400, "2FA is already enabled");

  await useOtp({ email: user.email, purpose: "enable_2fa", otp: req.body?.otp });

  user.twoFactorEnabled = true;
  user.twoFactorMethod = "email";
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, { twoFactorEnabled: true }, "2FA enabled successfully"));
});

/* ── Disable 2FA — step 1: send a code ─────────────────────────────────── */
export const requestDisable2FAOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled");

  await issueOtp({
    email: user.email,
    purpose: "disable_2fa",
    subject: "Turn off two-factor authentication — your code",
    intro: "You asked to turn off two-factor authentication for your account. If this was not you, change your password.",
  });

  res.status(200).json(new ApiResponse(200, null, `A code has been sent to ${user.email}`));
});

/* ── Disable 2FA — step 2: check the code and switch it off ────────────── */
export const disable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled");

  await useOtp({ email: user.email, purpose: "disable_2fa", otp: req.body?.otp });

  user.twoFactorEnabled = false;
  user.twoFactorMethod = "none";
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, { twoFactorEnabled: false }, "2FA disabled successfully"));
});

/* ── Verify 2FA code at sign-in (after the password step) ──────────────── */
// Public (no token yet) — listed in PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js. It was not,
// so the request was refused for having no token and nobody with 2FA turned on could sign in.
export const verifyLogin2FA = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) throw new ApiError(400, "userId and otp are required");

  const user = await User.findById(userId).populate("roleId").populate("schoolId");
  if (!user || !user.isActive || user.isDeleted) throw new ApiError(401, "User not found or inactive");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled for this user");

  // Password login checked the school; it may have been switched off or suspended since the code went out.
  let billingOnly = null;
  if (!isSuperAdminUser(user)) {
    const problem = await findSchoolAccessProblem(user.schoolId?._id, { fresh: true });
    if (problem && !canUseBillingOnly(problem, user)) throw new ApiError(403, problem.message);
    if (problem) billingOnly = { reason: billingOnlyMessage(problem) };
  }

  await useOtp({ email: user.email, purpose: "login", otp });

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Sign-ins that went through 2FA were missing from the login log.
  recordLoginEvent({
    userId: user._id,
    schoolId: user.schoolId?._id || user.schoolId,
    userRole: user.roleId?.name || "Unknown",
    academicYearId: user.academicYearId,
    req,
    status: "success",
  });

  res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" })
    .json(new ApiResponse(200, { accessToken, refreshToken, billingOnly }, "2FA verified. Login successful."));
});

/* ── Get 2FA status for current user ───────────────────────────────────── */
export const get2FAStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("twoFactorEnabled twoFactorMethod email");
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, {
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod,
    email: user.email,
  }, "2FA status fetched"));
});
