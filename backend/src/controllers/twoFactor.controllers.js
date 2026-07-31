import { User } from "../models/user.model.js";
import { OTP } from "../models/otpVerifications.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/mailServices.js";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

/* ── Generate a 6-digit OTP ─────────────────────────────────────────────── */
const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

/* ── Send OTP email ─────────────────────────────────────────────────────── */
const sendOtpEmail = async (email, code, purpose = "2FA Verification") => {
  await sendEmail(
    email,
    `${purpose} — Your OTP Code`,
    `Your one-time password is: ${code}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\nDo not share this code with anyone.`
  );
};

/* ── Enable 2FA — step 1: send OTP to user's email ─────────────────────── */
export const enable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.twoFactorEnabled) throw new ApiError(400, "2FA is already enabled");

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Upsert OTP (partial unique index handles race condition)
  await OTP.findOneAndUpdate(
    { emailOrPhone: user.email, purpose: "login" },
    { code, expiresAt, verifiedAt: null },
    { upsert: true, new: true }
  );

  await sendOtpEmail(user.email, code, "Enable 2FA");

  res.status(200).json(new ApiResponse(200, null, `OTP sent to ${user.email}. Enter it to confirm enabling 2FA.`));
});

/* ── Enable 2FA — step 2: verify OTP and activate ──────────────────────── */
export const confirm2FA = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP is required");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const record = await OTP.findOne({
    emailOrPhone: user.email,
    purpose: "login",
    verifiedAt: null,
  });

  if (!record) throw new ApiError(400, "OTP not found or already used");
  if (new Date() > record.expiresAt) throw new ApiError(400, "OTP has expired");
  if (record.attempts >= 5) throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
  if (record.code !== otp) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Invalid OTP");
  }

  record.verifiedAt = new Date();
  await record.save();

  user.twoFactorEnabled = true;
  user.twoFactorMethod = "email";
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, { twoFactorEnabled: true }, "2FA enabled successfully"));
});

/* ── Disable 2FA ────────────────────────────────────────────────────────── */
export const disable2FA = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP is required to disable 2FA");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled");

  const record = await OTP.findOne({
    emailOrPhone: user.email,
    purpose: "login",
    verifiedAt: null,
  });

  if (!record) throw new ApiError(400, "OTP not found or already used. Please request a new one.");
  if (new Date() > record.expiresAt) throw new ApiError(400, "OTP has expired. Please request a new one.");
  if (record.attempts >= 5) throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
  if (record.code !== otp) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Invalid OTP");
  }

  record.verifiedAt = new Date();
  await record.save();

  user.twoFactorEnabled = false;
  user.twoFactorMethod = "none";
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, { twoFactorEnabled: false }, "2FA disabled successfully"));
});

/* ── Send OTP for disable confirmation ──────────────────────────────────── */
export const requestDisable2FAOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled");

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTP.findOneAndUpdate(
    { emailOrPhone: user.email, purpose: "login" },
    { code, expiresAt, verifiedAt: null },
    { upsert: true, new: true }
  );

  await sendOtpEmail(user.email, code, "Disable 2FA");

  res.status(200).json(new ApiResponse(200, null, `OTP sent to ${user.email}`));
});

/* ── Verify 2FA OTP at login (called after password check) ─────────────── */
export const verifyLogin2FA = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) throw new ApiError(400, "userId and otp are required");

  const user = await User.findById(userId).populate("roleId").populate("schoolId");
  if (!user || !user.isActive) throw new ApiError(401, "User not found or inactive");
  if (!user.twoFactorEnabled) throw new ApiError(400, "2FA is not enabled for this user");

  const record = await OTP.findOne({
    emailOrPhone: user.email,
    purpose: "login",
    verifiedAt: null,
  });

  if (!record) throw new ApiError(400, "OTP not found or already used");
  if (new Date() > record.expiresAt) throw new ApiError(400, "OTP has expired");
  if (record.attempts >= 5) throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
  if (record.code !== otp) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Invalid OTP");
  }

  record.verifiedAt = new Date();
  await record.save();

  // Generate tokens now that 2FA is complete
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" })
    .json(new ApiResponse(200, { accessToken, refreshToken }, "2FA verified. Login successful."));
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
