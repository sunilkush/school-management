import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetExamAnalyticsQuery, useGetExamsQuery } from '../../store/api/apiSlice';

const RISK_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

/** Exam-level analytics — attempts, evaluation stats and a risk-level insight, distinct from
 * Teacher's ExamReports (online-attempt performance summary) and Evaluation (offline class-result
 * summary) screens; this hits its own GET /exams/:id/analytics endpoint. */
export function ExamAnalyticsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [examId, setExamId] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];

  const analyticsQuery = useGetExamAnalyticsQuery(examId, { skip: !examId });
  const analytics = analyticsQuery.data;

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EXAM</Text>
      <QueryState
        isLoading={examsQuery.isLoading}
        isError={examsQuery.isError}
        error={examsQuery.error}
        onRetry={examsQuery.refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams available yet"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        {examId && (
          <QueryState
            isLoading={analyticsQuery.isLoading || analyticsQuery.isFetching}
            isError={analyticsQuery.isError}
            error={analyticsQuery.error}
            onRetry={analyticsQuery.refetch}
            isEmpty={!analytics}
            emptyIcon="chart-bar"
            emptyLabel="No analytics available for this exam yet"
          >
            {analytics && (
              <>
                <View style={{ marginBottom: spacing.lg }}>
                  <StatGrid>
                    <StatCard label="Total Attempts" metric={{ label: 'Total Attempts', icon: 'account-multiple-outline', color: colors.primary, value: analytics.attempts?.total ?? 0 }} />
                    <StatCard label="Avg. Marks" metric={{ label: 'Avg. Marks', icon: 'chart-line', color: '#0891B2', value: analytics.evaluation?.averageObtainedMarks ?? 0 }} />
                    <StatCard label="Pass Rate" metric={{ label: 'Pass Rate', icon: 'check-circle-outline', color: '#22C55E', value: analytics.evaluation?.passPercentage ?? 0, suffix: '%' }} />
                  </StatGrid>
                </View>

                <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>Risk Level</Text>
                    <StatusPill
                      label={analytics.enterpriseInsights?.riskLevel ?? 'unknown'}
                      color={RISK_COLOR[analytics.enterpriseInsights?.riskLevel] || colors.textMuted}
                    />
                  </View>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {analytics.enterpriseInsights?.recommendation}
                  </Text>
                </View>
              </>
            )}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
