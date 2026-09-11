import { useGetHostelRoomsQuery, useGetCanteenItemsQuery } from '../../store/api/apiSlice';
import { formatCurrency } from '../../utils/format';

const HOSTEL_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Hostel Warden'];
const CANTEEN_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];

/**
 * Hostel rooms — who is in which room, and where there is space.
 *
 * Read-only. Assigning a student to a room is a housing decision made with a waiting list and a
 * parent conversation behind it, not something to tap through on a phone; the web portal owns it.
 * The occupancy view, though, is exactly what a warden wants while walking the building.
 */
export const hostelModule = {
  key: 'Rooms',
  title: 'Hostel Rooms',
  icon: 'bed-outline',
  // "Hostel" is the same register under the warden's own label.
  aliases: ['Hostel'],

  servesRole: (ctx) => ctx.is(...HOSTEL_ROLES),
  notForRoleLabel: 'The hostel room register is kept by the warden and the school office.',

  useList: () => useGetHostelRoomsQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.roomNumber, (row) => (row.students ?? []).map((s) => s.name).join(' ')],
  searchPlaceholder: 'Search by room or student',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'space', label: 'Has space' },
      { value: 'full', label: 'Full' },
    ],
    apply: (row, value) => {
      const occupied = row.students?.length ?? 0;
      const capacity = row.capacity ?? 0;
      return value === 'full' ? occupied >= capacity : occupied < capacity;
    },
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const beds = rows.reduce((sum, row) => sum + (row.capacity || 0), 0);
    const filled = rows.reduce((sum, row) => sum + (row.students?.length || 0), 0);
    return [
      { label: 'Beds', value: beds, icon: 'bed-outline' },
      { label: 'Occupied', value: filled, icon: 'account-group-outline', color: '#2563EB' },
      {
        label: 'Free',
        value: Math.max(beds - filled, 0),
        icon: 'bed-empty',
        color: beds - filled > 0 ? '#22C55E' : '#EF4444',
      },
    ];
  },

  row: (row) => {
    const occupied = row.students?.length ?? 0;
    const capacity = row.capacity ?? 0;
    const full = occupied >= capacity;
    return {
      title: `Room ${row.roomNumber}`,
      subtitle: occupied ? row.students.map((student) => student.name).join(', ') : 'Empty',
      meta: `${occupied} of ${capacity} beds`,
      badge: { label: full ? 'full' : `${capacity - occupied} free`, tone: full ? 'overdue' : 'active' },
    };
  },

  emptyIcon: 'bed-outline',
  emptyLabel: 'No hostel rooms set up yet',

  detail: {
    title: 'Room',
    titleFor: (row) => `Room ${row.roomNumber}`,
    fields: (row) => [
      { label: 'Capacity', value: `${row.capacity ?? 0} beds` },
      { label: 'Occupied', value: String(row.students?.length ?? 0) },
      {
        label: 'Students',
        value: row.students?.length ? row.students.map((student) => student.name).join('\n') : null,
      },
    ],
  },
};

/**
 * The canteen menu and what each item costs.
 *
 * Read-only, and deliberately not a shop. The backend does have a wallet and an order endpoint,
 * but taking a child's money through this app would need the wallet top-up flow, a parent's
 * consent trail and a refund path — none of which exist yet. Showing a price list that is honest
 * beats a checkout that is half-built.
 */
export const canteenModule = {
  key: 'Canteen',
  title: 'Canteen',
  icon: 'food-apple-outline',

  servesRole: (ctx) => ctx.is(...CANTEEN_ROLES),
  notForRoleLabel: 'The canteen menu is managed by the school office.',

  useList: () => useGetCanteenItemsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.category],
  searchPlaceholder: 'Search the menu',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'Breakfast', label: 'Breakfast' },
      { value: 'Lunch', label: 'Lunch' },
      { value: 'Snacks', label: 'Snacks' },
      { value: 'Beverages', label: 'Drinks' },
    ],
    apply: (row, value) => row.category === value,
  },

  row: (row) => ({
    title: row.name,
    subtitle: row.category,
    meta: formatCurrency(row.price || 0),
    badge: row.isAvailable === false ? { label: 'off menu', tone: 'inactive' } : null,
  }),

  emptyIcon: 'food-off-outline',
  emptyLabel: 'Nothing on the canteen menu yet',
  footerNote: 'Prices only — ordering and wallet top-ups are not available in the app.',

  detail: {
    title: 'Item',
    titleFor: (row) => row.name,
    badgeFor: (row) => (row.isAvailable === false ? { label: 'off menu', tone: 'inactive' } : null),
    fields: (row) => [
      { label: 'Category', value: row.category },
      { label: 'Price', value: formatCurrency(row.price || 0) },
      { label: 'Available', value: row.isAvailable === false ? 'Not today' : 'Yes' },
    ],
  },
};
