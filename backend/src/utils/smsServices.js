import twilio from "twilio";
import { User } from "../models/user.model.js";

let twilioClient;
let initAttempted = false;

/**
 * Lazily initializes the Twilio client from env vars. Returns null (rather than throwing) when
 * they're unset/invalid, so a school that hasn't configured SMS doesn't take module import or
 * notification creation down — SMS becomes a no-op, not a boot crash or a 500.
 */
function getTwilioClient() {
  if (initAttempted) return twilioClient || null;
  initAttempted = true;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[smsServices] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER not set — SMS sending is disabled");
    return null;
  }

  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return twilioClient;
  } catch (error) {
    console.error("[smsServices] Failed to initialize Twilio client:", error.message);
    return null;
  }
}

/**
 * Sends a single SMS. Never throws — logs and returns false on failure so a caller looping over
 * many recipients can keep going.
 */
const sendSms = async (to, message) => {
  const client = getTwilioClient();
  if (!client) return false;

  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
    return true;
  } catch (error) {
    console.error(`[smsServices] Failed to send SMS to ${to}:`, error.message);
    return false;
  }
};

/**
 * Sends an SMS to every given user id that has a phone number on file. Mirrors
 * pushService.js's sendPushToUsers contract: never throws, returns {sent, failed, skipped}
 * with skipped:true when Twilio isn't configured so the caller can leave deliveryStats untouched.
 */
export async function sendSmsToUsers(userIds, { title, body }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  const client = getTwilioClient();
  if (!client) return { sent: 0, failed: 0, skipped: true };

  const users = await User.find({ _id: { $in: userIds }, phone: { $exists: true, $ne: "" } }).select("phone");
  if (!users.length) return { sent: 0, failed: 0, skipped: false };

  const message = title ? `${title}\n\n${body || ""}` : body || "";

  // Parallel, not sequential — see the comment in mailServices.js's sendEmailToUsers for why a
  // per-recipient for-loop is a latent hang risk once recipient counts grow.
  const results = await Promise.all(users.map((user) => sendSms(user.phone, message)));

  let sent = 0;
  let failed = 0;
  results.forEach((ok) => { if (ok) sent += 1; else failed += 1; });

  return { sent, failed, skipped: false };
}

export { sendSms };
