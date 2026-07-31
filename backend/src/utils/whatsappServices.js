import twilio from "twilio";
import { User } from "../models/user.model.js";
import { getSchoolTwilioConfig } from "./twilioConfig.js";

let defaultClient;
let defaultInitAttempted = false;

/**
 * Lazily initializes the shared platform Twilio client from env vars. Returns null (rather than
 * throwing) when they're unset/invalid, so a school that hasn't configured WhatsApp at all —
 * either its own account or the platform default — doesn't take module import or notification
 * creation down; WhatsApp becomes a no-op, not a boot crash or a 500.
 */
function getDefaultTwilioClient() {
  if (defaultInitAttempted) return defaultClient || null;
  defaultInitAttempted = true;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn("[whatsappServices] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_NUMBER not set — platform-default WhatsApp sending is disabled");
    return null;
  }

  try {
    defaultClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return defaultClient;
  } catch (error) {
    console.error("[whatsappServices] Failed to initialize Twilio client:", error.message);
    return null;
  }
}

const withWhatsAppPrefix = (value) => `whatsapp:${String(value || "").replace(/^whatsapp:/, "")}`;

/**
 * Resolves which Twilio client + "from" number a school's WhatsApp message should go out on:
 * their own configured account if they've enabled one, otherwise the shared platform account.
 */
async function resolveSender(schoolId) {
  const schoolConfig = await getSchoolTwilioConfig(schoolId, { channel: "whatsapp" });
  if (schoolConfig) {
    try {
      return { client: twilio(schoolConfig.accountSid, schoolConfig.authToken), from: schoolConfig.whatsappFromNumber };
    } catch (error) {
      console.error(`[whatsappServices] Failed to init school ${schoolId}'s own Twilio client, falling back to platform account:`, error.message);
    }
  }

  const client = getDefaultTwilioClient();
  return client ? { client, from: process.env.TWILIO_WHATSAPP_NUMBER } : null;
}

/**
 * Sends a single WhatsApp message via the resolved sender. Never throws — logs and returns false
 * on failure so a caller looping over many recipients can keep going.
 */
const sendWhatsApp = async (to, message, sender) => {
  try {
    await sender.client.messages.create({
      from: withWhatsAppPrefix(sender.from),
      to: withWhatsAppPrefix(to),
      body: message,
    });
    return true;
  } catch (error) {
    console.error(`[whatsappServices] Failed to send WhatsApp message to ${to}:`, error.message);
    return false;
  }
};

/**
 * Sends a WhatsApp message to every given user id that has a phone number on file, using the
 * calling school's own Twilio account if they've configured one. Mirrors pushService.js's
 * sendPushToUsers contract: never throws, returns {sent, failed, skipped} with skipped:true when
 * no sender (school or platform) is configured, so the caller can leave deliveryStats untouched.
 */
export async function sendWhatsAppToUsers(userIds, { title, body, schoolId }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  const sender = await resolveSender(schoolId);
  if (!sender) return { sent: 0, failed: 0, skipped: true };

  const users = await User.find({ _id: { $in: userIds }, phone: { $exists: true, $ne: "" } }).select("phone");
  if (!users.length) return { sent: 0, failed: 0, skipped: false };

  const message = title ? `${title}\n\n${body || ""}` : body || "";

  // Parallel, not sequential — see the comment in mailServices.js's sendEmailToUsers for why a
  // per-recipient for-loop is a latent hang risk once recipient counts grow.
  const results = await Promise.all(users.map((user) => sendWhatsApp(user.phone, message, sender)));

  let sent = 0;
  let failed = 0;
  results.forEach((ok) => { if (ok) sent += 1; else failed += 1; });

  return { sent, failed, skipped: false };
}
