import mongoose from "mongoose";

import { JournalEntry } from "../models/JournalEntry.model.js";
import { LedgerAccount, ACCOUNT_TYPES } from "../models/LedgerAccount.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  seedChartOfAccounts,
  trialBalance,
  profitAndLoss,
  balanceSheet,
  accountLedger,
} from "../services/ledger.service.js";

/**
 * Double-entry ledger: chart of accounts, journal entries, and the statements built from them.
 *
 * Phase 1 is manual-entry only and deliberately touches nothing else in the codebase. The
 * auto-posting layer that turns fee payments, expenses and payslips into journal entries lands
 * separately, along with the reconciliation report that finds money events which never got one.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

/* ── Chart of accounts ───────────────────────────────────────────── */

export const listAccounts = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { type, isActive } = req.query;

  const accounts = await LedgerAccount.find({
    schoolId,
    ...(type ? { type } : {}),
    ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
  })
    .sort({ code: 1 })
    .lean();

  return res.json(new ApiResponse(200, accounts, "Accounts fetched"));
});

export const seedAccounts = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const result = await seedChartOfAccounts({ schoolId, createdBy: req.user._id });
  return res.json(
    new ApiResponse(200, result, result.created ? `${result.created} account(s) added` : "Chart of accounts already complete")
  );
});

export const createAccount = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { code, name, type, parentId, description } = req.body;

  if (!code?.trim()) throw new ApiError(400, "Account code is required");
  if (!name?.trim()) throw new ApiError(400, "Account name is required");
  if (!ACCOUNT_TYPES.includes(type)) throw new ApiError(400, `Type must be one of: ${ACCOUNT_TYPES.join(", ")}`);

  const account = await LedgerAccount.create({
    schoolId,
    code: code.trim(),
    name: name.trim(),
    type,
    parentId: parentId || null,
    description: description || "",
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, account, "Account created"));
});

export const updateAccount = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const account = await LedgerAccount.findOne({ _id: req.params.id, schoolId });
  if (!account) throw new ApiError(404, "Account not found");

  // `type` is intentionally not updatable. It decides the normal balance and which statement the
  // account appears on, so changing it would silently restate every statement already produced.
  if (req.body.name !== undefined) account.name = req.body.name;
  if (req.body.description !== undefined) account.description = req.body.description;
  if (req.body.parentId !== undefined) account.parentId = req.body.parentId || null;
  if (req.body.isActive !== undefined) account.isActive = Boolean(req.body.isActive);
  account.updatedBy = req.user._id;

  await account.save();
  return res.json(new ApiResponse(200, account, "Account updated"));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const account = await LedgerAccount.findOne({ _id: req.params.id, schoolId });
  if (!account) throw new ApiError(404, "Account not found");

  if (account.isSystem) {
    throw new ApiError(400, "This is a system account — deactivate it instead of deleting it");
  }

  const used = await JournalEntry.countDocuments({ schoolId, "lines.accountId": account._id });
  if (used > 0) {
    throw new ApiError(400, `Cannot delete — ${used} journal entr(ies) use this account. Deactivate it instead.`);
  }

  await account.deleteOne();
  return res.json(new ApiResponse(200, null, "Account deleted"));
});

/* ── Journal entries ─────────────────────────────────────────────── */

/** Sequential per school and year, so the books read the way an auditor expects. */
const nextEntryNumber = async (schoolId, date) => {
  const year = new Date(date).getFullYear();
  const prefix = `JV-${year}-`;
  const last = await JournalEntry.findOne({ schoolId, entryNumber: new RegExp(`^${prefix}`) })
    .sort({ entryNumber: -1 })
    .select("entryNumber")
    .lean();

  const lastSeq = last ? parseInt(String(last.entryNumber).slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(5, "0")}`;
};

/** Every account referenced must exist in this school — otherwise a typo in an id would post
 *  money into an account belonging to someone else, or to nothing at all. */
const assertAccountsBelongToSchool = async (schoolId, lines) => {
  const ids = [...new Set(lines.map((l) => String(l.accountId)))];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new ApiError(400, "Invalid account id in lines");

  const found = await LedgerAccount.countDocuments({ schoolId, _id: { $in: ids } });
  if (found !== ids.length) throw new ApiError(400, "One or more accounts do not belong to your school");
};

export const createJournalEntry = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { date, narration, lines, academicYearId, post = false } = req.body;

  if (!Array.isArray(lines) || lines.length < 2) throw new ApiError(400, "A journal entry needs at least two lines");
  const entryDate = parseDate(date, "date") || new Date();
  await assertAccountsBelongToSchool(schoolId, lines);

  const entry = await JournalEntry.create({
    schoolId,
    academicYearId: academicYearId || null,
    entryNumber: await nextEntryNumber(schoolId, entryDate),
    date: entryDate,
    narration: narration || "",
    lines,
    status: post ? "posted" : "draft",
    postedAt: post ? new Date() : null,
    postedBy: post ? req.user._id : null,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, entry, post ? "Entry posted" : "Entry saved as draft"));
});

export const listJournalEntries = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { from, to, status, accountId } = req.query;

  const filter = { schoolId };
  const fromDate = parseDate(from, "from date");
  const toDate = parseDate(to, "to date");
  if (fromDate || toDate) {
    filter.date = { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) };
  }
  if (status) filter.status = status;
  if (accountId) filter["lines.accountId"] = accountId;

  const entries = await JournalEntry.find(filter)
    .populate("lines.accountId", "code name type")
    .sort({ date: -1, entryNumber: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, entries, "Journal entries fetched"));
});

export const postJournalEntry = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const entry = await JournalEntry.findOne({ _id: req.params.id, schoolId });
  if (!entry) throw new ApiError(404, "Journal entry not found");
  if (entry.status === "posted") throw new ApiError(400, "This entry is already posted");
  if (entry.status === "void") throw new ApiError(400, "A void entry cannot be posted");

  entry.status = "posted";
  entry.postedAt = new Date();
  entry.postedBy = req.user._id;
  await entry.save();

  return res.json(new ApiResponse(200, entry, "Entry posted"));
});

/**
 * Reverses a posted entry with a mirror-image entry on a given date.
 *
 * This is the ONLY way to undo a posted entry. Editing or deleting one would change a figure
 * somebody may already have reported; a reversal leaves both the original and the correction
 * visible, which is what an audit trail means.
 */
export const reverseJournalEntry = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const original = await JournalEntry.findOne({ _id: req.params.id, schoolId });
  if (!original) throw new ApiError(404, "Journal entry not found");
  if (original.status !== "posted") throw new ApiError(400, "Only a posted entry can be reversed");
  if (original.reversedByEntryId) throw new ApiError(400, "This entry has already been reversed");

  const reversalDate = parseDate(req.body.date, "date") || new Date();

  const reversal = await JournalEntry.create({
    schoolId,
    academicYearId: original.academicYearId,
    entryNumber: await nextEntryNumber(schoolId, reversalDate),
    date: reversalDate,
    narration: req.body.narration || `Reversal of ${original.entryNumber}`,
    lines: original.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.credit,
      credit: l.debit,
      description: l.description,
    })),
    source: original.source,
    status: "posted",
    postedAt: new Date(),
    postedBy: req.user._id,
    reversesEntryId: original._id,
    createdBy: req.user._id,
  });

  original.reversedByEntryId = reversal._id;
  await original.save();

  return res.status(201).json(new ApiResponse(201, reversal, "Entry reversed"));
});

/* ── Statements ──────────────────────────────────────────────────── */

export const getTrialBalance = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await trialBalance({
    schoolId,
    from: parseDate(req.query.from, "from date"),
    to: parseDate(req.query.to, "to date"),
  });
  return res.json(new ApiResponse(200, data, "Trial balance"));
});

export const getProfitAndLoss = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await profitAndLoss({
    schoolId,
    from: parseDate(req.query.from, "from date"),
    to: parseDate(req.query.to, "to date"),
  });
  return res.json(new ApiResponse(200, data, "Income and expenditure"));
});

export const getBalanceSheet = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await balanceSheet({ schoolId, asOf: parseDate(req.query.asOf, "date") });
  return res.json(new ApiResponse(200, data, "Balance sheet"));
});

export const getAccountLedger = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await accountLedger({
    schoolId,
    accountId: req.params.id,
    from: parseDate(req.query.from, "from date"),
    to: parseDate(req.query.to, "to date"),
  });
  if (!data) throw new ApiError(404, "Account not found");
  return res.json(new ApiResponse(200, data, "Account ledger"));
});
