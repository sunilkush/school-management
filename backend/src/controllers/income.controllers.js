import mongoose from "mongoose";
import { Income } from "../models/Income.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const resolveSchoolId = (user) =>
  user?.schoolId?._id || user?.schoolId || user?.school?._id || null;

/* ── CREATE ──────────────────────────────────────────────────────── */
export const createIncome = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const {
    title, category, amount, date, paymentMode,
    referenceNo, receivedFrom, description, academicYearId,
  } = req.body;

  if (!title || !category || amount === undefined || !date) {
    throw new ApiError(400, "title, category, amount and date are required");
  }
  if (Number(amount) < 0) throw new ApiError(400, "Amount cannot be negative");

  const income = await Income.create({
    schoolId,
    title: title.trim(),
    category,
    amount: Number(amount),
    date: new Date(date),
    paymentMode: paymentMode || "cash",
    referenceNo: referenceNo?.trim() || "",
    receivedFrom: receivedFrom?.trim() || "",
    description: description?.trim() || "",
    academicYearId: academicYearId || undefined,
    createdBy: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Income record created",
    data: income,
  });
});

/* ── LIST ────────────────────────────────────────────────────────── */
export const getAllIncome = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const {
    page = 1, limit = 50, category, startDate, endDate,
    academicYearId, paymentMode, search,
  } = req.query;

  const filter = { schoolId };
  if (category) filter.category = category;
  if (paymentMode) filter.paymentMode = paymentMode;
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
    Income.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("createdBy", "name")
      .lean(),
    Income.countDocuments(filter),
  ]);

  // summary for current filter
  const aggSummary = await Income.aggregate([
    { $match: filter },
    { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  return sendSuccess(res, {
    message: "Income records fetched",
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
export const getIncomeById = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const income = await Income.findOne({ _id: req.params.id, schoolId })
    .populate("createdBy", "name");
  if (!income) throw new ApiError(404, "Income record not found");
  return sendSuccess(res, { message: "Income record fetched", data: income });
});

/* ── UPDATE ──────────────────────────────────────────────────────── */
export const updateIncome = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const income = await Income.findOne({ _id: req.params.id, schoolId });
  if (!income) throw new ApiError(404, "Income record not found");

  const allowed = [
    "title", "category", "amount", "date", "paymentMode",
    "referenceNo", "receivedFrom", "description", "academicYearId",
  ];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) {
      income[k] = k === "amount" ? Number(req.body[k]) : req.body[k];
    }
  });
  income.updatedBy = req.user._id;
  await income.save();

  return sendSuccess(res, { message: "Income record updated", data: income });
});

/* ── DELETE ──────────────────────────────────────────────────────── */
export const deleteIncome = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const income = await Income.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!income) throw new ApiError(404, "Income record not found");
  return sendSuccess(res, { message: "Income record deleted", data: { id: req.params.id } });
});

/* ── SUMMARY (category-wise totals) ─────────────────────────────── */
export const getIncomeSummary = asyncHandler(async (req, res) => {
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

  const [byCategory, byMonth, total] = await Promise.all([
    Income.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Income.aggregate([
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
    Income.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  return sendSuccess(res, {
    message: "Income summary fetched",
    data: {
      total: total[0]?.total || 0,
      count: total[0]?.count || 0,
      byCategory,
      byMonth,
    },
  });
});
