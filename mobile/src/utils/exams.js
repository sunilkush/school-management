// backend Exam.model.js status enum: ["draft","published","completed"]
export const EXAM_STATUS_META = {
  draft: { label: 'Draft', color: '#94A3B8' },
  published: { label: 'Published', color: '#2563EB' },
  completed: { label: 'Completed', color: '#22C55E' },
};

// backend ExamResult.model.js resultStatus enum: ["PASS","FAIL"]
export function resultStatusColor(resultStatus) {
  return resultStatus === 'PASS' ? '#22C55E' : '#EF4444';
}
