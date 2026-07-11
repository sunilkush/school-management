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

export function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
