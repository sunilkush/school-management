// Shared visual patterns ported from the web app's design system (frontend/src/styles/pageStyles.js)
// so the mobile app reads as the same product, not just the same brand colors. React Native's
// color parser accepts 8-digit hex (RRGGBBAA), so the web app's `${color}22` alpha-suffix trick
// works unchanged here.

// Exact palette from frontend/src/components/dashboard/RoleDashboardOverview.jsx (STAT_COLORS) —
// dashboard metric tiles rotate through these rather than using one hue, since each tile is a
// distinct labeled KPI, not a magnitude comparison across categories (unlike CategoryBarChart).
export const STAT_COLORS = ['#2563EB', '#14B8A6', '#22C55E', '#F59E0B', '#7C3AED', '#EF4444'];

// Exact palette from frontend/src/styles/pageStyles.js (avatarColor/avatarStyle) — pastel bg +
// saturated ink, keyed by the first character of a name so the same person always gets the same
// color across screens.
const AVATAR_PALETTE = [
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#CCFBF1', color: '#0D9488' },
  { bg: '#DCFCE7', color: '#15803D' },
  { bg: '#FEE2E2', color: '#DC2626' },
  { bg: '#FEF3C7', color: '#B45309' },
  { bg: '#EDE9FE', color: '#6D28D9' },
];

export function avatarColorFor(name = '') {
  const idx = (name.charCodeAt(0) || 65) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

// Exact semantic map from frontend/src/styles/pageStyles.js (STATUS) — one vocabulary for every
// status pill in the app, not just attendance's 5 values.
export const STATUS_SEMANTICS = {
  active: { dot: '#22C55E', text: '#15803D', bg: '#DCFCE780', border: '#22C55E4D' },
  inactive: { dot: '#94A3B8', text: '#64748B', bg: '#F1F5F999', border: '#94A3B866' },
  pending: { dot: '#F59E0B', text: '#B45309', bg: '#FEF3C780', border: '#F59E0B4D' },
  overdue: { dot: '#EF4444', text: '#DC2626', bg: '#FEE2E280', border: '#EF44444D' },
  suspended: { dot: '#8B5CF6', text: '#6D28D9', bg: '#EDE9FE80', border: '#8B5CF64D' },
  paid: { dot: '#22C55E', text: '#15803D', bg: '#DCFCE780', border: '#22C55E4D' },
  unpaid: { dot: '#EF4444', text: '#DC2626', bg: '#FEE2E280', border: '#EF44444D' },
  partial: { dot: '#F59E0B', text: '#B45309', bg: '#FEF3C780', border: '#F59E0B4D' },
};

/** Rounded-square tinted icon badge — the app's one icon-presentation pattern (iconWell in pageStyles.js). */
export function iconWellStyle(color, size = 36) {
  return {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.28),
    backgroundColor: `${color}22`,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/** Colored pill badge — text on a tinted background with a tinted border (pill() in pageStyles.js). */
export function pillStyle(color) {
  return {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: `${color}15`,
    borderWidth: 1,
    borderColor: `${color}25`,
  };
}
