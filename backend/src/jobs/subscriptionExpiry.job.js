import cron from "node-cron";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { createInvoiceForSubscription } from "../controllers/superAdminBilling.controllers.js";
import { notifyUser } from "../utils/notifyService.js";

// How many days before a subscription's endDate to generate the renewal invoice and remind
// the school. Not real Razorpay Subscriptions/e-mandate auto-debit (a separate, larger
// integration) — this generates the next invoice and lets the School Admin pay it through the
// new self-serve billing page; "retry" for a failed/skipped payment is simply that the invoice
// stays unpaid/overdue and payable again any time, no separate retry scheduler needed.
const RENEWAL_REMINDER_DAYS = 7;

/** Notifies every School Admin at a school that a renewal invoice is due. Never throws — a
 * notification failure must not abort the job for every other school it still needs to process. */
const notifySchoolAdmins = async ({ schoolId, invoice }) => {
  try {
    const schoolAdminRole = await Role.findOne({ name: "School Admin", schoolId });
    if (!schoolAdminRole) return;

    const admins = await User.find({ schoolId, roleId: schoolAdminRole._id, isActive: true }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          schoolId,
          userId: admin._id,
          title: "Subscription renewal invoice generated",
          message: `Invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount}) is due by ${invoice.dueDate.toDateString()}. Pay it from Billing → My Subscription.`,
          channels: { inApp: true, email: true },
        })
      )
    );
  } catch (err) {
    console.error(`[SubscriptionJob] Failed to notify school ${schoolId} about renewal invoice:`, err.message);
  }
};

/**
 * Runs every day at midnight (00:00).
 * 1. Marks active/trial subscriptions as "expired" when endDate has passed.
 * 2. Marks unpaid invoices as "overdue" when dueDate has passed.
 * 3. RENEWAL_REMINDER_DAYS before an active/trial subscription's endDate, generates the next
 *    invoice (idempotent — skips if one already exists for that billing period) and notifies
 *    the school's admins.
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

      // ── 3. Generate renewal invoices + notify ─────────────────────
      const reminderWindowEnd = new Date(now);
      reminderWindowEnd.setDate(reminderWindowEnd.getDate() + RENEWAL_REMINDER_DAYS);

      const dueForRenewal = await SchoolSubscription.find({
        status: { $in: ["active", "trial"] },
        endDate: { $gte: now, $lte: reminderWindowEnd },
      });

      let renewalCount = 0;
      for (const subscription of dueForRenewal) {
        const existingInvoice = await SubscriptionInvoice.findOne({
          schoolId: subscription.schoolId,
          billingPeriodEnd: subscription.endDate,
        });
        if (existingInvoice) continue; // Already generated on a previous day's run.

        const invoice = await createInvoiceForSubscription(subscription);
        await notifySchoolAdmins({ schoolId: subscription.schoolId, invoice });
        renewalCount += 1;
      }
      if (renewalCount > 0) {
        console.log(`[SubscriptionJob] Generated ${renewalCount} renewal invoice(s) and notified school admins.`);
      }
    } catch (err) {
      console.error("[SubscriptionJob] Error during expiry check:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[SubscriptionJob] Subscription expiry job scheduled (daily at midnight IST).");
}
