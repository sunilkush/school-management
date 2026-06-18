import mongoose from "mongoose";
import { Expense } from "../models/Expense.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const resolveSchoolId = (user) =>
  user?.schoolId?._id || user?.schoolId || user?.school?._id || null;

/* ── CREATE ──────────────────────────────────────────────────────── */
export const createExpense = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const {
    title, category, amount, date, paymentMode,
    referenceNo, paidTo, description, invoiceNo, academicYearId, status,
  } = req.body;

  if (!title || !category || amount === undefined || !date) {
    throw new ApiError(400, "title, category, amount and date are required");
  }
  if (Number(amount) < 0) throw new ApiError(400, "Amount cannot be negative");

  const expense = await Expense.create({
    schoolId,
    title: title.trim(),
    category,
    amount: Number(amount),
    date: new Date(date),
    paymentMode: paymentMode || "cash",
    referenceNo: referenceNo?.trim() || "",
    paidTo: paidTo?.trim() || "",
    description: description?.trim() || "",
    invoiceNo: invoiceNo?.trim() || "",
    status: status || "paid",
    academicYearId: academicYearId || undefined,
    createdBy: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Expense record created",
    data: expense,
  });
});

/* ── LIST ────────────────────────────────────────────────────────── */
export const getAllExpenses = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const {
    page = 1, limit = 50, category, startDate, endDate,
    academicYearId, paymentMode, status, search,
  } = req.query;

  const filter = { schoolId };
  if (category) filter.category = category;
  if (paymentMode) filter.paymentMode = paymentMode;
  if (status) filter.status = status;
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId))
    filter.academicYearId = academicYearId;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate)   filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }
  if (search) filter.title = { $regex: search.trim(), $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("createdBy", "name")
      .lean(),
    Expense.countDocuments(filter),
  ]);

  const aggSummary = await Expense.aggregate([
    { $match: filter },
    { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  return sendSuccess(res, {
    message: "Expense records fetched",
    data: {
      records,
      total,
      page: Number(page),
      limit: Number(limit),
      totalAmount: aggSummary[0]?.totalAmount || 0,
      count: aggSummary[0]?.count || 0,
    },
  });
});

/* ── SINGLE ──────────────────────────────────────────────────────── */
export const getExpenseById = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const expense = await Expense.findOne({ _id: req.params.id, schoolId })
    .populate("createdBy", "name")
    .populate("approvedBy", "name");
  if (!expense) throw new ApiError(404, "Expense record not found");
  return sendSuccess(res, { message: "Expense record fetched", data: expense });
});

/* ── UPDATE ──────────────────────────────────────────────────────── */
export const updateExpense = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const expense = await Expense.findOne({ _id: req.params.id, schoolId });
  if (!expense) throw new ApiError(404, "Expense record not found");

  const allowed = [
    "title", "category", "amount", "date", "paymentMode",
    "referenceNo", "paidTo", "description", "invoiceNo", "status", "academicYearId",
  ];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) {
      expense[k] = k === "amount" ? Number(req.body[k]) : req.body[k];
    }
  });
  expense.updatedBy = req.user._id;

  // if approving
  if (req.body.status === "approved" || req.body.status === "paid") {
    expense.approvedBy = req.user._id;
  }

  await expense.save();
  return sendSuccess(res, { message: "Expense record updated", data: expense });
});

/* ── DELETE ──────────────────────────────────────────────────────── */
export const deleteExpense = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!expense) throw new ApiError(404, "Expense record not found");
  return sendSuccess(res, { message: "Expense record deleted", data: { id: req.params.id } });
});

/* ── SUMMARY ─────────────────────────────────────────────────────── */
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { startDate, endDate, academicYearId } = req.query;
  const match = { schoolId: new mongoose.Types.ObjectId(String(schoolId)) };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate)   match.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId))
    match.academicYearId = new mongoose.Types.ObjectId(academicYearId);

  const [byCategory, byMonth, total, byStatus] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  return sendSuccess(res, {
    message: "Expense summary fetched",
    data: {
      total: total[0]?.total || 0,
      count: total[0]?.count || 0,
      byCategory,
      byMonth,
      byStatus,
    },
  });
});
