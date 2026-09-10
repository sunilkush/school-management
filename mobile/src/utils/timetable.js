export const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/** Backend already returns rows sorted by dayOfWeek then timeSlotId.order — this just buckets them. */
export function groupTimetableByDay(rows = []) {
  const byDay = new Map();
  for (const row of rows) {
    const day = row.dayOfWeek;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(row);
  }
  return DAY_ORDER.filter((day) => byDay.has(day)).map((day) => ({ day, label: DAY_LABELS[day], rows: byDay.get(day) }));
}

const NON_SUBJECT_LABELS = {
  break: 'Break',
  lunch: 'Lunch',
  assembly: 'Assembly',
  activity: 'Activity',
  substitution: 'Substitution',
};

export function timetableRowTitle(row) {
  if (row.type !== 'regular') return NON_SUBJECT_LABELS[row.type] ?? row.type;
  return row.subjectId?.name ?? 'Free Period';
}

export function timetableRowSubtitle(row) {
  const parts = [];
  if (row.timeSlotId?.startTime && row.timeSlotId?.endTime) {
    parts.push(`${row.timeSlotId.startTime} – ${row.timeSlotId.endTime}`);
  }
  if (row.type === 'regular' && row.teacherId?.name) parts.push(row.teacherId.name);
  if (row.roomId?.name) parts.push(row.roomId.name);
  return parts.join(' · ');
}

// backend/src/models/Timetable.model.js `type` enum — a period's own type, independent of the
// time slot's own type (you can place a "regular" period inside a slot labeled "break"; the web
// app allows this too, not a bug to fix).
export const TIMETABLE_ENTRY_TYPES = ['regular', 'break', 'lunch', 'assembly', 'activity', 'substitution'];
// Only these types require subjectId + teacherId (backend validateEntry enforces this).
export const TEACHING_ENTRY_TYPES = new Set(['regular', 'activity', 'substitution']);

export const TIMETABLE_TYPE_COLORS = {
  regular: '#2563EB',
  activity: '#7C3AED',
  substitution: '#F59E0B',
  break: '#EA580C',
  lunch: '#14B8A6',
  assembly: '#0891B2',
};

export function timetableTypeColor(type) {
  return TIMETABLE_TYPE_COLORS[type] ?? '#94A3B8';
}

// backend/src/models/TimeSlot.model.js `type` enum (no "substitution" — that's an entry-level
// type only) and backend/src/models/Room.model.js `type` enum.
export const TIME_SLOT_TYPES = ['period', 'break', 'lunch', 'assembly', 'activity'];
export const ROOM_TYPES = ['classroom', 'lab', 'library', 'auditorium', 'sports', 'other'];
