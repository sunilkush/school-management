import cron from "node-cron";
import { PTMSlot } from "../models/PTMSlot.model.js";
import { PTMSession } from "../models/PTMSession.model.js";
import { notifyUser } from "../utils/notifyService.js";

/**
 * Runs every day at 8 AM IST. Finds PTM slots booked for "tomorrow" that haven't had a reminder
 * sent yet and notifies each parent — a day-before nudge for a meeting they booked, possibly,
 * weeks ago.
 */
export function startPtmReminderJob() {
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = new Date();
      const startOfTomorrow = new Date(now);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const slots = await PTMSlot.find({
        status: "Booked",
        reminderSentAt: null,
        startTime: { $gte: startOfTomorrow, $lte: endOfTomorrow },
      });

      if (!slots.length) return;

      const sessionIds = [...new Set(slots.map((s) => `${s.ptmSessionId}`))];
      const sessions = await PTMSession.find({ _id: { $in: sessionIds } }).select("title location").lean();
      const sessionMap = new Map(sessions.map((s) => [`${s._id}`, s]));

      let notified = 0;
      for (const slot of slots) {
        const session = sessionMap.get(`${slot.ptmSessionId}`);
        const timeRange = new Date(slot.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

        // eslint-disable-next-line no-await-in-loop
        await notifyUser({
          schoolId: slot.schoolId,
          userId: slot.parentId,
          title: "PTM reminder — tomorrow",
          message: `Reminder: your PTM slot for ${slot.studentName || "your child"} (${session?.title || "PTM"}) is tomorrow at ${timeRange}${session?.location ? ` at ${session.location}` : ""}.`,
          channels: { inApp: true, email: true, sms: true, whatsapp: true },
        });

        // eslint-disable-next-line no-await-in-loop
        await PTMSlot.findByIdAndUpdate(slot._id, { reminderSentAt: new Date() });
        notified += 1;
      }

      console.log(`[PtmReminderJob] Sent ${notified} PTM reminder(s) for tomorrow.`);
    } catch (err) {
      console.error("[PtmReminderJob] Error during reminder run:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[PtmReminderJob] PTM reminder job scheduled (daily at 8 AM IST).");
}
