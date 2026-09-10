import {
  useGetMyCircularsQuery,
  useGetCircularQuery,
  useAcknowledgeCircularMutation,
} from '../../store/api/apiSlice';
import { formatDate, timeAgo } from '../../utils/format';

/**
 * Circulars — the reader's inbox. Numbered notices, some of which ask the reader to acknowledge
 * that they have read them.
 *
 * Deliberately the RECIPIENT view only. Issuing a circular (drafting, picking an audience,
 * publishing, then chasing who has not acknowledged) is a staff workflow with its own screens on
 * the web portal and does not collapse into this list — that is Phase 5 work, not a descriptor.
 *
 * The distinction the backend is careful about, and so is this screen: **opening a circular is not
 * the same as acknowledging it.** Views and acknowledgements are counted separately, so reading
 * one silently records a view and nothing more; agreeing is always an explicit tap.
 */
export const circularsModule = {
  key: 'Circulars',
  title: 'Circulars',
  icon: 'bullhorn-variant-outline',

  useList: () => useGetMyCircularsQuery(),
  selectRows: (data) => data ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.circularNumber, (row) => row.category],
  searchPlaceholder: 'Search by title or number',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'action', label: 'Needs you' },
      { value: 'pinned', label: 'Pinned' },
    ],
    apply: (row, value) => (value === 'action' ? row.needsAcknowledgement : row.isPinned),
  },

  row: (row) => ({
    title: row.isPinned ? `📌  ${row.title}` : row.title,
    subtitle: row.circularNumber ? `${row.circularNumber} · ${row.category}` : row.category,
    meta: row.publishedAt ? timeAgo(row.publishedAt) : null,
    // An unopened circular reads as unread; one still awaiting your acknowledgement stays bold
    // even after you have opened it, because it is still asking something of you.
    unread: !row.viewedAt || row.needsAcknowledgement,
    badge: row.needsAcknowledgement
      ? { label: 'acknowledge', tone: 'pending' }
      : row.acknowledgedAt
        ? { label: 'acknowledged', tone: 'active' }
        : null,
  }),

  emptyIcon: 'bullhorn-outline',
  emptyLabel: 'No circulars for you yet',

  detail: {
    title: 'Circular',
    // Fetching the record is what records the view — GET /circulars/:id is side-effecting by
    // design, so there is no separate read-receipt call that could be forgotten.
    useItem: (id) => useGetCircularQuery(id, { skip: !id }),
    selectItem: (data) => data?.circular ?? data,
    titleFor: (record) => record?.title ?? 'Circular',
    badgeFor: (record) =>
      record?.acknowledgedAt
        ? { label: 'acknowledged', tone: 'active' }
        : record?.requiresAcknowledgement
          ? { label: 'needs acknowledgement', tone: 'pending' }
          : null,
    fields: (record) => [
      { label: 'Circular number', value: record?.circularNumber },
      { label: 'Category', value: record?.category },
      { label: 'Issued by', value: record?.issuedBy?.name },
      { label: 'Published', value: record?.publishedAt ? formatDate(record.publishedAt) : null },
      { label: 'Notice', value: record?.body },
      // The exact wording the reader is agreeing to, shown before the button that agrees to it.
      // The backend copies this onto the acknowledgement record so it cannot change afterwards.
      {
        label: 'You are being asked to confirm',
        value: record?.requiresAcknowledgement && !record?.acknowledgedAt ? record?.acknowledgementText : null,
      },
      {
        label: 'Acknowledgement deadline',
        value: record?.acknowledgementDeadline ? formatDate(record.acknowledgementDeadline) : null,
      },
      { label: 'Acknowledged on', value: record?.acknowledgedAt ? formatDate(record.acknowledgedAt) : null },
      // Attachments are listed rather than opened: the app has no file viewer yet, and claiming
      // to open one it cannot render would be worse than naming it.
      {
        label: 'Attachments',
        value: record?.attachments?.length
          ? record.attachments.map((file) => file.name).join(', ')
          : null,
      },
    ],
    actions: [
      {
        key: 'acknowledge',
        // The school's own wording for what is being agreed to is shown as a field above, so this
        // button only has to be the act of agreeing, not the statement itself.
        label: 'I acknowledge this circular',
        icon: 'check-decagram-outline',
        tone: 'primary',
        // The backend rejects an acknowledgement on a circular that does not ask for one, and on
        // one already acknowledged — so neither is offered.
        allow: (ctx, record) => Boolean(record?.requiresAcknowledgement) && !record?.acknowledgedAt,
        useMutation: useAcknowledgeCircularMutation,
        title: 'Acknowledge',
        submitLabel: 'Confirm Acknowledgement',
        fields: [
          {
            name: 'note',
            label: 'Add a note (optional)',
            type: 'textarea',
            placeholder: 'Anything you want on record with your acknowledgement',
          },
        ],
        buildArg: (record, ctx, values) => ({ id: record._id, note: values.note?.trim() || '' }),
      },
    ],
  },
};
