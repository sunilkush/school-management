import { Linking } from 'react-native';
import { useGetOnlineClassesQuery, useJoinOnlineClassMutation } from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';

const STATUS_TONES = { live: 'active', scheduled: 'pending', completed: 'inactive', cancelled: 'overdue' };

/**
 * Live online classes.
 *
 * **The app hosts no video.** The school pastes its own Meet/Zoom/Teams link and this hands that
 * link to the device's browser or app. Nothing is streamed, recorded, or embedded here.
 *
 * Equally: joining is **not attendance**. The backend records a "join" — that someone opened the
 * link — and is careful to never call it attendance, because opening a link is not sitting
 * through a lesson. Nothing in this module implies otherwise.
 *
 * A learner's list arrives with `meetingLink` nulled until the link is due to open, along with
 * `canJoin` and `joinOpensAt`, so the button is honest about when the class actually starts
 * instead of failing on tap.
 */
export const onlineClassesModule = {
  key: 'OnlineClasses',
  title: 'Online Classes',
  icon: 'video-outline',

  useList: () => useGetOnlineClassesQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.classes ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.subjectId?.name, (row) => row.teacherId?.name],
  searchPlaceholder: 'Search classes',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'live', label: 'Live now' },
      { value: 'scheduled', label: 'Upcoming' },
    ],
    apply: (row, value) => row.status === value,
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.subjectId?.name, row.teacherId?.name].filter(Boolean).join(' · '),
    meta: row.scheduledStart ? `${formatDate(row.scheduledStart)}, ${formatTime(row.scheduledStart)}` : null,
    unread: row.status === 'live',
    badge: row.status ? { label: row.status, tone: STATUS_TONES[row.status] } : null,
  }),

  emptyIcon: 'video-off-outline',
  emptyLabel: 'No online classes scheduled',

  detail: {
    title: 'Online Class',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status, tone: STATUS_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Teacher', value: row.teacherId?.name },
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' · ') },
      {
        label: 'Starts',
        value: row.scheduledStart ? `${formatDate(row.scheduledStart)}, ${formatTime(row.scheduledStart)}` : null,
      },
      { label: 'Ends', value: row.scheduledEnd ? formatTime(row.scheduledEnd) : null },
      { label: 'Platform', value: row.provider },
      { label: 'Details', value: row.description },
      // Said plainly so nobody sits refreshing, wondering whether the app is broken.
      {
        label: 'Link opens at',
        value: row.joinOpensAt ? `${formatDate(row.joinOpensAt)}, ${formatTime(row.joinOpensAt)}` : null,
      },
      { label: 'Cancelled because', value: row.cancelledReason },
    ],
    actions: [
      {
        key: 'join',
        label: 'Join class',
        icon: 'video',
        tone: 'primary',
        // `canJoin` is the backend's own decision about whether the link is open yet; the same
        // check runs server-side on join, so this only avoids offering a tap that would 403.
        allow: (ctx, row) => row?.status !== 'cancelled' && row?.canJoin !== false,
        useMutation: useJoinOnlineClassMutation,
        buildArg: (row) => row._id,
        // The join call's whole purpose is its response: the link is only handed over here, never
        // held in the list for a class that has not opened yet.
        onSuccess: (result) => {
          const link = result?.meetingLink;
          if (link) Linking.openURL(link).catch(() => {});
        },
        // Stay put — the meeting opens in another app and the passcode may still be needed here.
        stayOnSuccess: true,
      },
    ],
  },
};
