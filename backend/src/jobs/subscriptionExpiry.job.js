import cron from "node-cron";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";

/**
 * Runs every day at midnight (00:00).
 * 1. Marks active/trial subscriptions as "expired" when endDate has passed.
 * 2. Marks unpaid invoices as "overdue" when dueDate has passed.
 */
export function startSubscriptionExpiryJob() {
  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    try {
      // ── 1. Expire subscriptions ──────────────────────────────────
      const expiredResult = await SchoolSubscription.updateMany(
        { endDate: { $lt: now }, status: { $in: ["active", "trial"] } },
        { $set: { status: "expired" } }
      );
      if (expiredResult.modifiedCount > 0) {
        console.log(`[SubscriptionJob] Marked ${expiredResult.modifiedCount} subscription(s) as expired.`);
      }

      // ── 2. Mark overdue invoices ─────────────────────────────────
      const overdueResult = await SubscriptionInvoice.updateMany(
        { dueDate: { $lt: now }, status: { $in: ["unpaid", "draft"] } },
        { $set: { status: "overdue" } }
      );
      if (overdueResult.modifiedCount > 0) {
        console.log(`[SubscriptionJob] Marked ${overdueResult.modifiedCount} invoice(s) as overdue.`);
      }
    } catch (err) {
      console.error("[SubscriptionJob] Error during expiry check:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[SubscriptionJob] Subscription expiry job scheduled (daily at midnight IST).");
}
