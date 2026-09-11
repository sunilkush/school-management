import { useGetInventoryItemsQuery } from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

const CONDITION_TONES = {
  new: 'active',
  good: 'active',
  fair: 'pending',
  poor: 'overdue',
  disposed: 'inactive',
};

/**
 * School stock — consumable supplies and fixed assets in one register, which is how the backend
 * models it (`itemType: 'supply' | 'asset'`).
 *
 * Read-only here. Adding stock, issuing it to a department and disposing of an asset are
 * store-room jobs done at a desk with a purchase order in hand, not from a phone; the web portal
 * owns those. What a phone is genuinely good for is checking *what is left* while standing in
 * front of the shelf — hence the low-stock filter.
 */
export const inventoryModule = {
  key: 'Inventory',
  title: 'Inventory',
  icon: 'package-variant-closed',

  useList: () => useGetInventoryItemsQuery({}),
  // The endpoint returns a bare array, already enriched with `available` and `lowStock`.
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.category, (row) => row.serialNumber],
  searchPlaceholder: 'Search stock',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'low', label: 'Low stock' },
      { value: 'asset', label: 'Assets' },
      { value: 'supply', label: 'Supplies' },
    ],
    // `lowStock` is computed server-side against each item's own threshold, so it is trusted
    // rather than recomputed here with a guessed rule.
    apply: (row, value) => (value === 'low' ? Boolean(row.lowStock) : row.itemType === value),
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const low = rows.filter((row) => row.lowStock).length;
    return [
      { label: 'Items', value: rows.length, icon: 'package-variant-closed' },
      {
        label: 'Low stock',
        value: low,
        icon: 'alert-outline',
        color: low > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: [row.category, row.location].filter(Boolean).join(' · '),
    // `available` is quantity minus what is already allocated out — the number that decides
    // whether you can actually take one, which is not the same as the quantity on the books.
    meta: `${row.available ?? row.quantity ?? 0} ${row.unit || 'available'}${
      row.allocated ? ` · ${row.allocated} issued out` : ''
    }`,
    unread: Boolean(row.lowStock),
    badge: row.lowStock
      ? { label: 'low stock', tone: 'overdue' }
      : row.condition
        ? { label: row.condition, tone: CONDITION_TONES[row.condition] }
        : null,
  }),

  emptyIcon: 'package-variant',
  emptyLabel: 'Nothing in the store register yet',

  detail: {
    title: 'Item',
    titleFor: (row) => row.name,
    badgeFor: (row) => (row.condition ? { label: row.condition, tone: CONDITION_TONES[row.condition] } : null),
    fields: (row) => [
      { label: 'Type', value: row.itemType === 'asset' ? 'Fixed asset' : 'Consumable supply' },
      { label: 'Category', value: row.category },
      { label: 'Location', value: row.location },
      { label: 'In stock', value: `${row.quantity ?? 0} ${row.unit || ''}`.trim() },
      { label: 'Issued out', value: row.allocated ? String(row.allocated) : null },
      { label: 'Available', value: String(row.available ?? row.quantity ?? 0) },
      { label: 'Reorder below', value: row.minThreshold ? String(row.minThreshold) : null },
      { label: 'Serial number', value: row.serialNumber },
      { label: 'Purchased', value: row.purchaseDate ? formatDate(row.purchaseDate) : null },
      { label: 'Purchase price', value: row.purchasePrice ? formatCurrency(row.purchasePrice) : null },
      { label: 'Warranty until', value: row.warrantyExpiry ? formatDate(row.warrantyExpiry) : null },
    ],
  },
};
