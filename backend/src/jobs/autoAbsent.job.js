import cron from "node-cron";
import { School } from "../models/school.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { Attendance } from "../models/attendance.model.js";
import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { SchoolEvent } from "../models/SchoolEvent.model.js";
import { ROLE_MAP } from "../controllers/selfAttendance.controllers.js";

// Students are marked by their teacher's roll call, which already records who was absent;
// parents and super admins do not attend. Everyone else checks in themselves.
const NOT_SELF_CHECKIN_ROLES = new Set(["Student", "Parent", "Super Admin"]);
const HOLIDAY_AUDIENCES = ["All", "Staff", "Teachers"];

function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function nowInIst() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { hm: `${get("hour")}:${get("minute")}`, weekday: get("weekday") };
}

/**
 * Records today's attendance for every staff member of one school who has none by the time
 * school hours end: "leave" if an approved leave covers today, otherwise "absent". Check-in
 * closes at School Ends (selfAttendance.controllers.js), so from then on a missing record can
 * only mean they did not come.
 *
 * Only ever inserts: a record that exists — a check-in, a device punch, or one an admin
 * entered — is never touched, so re-running is safe. Rows are `source: "auto"` with no
 * markedBy, so they read as the system's and not as someone's decision.
 */
export async function markAbsenteesForSchool(schoolId, { endTime = "15:00" } = {}) {
  const date = todayUTC();
  const nextDay = new Date(date.getTime() + 24 * 3600 * 1000);

  // Events are saved from the browser as IST midnight, which is the previous UTC day.
  const holiday = await SchoolEvent.exists({
    schoolId,
    type: "Holiday",
    status: { $ne: "cancelled" },
    audience: { $in: HOLIDAY_AUDIENCES },
    startDate: { $lt: nextDay },
    endDate: { $gte: new Date(date.getTime() - 6 * 3600 * 1000) },
  });
  if (holiday) return { absent: 0, leave: 0, skipped: "holiday" };

  // Someone whose account was made after school ended today was never expected to check in.
  const [eh, em] = endTime.split(":").map(Number);
  const schoolEndedAt = new Date(date.getTime() + ((eh * 60 + em) - 330) * 60 * 1000);
  const users = await User.find({ schoolId, isActive: true, createdAt: { $lt: schoolEndedAt } })
    .select("_id roleId")
    .lean();
  const roles = await Role.find({ _id: { $in: [...new Set(users.map((u) => String(u.roleId)))] } })
    .select("name")
    .lean();
  const roleName = new Map(roles.map((r) => [String(r._id), r.name]));
  const staff = users.filter((u) => {
    const name = roleName.get(String(u.roleId));
    return name && !NOT_SELF_CHECKIN_ROLES.has(name);
  });
  if (!staff.length) return { absent: 0, leave: 0 };

  const staffIds = staff.map((u) => u._id);
  const [recorded, onLeave] = await Promise.all([
    Attendance.distinct("userId", { schoolId, date, userId: { $in: staffIds } }),
    LeaveRequest.distinct("userId", {
      schoolId,
      userId: { $in: staffIds },
      status: "approved",
      startDate: { $lt: nextDay },
      endDate: { $gte: date },
    }),
  ]);
  const hasRecord = new Set(recorded.map(String));
  const leaveSet = new Set(onLeave.map(String));

  const missing = staff.filter((u) => !hasRecord.has(String(u._id)));
  if (!missing.length) return { absent: 0, leave: 0 };

  const ops = missing.map((u) => {
    const leave = leaveSet.has(String(u._id));
    return {
      updateOne: {
        filter: { schoolId, userId: u._id, date },
        // $setOnInsert only: a check-in that lands between the read above and this write wins.
        update: {
          $setOnInsert: {
            role: ROLE_MAP[roleName.get(String(u.roleId))] || "staff",
            status: leave ? "leave" : "absent",
            source: "auto",
            markedBy: null,
            remarks: leave ? "On approved leave" : `Did not check in by ${endTime}`,
          },
        },
        upsert: true,
      },
    };
  });

  try {
    await Attendance.bulkWrite(ops, { ordered: false });
  } catch (err) {
    // Another run inserted the same day at the same moment; the unique index kept one.
    if (err?.code !== 11000 && !err?.writeErrors?.every?.((e) => e.code === 11000)) throw err;
  }

  const leave = missing.filter((u) => leaveSet.has(String(u._id))).length;
  return { absent: missing.length - leave, leave };
}

/**
 * Every 10 minutes, for each school whose School Ends time has passed today (and which has not
 * switched this off), records staff who never checked in. Sundays are skipped: no school here
 * has a weekly-off setting, and Sunday is the day off everywhere it is used.
 */
export function startAutoAbsentJob() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const { hm, weekday } = nowInIst();
      if (weekday === "Sun") return;

      const schools = await School.find({
        isActive: true,
        "attendanceHours.autoAbsentEnabled": { $ne: false },
      })
        .select("_id attendanceHours")
        .lean();

      let absent = 0;
      let leave = 0;
      for (const school of schools) {
        const endTime = school.attendanceHours?.endTime || "15:00";
        if (hm < endTime) continue;
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await markAbsenteesForSchool(school._id, { endTime });
          absent += r.absent;
          leave += r.leave;
        } catch (err) {
          console.error(`[AutoAbsentJob] School ${school._id}:`, err.message);
        }
      }
      if (absent || leave) {
        console.log(`[AutoAbsentJob] Marked ${absent} absent and ${leave} on leave.`);
      }
    } catch (err) {
      console.error("[AutoAbsentJob] Error during run:", err.message);
    }
  }, { timezone: "Asia/Kolkata" });

  console.log("[AutoAbsentJob] Auto-absent job scheduled (every 10 minutes, IST).");
}
