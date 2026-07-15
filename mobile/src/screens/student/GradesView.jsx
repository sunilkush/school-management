import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ExamResultsSection } from '../exams/ExamResultsSection';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyExamResultsQuery } from '../../store/api/apiSlice';

/** Report card — mirrors frontend/src/pages/Student/Grades/StudentGrades.jsx. Same ExamResult
 * data as the Exams tab's Results section (identical model/endpoint), just its own dedicated
 * destination with a pass/fail count summary row like the web page has. */
export function GradesView() {
  const { colors } = useAppTheme();
  const resultsQuery = useGetMyExamResultsQuery();
  const results = resultsQuery.data ?? [];

  const stats = useMemo(() => {
    const passed = results.filter((r) => r.resultStatus === 'PASS').length;
    const failed = results.filter((r) => r.resultStatus === 'FAIL').length;
    return { total: results.length, passed, failed };
  }, [results]);

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: 16 }}>
        <StatGrid>
          <StatCard label="Results" metric={{ label: 'Results', icon: 'file-chart-outline', color: colors.primary, value: stats.total }} />
          <StatCard label="Passed" metric={{ label: 'Passed', icon: 'check-circle-outline', color: colors.success, value: stats.passed }} />
          <StatCard label="Failed" metric={{ label: 'Failed', icon: 'close-circle-outline', color: colors.danger, value: stats.failed }} />
        </StatGrid>
      </View>

      <ExamResultsSection query={resultsQuery} />
    </ScreenContainer>
  );
}
