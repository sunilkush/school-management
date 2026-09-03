import { Expense } from "../models/Expense.model.js";
import { Income } from "../models/Income.model.js";
import { JournalEntry } from "../models/JournalEntry.model.js";
import { LedgerAccount } from "../models/LedgerAccount.model.js";
import { Payment } from "../models/payment.model.js";
import { PayrollItem } from "../models/PayrollItem.model.js";
import { PayrollRun } from "../models/PayrollRun.model.js";
import { Refund } from "../models/Refund.model.js";

/**
 * Turns the money events the rest of the system already records into journal entries.
 *
 * Deliberately a SWEEP rather than hooks inside each controller. Posting inline from
 * payment/refund/payroll/income/expense would mean five call sites today and a sixth to remember
 * the next time a money path is added — and a single forgotten one silently unbalances the books
 * with nothing to show for it. Here, "which events still need posting" is one query, and it is
 * the same query the reconciliation report runs. Posting and reconciliation therefore cannot
 * drift apart, the sweep is idempotent because an event that already has an entry is excluded by
 * definition, and it works retroactively on data that predates the ledger.
 *
 * The trade-off is that the books lag until the sweep runs. For a school that is fine — this is
 * how periodic bookkeeping already works — and it can be triggered on demand or on a schedule.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* ── Account codes ───────────────────────────────────────────────── */

const CASH = "1000";
const BANK = "1010";
const FEES_RECEIVABLE = "1100";
const STATUTORY_PAYABLE = "2020";
const TUITION_INCOME = "4000";
const OTHER_INCOME = "4080";
const SALARIES = "5000";
const OTHER_EXPENSE = "5090";

/** Anything that is not literal cash lands in the bank account. */
const assetCodeForMode = (mode) => (mode === "cash" ? CASH : BANK);

/** Payroll run statuses that mean the salaries actually left the bank. "approved" is deliberately
 *  excluded — approval authorises the payout, it is not the payout. */
const PAID_RUN_STATUSES = ["paid", "locked"];

/** Income.category -> income account. Anything unmapped falls to Other Income rather than being
 *  skipped, because an unposted event is worse than a coarsely-classified one. */
const INCOME_CATEGORY_TO_CODE = {
  "Tuition Fee": "4000",
  "Admission Fee": "4010",
  "Registration Fee": "4010",
  "Transport Income": "4020",
  "Hostel Income": "4030",
  "Exam Income": "4040",
  "Library Income": "4050",
  "Sports Income": "4050",
  "Canteen Income": "4060",
  Donation: "4070",
  Grant: "4070",
  Sponsorship: "4070",
};

/** Expense.category -> expense account. Same fallback reasoning as income. */
const EXPENSE_CATEGORY_TO_CODE = {
  "Staff Salary": "5000",
  "Teacher Salary": "5000",
  "Contract Salary": "5000",
  Insurance: "5010",
  Rent: "5020",
  "Utility Bills": "5030",
  Internet: "5030",
  Maintenance: "5040",
  Cleaning: "5040",
  "Transportation Cost": "5050",
  "Canteen Expense": "5060",
  Stationery: "5070",
  Printing: "5070",
  "Library Purchase": "5070",
  "Laboratory Equipment": "5070",
  "Event Expense": "5080",
  Marketing: "5080",
  "Software Subscription": "5090",
  "Legal & Professional": "5090",
};

/* ── Event sources ───────────────────────────────────────────────── */

/**
 * Each source knows how to find its own unposted documents and how to turn one into journal
 * lines. Adding a new money path means adding one entry here — and until it is added, the
 * reconciliation report has no way to know about it, which is the honest limit of this approach.
 */
const SOURCES = {
  Payment: {
    label: "Fee payments",
    dateField: "paymentDate",
    // Only settled money. A pending payment is not income yet, and a refunded one is corrected
    // by its own Refund document rather than by suppressing the original.
    filter: { status: "success" },
    model: () => Payment,
    build: (doc) => {
      const amount = round2(doc.amountPaid);
      if (amount <= 0) return null;
      return {
        date: doc.paymentDate || doc.createdAt,
        narration: `Fee received${doc.receiptNo ? ` — receipt ${doc.receiptNo}` : ""}`,
        lines: [
          { code: assetCodeForMode(doc.paymentMode), debit: amount, credit: 0 },
          { code: TUITION_INCOME, debit: 0, credit: amount },
        ],
      };
    },
  },

  Refund: {
    label: "Fee refunds",
    dateField: "refundedAt",
    filter: {},
    model: () => Refund,
    build: (doc) => {
      const amount = round2(doc.amount);
      if (amount <= 0) return null;
      // An "adjustment" refund moves no money — it writes the amount back against what the
      // student owes instead of paying anything out.
      const creditCode = doc.refundMode === "adjustment" ? FEES_RECEIVABLE : assetCodeForMode(doc.refundMode);
      return {
        date: doc.refundedAt || doc.createdAt,
        narration: `Fee refund — ${doc.reason || "no reason recorded"}`,
        lines: [
          { code: TUITION_INCOME, debit: amount, credit: 0 },
          { code: creditCode, debit: 0, credit: amount },
        ],
      };
    },
  },

  PayrollItem: {
    label: "Salaries",
    dateField: "createdAt",
    filter: {},
    // A payroll item belongs to a run, and only a run that has actually been disbursed has moved
    // money. Posting a draft or merely-approved run would credit the bank for cash still sitting
    // in it. The gate lives on the parent, so it cannot be expressed as a filter on the item.
    extraFilter: async (schoolId) => {
      const runs = await PayrollRun.find({ schoolId, status: { $in: PAID_RUN_STATUSES } })
        .select("_id")
        .lean();
      return { payrollRunId: { $in: runs.map((r) => r._id) } };
    },
    model: () => PayrollItem,
    build: (doc) => {
      const gross = round2(doc.gross);
      const deductions = round2(doc.totalDeductions);
      const net = round2(doc.netSalary);
      if (gross <= 0) return null;
      // Gross is the cost to the school; only the net actually leaves the bank, with the
      // difference held as a statutory liability until it is remitted.
      const lines = [{ code: SALARIES, debit: gross, credit: 0 }];
      if (deductions > 0) lines.push({ code: STATUTORY_PAYABLE, debit: 0, credit: deductions });
      if (net > 0) lines.push({ code: BANK, debit: 0, credit: net });
      return { date: doc.createdAt, narration: "Salary", lines };
    },
  },

  Income: {
    label: "Other income",
    dateField: "date",
    filter: {},
    model: () => Income,
    build: (doc) => {
      const amount = round2(doc.amount);
      if (amount <= 0) return null;
      return {
        date: doc.date || doc.createdAt,
        narration: doc.title || `Income — ${doc.category}`,
        lines: [
          { code: assetCodeForMode(doc.paymentMode), debit: amount, credit: 0 },
          { code: INCOME_CATEGORY_TO_CODE[doc.category] || OTHER_INCOME, debit: 0, credit: amount },
        ],
      };
    },
  },

  Expense: {
    label: "Expenses",
    dateField: "date",
    // Only money actually paid out. Pending and rejected expenses are not a cost yet.
    filter: { status: "paid" },
    model: () => Expense,
    build: (doc) => {
      const amount = round2(doc.amount);
      if (amount <= 0) return null;
      return {
        date: doc.date || doc.createdAt,
        narration: doc.title || `Expense — ${doc.category}`,
        lines: [
          { code: EXPENSE_CATEGORY_TO_CODE[doc.category] || OTHER_EXPENSE, debit: amount, credit: 0 },
          { code: assetCodeForMode(doc.paymentMode), debit: 0, credit: amount },
        ],
      };
    },
  },
};

export const SOURCE_NAMES = Object.keys(SOURCES);

/* ── The sweep ───────────────────────────────────────────────────── */

const dateRangeFilter = (field, from, to) =>
  from || to ? { [field]: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {};

/** Ids of documents from one source that already have a journal entry. */
const alreadyPostedIds = async ({ schoolId, sourceName }) => {
  const rows = await JournalEntry.find({
    schoolId,
    "source.model": sourceName,
    status: { $ne: "void" },
  })
    .select("source.documentId")
    .lean();
  return new Set(rows.map((r) => String(r.source?.documentId)));
};

/** Every money event in range that has no journal entry yet, grouped by source. */
export const findUnpostedEvents = async ({ schoolId, from = null, to = null, sources = SOURCE_NAMES }) => {
  const result = {};

  for (const name of sources) {
    const source = SOURCES[name];
    if (!source) continue;

    // eslint-disable-next-line no-await-in-loop
    const extra = source.extraFilter ? await source.extraFilter(schoolId) : {};

    const [docs, posted] = await Promise.all([
      source
        .model()
        .find({ schoolId, ...source.filter, ...extra, ...dateRangeFilter(source.dateField, from, to) })
        .lean(),
      alreadyPostedIds({ schoolId, sourceName: name }),
    ]);

    result[name] = {
      label: source.label,
      total: docs.length,
      unposted: docs.filter((d) => !posted.has(String(d._id))),
    };
  }

  return result;
};

/**
 * What is posted, what is not, and what it is worth. Read-only — this is the report an accountant
 * checks before trusting a statement.
 */
export const reconciliationReport = async ({ schoolId, from = null, to = null }) => {
  const found = await findUnpostedEvents({ schoolId, from, to });

  const sources = SOURCE_NAMES.map((name) => {
    const entry = found[name];
    const amountOf = (d) => round2(d.amountPaid ?? d.amount ?? d.gross ?? 0);
    const unpostedValue = round2(entry.unposted.reduce((s, d) => s + amountOf(d), 0));
    return {
      source: name,
      label: entry.label,
      total: entry.total,
      posted: entry.total - entry.unposted.length,
      unposted: entry.unposted.length,
      unpostedValue,
    };
  });

  return {
    from,
    to,
    sources,
    totalUnposted: sources.reduce((s, r) => s + r.unposted, 0),
    // The single number that answers "can I trust the statements right now".
    isFullyPosted: sources.every((r) => r.unposted === 0),
  };
};

/**
 * Posts everything outstanding. Safe to re-run: an event that already has an entry is excluded by
 * the same query the report uses, so a second run posts nothing.
 */
export const postPendingEvents = async ({ schoolId, from = null, to = null, postedBy = null }) => {
  const accounts = await LedgerAccount.find({ schoolId }).select("code").lean();
  const codeToId = new Map(accounts.map((a) => [a.code, a._id]));
  if (codeToId.size === 0) {
    return { posted: 0, skipped: 0, problems: [{ reason: "Chart of accounts has not been set up yet" }] };
  }

  const found = await findUnpostedEvents({ schoolId, from, to });

  const entries = [];
  const problems = [];
  let skipped = 0;

  for (const name of SOURCE_NAMES) {
    const source = SOURCES[name];
    for (const doc of found[name].unposted) {
      const built = source.build(doc);
      if (!built) {
        skipped += 1;
        continue;
      }

      const missing = built.lines.map((l) => l.code).filter((code) => !codeToId.has(code));
      if (missing.length) {
        // Reported rather than swallowed: a missing account means these events stay unposted, and
        // the accountant needs to know which account to create.
        problems.push({ source: name, documentId: doc._id, reason: `Missing account code(s): ${missing.join(", ")}` });
        continue;
      }

      entries.push({
        schoolId,
        academicYearId: doc.academicYearId || null,
        date: built.date,
        narration: built.narration,
        lines: built.lines.map((l) => ({ accountId: codeToId.get(l.code), debit: l.debit, credit: l.credit })),
        source: { model: name, documentId: doc._id },
        status: "posted",
        postedAt: new Date(),
        postedBy,
        createdBy: postedBy,
      });
    }
  }

  // Numbered per school and year like manual entries, so a swept entry is indistinguishable from
  // a hand-written one in the register — an auditor should not have to care which produced it.
  const seqByYear = new Map();
  const nextNumber = async (date) => {
    const year = new Date(date).getFullYear();
    if (!seqByYear.has(year)) {
      const prefix = `JV-${year}-`;
      const last = await JournalEntry.findOne({ schoolId, entryNumber: new RegExp(`^${prefix}`) })
        .sort({ entryNumber: -1 })
        .select("entryNumber")
        .lean();
      const lastSeq = last ? parseInt(String(last.entryNumber).slice(prefix.length), 10) : 0;
      seqByYear.set(year, Number.isNaN(lastSeq) ? 0 : lastSeq);
    }
    const next = seqByYear.get(year) + 1;
    seqByYear.set(year, next);
    return `JV-${year}-${String(next).padStart(5, "0")}`;
  };

  // Created one at a time so the model validation (balanced lines) runs on every entry —
  // insertMany would bypass it, which is the one shortcut this module cannot afford.
  let posted = 0;
  for (const draft of entries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await JournalEntry.create({ ...draft, entryNumber: await nextNumber(draft.date) });
      posted += 1;
    } catch (error) {
      problems.push({ source: draft.source.model, documentId: draft.source.documentId, reason: error.message });
    }
  }

  return { posted, skipped, problems };
};
