import cron from "node-cron";
import { School } from "../models/school.model.js";
import { addMissingStaffToPayroll } from "../services/employeeProfile.service.js";

/**
 * Keeps every school's payroll complete without anyone pressing a button: staff users with no
 * employee record get one, and every staff employee without a salary structure gets a ₹0 draft
 * to fill in (see services/employeeProfile.service.js). New users are added the moment they are
 * created; this catches everyone else — accounts from before that, and users whose role later
 * changed to a staff role. Runs once when the server starts and then daily at 01:00 IST.
 */
const runForAllSchools = async () => {
  const schoolIds = await School.find({}).distinct("_id");
  let employees = 0;
  let structures = 0;
  for (const schoolId of schoolIds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await addMissingStaffToPayroll(schoolId);
      employees += result.added.length;
      structures += result.structuresAdded;
    } catch (err) {
      // One school's bad record must not stop every other school.
      console.error(`[PayrollStaffJob] School ${schoolId}:`, err.message);
    }
  }
  if (employees || structures) {
    console.log(`[PayrollStaffJob] Added ${employees} staff and ${structures} draft salary structure(s) across ${schoolIds.length} school(s).`);
  }
};

export function startPayrollStaffJob() {
  runForAllSchools().catch((err) => console.error("[PayrollStaffJob] Error during start-up run:", err.message));

  cron.schedule(
    "0 1 * * *",
    () => runForAllSchools().catch((err) => console.error("[PayrollStaffJob] Error during run:", err.message)),
    { timezone: "Asia/Kolkata" }
  );

  console.log("[PayrollStaffJob] Payroll staff job scheduled (at start-up and daily 01:00 IST).");
}
