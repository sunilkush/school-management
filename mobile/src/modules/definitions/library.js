import { useGetMyLibraryBooksQuery } from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

function daysUntil(dueDate) {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

/**
 * The books a student currently has out — not the catalogue.
 *
 * `/student-portal/me/library-books` returns only Issued and Overdue books, so this list is
 * deliberately "what you are holding and when it is due", which is the thing a student opens
 * their phone to check. Browsing or reserving from the catalogue is a separate feature the
 * backend does not expose to students at all.
 *
 * The fine shown is the backend's own running calculation for an already-overdue book, not a
 * prediction — nothing is owed on a book that is merely due soon.
 */
export const libraryModule = {
  key: 'Library',
  title: 'Library',
  icon: 'book-open-page-variant-outline',

  // Parent has a 'Library' nav entry too, but the only endpoint behind this is the student's own
  // (`getMyActiveEnrollment` resolves from the caller). The per-child library route exists
  // separately and belongs with a scope picker — Phase 5, alongside the rest of the parent views.
  servesRole: (ctx) => ctx.is('Student'),
  notForRoleLabel: 'This is a student’s own borrowed books. The parent view of a child’s library account is coming in Phase 5.',

  useList: () => useGetMyLibraryBooksQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.bookId?.title, (row) => row.bookId?.author],
  searchPlaceholder: 'Search your books',

  summary: (rows) => {
    if (rows.length === 0) return [];
    const overdue = rows.filter((row) => row.status === 'Overdue');
    const fines = rows.reduce((sum, row) => sum + (row.fineAmount || 0), 0);
    const tiles = [
      { label: 'Books out', value: rows.length, icon: 'book-multiple-outline' },
      { label: 'Overdue', value: overdue.length, icon: 'alert-circle-outline', color: overdue.length ? '#EF4444' : '#94A3B8' },
    ];
    // Only worth a tile when there is actually something to pay.
    if (fines > 0) tiles.push({ label: 'Fine due', value: fines, format: 'currency', color: '#EF4444' });
    return tiles;
  },

  row: (row) => {
    const left = daysUntil(row.dueDate);
    const overdue = row.status === 'Overdue';
    return {
      title: row.bookId?.title ?? 'Book',
      subtitle: row.bookId?.author,
      meta: row.dueDate ? `Due ${formatDate(row.dueDate)}` : null,
      unread: overdue,
      badge: overdue
        ? { label: row.fineAmount > 0 ? `overdue · ${formatCurrency(row.fineAmount)}` : 'overdue', tone: 'overdue' }
        : left != null && left <= 3
          ? { label: left <= 0 ? 'due today' : `${left}d left`, tone: 'pending' }
          : null,
    };
  },

  emptyIcon: 'book-outline',
  emptyLabel: 'You have no books out',

  detail: {
    title: 'Borrowed Book',
    titleFor: (row) => row.bookId?.title ?? 'Book',
    badgeFor: (row) => (row.status === 'Overdue' ? { label: 'overdue', tone: 'overdue' } : null),
    fields: (row) => [
      { label: 'Author', value: row.bookId?.author },
      { label: 'ISBN', value: row.bookId?.isbn },
      { label: 'Issued on', value: row.issueDate ? formatDate(row.issueDate) : null },
      { label: 'Due back', value: row.dueDate ? formatDate(row.dueDate) : null },
      { label: 'Fine so far', value: row.fineAmount > 0 ? formatCurrency(row.fineAmount) : null },
    ],
  },
};
