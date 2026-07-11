// backend/src/controllers/message.controllers.js validates priority against exactly these values.
export const MESSAGE_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const MESSAGE_PRIORITY_META = {
  low: { label: 'Low', color: '#94A3B8' },
  normal: { label: 'Normal', color: '#2563EB' },
  high: { label: 'High', color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

export function otherParty(message, currentUserId) {
  const senderId = message.senderId?._id ?? message.senderId;
  if (String(senderId) === String(currentUserId)) {
    return (message.recipientIds ?? []).map((r) => r.name).join(', ') || 'Unknown';
  }
  return message.senderId?.name ?? 'Unknown';
}
