import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { formatDate, formatTime } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetExamAttemptByIdQuery } from '../../store/api/apiSlice';

const GRADE_COLOR = { 'A+': '#7C3AED', A: '#0891B2', B: '#15803D', C: '#B45309', D: '#DC2626', F: '#7F1D1D' };

const STATUS_META = {
  evaluated: { color: '#15803D', label: 'Evaluated' },
  submitted: { color: '#1D4ED8', label: 'Submitted' },
  in_progress: { color: '#B45309', label: 'In Progress' },
};

const resolveText = (ans, idx) => ans?.questionSnapshot?.statement || `Question ${idx + 1}`;
const resolveMaxMarks = (ans) => Number(ans?.questionSnapshot?.marks ?? 0) || 0;

const formatAnswer = (raw) => {
  if (raw === null || raw === undefined) return '—';
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ') || '—';
  if (typeof raw === 'object') return raw.text || raw.value || JSON.stringify(raw);
  return `${raw}`.trim() || '—';
};

/** Mobile port of web's AttemptReview.jsx — score summary + question-by-question breakdown for a
 * submitted/evaluated attempt (auto-graded questions show correct/incorrect immediately; subjective
 * ones stay "Pending" until a teacher evaluates them via web's Evaluation screen). */
export function AttemptReviewScreen({ route }) {
  const { colors, typography, spacing } = useAppTheme();
  const attemptId = route.params?.attemptId;
  const { data: attempt, isLoading, isFetching, isError, error, refetch } = useGetExamAttemptByIdQuery(attemptId, { skip: !attemptId });

  const answers = attempt?.answers ?? [];

  const stats = useMemo(() => {
    if (!attempt) return null;
    const evaled = answers.filter((a) => a?.isCorrect !== null && a?.isCorrect !== undefined);
    const correct = evaled.filter((a) => a.isCorrect).length;
    const answeredCount = answers.filter((a) => {
      const v = a?.response;
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && `${v}`.trim() !== '';
    }).length;
    const possible = answers.reduce((s, a) => s + resolveMaxMarks(a), 0);
    const obtained = Number(attempt?.totalMarksObtained ?? 0) || 0;
    const pct = possible ? Math.round((obtained / possible) * 100) : 0;
    return { total: answers.length, answered: answeredCount, correct, evaled: evaled.length, possible, obtained, pct };
  }, [attempt, answers]);

  if (!attemptId) {
    return (
      <ScreenContainer>
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="file-question-outline" emptyLabel="Attempt ID missing" />
      </ScreenContainer>
    );
  }

  const sm = STATUS_META[attempt?.status] ?? STATUS_META.submitted;
  const grade = attempt?.grade;
  const gc = GRADE_COLOR[grade] || colors.textMuted;
  const pct = stats?.pct ?? 0;

  return (
    <ScreenContainer scrollable>
      <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={!attempt}>
        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: spacing.lg, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.h3, { color: colors.text, flex: 1, minWidth: 0 }]} numberOfLines={1}>
              {attempt?.examId?.title || 'Exam'}
            </Text>
            <StatusPill label={sm.label} color={sm.color} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text }}>{pct}%</Text>
            {grade && (
              <View style={{ backgroundColor: `${gc}22`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 }}>
                <Text style={{ color: gc, fontWeight: '700', fontSize: 13 }}>Grade {grade}</Text>
              </View>
            )}
          </View>
          <ProgressBar progress={pct / 100} color={pct >= 60 ? colors.success : pct >= 40 ? colors.warning : colors.danger} style={{ height: 8, borderRadius: 4, marginBottom: spacing.xs }} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {stats?.obtained ?? 0} / {stats?.possible ?? 0} marks obtained
          </Text>
        </View>

        <StatGrid>
          <StatCard label="Questions" metric={{ value: stats?.total ?? 0, icon: 'file-document-outline' }} />
          <StatCard label="Answered" metric={{ value: stats?.answered ?? 0, icon: 'check-circle-outline' }} />
          <StatCard label="Correct" metric={{ value: `${stats?.correct ?? 0}/${stats?.evaled ?? 0}`, icon: 'trophy-outline' }} />
          <StatCard
            label="Submitted"
            metric={{ value: attempt?.submittedAt ? formatTime(attempt.submittedAt) : 'Pending', icon: 'clock-outline' }}
          />
        </StatGrid>

        <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Question-wise Review</Text>

        {answers.length === 0 ? (
          <QueryState isLoading={false} isError={false} isEmpty emptyIcon="file-document-outline" emptyLabel="No answers found" />
        ) : (
          answers.map((ans, i) => {
            const maxMks = resolveMaxMarks(ans);
            const gotMks = Number(ans?.marksObtained ?? 0) || 0;
            const hasEval = ans?.isCorrect !== null && ans?.isCorrect !== undefined;
            const correct = Boolean(ans?.isCorrect);
            const borderColor = hasEval ? (correct ? colors.success : colors.danger) : colors.border;

            return (
              <View
                key={ans?._id || i}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: hasEval ? borderColor : colors.border,
                  borderLeftWidth: 4,
                  borderLeftColor: borderColor,
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, flexWrap: 'wrap', gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.textOnPrimary, fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>
                    </View>
                    <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700' }]}>
                      {(ans?.questionSnapshot?.questionType || 'subjective').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>{gotMks} / {maxMks} marks</Text>
                    {hasEval ? (
                      <StatusPill label={correct ? 'Correct' : 'Incorrect'} color={correct ? colors.success : colors.danger} />
                    ) : (
                      <StatusPill label="Pending" color={colors.textMuted} />
                    )}
                    {ans?.flagged && <StatusPill label="Flagged" color={colors.warning} />}
                  </View>
                </View>

                <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>{resolveText(ans, i)}</Text>

                <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 8, padding: spacing.sm }}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>Your answer: </Text>
                    {formatAnswer(ans?.response)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {attempt?.submittedAt && (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }]}>
            Submitted {formatDate(attempt.submittedAt)} · {formatTime(attempt.submittedAt)}
          </Text>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
