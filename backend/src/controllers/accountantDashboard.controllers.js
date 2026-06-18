import mongoose from "mongoose";
import { Income } from "../models/Income.model.js";
import { Expense } from "../models/Expense.model.js";
import { Payment } from "../models/payment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { PayrollEntry } from "../models/payrollEntry.model.js";
import { Student } from "../models/student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

const resolveSchoolId = (user) =>
  user?.schoolId?._id || user?.schoolId || user?.school?._id || null;

const toOid = (id) => new mongoose.Types.ObjectId(String(id));

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── MAIN FINANCIAL DASHBOARD ────────────────────────────────────── */
export const getAccountantDashboard = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const sid = toOid(schoolId);
  const now = new Date();

  // Current month range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Last 6 months range
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    // Fee collections (payment records)
    totalCollected,
    thisMonthCollected,
    // Student fee dues
    feeSummary,
    // Income records (manual entries)
    incomeSummary,
    thisMonthIncome,
    // Expense records
    expenseSummary,
    thisMonthExpense,
    // Payroll
    payrollSummary,
    // Monthly trend (last 6 months) — income
    incomeMonthly,
    // Monthly trend — expenses
    expenseMonthly,
    // Monthly trend — fee collections
    feeMonthly,
    // Recent payments
    recentPayments,
    // Recent income
    recentIncome,
    // Recent expenses
    recentExpenses,
    // Total students
    totalStudents,
  ] = await Promise.all([
    // All-time collected fees
    Payment.aggregate([
      { $match: { schoolId: sid, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]),
    // This month collected fees
    Payment.aggregate([
      { $match: { schoolId: sid, status: "success", paymentDate: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]),
    // Fee dues
    StudentFee.aggregate([
      { $match: { schoolId: sid } },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$totalAmount" },
          paidAmount:  { $sum: "$paidAmount" },
          dueAmount:   { $sum: "$dueAmount" },
          count:       { $sum: 1 },
        },
      },
    ]),
    // All-time manual income
    Income.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // This month manual income
    Income.aggregate([
      { $match: { schoolId: sid, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // All-time expenses
    Expense.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // This month expenses
    Expense.aggregate([
      { $match: { schoolId: sid, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Payroll (this month)
    PayrollEntry.aggregate([
      {
        $match: {
          schoolId: sid,
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$netSalary" }, count: { $sum: 1 } } },
    ]),
    // Income monthly trend (last 6 months)
    Income.aggregate([
      { $match: { schoolId: sid, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Expense monthly trend (last 6 months)
    Expense.aggregate([
      { $match: { schoolId: sid, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Fee collection monthly trend
    Payment.aggregate([
      { $match: { schoolId: sid, status: "success", paymentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$paymentDate" }, month: { $month: "$paymentDate" } },
          total: { $sum: "$amountPaid" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Recent payments (last 10)
    Payment.find({ schoolId: sid, status: "success" })
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate("studentId", "name")
      .lean(),
    // Recent income entries
    Income.find({ schoolId: sid })
      .sort({ date: -1 })
      .limit(5)
      .lean(),
    // Recent expense entries
    Expense.find({ schoolId: sid })
      .sort({ date: -1 })
      .limit(5)
      .lean(),
    // Student count
    Student.countDocuments({ schoolId }),
  ]);

  // Build fee summary object
  const fees = { totalDue: 0, totalPaid: 0, totalPending: 0, paidCount: 0, pendingCount: 0 };
  feeSummary.forEach((f) => {
    if (f._id === "paid")    { fees.totalPaid    += f.paidAmount; fees.paidCount    += f.count; }
    if (f._id === "pending") { fees.totalPending += f.dueAmount;  fees.pendingCount += f.count; }
    if (f._id === "partial") { fees.totalPending += f.dueAmount;  fees.pendingCount += f.count; }
    fees.totalDue += f.totalAmount;
  });

  const totalIncome    = (incomeSummary[0]?.total || 0) + (totalCollected[0]?.total || 0);
  const totalExpenses  = expenseSummary[0]?.total || 0;
  const netProfitLoss  = totalIncome - totalExpenses;

  const thisMonthTotalIncome =
    (thisMonthIncome[0]?.total || 0) + (thisMonthCollected[0]?.total || 0);
  const thisMonthTotalExpense =
    (thisMonthExpense[0]?.total || 0) + (payrollSummary[0]?.total || 0);

  // Build last-6-month chart data
  const chartMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
  }

  const buildMonthlyMap = (arr) => {
    const map = {};
    arr.forEach((r) => { map[`${r._id.year}-${r._id.month}`] = r.total; });
    return map;
  };

  const incomeMap  = buildMonthlyMap(incomeMonthly);
  const expenseMap = buildMonthlyMap(expenseMonthly);
  const feeMap     = buildMonthlyMap(feeMonthly);

  const monthlyChart = chartMonths.map(({ year, month, label }) => ({
    month: label,
    income:   (incomeMap[`${year}-${month}`] || 0) + (feeMap[`${year}-${month}`] || 0),
    expense:  expenseMap[`${year}-${month}`] || 0,
    feeCollection: feeMap[`${year}-${month}`] || 0,
  }));

  // Recent activity (combine and sort)
  const recentActivity = [
    ...recentPayments.map((p) => ({
      _id: p._id,
      type: "fee_payment",
      title: `Fee collected — ${p.studentId?.name || "Student"}`,
      amount: p.amountPaid,
      date: p.paymentDate,
      mode: p.paymentMode,
      color: "#059669",
    })),
    ...recentIncome.map((i) => ({
      _id: i._id,
      type: "income",
      title: `${i.category} — ${i.title}`,
      amount: i.amount,
      date: i.date,
      mode: i.paymentMode,
      color: "#0891b2",
    })),
    ...recentExpenses.map((e) => ({
      _id: e._id,
      type: "expense",
      title: `${e.category} — ${e.title}`,
      amount: -e.amount,
      date: e.date,
      mode: e.paymentMode,
      color: "#dc2626",
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  return sendSuccess(res, {
    message: "Accountant financial dashboard fetched",
    data: {
      kpis: {
        totalRevenue:         totalIncome,
        totalExpenses,
        netProfitLoss,
        totalFeeCollected:    totalCollected[0]?.total || 0,
        pendingFees:          fees.totalPending,
        paidFees:             fees.totalPaid,
        pendingFeeCount:      fees.pendingCount,
        payrollThisMonth:     payrollSummary[0]?.total || 0,
        thisMonthIncome:      thisMonthTotalIncome,
        thisMonthExpense:     thisMonthTotalExpense,
        totalStudents,
      },
      monthlyChart,
      recentActivity,
    },
  });
});
