const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

/** Renders a dashboard metric ({value, suffix?, format?}) as display text. */
export function formatMetricValue(metric) {
  if (metric?.format === 'currency') return formatCurrency(metric.value);
  const value = metric?.value ?? 0;
  return metric?.suffix ? `${value}${metric.suffix}` : String(value);
}

export function formatDate(dateInput, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', options);
}

/** YYYY-MM-DD in local time — avoids the day-shift `toISOString()` causes near midnight in +/- UTC zones. */
export function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "12:04" or "1:02:04" countdown display for a remaining-seconds duration (exam timers). */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mmss = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return hh > 0 ? `${hh}:${mmss}` : mmss;
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** exponent;
  return `${exponent === 0 ? scaled : scaled.toFixed(1)} ${units[exponent]}`;
}

export function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "2h ago" / "3d ago" style relative time — mirrors the web app's dayjs(...).fromNow() for
 * notification timestamps, without adding a dayjs dependency for one call site. */
export function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return 'just now';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return formatDate(date);
}
