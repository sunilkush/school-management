import crypto from "crypto";
import { OTP } from "../models/otpVerifications.model.js";
import { sendEmail } from "./mailServices.js";
import { ApiError } from "./ApiError.js";

/**
 * One-time codes sent by email — for signing in with two-factor authentication, and for turning
 * it on or off.
 *
 * What this replaces went wrong in ways that locked people out:
 *  - A new code did not reset the wrong-attempt count, so after five mistyped codes in total,
 *    ever, every future code was "burned" on arrival and a 2FA account could never sign in again.
 *  - Sign-in, turning 2FA on and turning it off all shared one code slot, so asking for one
 *    replaced another that was still waiting (and a code sent for one could be used for another).
 *  - Codes came from Math.random(), and a failed email left the user told "OTP sent".
 */

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

/** Makes a new code for this email and purpose (replacing any waiting one) and emails it. */
export async function issueOtp({ email, purpose, subject, intro }) {
  if (!email) throw new ApiError(400, "This account has no email address to send the code to");

  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  // Only the waiting (unused) code is replaced; a used one is left for its TTL, so the partial
  // unique index on waiting codes can never see two.
  await OTP.findOneAndUpdate(
    { emailOrPhone: email, purpose, verifiedAt: null },
    { $set: { code, expiresAt, attempts: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendEmail(
      email,
      subject,
      `${intro}\n\nYour code is: ${code}\n\nIt expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`
    );
  } catch (err) {
    await OTP.deleteOne({ emailOrPhone: email, purpose, verifiedAt: null }).catch(() => {});
    console.error(`[otp] could not email a ${purpose} code:`, err.message);
    throw new ApiError(502, "The code could not be sent by email. Please try again in a moment.");
  }
}

/**
 * Checks a code and uses it up. Each check takes one attempt before the code is compared, in a
 * single update, so parallel guesses cannot get past the limit; a right code can be used once.
 */
export async function useOtp({ email, purpose, otp }) {
  const entered = String(otp ?? "").trim();
  if (!/^\d{6}$/.test(entered)) throw new ApiError(400, "Enter the 6-digit code");

  const now = new Date();
  const record = await OTP.findOneAndUpdate(
    { emailOrPhone: email, purpose, verifiedAt: null, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );

  if (!record) {
    const waiting = await OTP.findOne({ emailOrPhone: email, purpose, verifiedAt: null }).select("expiresAt");
    if (!waiting) throw new ApiError(400, "No code is waiting. Request a new one.");
    if (waiting.expiresAt <= now) throw new ApiError(400, "That code has expired. Request a new one.");
    throw new ApiError(429, "Too many wrong codes. Request a new one.");
  }

  const matches = record.code.length === entered.length
    && crypto.timingSafeEqual(Buffer.from(record.code), Buffer.from(entered));
  if (!matches) {
    const left = OTP_MAX_ATTEMPTS - record.attempts;
    throw new ApiError(
      400,
      left > 0 ? `Wrong code — ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes. Request a new one."
    );
  }

  const used = await OTP.findOneAndUpdate({ _id: record._id, verifiedAt: null }, { $set: { verifiedAt: new Date() } });
  if (!used) throw new ApiError(400, "That code has already been used. Request a new one.");
}
