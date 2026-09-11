import {
  useGetIncomeRecordsQuery,
  useGetExpenseRecordsQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

// income.routes.js / expense.routes.js READ_ROLES.
const FINANCE_READ = ['Super Admin', 'School Admin', 'Accountant', 'Principal', 'Vice Principal'];

/**
 * Income and expenses are two structurally identical cash ledgers — same fields, same list shape,
 * two URLs. The backend generates both sets of endpoints from one helper for exactly that reason,
 * so building both descriptors from one factory here keeps them honest to each other: any fix to
 * how money is displayed lands on both at once.
 *
 * Read-only. Recording a receipt or a payment is a bookkeeping act that belongs next to the paper
 * it came from; the sums and the search are what a principal wants on a phone.
 */
function cashLedger({ key, title, icon, useList, aliases, emptyLabel, partyLabel, accent }) {
  return {
    key,
    title,
    icon,
    aliases,

    servesRole: (ctx) => ctx.is(...FINANCE_READ),
    notForRoleLabel: 'The cash book is kept by the accounts team.',

    useList,
    selectRows: (data) => data?.records ?? [],
    rowKey: (row) => row._id,

    searchFields: [
      (row) => row.title,
      (row) => row.category,
      (row) => row.receivedFrom ?? row.paidTo ?? row.vendor,
      (row) => row.referenceNo,
    ],
    searchPlaceholder: 'Search by title, category or party',

    // Totals come from the rows on screen, so they always agree with the list. The endpoint also
    // returns a server-side `totalAmount` across ALL pages — deliberately not used here, because a
    // total that counts rows you cannot see next to a list you can is just confusing.
    summary: (rows) => {
      if (rows.length === 0) return [];
      const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
      return [
        { label: 'Shown here', value: total, format: 'currency', color: accent },
        { label: 'Entries', value: rows.length, icon: 'format-list-numbered' },
      ];
    },

    row: (row) => ({
      title: row.title,
      subtitle: row.category,
      meta: [
        row.date ? formatDate(row.date) : null,
        row.receivedFrom || row.paidTo || row.vendor,
        row.paymentMode,
      ]
        .filter(Boolean)
        .join(' · '),
      badge: { label: formatCurrency(row.amount || 0), tone: null, color: accent },
    }),

    emptyIcon: 'cash-remove',
    emptyLabel,

    detail: {
      title,
      titleFor: (row) => row.title,
      fields: (row) => [
        { label: 'Amount', value: formatCurrency(row.amount || 0) },
        { label: 'Category', value: row.category },
        { label: 'Date', value: row.date ? formatDate(row.date) : null },
        { label: partyLabel, value: row.receivedFrom || row.paidTo || row.vendor },
        { label: 'Payment mode', value: row.paymentMode },
        { label: 'Reference', value: row.referenceNo },
        { label: 'Notes', value: row.description },
      ],
    },
  };
}

export const incomeModule = cashLedger({
  key: 'Income',
  title: 'Income',
  icon: 'cash-plus',
  accent: '#22C55E',
  useList: () => useGetIncomeRecordsQuery({ limit: 50 }),
  emptyLabel: 'No income recorded',
  partyLabel: 'Received from',
});

export const expensesModule = cashLedger({
  key: 'Expenses',
  title: 'Expenses',
  icon: 'cash-minus',
  accent: '#EF4444',
  useList: () => useGetExpenseRecordsQuery({ limit: 50 }),
  emptyLabel: 'No expenses recorded',
  partyLabel: 'Paid to',
});
