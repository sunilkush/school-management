import {
  useGetBooksQuery,
  useGetIssuedBooksQuery,
  useGetLibrarySettingsQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

const LIBRARY_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Librarian'];

/**
 * The library from the librarian's side — the catalogue, what is out on loan, and the lending
 * rules. The borrower's own view (`Library`, built in Phase 4) is a different, narrower screen.
 */

/** The catalogue. */
export const bookCatalogueModule = {
  key: 'Books',
  title: 'Book Catalogue',
  icon: 'bookshelf',
  aliases: ['BookCatalog'],

  servesRole: (ctx) => ctx.is(...LIBRARY_ROLES),
  notForRoleLabel: 'The catalogue is maintained by the library. Books you have borrowed are under “Library”.',

  useList: () => useGetBooksQuery({ limit: 100 }),
  selectRows: (data) => (Array.isArray(data) ? data : data?.books ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.author, (row) => row.isbn, (row) => row.category],
  searchPlaceholder: 'Search by title, author or ISBN',

  filter: {
    allLabel: 'All',
    options: [{ value: 'available', label: 'On the shelf' }, { value: 'out', label: 'All copies out' }],
    apply: (row, value) =>
      value === 'available' ? (row.availableCopies ?? 0) > 0 : (row.availableCopies ?? 0) === 0,
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const copies = rows.reduce((sum, row) => sum + (row.totalCopies || 0), 0);
    const onShelf = rows.reduce((sum, row) => sum + (row.availableCopies || 0), 0);
    return [
      { label: 'Titles', value: rows.length, icon: 'bookshelf' },
      { label: 'Copies', value: copies, icon: 'book-multiple-outline' },
      {
        label: 'On the shelf',
        value: onShelf,
        icon: 'book-check-outline',
        color: onShelf > 0 ? '#22C55E' : '#EF4444',
      },
    ];
  },

  row: (row) => {
    const available = row.availableCopies ?? 0;
    return {
      title: row.title,
      subtitle: row.author,
      // Where to physically find it is the thing a librarian is standing there needing.
      meta: [row.shelfLocation, row.rackNumber ? `Rack ${row.rackNumber}` : null, row.category]
        .filter(Boolean)
        .join(' · '),
      badge: {
        label: available > 0 ? `${available} of ${row.totalCopies ?? 0}` : 'all out',
        tone: available > 0 ? 'active' : 'overdue',
      },
    };
  },

  emptyIcon: 'book-off-outline',
  emptyLabel: 'No books in the catalogue',

  detail: {
    title: 'Book',
    titleFor: (row) => row.title,
    fields: (row) => [
      { label: 'Author', value: row.author },
      { label: 'Publisher', value: row.publisher },
      { label: 'ISBN', value: row.isbn },
      { label: 'Category', value: row.category },
      { label: 'Language', value: row.language },
      { label: 'Edition', value: row.edition },
      { label: 'Where it lives', value: [row.shelfLocation, row.rackNumber].filter(Boolean).join(' · ') },
      { label: 'Copies', value: `${row.availableCopies ?? 0} available of ${row.totalCopies ?? 0}` },
      { label: 'About', value: row.description },
    ],
  },
};

const LOAN_TONES = { Issued: 'active', Returned: 'inactive', Overdue: 'overdue' };

/** What is currently out on loan. */
export const issuedBooksModule = {
  key: 'IssuedBooks',
  title: 'Issued Books',
  icon: 'book-arrow-right-outline',

  servesRole: (ctx) => ctx.is(...LIBRARY_ROLES),
  notForRoleLabel: 'Loans are tracked by the library.',

  useList: (ctx, { filter }) => useGetIssuedBooksQuery({ status: filter ?? undefined, limit: 100 }),
  // The controller flattens a borrower name onto each row before responding, so there is no need
  // to dig through two possible populate paths here.
  selectRows: (data) => (Array.isArray(data) ? data : data?.records ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.borrowerName, (row) => row.bookId?.title],
  searchPlaceholder: 'Search by borrower or title',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'Issued', label: 'Out' },
      { value: 'Overdue', label: 'Overdue' },
      { value: 'Returned', label: 'Returned' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const overdue = rows.filter((row) => row.status === 'Overdue').length;
    const owed = rows.reduce((sum, row) => sum + (row.fineStatus === 'Paid' ? 0 : row.fine || 0), 0);
    return [
      { label: 'Overdue', value: overdue, icon: 'clock-alert-outline', color: overdue > 0 ? '#EF4444' : '#94A3B8' },
      // Unpaid fines only — a fine already collected is not money outstanding.
      { label: 'Fines owed', value: owed, format: 'currency', color: owed > 0 ? '#F59E0B' : '#94A3B8' },
    ];
  },

  row: (row) => ({
    title: row.bookId?.title ?? 'Book',
    subtitle: row.borrowerName,
    meta: [
      row.dueDate ? `Due ${formatDate(row.dueDate)}` : null,
      row.fine ? `Fine ${formatCurrency(row.fine)}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: row.status === 'Overdue',
    badge: row.status ? { label: row.status.toLowerCase(), tone: LOAN_TONES[row.status] } : null,
  }),

  emptyIcon: 'book-check-outline',
  emptyLabel: 'Nothing out on loan',
  // Issuing and returning both change copy counts and can raise a fine — desk work, at the desk.
  footerNote: 'Issuing and returning books is done at the library desk on the web portal.',

  detail: {
    title: 'Loan',
    titleFor: (row) => row.bookId?.title ?? 'Loan',
    badgeFor: (row) => (row.status ? { label: row.status.toLowerCase(), tone: LOAN_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Borrower', value: row.borrowerName },
      { label: 'Borrower type', value: row.memberType },
      { label: 'Issued', value: row.issueDate ? formatDate(row.issueDate) : null },
      { label: 'Due', value: row.dueDate ? formatDate(row.dueDate) : null },
      { label: 'Returned', value: row.returnDate ? formatDate(row.returnDate) : null },
      { label: 'Fine', value: row.fine ? `${formatCurrency(row.fine)} (${row.fineStatus ?? 'unpaid'})` : null },
      { label: 'Fine note', value: row.fineNote },
      { label: 'Issued by', value: row.issuedBy?.name },
    ],
  },
};

/** The lending rules the library runs on. */
export const librarySettingsModule = {
  key: 'LibrarySettings',
  title: 'Library Rules',
  icon: 'cog-outline',

  servesRole: (ctx) => ctx.is(...LIBRARY_ROLES),
  notForRoleLabel: 'Library rules are set by the library.',

  useList: () => useGetLibrarySettingsQuery(),
  // One settings document, not a list — it becomes a single row so the generic screen can show it.
  selectRows: (data) => (data ? [data] : []),
  rowKey: (row) => row._id ?? 'settings',

  row: (row) => ({
    title: 'Lending rules',
    subtitle: `${row.maxBooksPerStudent ?? '—'} books per student · ${row.loanPeriodDays ?? '—'} days`,
    meta: row.finePerDay ? `${formatCurrency(row.finePerDay)} per day late` : null,
  }),

  emptyIcon: 'cog-off-outline',
  emptyLabel: 'No library rules configured yet',
  footerNote: 'Changing these affects every loan, so it is done on the web portal.',

  detail: {
    title: 'Library Rules',
    titleFor: () => 'Lending rules',
    fields: (row) => [
      { label: 'Books per student', value: row.maxBooksPerStudent != null ? String(row.maxBooksPerStudent) : null },
      { label: 'Books per staff member', value: row.maxBooksPerStaff != null ? String(row.maxBooksPerStaff) : null },
      { label: 'Loan period', value: row.loanPeriodDays ? `${row.loanPeriodDays} days` : null },
      { label: 'Fine per day late', value: row.finePerDay ? formatCurrency(row.finePerDay) : null },
      { label: 'Renewals allowed', value: row.maxRenewals != null ? String(row.maxRenewals) : null },
    ],
  },
};
