// backend/src/models/StudentEnrollment.model.js status enum: ["Active","Promoted","Transferred","Alumni","Inactive"]
export const STUDENT_STATUS_COLORS = {
  active: '#22C55E',
  promoted: '#2563EB',
  transferred: '#F59E0B',
  alumni: '#7C3AED',
  inactive: '#94A3B8',
};

export function studentStatusColor(status, fallback = '#94A3B8') {
  return STUDENT_STATUS_COLORS[status?.toLowerCase()] ?? fallback;
}
