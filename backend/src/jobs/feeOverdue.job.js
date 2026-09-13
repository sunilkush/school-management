import cron from "node-cron";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { refreshInstallments } from "../services/feeSchedule.service.js";

/**
 * Runs every day at 00:30 IST. Marks installments that are past their due date as overdue and
 * brings their late fines up to date, school by school (each has its own fine rule).
 *
 * A student's own screen and every payment already refresh that student's installments on the
 * spot; this job is for everyone nobody looked at today, so collection reports and the
 * defaulters list reflect this morning rather than whenever each record was last opened.
 */
export function startFeeOverdueJob() {
  cron.schedule(
    "30 0 * * *",
    async () => {
      try {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const schoolIds = await FeeInstallment.distinct("schoolId", {
          status: { $ne: "paid" },
          dueDate: { $lt: startOfToday },
        });

        let updated = 0;
        for (const schoolId of schoolIds) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const result = await refreshInstallments({ schoolId, onlyPastDue: true, now });
            updated += result.updated;
          } catch (err) {
            // One school's bad record must not stop every other school's refresh.
            console.error(`[FeeOverdueJob] School ${schoolId}:`, err.message);
          }
        }

        if (updated > 0) {
          console.log(`[FeeOverdueJob] Updated fines/status on ${updated} installment(s) across ${schoolIds.length} school(s).`);
        }
      } catch (err) {
        console.error("[FeeOverdueJob] Error during run:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("[FeeOverdueJob] Fee overdue job scheduled (daily 00:30 IST).");
}
