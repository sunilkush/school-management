import mongoose from "mongoose";
import { LeaveLedger } from "../models/LeaveLedger.model.js";
import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { Employee } from "../models/Employee.model.js";
import { School } from "../models/school.model.js";
import { SchoolEvent } from "../models/SchoolEvent.model.js";

/**
 * Staff paid leave. Each month every employee earns CL and EL (1 and 0.5 by default,
 * School.leavePolicy); approved leave spends it; whatever is left on 31 March is paid out with
 * March's salary and the next financial year starts from zero. Balances are the sum of
 * LeaveLedger rows for the year — never a stored number that could drift.
 *
 * Only staff (people with an Employee record) have a balance, and they take only CL or EL.
 * Students' leave is unchanged.
 */

// Leave types on a request that draw from a balance.
export const BALANCE_TYPE_OF = { casual: "CL", paid: "EL", compoff: "CO" };
export const BALANCE_TYPES = ["CL", "EL", "CO"];

const DAY_MS = 24 * 3600 * 1000;
const IST_MS = 330 * 60 * 1000;

/** The attendance day (UTC midnight of the IST calendar date) a moment falls on. */
export const istDay = (value) => {
  const ist = new Date(new Date(value).getTime() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
};

/** Financial year (April–March) by its starting year, for an attendance day. */
export const fyOfDay = (day) => (day.getUTCMonth() >= 3 ? day.getUTCFullYear() : day.getUTCFullYear() - 1);
export const currentFy = () => fyOfDay(istDay(new Date()));
export const periodOfDay = (day) => `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}`;

export const isStaffMember = async (schoolId, userId) =>
  Boolean(await Employee.exists({ schoolId, userId }));

/** Holiday days (as "YYYY-MM-DD") from the school calendar between two attendance days. */
const holidayDays = async (schoolId, first, last) => {
  const events = await SchoolEvent.find({
    schoolId,
    type: "Holiday",
    status: { $ne: "cancelled" },
    audience: { $in: ["All", "Staff", "Teachers"] },
    startDate: { $lt: new Date(last.getTime() + DAY_MS) },
    endDate: { $gte: new Date(first.getTime() - DAY_MS) },
  }).select("startDate endDate").lean();
  const set = new Set();
  // Calendar dates may be saved as IST midnight (18:30 the day before in UTC): round to the day.
  const round = (d) => new Date(Math.floor((new Date(d).getTime() + DAY_MS / 2) / DAY_MS) * DAY_MS);
  for (const e of events) {
    for (let t = round(e.startDate).getTime(); t <= round(e.endDate).getTime(); t += DAY_MS) {
      set.add(new Date(t).toISOString().slice(0, 10));
    }
  }
  return set;
};

/** Whether a day is a Sunday or a holiday on the school calendar (a day off worth a Comp Off). */
export const isOffDay = async (schoolId, day) => {
  if (day.getUTCDay() === 0) return true;
  return (await holidayDays(schoolId, day, day)).has(day.toISOString().slice(0, 10));
};

/**
 * The days a leave actually takes: school days only (not Sundays, not holidays), half a day for a
 * half-day leave. Returns the dates and the total split by financial year.
 */
export const countLeaveDays = async (schoolId, startDate, endDate, halfDaySession = null) => {
  const first = istDay(startDate);
  const last = istDay(endDate);
  const holidays = await holidayDays(schoolId, first, last);
  const dates = [];
  for (let t = first.getTime(); t <= last.getTime() && dates.length < 366; t += DAY_MS) {
    const day = new Date(t);
    if (day.getUTCDay() !== 0 && !holidays.has(day.toISOString().slice(0, 10))) dates.push(day);
  }
  const perDay = halfDaySession ? 0.5 : 1;
  const byFy = new Map();
  for (const d of dates) byFy.set(fyOfDay(d), (byFy.get(fyOfDay(d)) || 0) + perDay);
  return {
    dates,
    days: dates.length * perDay,
    byFy: [...byFy.entries()].map(([fy, days]) => ({ fy, days })),
  };
};

const emptyBalance = () => ({ earned: 0, used: 0, encashed: 0, adjusted: 0, balance: 0, pending: 0, available: 0 });

/**
 * { [userId]: { CL: {...}, EL: {...} } } for the given financial year. `pending` is what
 * requests still awaiting a decision are holding; `available` is what a new request may use.
 */
export const getBalances = async (schoolId, userIds, fy, { excludeRequestId = null } = {}) => {
  const ids = userIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const out = {};
  for (const id of ids) out[String(id)] = { CL: emptyBalance(), EL: emptyBalance(), CO: emptyBalance() };

  const rows = await LeaveLedger.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(String(schoolId)), userId: { $in: ids }, fy } },
    { $group: { _id: { userId: "$userId", leaveType: "$leaveType", kind: "$kind" }, days: { $sum: "$days" } } },
  ]);
  const field = { accrual: "earned", compoff: "earned", leave: "used", encashment: "encashed", adjustment: "adjusted" };
  for (const r of rows) {
    const b = out[String(r._id.userId)]?.[r._id.leaveType];
    if (!b) continue;
    // Spending rows are negative in the ledger; shown as positive "used"/"encashed".
    b[field[r._id.kind]] += r._id.kind === "leave" || r._id.kind === "encashment" ? -r.days : r.days;
    b.balance += r.days;
  }

  const pending = await LeaveRequest.find({
    schoolId,
    userId: { $in: ids },
    status: "pending",
    balanceType: { $in: BALANCE_TYPES },
    "balanceByFy.fy": fy,
    ...(excludeRequestId ? { _id: { $ne: excludeRequestId } } : {}),
  }).select("userId balanceType balanceByFy").lean();
  for (const p of pending) {
    const b = out[String(p.userId)]?.[p.balanceType];
    if (!b) continue;
    b.pending += (p.balanceByFy || []).filter((x) => x.fy === fy).reduce((s, x) => s + x.days, 0);
  }

  const round = (n) => Math.round(n * 100) / 100;
  for (const u of Object.values(out)) {
    for (const b of Object.values(u)) {
      for (const k of Object.keys(b)) b[k] = round(b[k]);
      b.available = round(b.balance - b.pending);
    }
  }
  return out;
};

/**
 * Throws a readable message when a request needs more of a balance than is free in any year it
 * touches. `excludeRequestId` leaves the request itself out of "pending" (used on approval).
 */
export const assertEnoughBalance = async ({ schoolId, userId, balanceType, byFy, excludeRequestId = null, countPending = true, ApiError }) => {
  for (const { fy, days } of byFy) {
    // eslint-disable-next-line no-await-in-loop
    const b = (await getBalances(schoolId, [userId], fy, { excludeRequestId }))[String(userId)][balanceType];
    const free = countPending ? b.available : b.balance;
    if (days > free + 1e-9) {
      throw new ApiError(400, `Not enough ${balanceType} balance: ${free} day(s) available${byFy.length > 1 ? ` in ${fy}-${String(fy + 1).slice(2)}` : ""}, ${days} needed`);
    }
  }
};

/** Spends an approved leave's days from the balance. Once per request and year. */
export const recordLeaveSpend = async (leave, approverId) => {
  if (!leave.balanceType || !leave.balanceByFy?.length) return;
  for (const { fy, days } of leave.balanceByFy) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await LeaveLedger.create({
        schoolId: leave.schoolId,
        userId: leave.userId,
        leaveType: leave.balanceType,
        kind: "leave",
        days: -days,
        fy,
        leaveRequestId: leave._id,
        createdBy: approverId,
        note: "Approved leave",
      });
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }
};

/**
 * Credits one month's CL and EL to every employee of a school who worked in that month (joined
 * by its last day, not relieved before its first). Safe to repeat: each month is credited once.
 */
export const accrueMonthForSchool = async (schoolId, period) => {
  const [y, m] = period.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  const school = await School.findById(schoolId).select("leavePolicy").lean();
  const cl = Number(school?.leavePolicy?.clPerMonth ?? 1);
  const el = Number(school?.leavePolicy?.elPerMonth ?? 0.5);
  const fy = fyOfDay(monthStart);

  const employees = await Employee.find({
    schoolId,
    isActive: { $ne: false },
    $and: [
      { $or: [{ joinDate: null }, { joinDate: { $lte: monthEnd } }] },
      { $or: [{ relievingDate: null }, { relievingDate: { $exists: false } }, { relievingDate: { $gte: monthStart } }] },
    ],
  }).select("userId").lean();

  const ops = [];
  for (const e of employees) {
    for (const [leaveType, days] of [["CL", cl], ["EL", el]]) {
      if (!(days > 0)) continue;
      ops.push({
        updateOne: {
          filter: { userId: e.userId, leaveType, period, kind: "accrual" },
          update: { $setOnInsert: { schoolId, userId: e.userId, leaveType, period, kind: "accrual", days, fy, note: `Earned for ${period}` } },
          upsert: true,
        },
      });
    }
  }
  if (!ops.length) return 0;
  try {
    const r = await LeaveLedger.bulkWrite(ops, { ordered: false });
    return r.upsertedCount || 0;
  } catch (err) {
    if (!err?.writeErrors?.every?.((e) => e.code === 11000)) throw err;
    return err.result?.upsertedCount ?? 0;
  }
};

/**
 * CL and EL in each month of a financial year, April to March, by the dates the leave falls on
 * (Sundays and holidays not counted, a half day as 0.5): CL / EL approved, pendingCL / pendingEL
 * applied for and not yet decided.
 */
export const monthlyUsage = async (schoolId, userId, fy) => {
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(fy, 3 + i, 1));
    months.push({ month: periodOfDay(d), CL: 0, EL: 0, CO: 0, pendingCL: 0, pendingEL: 0, pendingCO: 0 });
  }
  const byMonth = new Map(months.map((m) => [m.month, m]));
  const leaves = await LeaveRequest.find({
    schoolId,
    userId,
    status: { $in: ["approved", "pending"] },
    balanceType: { $in: BALANCE_TYPES },
    "balanceByFy.fy": fy,
  }).select("startDate endDate halfDaySession balanceType status").lean();
  for (const l of leaves) {
    // eslint-disable-next-line no-await-in-loop
    const { dates } = await countLeaveDays(schoolId, l.startDate, l.endDate, l.halfDaySession);
    for (const day of dates) {
      const m = byMonth.get(periodOfDay(day));
      if (m) m[l.status === "pending" ? `pending${l.balanceType}` : l.balanceType] += l.halfDaySession ? 0.5 : 1;
    }
  }
  return months;
};
