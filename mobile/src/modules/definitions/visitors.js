import {
  useGetGateEntriesQuery,
  useCreateGateEntryMutation,
  useMarkGateExitMutation,
} from '../../store/api/apiSlice';
import { formatTime, timeAgo } from '../../utils/format';

// gateEntry.routes.js ALLOWED — gated by role name, not the permissions array.
const GATE_ROLES = ['School Admin', 'Receptionist', 'Security', 'Super Admin'];

/**
 * The visitor gate register — and one of the few modules where a phone is the *right* device
 * rather than a smaller copy of the desktop. A guard standing at the gate logs an arrival and taps
 * the same person out when they leave; nobody wants to walk to a desktop for that.
 *
 * So unlike the rest of Tier C this one is fully read-write, and the list defaults to who is
 * currently inside — the question a guard is actually being asked.
 */
export const visitorsModule = {
  key: 'VisitorLog',
  title: 'Gate Register',
  icon: 'account-clock-outline',

  servesRole: (ctx) => ctx.is(...GATE_ROLES),
  notForRoleLabel: 'The gate register is kept by reception and security.',

  useList: (ctx, { filter }) =>
    // The endpoint pages; 100 covers a day at the gate comfortably, and the list is
    // reverse-chronological so the newest arrivals are on top either way.
    useGetGateEntriesQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.entries ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.phone, (row) => row.vehicleNo, (row) => row.purpose],
  searchPlaceholder: 'Search by name, phone or vehicle',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'Inside', label: 'Inside now' },
      { value: 'Exited', label: 'Left' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const inside = rows.filter((row) => row.status === 'Inside').length;
    return [
      { label: 'Inside now', value: inside, icon: 'account-group-outline', color: inside > 0 ? '#2563EB' : '#94A3B8' },
      { label: 'Logged', value: rows.length, icon: 'clipboard-list-outline' },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: [row.type, row.purpose].filter(Boolean).join(' · '),
    meta: row.status === 'Inside'
      ? `In since ${formatTime(row.entryTime)} · ${timeAgo(row.entryTime)}`
      : `${formatTime(row.entryTime)} – ${row.exitTime ? formatTime(row.exitTime) : '?'}`,
    // Still on the premises is the thing a guard needs to spot at a glance.
    unread: row.status === 'Inside',
    badge: { label: row.status === 'Inside' ? 'inside' : 'left', tone: row.status === 'Inside' ? 'active' : 'inactive' },
  }),

  emptyIcon: 'door-closed',
  emptyLabel: 'Nobody logged at the gate yet',

  detail: {
    title: 'Gate Entry',
    titleFor: (row) => row.name,
    badgeFor: (row) => ({
      label: row.status === 'Inside' ? 'inside' : 'left',
      tone: row.status === 'Inside' ? 'active' : 'inactive',
    }),
    fields: (row) => [
      { label: 'Type', value: row.type },
      { label: 'Phone', value: row.phone },
      { label: 'Purpose', value: row.purpose },
      { label: 'Vehicle', value: row.vehicleNo },
      { label: 'Gate', value: row.gate },
      { label: 'Entered', value: formatTime(row.entryTime) },
      { label: 'Left', value: row.exitTime ? formatTime(row.exitTime) : null },
      { label: 'Logged by', value: row.loggedBy?.name },
    ],
    actions: [
      {
        key: 'exit',
        label: 'Mark as left',
        icon: 'exit-run',
        tone: 'primary',
        // The backend stamps the exit time itself, so there is nothing to collect — one tap.
        allow: (ctx, row) => ctx.is(...GATE_ROLES) && row?.status === 'Inside',
        useMutation: useMarkGateExitMutation,
        buildArg: (row) => row._id,
      },
    ],
  },

  create: {
    title: 'Log an Entry',
    label: 'Log entry',
    submitLabel: 'Log Entry',
    allow: (ctx) => ctx.is(...GATE_ROLES),
    useMutation: useCreateGateEntryMutation,
    // Entry time is stamped server-side — a guard logging someone in is, by definition, doing it
    // now, and a date field here would only invite a wrong one.
    fields: [
      { name: 'name', label: 'Visitor name', required: true },
      {
        name: 'type',
        label: 'Who is it',
        type: 'select',
        initial: 'Visitor',
        required: true,
        options: [
          { value: 'Visitor', label: 'Visitor' },
          { value: 'Parent', label: 'Parent' },
          { value: 'Vendor', label: 'Vendor' },
          { value: 'Contractor', label: 'Contractor' },
          { value: 'Staff', label: 'Staff' },
          { value: 'Other', label: 'Other' },
        ],
      },
      { name: 'phone', label: 'Phone', type: 'number' },
      { name: 'purpose', label: 'Purpose of visit' },
      { name: 'vehicleNo', label: 'Vehicle number' },
      {
        name: 'gate',
        label: 'Gate',
        type: 'select',
        initial: 'Main',
        options: [
          { value: 'Main', label: 'Main' },
          { value: 'Side', label: 'Side' },
          { value: 'Back', label: 'Back' },
          { value: 'Other', label: 'Other' },
        ],
      },
    ],
    buildPayload: (values) => ({
      name: values.name.trim(),
      type: values.type,
      phone: String(values.phone || '').trim(),
      purpose: values.purpose?.trim() || '',
      vehicleNo: values.vehicleNo?.trim() || '',
      gate: values.gate,
    }),
  },
};
