import twilio from "twilio";
import { User } from "../models/user.model.js";

let twilioClient;
let initAttempted = false;

/**
 * Lazily initializes the Twilio client from env vars. Returns null (rather than throwing) when
 * they're unset/invalid, so a school that hasn't configured WhatsApp doesn't take module import
 * or notification creation down — WhatsApp becomes a no-op, not a boot crash or a 500.
 */
function getTwilioClient() {
  if (initAttempted) return twilioClient || null;
  initAttempted = true;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn("[whatsappServices] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_NUMBER not set — WhatsApp sending is disabled");
    return null;
  }

  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return twilioClient;
  } catch (error) {
    console.error("[whatsappServices] Failed to initialize Twilio client:", error.message);
    return null;
  }
}

const withWhatsAppPrefix = (value) => `whatsapp:${String(value || "").replace(/^whatsapp:/, "")}`;

/**
 * Sends a single WhatsApp message. Never throws — logs and returns false on failure so a caller
 * looping over many recipients can keep going.
 */
const sendWhatsApp = async (to, message) => {
  const client = getTwilioClient();
  if (!client) return false;

  try {
    await client.messages.create({
      from: withWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
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
 * Sends a WhatsApp message to every given user id that has a phone number on file. Mirrors
 * pushService.js's sendPushToUsers contract: never throws, returns {sent, failed, skipped}
 * with skipped:true when Twilio isn't configured so the caller can leave deliveryStats untouched.
 */
export async function sendWhatsAppToUsers(userIds, { title, body }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  const client = getTwilioClient();
  if (!client) return { sent: 0, failed: 0, skipped: true };

  const users = await User.find({ _id: { $in: userIds }, phone: { $exists: true, $ne: "" } }).select("phone");
  if (!users.length) return { sent: 0, failed: 0, skipped: false };

  const message = title ? `${title}\n\n${body || ""}` : body || "";

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await sendWhatsApp(user.phone, message);
    if (ok) sent += 1; else failed += 1;
  }

  return { sent, failed, skipped: false };
}

export { sendWhatsApp };
