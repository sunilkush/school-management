// Matches backend/src/controllers/dashboard.controllers.js's score->tier thresholds
// (score >= 90 EXCELLENT, >= 75 GOOD, >= 60 AVERAGE, else POOR) and the web PerfBadge colors.
export const PERFORMANCE_META = {
  EXCELLENT: { label: 'Excellent', color: '#0EA472' },
  GOOD: { label: 'Good', color: '#1677FF' },
  AVERAGE: { label: 'Average', color: '#EA580C' },
  POOR: { label: 'Poor', color: '#EF4444' },
};
