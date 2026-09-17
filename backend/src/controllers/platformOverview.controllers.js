import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";
import { SubscriptionPayment } from "../models/SubscriptionPayment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * The Super Admin's home page: what needs doing, and how the platform stands.
 *
 * The dashboard used to be assembled from figures that did not mean what their labels said: its
 * "Revenue" was the fees schools collected from their own students, its admin count counted the
 * School Admins of whichever school's role came back first, "Expiring soon" counted switched-off
 * schools, plan counts only knew plans literally named "Premium" or "Standard", and the "System
 * health" panel was fixed numbers. Everything here is counted from the records it names.
 */

const DAY = 24 * 60 * 60 * 1000;
const SOON_DAYS = 30;
const TZ = "Asia/Kolkata";

/** Where a school's subscription stands; the same reading the Schools page uses. */
export function planState(sub, now = new Date()) {
  if (!sub) return { key: "none", daysLeft: null };
  const daysLeft = Math.ceil((new Date(sub.endDate) - now) / DAY);
  if (sub.status === "suspended" || sub.status === "cancelled") return { key: sub.status, daysLeft };
  if (sub.status === "expired" || new Date(sub.endDate) <= now) return { key: "expired", daysLeft };
  if (daysLeft <= SOON_DAYS) return { key: "ending", daysLeft, trial: sub.status === "trial" };
  return { key: sub.status === "trial" ? "trial" : "active", daysLeft };
}

/** 1 April of the financial year `now` falls in. */
export const financialYearStart = (now = new Date()) => {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 3, 1) - 5.5 * 60 * 60 * 1000);
};

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getPlatformOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const fyStart = financialYearStart(now);
  // The last six calendar months, this one included, in Indian time.
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - (5 - i), 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
  });
  const sixMonthsStart = new Date(Date.UTC(months[0].y, months[0].m - 1, 1) - 5.5 * 60 * 60 * 1000);
  const netAmount = { $subtract: ["$amount", { $ifNull: ["$refundAmount", 0] }] };

  const [schools, subs, students, teachers, collected, monthly, openInvoices, recentPayments] = await Promise.all([
    School.find().select("name address isActive logo createdAt").lean(),
    SchoolSubscription.find().select("schoolId status endDate planId").populate("planId", "name").lean(),
    Student.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$schoolId", count: { $sum: 1 } } },
    ]),
    // Roles belong to schools, so "Teacher" is matched by name across every school's roles.
    User.aggregate([
      { $match: { isActive: true, isDeleted: { $ne: true }, schoolId: { $ne: null } } },
      { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "role" } },
      { $unwind: "$role" },
      { $match: { "role.name": "Teacher" } },
      { $group: { _id: "$schoolId", count: { $sum: 1 } } },
    ]),
    SubscriptionPayment.aggregate([
      { $match: { status: "success", paymentDate: { $gte: fyStart } } },
      { $group: { _id: null, total: { $sum: netAmount }, count: { $sum: 1 } } },
    ]),
    SubscriptionPayment.aggregate([
      { $match: { status: "success", paymentDate: { $gte: sixMonthsStart } } },
      {
        $group: {
          _id: { y: { $year: { date: "$paymentDate", timezone: TZ } }, m: { $month: { date: "$paymentDate", timezone: TZ } } },
          total: { $sum: netAmount },
        },
      },
    ]),
    SubscriptionInvoice.find({ status: { $in: ["unpaid", "overdue"] } })
      .select("schoolId invoiceNumber totalAmount dueDate status")
      .lean(),
    SubscriptionPayment.find({ status: "success" })
      .sort({ paymentDate: -1 })
      .limit(5)
      .select("schoolId amount paymentDate paymentMode")
      .lean(),
  ]);

  const byId = (rows) => new Map(rows.map((r) => [String(r._id), r.count]));
  const studentsOf = byId(students);
  const teachersOf = byId(teachers);
  const subOf = new Map(subs.map((s) => [String(s.schoolId), s]));
  const nameOf = new Map(schools.map((s) => [String(s._id), s.name]));

  const rows = schools.map((school) => {
    const sub = subOf.get(String(school._id));
    const state = planState(sub, now);
    return {
      _id: school._id,
      name: school.name,
      address: school.address || "",
      logo: school.logo || "",
      isActive: school.isActive !== false,
      students: studentsOf.get(String(school._id)) || 0,
      teachers: teachersOf.get(String(school._id)) || 0,
      plan: {
        name: sub?.planId?.name || null,
        state: state.key,
        daysLeft: state.daysLeft,
        trial: Boolean(state.trial),
        endDate: sub?.endDate || null,
      },
    };
  });

  /* What needs doing, most urgent first. A switched-off school is someone's decision, not a lapse. */
  const attention = [];
  for (const row of rows.filter((r) => r.isActive)) {
    const { state, daysLeft } = row.plan;
    if (state === "expired") {
      attention.push({ kind: "expired", severity: 0, schoolId: row._id, schoolName: row.name, daysAgo: Math.abs(daysLeft ?? 0), endDate: row.plan.endDate });
    } else if (state === "suspended" || state === "cancelled") {
      attention.push({ kind: state, severity: 1, schoolId: row._id, schoolName: row.name });
    } else if (state === "ending") {
      attention.push({ kind: "ending", severity: 2, schoolId: row._id, schoolName: row.name, daysLeft, endDate: row.plan.endDate });
    } else if (state === "none") {
      attention.push({ kind: "none", severity: 3, schoolId: row._id, schoolName: row.name });
    }
  }
  for (const invoice of openInvoices) {
    const overdueDays = Math.floor((now - new Date(invoice.dueDate)) / DAY);
    if (overdueDays <= 0) continue;
    attention.push({
      kind: "overdue", severity: 1, schoolId: invoice.schoolId, schoolName: nameOf.get(String(invoice.schoolId)) || "A deleted school",
      invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, amount: invoice.totalAmount, overdueDays,
    });
  }
  attention.sort((a, b) => a.severity - b.severity || (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || String(a.schoolName).localeCompare(String(b.schoolName)));

  const counts = { active: 0, trial: 0, ending: 0, expired: 0, suspended: 0, cancelled: 0, none: 0 };
  rows.forEach((r) => { counts[r.plan.state] += 1; });

  const monthTotals = new Map(monthly.map((m) => [`${m._id.y}-${m._id.m}`, m.total]));
  const outstanding = openInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const overdue = openInvoices.filter((i) => new Date(i.dueDate) < now);

  return res.status(200).json(new ApiResponse(200, {
    generatedAt: now,
    schools: {
      total: rows.length,
      on: rows.filter((r) => r.isActive).length,
      off: rows.filter((r) => !r.isActive).length,
    },
    students: rows.reduce((sum, r) => sum + r.students, 0),
    teachers: rows.reduce((sum, r) => sum + r.teachers, 0),
    billing: {
      financialYearStart: fyStart,
      collectedThisYear: collected[0]?.total || 0,
      paymentsThisYear: collected[0]?.count || 0,
      outstanding,
      openInvoices: openInvoices.length,
      overdueInvoices: overdue.length,
      monthly: months.map(({ y, m }) => ({ year: y, month: m, label: `${MONTH[m - 1]} ${y}`, total: monthTotals.get(`${y}-${m}`) || 0 })),
    },
    plans: counts,
    attention,
    schoolRows: rows,
    recentPayments: recentPayments.map((p) => ({
      _id: p._id, schoolId: p.schoolId, schoolName: nameOf.get(String(p.schoolId)) || "A deleted school",
      amount: p.amount, paymentDate: p.paymentDate, paymentMode: p.paymentMode,
    })),
  }, "Platform overview"));
});
