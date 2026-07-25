import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDate, formatTime } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Mirrors web's ExamCard (StudentExamsPage.jsx) window logic — when a published exam's
 * start/end window is actually open right now vs. upcoming/closed/unpublished. */
export function computeExamWindow(exam, now = new Date()) {
  if (exam?.status !== 'published') return { canStart: false, label: 'Not Published', color: '#64748B' };
  const s = exam.startTime ? new Date(exam.startTime) : null;
  const e = exam.endTime ? new Date(exam.endTime) : null;
  if (!s || Number.isNaN(s.getTime()) || !e || Number.isNaN(e.getTime())) {
    return { canStart: false, label: 'No Time Set', color: '#64748B' };
  }
  if (now < s) return { canStart: false, label: `Opens ${formatTime(s)}`, color: '#B45309' };
  if (now > e) return { canStart: false, label: 'Closed', color: '#DC2626' };
  return { canStart: true, label: 'Live Now', color: '#15803D' };
}

export function StudentExamCard({ exam, attempt, onStart, onResume, onReview, starting }) {
  const { spacing } = useAppTheme();
  const win = computeExamWindow(exam);
  const hasAttempt = Boolean(attempt);

  return (
    <AccentListCard
      accent={win.color}
      avatar={<IconWell icon="pencil-box-outline" color={win.color} size={38} />}
      title={exam.title || 'Untitled Exam'}
      subtitle={`${exam.subjectId?.name ?? 'Subject'} · ${formatDate(exam.examDate)}`}
      badge={<StatusPill label={win.label} color={win.color} />}
      meta={[
        { label: 'Window', value: exam.startTime && exam.endTime ? `${formatTime(exam.startTime)} – ${formatTime(exam.endTime)}` : '—' },
        { label: 'Marks', value: `${exam.totalMarks ?? 0} · Pass ${exam.passingMarks ?? 0}` },
        { label: 'Duration', value: `${exam.durationMinutes ?? 0} min` },
      ]}
      expandable
      actions={
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {hasAttempt ? (
            <>
              <Button mode="outlined" compact onPress={() => onReview(attempt._id)}>
                Review
              </Button>
              <Button mode="contained" compact icon="reload" onPress={() => onResume(attempt._id)}>
                Resume
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              compact
              icon="play-circle-outline"
              disabled={!win.canStart}
              loading={starting}
              onPress={() => onStart(exam._id)}
            >
              Start Exam
            </Button>
          )}
        </View>
      }
    />
  );
}
