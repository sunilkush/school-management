import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetExamPerformanceSummaryQuery, useGetExamsQuery } from '../../store/api/apiSlice';

/** Performance summary over ExamAttempt records (the online exam-attempt track) — an exam with
 * no online attempts taken returns 404 server-side, shown here as an honest empty state rather
 * than an error, since most exams in this app are marked offline via Evaluation, not attempted
 * online. */
export function ExamReportsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [examId, setExamId] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];

  const summaryQuery = useGetExamPerformanceSummaryQuery(examId, { skip: !examId });
  const summary = summaryQuery.data;
  const noAttempts = summaryQuery.isError && summaryQuery.error?.status === 404;

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        {examId && (
          <QueryState
            isLoading={summaryQuery.isLoading || summaryQuery.isFetching}
            isError={summaryQuery.isError && !noAttempts}
            error={summaryQuery.error}
            onRetry={summaryQuery.refetch}
            isEmpty={noAttempts || !summary}
            emptyIcon="chart-bar"
            emptyLabel="No online exam attempts recorded for this exam yet"
          >
            {summary && (
              <Panel>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Total Attempts</Text>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{summary.totalAttempts}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Average Marks</Text>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{summary.avgMarks?.toFixed(1)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Highest</Text>
                  <Text style={[typography.bodyStrong, { color: colors.success }]}>{summary.highest}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>Lowest</Text>
                  <Text style={[typography.bodyStrong, { color: colors.danger }]}>{summary.lowest}</Text>
                </View>
              </Panel>
            )}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
