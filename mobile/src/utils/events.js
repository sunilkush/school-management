// backend/src/models/SchoolEvent.model.js enums.
export const EVENT_TYPES = ['Event', 'Holiday', 'Meeting', 'Exam', 'Activity', 'Reminder'];
export const EVENT_AUDIENCES = ['All', 'Students', 'Teachers', 'Parents', 'Staff'];
export const EVENT_STATUSES = ['scheduled', 'cancelled', 'completed'];

export const EVENT_TYPE_COLORS = {
  Event: '#2563EB',
  Holiday: '#22C55E',
  Meeting: '#7C3AED',
  Exam: '#EF4444',
  Activity: '#F59E0B',
  Reminder: '#14B8A6',
};

export function eventTypeColor(type) {
  return EVENT_TYPE_COLORS[type] ?? '#94A3B8';
}
