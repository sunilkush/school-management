import { JournalEntry } from "../models/JournalEntry.model.js";
import { LedgerAccount, NORMAL_BALANCE } from "../models/LedgerAccount.model.js";

/**
 * Reads the ledger and turns it into the three statements a school actually gets asked for.
 *
 * Every figure here comes from POSTED journal entries only. Drafts are deliberately excluded —
 * a statement that quietly includes unposted work is how two people end up quoting different
 * numbers out of the same system.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Default chart of accounts for an Indian school. Codes follow the usual ranges (1xxx asset,
 * 2xxx liability, 3xxx equity, 4xxx income, 5xxx expense), and the income/expense heads mirror
 * the categories Income.model.js and Expense.model.js already use — so the auto-posting layer in
 * phase 2 has an obvious target for each existing category instead of needing a mapping table
 * invented from nothing.
 */
export const DEFAULT_CHART = [
  { code: "1000", name: "Cash in Hand", type: "asset" },
  { code: "1010", name: "Bank Account", type: "asset" },
  { code: "1100", name: "Fees Receivable", type: "asset" },
  { code: "1200", name: "Furniture & Equipment", type: "asset" },

  { code: "2000", name: "Fees Received in Advance", type: "liability" },
  { code: "2010", name: "Salaries Payable", type: "liability" },
  { code: "2020", name: "Statutory Dues Payable", type: "liability" },
  { code: "2030", name: "Security Deposits (Refundable)", type: "liability" },

  { code: "3000", name: "Trust / Society Corpus", type: "equity" },
  { code: "3010", name: "Retained Surplus", type: "equity" },

  { code: "4000", name: "Tuition Fee Income", type: "income" },
  { code: "4010", name: "Admission & Registration Fee", type: "income" },
  { code: "4020", name: "Transport Income", type: "income" },
  { code: "4030", name: "Hostel Income", type: "income" },
  { code: "4040", name: "Examination Income", type: "income" },
  { code: "4050", name: "Library & Sports Income", type: "income" },
  { code: "4060", name: "Canteen Income", type: "income" },
  { code: "4070", name: "Donations & Grants", type: "income" },
  { code: "4080", name: "Other Income", type: "income" },

  { code: "5000", name: "Salaries & Wages", type: "expense" },
  { code: "5010", name: "Staff Benefits & Statutory", type: "expense" },
  { code: "5020", name: "Rent, Rates & Taxes", type: "expense" },
  { code: "5030", name: "Electricity & Utilities", type: "expense" },
  { code: "5040", name: "Repairs & Maintenance", type: "expense" },
  { code: "5050", name: "Transport Expenses", type: "expense" },
  { code: "5060", name: "Hostel & Canteen Expenses", type: "expense" },
  { code: "5070", name: "Teaching Aids & Stationery", type: "expense" },
  { code: "5080", name: "Marketing & Events", type: "expense" },
  { code: "5090", name: "Other Expenses", type: "expense" },
];

/** Creates any missing default accounts. Safe to re-run — existing codes are left untouched, so
 *  a school that renamed "Other Income" keeps its own wording. */
export const seedChartOfAccounts = async ({ schoolId, createdBy = null }) => {
  const existing = await LedgerAccount.find({ schoolId }).select("code").lean();
  const have = new Set(existing.map((a) => a.code));

  const missing = DEFAULT_CHART.filter((a) => !have.has(a.code)).map((a) => ({
    ...a,
    schoolId,
    isSystem: true,
    createdBy,
  }));
  if (missing.length) await LedgerAccount.insertMany(missing);

  return { created: missing.length, total: existing.length + missing.length };
};

/** Sums debits and credits per account over a date range, from posted entries only. */
const accountTotals = async ({ schoolId, from, to }) => {
  const match = { schoolId, status: "posted" };
  if (from || to) {
    match.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  const rows = await JournalEntry.aggregate([
    { $match: match },
    { $unwind: "$lines" },
    {
      $group: {
        _id: "$lines.accountId",
        debit: { $sum: "$lines.debit" },
        credit: { $sum: "$lines.credit" },
      },
    },
  ]);

  return new Map(rows.map((r) => [String(r._id), { debit: round2(r.debit), credit: round2(r.credit) }]));
};

/** Balance expressed in whichever direction is normal for the account type, so an asset with more
 *  debits reads positive and so does an income account with more credits. */
const balanceOf = (type, debit, credit) =>
  NORMAL_BALANCE[type] === "debit" ? round2(debit - credit) : round2(credit - debit);

export const trialBalance = async ({ schoolId, from = null, to = null }) => {
  const [accounts, totals] = await Promise.all([
    LedgerAccount.find({ schoolId }).sort({ code: 1 }).lean(),
    accountTotals({ schoolId, from, to }),
  ]);

  const rows = accounts.map((account) => {
    const t = totals.get(String(account._id)) || { debit: 0, credit: 0 };
    return {
      accountId: account._id,
      code: account.code,
      name: account.name,
      type: account.type,
      debit: t.debit,
      credit: t.credit,
      balance: balanceOf(account.type, t.debit, t.credit),
    };
  });

  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));

  return {
    rows: rows.filter((r) => r.debit || r.credit),
    totalDebit,
    totalCredit,
    // Always true given the model's balance rule, but reported anyway: if it ever goes false the
    // report says so, instead of the mismatch having to be spotted by eye.
    isBalanced: totalDebit === totalCredit,
  };
};

export const profitAndLoss = async ({ schoolId, from = null, to = null }) => {
  const tb = await trialBalance({ schoolId, from, to });

  const income = tb.rows.filter((r) => r.type === "income");
  const expense = tb.rows.filter((r) => r.type === "expense");
  const totalIncome = round2(income.reduce((s, r) => s + r.balance, 0));
  const totalExpense = round2(expense.reduce((s, r) => s + r.balance, 0));

  return {
    from,
    to,
    income,
    expense,
    totalIncome,
    totalExpense,
    surplus: round2(totalIncome - totalExpense),
  };
};

export const balanceSheet = async ({ schoolId, asOf = null }) => {
  const tb = await trialBalance({ schoolId, to: asOf });

  const assets = tb.rows.filter((r) => r.type === "asset");
  const liabilities = tb.rows.filter((r) => r.type === "liability");
  const equity = tb.rows.filter((r) => r.type === "equity");

  const totalAssets = round2(assets.reduce((s, r) => s + r.balance, 0));
  const totalLiabilities = round2(liabilities.reduce((s, r) => s + r.balance, 0));
  const totalEquity = round2(equity.reduce((s, r) => s + r.balance, 0));

  // Income and expense have not been closed into equity, so the period surplus has to be carried
  // onto the sheet explicitly — without it the two sides would never agree.
  const income = round2(tb.rows.filter((r) => r.type === "income").reduce((s, r) => s + r.balance, 0));
  const expense = round2(tb.rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.balance, 0));
  const surplus = round2(income - expense);

  return {
    asOf,
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    currentPeriodSurplus: surplus,
    totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity + surplus),
    isBalanced: totalAssets === round2(totalLiabilities + totalEquity + surplus),
  };
};

/** Running ledger for one account — the "show me every movement on Bank" view. */
export const accountLedger = async ({ schoolId, accountId, from = null, to = null }) => {
  const account = await LedgerAccount.findOne({ _id: accountId, schoolId }).lean();
  if (!account) return null;

  const match = { schoolId, status: "posted", "lines.accountId": account._id };
  if (from || to) {
    match.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  const entries = await JournalEntry.find(match).sort({ date: 1, createdAt: 1 }).lean();

  let running = 0;
  const rows = [];
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (String(line.accountId) !== String(account._id)) continue;
      running = round2(running + balanceOf(account.type, line.debit, line.credit));
      rows.push({
        entryId: entry._id,
        entryNumber: entry.entryNumber,
        date: entry.date,
        narration: entry.narration,
        description: line.description,
        debit: round2(line.debit),
        credit: round2(line.credit),
        balance: running,
      });
    }
  }

  return { account, rows, closingBalance: running };
};
