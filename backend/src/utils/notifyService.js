import { Notification } from "../models/notification.model.js";
import { sendEmailToUsers } from "./mailServices.js";
import { sendSmsToUsers } from "./smsServices.js";
import { sendWhatsAppToUsers } from "./whatsappServices.js";

/**
 * Creates a single-recipient in-app Notification and, for each enabled external channel,
 * dispatches it — mirroring notification.controllers.js's createNotification flow but scoped to
 * one user instead of a resolved role/level audience. Never throws: a failed or unconfigured
 * channel should never fail whatever business action (incident report, PTM booking, ...)
 * triggered the notification.
 */
export async function notifyUser({ schoolId, userId, title, message, channels = {}, createdById }) {
  if (!userId) return null;

  const normalizedChannels = {
    inApp: channels.inApp !== false,
    email: !!channels.email,
    sms: !!channels.sms,
    whatsapp: !!channels.whatsapp,
  };

  let notification;
  try {
    notification = await Notification.create({
      title,
      message,
      level: "user",
      targetUserIds: [String(userId)],
      targetUserObjectIds: [userId],
      channels: normalizedChannels,
      status: "sent",
      deliveryStats: { sent: normalizedChannels.inApp ? 1 : 0, opened: 0, failed: 0 },
      createdBy: "System",
      createdById,
      schoolId,
    });
  } catch (error) {
    console.error("[notifyService] Failed to create notification:", error.message);
    return null;
  }

  const targetUserIds = [userId];

  const applyDelivery = async (result) => {
    if (result.skipped) return;
    try {
      notification = await Notification.findByIdAndUpdate(
        notification._id,
        { $inc: { "deliveryStats.sent": result.sent, "deliveryStats.failed": result.failed } },
        { new: true }
      );
    } catch (error) {
      console.error("[notifyService] Failed to update deliveryStats:", error.message);
    }
  };

  if (normalizedChannels.email) {
    await applyDelivery(await sendEmailToUsers(targetUserIds, { title, body: message }));
  }
  if (normalizedChannels.sms) {
    await applyDelivery(await sendSmsToUsers(targetUserIds, { title, body: message }));
  }
  if (normalizedChannels.whatsapp) {
    await applyDelivery(await sendWhatsAppToUsers(targetUserIds, { title, body: message }));
  }

  return notification;
}
