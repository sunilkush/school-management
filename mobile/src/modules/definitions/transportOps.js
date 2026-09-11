import {
  useGetTransportRoutesQuery,
  useGetVehiclesQuery,
  useGetTransportAssignmentsQuery,
} from '../../store/api/apiSlice';

// transport.routes.js TRANSPORT_READ.
const TRANSPORT_READ = [
  'Super Admin', 'School Admin', 'Transport Manager', 'Principal', 'Vice Principal',
];

/**
 * The transport fleet, from the office's side — routes, buses and who rides which.
 *
 * These are the staff counterpart to `MyTransport` (a family's own bus) and `DriverTrip` (the
 * driver running one). Read-only: adding a route means plotting stop coordinates on a map, and
 * assigning a student to a bus changes what their parent is billed.
 */

/** Routes and their stops. */
export const routesModule = {
  key: 'Routes',
  title: 'Routes',
  icon: 'map-marker-path',

  servesRole: (ctx) => ctx.is(...TRANSPORT_READ),
  notForRoleLabel: 'Transport routes are managed by the transport office.',

  useList: () => useGetTransportRoutesQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.routes ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.bus?.busNumber],
  searchPlaceholder: 'Search routes',

  summary: (rows) => {
    if (rows.length === 0) return [];
    // A route with no mapped stop points cannot produce an arrival estimate for any parent on it
    // — the live-bus screen says so out loud, so it is worth counting here too.
    const unmapped = rows.filter((row) => !row.stopPoints?.length).length;
    return [
      { label: 'Routes', value: rows.length, icon: 'map-marker-path' },
      {
        label: 'Not on the map',
        value: unmapped,
        icon: 'map-marker-off-outline',
        color: unmapped > 0 ? '#F59E0B' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: row.bus?.busNumber ?? row.bus?.vehicleType,
    meta: [
      row.stops?.length ? `${row.stops.length} stop${row.stops.length === 1 ? '' : 's'}` : null,
      row.students?.length ? `${row.students.length} riding` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: !row.stopPoints?.length,
    badge: row.stopPoints?.length ? null : { label: 'no map', tone: 'pending' },
  }),

  emptyIcon: 'map-marker-off-outline',
  emptyLabel: 'No transport routes set up',
  footerNote: 'Routes and their stop coordinates are set up on the web portal, where there is a map.',

  detail: {
    title: 'Route',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Bus', value: row.bus?.busNumber ?? row.bus?.vehicleType },
      { label: 'Students riding', value: String(row.students?.length ?? 0) },
      { label: 'Stops', value: row.stops?.length ? row.stops.join('\n') : null },
      {
        // Named stops without coordinates are exactly why a parent gets "no arrival time" — so the
        // gap is spelled out rather than left to be discovered on the parent's screen.
        label: 'Stops on the map',
        value: row.stopPoints?.length
          ? row.stopPoints.map((s) => `${s.sequence}. ${s.name}`).join('\n')
          : 'None — parents on this route get no arrival times',
      },
    ],
  },
};

/** The buses themselves. */
export const vehiclesModule = {
  key: 'Vehicles',
  title: 'Vehicles',
  icon: 'bus',

  servesRole: (ctx) => ctx.is(...TRANSPORT_READ),
  notForRoleLabel: 'The fleet is managed by the transport office.',

  useList: () => useGetVehiclesQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.vehicles ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.busNumber, (row) => row.driverName, (row) => row.route],
  searchPlaceholder: 'Search by bus number or driver',

  row: (row) => ({
    title: row.busNumber ?? row.vehicleType ?? 'Vehicle',
    subtitle: row.driverName ? `Driver: ${row.driverName}` : 'No driver assigned',
    meta: [row.route, row.capacity ? `${row.capacity} seats` : null].filter(Boolean).join(' · '),
    unread: !row.driverName,
    badge: row.status ? { label: String(row.status).toLowerCase(), tone: row.status === 'active' ? 'active' : 'inactive' } : null,
  }),

  emptyIcon: 'bus-alert',
  emptyLabel: 'No vehicles in the fleet',

  detail: {
    title: 'Vehicle',
    titleFor: (row) => row.busNumber ?? row.vehicleType ?? 'Vehicle',
    fields: (row) => [
      { label: 'Type', value: row.vehicleType },
      { label: 'Route', value: row.route },
      { label: 'Capacity', value: row.capacity != null ? `${row.capacity} seats` : null },
      { label: 'Driver', value: row.driverName },
      { label: 'Driver contact', value: row.driverContact },
      { label: 'Driving licence', value: row.drivingLicense },
      { label: 'Status', value: row.status },
    ],
  },
};

/** Which student rides which route, and from which stop. */
export const transportAssignmentsModule = {
  key: 'TransportAssignments',
  title: 'Bus Assignments',
  icon: 'account-arrow-right-outline',
  aliases: ['TransportUsers'],

  servesRole: (ctx) => ctx.is(...TRANSPORT_READ),
  notForRoleLabel: 'Bus assignments are managed by the transport office.',

  useList: () => useGetTransportAssignmentsQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.assignments ?? []),
  rowKey: (row) => row._id,

  searchFields: [
    (row) => row.studentName ?? row.studentId?.userId?.name,
    (row) => row.pickupStop,
    (row) => row.dropStop,
  ],
  searchPlaceholder: 'Search by student or stop',

  row: (row) => ({
    title: row.studentName ?? row.studentId?.userId?.name ?? 'Student',
    subtitle: row.routeId?.name ?? row.route,
    // Pickup and drop can be different stops, and which one matters depends on the direction the
    // bus is going — the live-bus screen picks between them, so both are shown here.
    meta: [row.pickupStop ? `Pickup ${row.pickupStop}` : null, row.dropStop ? `Drop ${row.dropStop}` : null]
      .filter(Boolean)
      .join(' · '),
    badge: row.isActive === false ? { label: 'inactive', tone: 'inactive' } : null,
  }),

  emptyIcon: 'account-off-outline',
  emptyLabel: 'No students assigned to transport',
  footerNote: 'Assigning a student to a bus affects what their family is billed, so it is done on the web portal.',

  detail: {
    title: 'Assignment',
    titleFor: (row) => row.studentName ?? row.studentId?.userId?.name ?? 'Student',
    fields: (row) => [
      { label: 'Route', value: row.routeId?.name ?? row.route },
      { label: 'Pickup stop', value: row.pickupStop },
      { label: 'Drop stop', value: row.dropStop },
      { label: 'Vehicle', value: row.vehicleId?.busNumber },
    ],
  },
};
