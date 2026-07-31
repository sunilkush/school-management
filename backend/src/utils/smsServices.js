import twilio from "twilio";
import { User } from "../models/user.model.js";
import { getSchoolTwilioConfig } from "./twilioConfig.js";

let defaultClient;
let defaultInitAttempted = false;

/**
 * Lazily initializes the shared platform Twilio client from env vars. Returns null (rather than
 * throwing) when they're unset/invalid, so a school that hasn't configured SMS at all — either
 * its own account or the platform default — doesn't take module import or notification creation
 * down; SMS becomes a no-op, not a boot crash or a 500.
 */
function getDefaultTwilioClient() {
  if (defaultInitAttempted) return defaultClient || null;
  defaultInitAttempted = true;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[smsServices] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER not set — platform-default SMS sending is disabled");
    return null;
  }

  try {
    defaultClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return defaultClient;
  } catch (error) {
    console.error("[smsServices] Failed to initialize Twilio client:", error.message);
    return null;
  }
}

/**
 * Resolves which Twilio client + "from" number a school's SMS should go out on: their own
 * configured account if they've enabled one, otherwise the shared platform account.
 */
async function resolveSender(schoolId) {
  const schoolConfig = await getSchoolTwilioConfig(schoolId, { channel: "sms" });
  if (schoolConfig) {
    try {
      return { client: twilio(schoolConfig.accountSid, schoolConfig.authToken), from: schoolConfig.smsFromNumber };
    } catch (error) {
      console.error(`[smsServices] Failed to init school ${schoolId}'s own Twilio client, falling back to platform account:`, error.message);
    }
  }

  const client = getDefaultTwilioClient();
  return client ? { client, from: process.env.TWILIO_PHONE_NUMBER } : null;
}

/**
 * Sends a single SMS via the resolved sender. Never throws — logs and returns false on failure so
 * a caller looping over many recipients can keep going.
 */
const sendSms = async (to, message, sender) => {
  try {
    await sender.client.messages.create({ from: sender.from, to, body: message });
    return true;
  } catch (error) {
    console.error(`[smsServices] Failed to send SMS to ${to}:`, error.message);
    return false;
  }
};

/**
 * Sends an SMS to every given user id that has a phone number on file, using the calling school's
 * own Twilio account if they've configured one. Mirrors pushService.js's sendPushToUsers contract:
 * never throws, returns {sent, failed, skipped} with skipped:true when no sender (school or
 * platform) is configured, so the caller can leave deliveryStats untouched.
 */
export async function sendSmsToUsers(userIds, { title, body, schoolId }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  const sender = await resolveSender(schoolId);
  if (!sender) return { sent: 0, failed: 0, skipped: true };

  const users = await User.find({ _id: { $in: userIds }, phone: { $exists: true, $ne: "" } }).select("phone");
  if (!users.length) return { sent: 0, failed: 0, skipped: false };

  const message = title ? `${title}\n\n${body || ""}` : body || "";

  // Parallel, not sequential — see the comment in mailServices.js's sendEmailToUsers for why a
  // per-recipient for-loop is a latent hang risk once recipient counts grow.
  const results = await Promise.all(users.map((user) => sendSms(user.phone, message, sender)));

  let sent = 0;
  let failed = 0;
  results.forEach((ok) => { if (ok) sent += 1; else failed += 1; });

  return { sent, failed, skipped: false };
}
