// backend/src/models/IssuedBooks.model.js status enum: ["Issued","Returned","Overdue","Lost"]
export const ISSUED_BOOK_STATUS_META = {
  Issued: { label: 'Issued', color: '#2563EB' },
  Overdue: { label: 'Overdue', color: '#EF4444' },
  Returned: { label: 'Returned', color: '#22C55E' },
  Lost: { label: 'Lost', color: '#7C3AED' },
  Damaged: { label: 'Damaged', color: '#F59E0B' },
};
