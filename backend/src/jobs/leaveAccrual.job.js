import cron from "node-cron";
import { School } from "../models/school.model.js";
import { accrueMonthForSchool, istDay, periodOfDay } from "../services/leaveBalance.service.js";

/**
 * Credits this month's CL and EL to every school's staff (services/leaveBalance.service.js).
 * Runs at start-up and every day at 00:30 IST; each month is credited once, so a missed day or a
 * restart costs nothing, and a new joiner is credited the day after they are added.
 */
const runForAllSchools = async () => {
  const period = periodOfDay(istDay(new Date()));
  const schoolIds = await School.find({ isActive: { $ne: false } }).distinct("_id");
  let credited = 0;
  for (const schoolId of schoolIds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      credited += await accrueMonthForSchool(schoolId, period);
    } catch (err) {
      console.error(`[LeaveAccrualJob] School ${schoolId}:`, err.message);
    }
  }
  if (credited) console.log(`[LeaveAccrualJob] Credited ${credited} leave entries for ${period}.`);
};

export function startLeaveAccrualJob() {
  runForAllSchools().catch((err) => console.error("[LeaveAccrualJob] Error during start-up run:", err.message));
  cron.schedule(
    "30 0 * * *",
    () => runForAllSchools().catch((err) => console.error("[LeaveAccrualJob] Error during run:", err.message)),
    { timezone: "Asia/Kolkata" }
  );
  console.log("[LeaveAccrualJob] Leave accrual job scheduled (at start-up and daily 00:30 IST).");
}
