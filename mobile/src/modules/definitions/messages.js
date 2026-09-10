import {
  useGetMessagesQuery,
  useMarkMessageReadMutation,
  useSendMessageMutation,
} from '../../store/api/apiSlice';
import { formatDate, timeAgo } from '../../utils/format';

const PRIORITY_TONES = { urgent: 'overdue', high: 'pending', normal: null, low: 'inactive' };

function senderName(row) {
  return row.senderId?.name ?? 'Unknown sender';
}

function recipientNames(row) {
  return (row.recipientIds ?? []).map((person) => person?.name).filter(Boolean).join(', ');
}

/**
 * Messages — the school's internal inbox.
 *
 * Threading is present in the data (`parentMessageId`, and a `/messages/:id/thread` endpoint) but
 * this screen shows one message at a time rather than a chat transcript. Replying works and is
 * correctly parented, so a reply lands in the right conversation on the web portal; what is not
 * built yet is the transcript view that renders a whole back-and-forth in one scroll. That is a
 * genuinely different screen, not a descriptor, and it is called out in PLAN.md rather than being
 * half-implemented here.
 *
 * Composing a brand-new message needs a recipient picker over `/messages/recipients`, which the
 * generic form cannot express either — so this offers reply only.
 */
export const messagesModule = {
  key: 'Messages',
  title: 'Messages',
  icon: 'email-outline',

  useList: (ctx, { filter }) => useGetMessagesQuery({ mailbox: filter ?? 'inbox' }),
  selectRows: (data) => (Array.isArray(data) ? data : data?.messages ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.subject, (row) => row.body, (row) => senderName(row)],
  searchPlaceholder: 'Search messages',

  // Server-side: /messages takes ?mailbox=. `null` (the "Inbox" chip) is the default mailbox.
  filter: {
    server: true,
    allLabel: 'Inbox',
    options: [
      { value: 'sent', label: 'Sent' },
      { value: 'archive', label: 'Archived' },
    ],
  },

  row: (row) => ({
    title: row.subject || '(no subject)',
    subtitle: row.body,
    meta: `${senderName(row)} · ${timeAgo(row.createdAt)}`,
    unread: !row.isRead,
    badge: PRIORITY_TONES[row.priority]
      ? { label: row.priority, tone: PRIORITY_TONES[row.priority] }
      : null,
  }),

  emptyIcon: 'email-off-outline',
  emptyLabel: 'No messages here',

  detail: {
    title: 'Message',
    titleFor: (row) => row.subject || '(no subject)',
    badgeFor: (row) =>
      PRIORITY_TONES[row.priority] ? { label: row.priority, tone: PRIORITY_TONES[row.priority] } : null,
    fields: (row) => [
      { label: 'From', value: senderName(row) },
      { label: 'To', value: recipientNames(row) },
      { label: 'Sent', value: formatDate(row.createdAt) },
      { label: 'Message', value: row.body },
    ],
    // Opening a message is what marks it read, the same convention as Notifications and Circulars.
    useOnOpen: useMarkMessageReadMutation,
    onOpenArg: (row) => (row.isRead ? null : row._id),
    actions: [
      {
        key: 'reply',
        label: 'Reply',
        icon: 'reply-outline',
        tone: 'primary',
        // Nothing to reply to on your own sent message, and no sender to reply to without one.
        allow: (ctx, row) => {
          const sender = row?.senderId?._id ?? row?.senderId;
          // mapMessage carries no 'sent by me' flag, so compare against the caller directly —
          // replying to yourself in the Sent mailbox is not a thing.
          return Boolean(sender) && String(sender) !== String(ctx.user?._id);
        },
        useMutation: useSendMessageMutation,
        title: 'Reply',
        submitLabel: 'Send Reply',
        fields: [{ name: 'body', label: 'Your reply', type: 'textarea', required: true }],
        buildArg: (row, ctx, values) => ({
          // Parenting the reply is what keeps it in the same conversation on the web portal.
          parentMessageId: row._id,
          subject: row.subject?.startsWith('Re:') ? row.subject : `Re: ${row.subject || '(no subject)'}`,
          body: values.body.trim(),
          recipientIds: [row.senderId?._id ?? row.senderId],
          priority: 'normal',
        }),
      },
    ],
  },
};
