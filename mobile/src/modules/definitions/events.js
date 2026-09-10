import { useGetEventsQuery } from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';

// SchoolEvent.model.js EVENT_TYPES. Holidays read as good news, exams as something to prepare
// for — worth distinguishing at a glance rather than badging everything the same.
const TYPE_TONES = {
  Holiday: 'active',
  Exam: 'overdue',
  Meeting: 'pending',
  Reminder: 'pending',
  Activity: 'inactive',
  Event: null,
};

function whenLabel(event) {
  const start = formatDate(event.startDate);
  const end = event.endDate ? formatDate(event.endDate) : null;
  const span = end && end !== start ? `${start} – ${end}` : start;
  return event.allDay || !event.startDate ? span : `${span}, ${formatTime(event.startDate)}`;
}

/**
 * The school calendar — holidays, exams, meetings, activities.
 *
 * Read-only here. Creating an event is admin work with an audience picker and a date range, and
 * it already has its own screen on the web portal; a parent opening "Events" wants to know when
 * the school is shut, not to schedule anything.
 *
 * The backend already narrows the list by the caller's audience, so no client-side role filtering
 * is applied on top — doing that as well would risk hiding an event the school did address to them.
 */
export const eventsModule = {
  key: 'Events',
  title: 'Events',
  icon: 'calendar-star',

  useList: () => useGetEventsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.events ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.description, (row) => row.location],
  searchPlaceholder: 'Search events',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'Holiday', label: 'Holidays' },
      { value: 'Exam', label: 'Exams' },
    ],
    apply: (row, value) => {
      if (value !== 'upcoming') return row.type === value;
      // "Upcoming" keeps an event that is still running today, not only ones that start later —
      // a week-long activity should not vanish from the list on its second day.
      const until = row.endDate ?? row.startDate;
      return until ? new Date(until).getTime() >= Date.now() : false;
    },
  },

  row: (row) => ({
    title: row.title,
    subtitle: row.location || row.description,
    meta: whenLabel(row),
    badge: TYPE_TONES[row.type] ? { label: row.type, tone: TYPE_TONES[row.type] } : null,
  }),

  emptyIcon: 'calendar-blank-outline',
  emptyLabel: 'Nothing on the calendar',

  detail: {
    title: 'Event',
    titleFor: (row) => row.title,
    badgeFor: (row) => (TYPE_TONES[row.type] ? { label: row.type, tone: TYPE_TONES[row.type] } : null),
    fields: (row) => [
      { label: 'When', value: whenLabel(row) },
      { label: 'Where', value: row.location },
      { label: 'Type', value: row.type },
      { label: 'For', value: row.audience },
      { label: 'Details', value: row.description },
    ],
  },
};
