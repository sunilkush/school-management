import cron from "node-cron";
import { School } from "../models/school.model.js";
import { Attendance } from "../models/attendance.model.js";

function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// "HH:mm" for right now, in the timezone school hours are configured in — the cron trigger's
// own timezone option only controls *when* the callback fires, not what `new Date()` means
// inside it, so this is computed independently for the endTime comparison.
function nowInIst() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = parts.find((p) => p.type === "hour").value;
  const mm = parts.find((p) => p.type === "minute").value;
  return `${hh}:${mm}`;
}

/**
 * Runs every 10 minutes. For each school whose configured attendanceHours.endTime has passed
 * (school hours over for the day) and hasn't opted out (autoCheckoutEnabled), force-closes
 * today's still-open attendance records. Two different groups, matched differently:
 *
 *  - Teachers/staff self-check-in via GPS punch — "still open" means they have a checkInAt but
 *    no checkOutAt (they punched in, then simply never punched out).
 *  - Students are marked present by their teacher (roster-based, see markBulkAttendance) —
 *    there's no self check-in timestamp to begin with, so "still open" instead means their
 *    status shows they were actually at school (present/late/halfday) and they don't have a
 *    checkOutAt yet. School ending the day is what closes it out for them.
 *
 * Naturally idempotent: once a record has checkOutAt set, it no longer matches either query,
 * so re-running mid-evening (or the next day, if the job was down) is safe.
 */
export function startAutoCheckoutJob() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = nowInIst();

      // Schools that never explicitly saved attendanceHours don't have it in their stored
      // document at all — a query filter on "attendanceHours.endTime" wouldn't match those,
      // even though the schema default (15:00) is what a hydrated read would show. Filtering
      // only on autoCheckoutEnabled here (which $ne:false correctly treats missing-as-true)
      // and comparing endTime in JS with an explicit fallback avoids that trap.
      const schools = await School.find({
        isActive: true,
        "attendanceHours.autoCheckoutEnabled": { $ne: false },
      })
        .select("_id attendanceHours")
        .lean();

      const dueSchools = schools.filter((s) => now >= (s.attendanceHours?.endTime || "15:00"));
      if (!dueSchools.length) return;

      const date = todayUTC();
      let totalCheckedOut = 0;

      for (const school of dueSchools) {
        // eslint-disable-next-line no-await-in-loop
        const [selfCheckinResult, studentResult] = await Promise.all([
          Attendance.updateMany(
            {
              schoolId: school._id,
              date,
              role: { $ne: "student" },
              checkInAt: { $ne: null },
              checkOutAt: null,
            },
            { $set: { checkOutAt: new Date(), autoCheckedOut: true } }
          ),
          Attendance.updateMany(
            {
              schoolId: school._id,
              date,
              role: "student",
              status: { $in: ["present", "late", "halfday"] },
              checkOutAt: null,
            },
            { $set: { checkOutAt: new Date(), autoCheckedOut: true } }
          ),
        ]);
        totalCheckedOut += selfCheckinResult.modifiedCount + studentResult.modifiedCount;
      }

      if (totalCheckedOut > 0) {
        console.log(`[AutoCheckoutJob] Auto-checked-out ${totalCheckedOut} attendance record(s) across ${dueSchools.length} school(s).`);
      }
    } catch (err) {
      console.error("[AutoCheckoutJob] Error during auto-checkout run:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[AutoCheckoutJob] Auto-checkout job scheduled (every 10 minutes, IST).");
}
