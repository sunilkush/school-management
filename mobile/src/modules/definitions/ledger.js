import {
  useGetLedgerAccountsQuery,
  useGetJournalEntriesQuery,
  useGetTrialBalanceQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

// ledger.routes.js STATEMENT_READERS — leadership reads the books without being able to touch them.
const STATEMENT_READERS = ['Super Admin', 'School Admin', 'Accountant', 'Principal', 'Vice Principal'];

const TYPE_TONES = {
  asset: 'active',
  expense: 'overdue',
  liability: 'pending',
  equity: 'partial',
  income: 'paid',
};

/**
 * The double-entry ledger, read-only — the chart of accounts, the journal, and the trial balance.
 *
 * **Nothing here writes.** That is not a gap to fill later: a posted journal entry is immutable by
 * design (a mistake is corrected with a reversing entry, never an edit), and most entries are not
 * typed by anyone at all — a server-side sweep posts them from money events that already happened.
 * A "new journal entry" button on a phone would be inviting someone to hand-write into a book that
 * is meant to be a consequence of other records.
 */
export const ledgerAccountsModule = {
  key: 'ChartOfAccounts',
  title: 'Chart of Accounts',
  icon: 'file-tree-outline',

  servesRole: (ctx) => ctx.is(...STATEMENT_READERS),
  notForRoleLabel: 'The books are kept by the accounts team.',

  useList: (ctx, { filter }) => useGetLedgerAccountsQuery({ type: filter ?? undefined }),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code],
  searchPlaceholder: 'Search by account name or code',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'asset', label: 'Assets' },
      { value: 'liability', label: 'Liabilities' },
      { value: 'income', label: 'Income' },
      { value: 'expense', label: 'Expenses' },
    ],
  },

  row: (row) => ({
    title: `${row.code} · ${row.name}`,
    subtitle: row.description || null,
    meta: row.isSystem ? 'System account' : null,
    badge: { label: row.type, tone: TYPE_TONES[row.type] },
  }),

  emptyIcon: 'file-tree-outline',
  emptyLabel: 'No accounts in the chart yet',

  detail: {
    title: 'Account',
    titleFor: (row) => row.name,
    badgeFor: (row) => ({ label: row.type, tone: TYPE_TONES[row.type] }),
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Type', value: row.type },
      { label: 'Description', value: row.description },
      // A system account is created and maintained by the auto-posting sweep — worth saying,
      // because it explains why it cannot be renamed or removed.
      { label: 'System account', value: row.isSystem ? 'Yes — maintained automatically' : null },
      { label: 'Active', value: row.isActive === false ? 'No' : 'Yes' },
    ],
  },
};

function entryTotal(row) {
  // A balanced entry's debits equal its credits, so either side is "the amount" — debits are used
  // by convention.
  return (row.lines ?? []).reduce((sum, line) => sum + (line.debit || 0), 0);
}

export const journalModule = {
  key: 'Journal',
  title: 'Journal',
  icon: 'book-open-outline',

  servesRole: (ctx) => ctx.is(...STATEMENT_READERS),
  notForRoleLabel: 'The books are kept by the accounts team.',

  useList: (ctx, { filter }) => useGetJournalEntriesQuery({ status: filter ?? undefined }),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.narration, (row) => row.entryNumber],
  searchPlaceholder: 'Search by narration or entry number',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'posted', label: 'Posted' },
      { value: 'draft', label: 'Draft' },
      { value: 'void', label: 'Void' },
    ],
  },

  row: (row) => ({
    title: row.narration || row.entryNumber || 'Journal entry',
    subtitle: row.entryNumber,
    meta: [row.date ? formatDate(row.date) : null, formatCurrency(entryTotal(row)), row.source?.kind]
      .filter(Boolean)
      .join(' · '),
    badge: {
      label: row.status,
      tone: row.status === 'posted' ? 'active' : row.status === 'void' ? 'overdue' : 'pending',
    },
  }),

  emptyIcon: 'book-outline',
  emptyLabel: 'No journal entries',

  detail: {
    title: 'Journal Entry',
    titleFor: (row) => row.entryNumber || 'Journal entry',
    badgeFor: (row) => ({
      label: row.status,
      tone: row.status === 'posted' ? 'active' : row.status === 'void' ? 'overdue' : 'pending',
    }),
    fields: (row) => [
      { label: 'Date', value: row.date ? formatDate(row.date) : null },
      { label: 'Narration', value: row.narration },
      // Each side of the entry, spelled out — this is the whole point of a journal, and collapsing
      // it to a single total would hide which accounts actually moved.
      ...(row.lines ?? []).map((line, index) => ({
        label: `${line.debit ? 'Debit' : 'Credit'} · ${line.accountId?.code ?? ''} ${
          line.accountId?.name ?? `Line ${index + 1}`
        }`.trim(),
        value: formatCurrency(line.debit || line.credit || 0) + (line.description ? ` — ${line.description}` : ''),
      })),
      { label: 'Total', value: formatCurrency(entryTotal(row)) },
      // Says where the entry came from — a sweep over a fee payment, say, rather than a person.
      { label: 'Posted from', value: row.source?.kind },
      { label: 'Posted at', value: row.postedAt ? formatDate(row.postedAt) : null },
    ],
  },
};

/**
 * The trial balance — every account's debits, credits and balance, and whether the two sides
 * agree. Rendered as a list of accounts with the balance check as a summary tile, because that
 * check is the one thing an accountant opens this to see.
 */
export const trialBalanceModule = {
  key: 'TrialBalance',
  title: 'Trial Balance',
  icon: 'scale-balance',

  servesRole: (ctx) => ctx.is(...STATEMENT_READERS),
  notForRoleLabel: 'The books are kept by the accounts team.',

  useList: () => useGetTrialBalanceQuery({}),
  selectRows: (data) => data?.rows ?? [],
  rowKey: (row) => String(row.accountId),

  searchFields: [(row) => row.name, (row) => row.code],
  searchPlaceholder: 'Search accounts',

  // Totals are computed from the rows currently listed, which means a search narrows them too.
  // That is a real limitation — `summary` only ever receives the visible rows, so the endpoint's
  // own `totalDebit` / `totalCredit` / `isBalanced` cannot be reached from here. The footer note
  // below says so outright, because a balance check that silently only covered part of the books
  // would be worse than no check at all.
  summary: (rows) => {
    if (rows.length === 0) return [];
    const debit = rows.reduce((sum, row) => sum + (row.debit || 0), 0);
    const credit = rows.reduce((sum, row) => sum + (row.credit || 0), 0);
    const balanced = Math.round((debit - credit) * 100) === 0;
    return [
      { label: 'Total debit', value: debit, format: 'currency' },
      { label: 'Total credit', value: credit, format: 'currency' },
      {
        label: balanced ? 'Balanced' : 'OUT OF BALANCE',
        value: balanced ? 0 : Math.abs(debit - credit),
        format: 'currency',
        icon: balanced ? 'check-circle-outline' : 'alert-circle-outline',
        color: balanced ? '#22C55E' : '#EF4444',
      },
    ];
  },

  row: (row) => ({
    title: `${row.code} · ${row.name}`,
    subtitle: row.type,
    meta: `Dr ${formatCurrency(row.debit || 0)} · Cr ${formatCurrency(row.credit || 0)}`,
    badge: { label: formatCurrency(row.balance || 0), tone: null, color: '#2563EB' },
  }),

  emptyIcon: 'scale-balance',
  emptyLabel: 'Nothing posted to the books yet',
  footerNote:
    'Totals cover only the accounts listed above — searching or filtering changes them, so use the web portal for a full balance check. Profit and loss and the balance sheet are there too.',
};
