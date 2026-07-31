import { CommunicationSettings } from "../models/CommunicationSettings.model.js";

/**
 * Returns this school's own Twilio config if they've set one up, configured Twilio as the
 * provider, and enabled the requested channel — otherwise null, so the caller falls back to the
 * shared platform-wide Twilio account from env vars.
 */
export const getSchoolTwilioConfig = async (schoolId, { channel } = {}) => {
  if (!schoolId) return null;

  const doc = await CommunicationSettings.findOne({ schoolId }).lean();
  if (!doc || doc.provider !== "twilio" || !doc.accountSid || !doc.authToken) return null;

  if (channel === "sms" && (!doc.isSmsEnabled || !doc.smsFromNumber)) return null;
  if (channel === "whatsapp" && (!doc.isWhatsappEnabled || !doc.whatsappFromNumber)) return null;

  return doc;
};
