import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { formatDate } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetExamReportsQuery, useGetExamsQuery } from '../store/api/apiSlice';

const STATUS_COLOR = { Pass: '#22C55E', Fail: '#EF4444' };
const TYPE_OPTIONS = [null, 'pass', 'fail'];

/** Per-student, per-attempt online-exam report — mirrors frontend's Exam Report page
 * (ExamReport.jsx), a row-list view distinct from Teacher's single-exam aggregate summary
 * (ExamReportsView.jsx). Both read the same ExamAttempt data. */
export function AcademicReportsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [examId, setExamId] = useState(null);
  const [type, setType] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetExamReportsQuery({ examId: examId || undefined, type: type || undefined });
  const reports = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="school-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Academic Reports</Text>
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EXAM (optional)</Text>
      <QueryState isLoading={examsQuery.isLoading} isError={examsQuery.isError} error={examsQuery.error} onRetry={examsQuery.refetch} isEmpty={exams.length === 0} emptyIcon="pencil-box-outline" emptyLabel="No exams available yet">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          <Chip selected={!examId} onPress={() => setExamId(null)}>
            All Exams
          </Chip>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
          {TYPE_OPTIONS.map((t) => (
            <Chip key={t || 'all'} selected={type === t} onPress={() => setType(t)}>
              {t ? t[0].toUpperCase() + t.slice(1) : 'All'}
            </Chip>
          ))}
        </ScrollView>

        <QueryState
          isLoading={isLoading || isFetching}
          isError={isError}
          error={error}
          onRetry={refetch}
          isEmpty={reports.length === 0}
          emptyIcon="file-chart-outline"
          emptyLabel="No exam attempts recorded yet"
        >
          {reports.map((r) => (
            <AccentListCard
              key={r._id}
              accent={STATUS_COLOR[r.status] || colors.primary}
              avatar={<AvatarInitials name={r.studentName} size={40} />}
              title={r.studentName}
              subtitle={r.examTitle}
              badge={<StatusPill label={r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />}
              meta={[
                { label: 'Score', value: `${r.score}/${r.totalMarks} (${r.percentage}%)` },
                { label: 'Exam Date', value: formatDate(r.examDate) },
                { label: 'Email', value: r.studentEmail },
              ]}
              expandable
            />
          ))}
        </QueryState>
      </QueryState>
    </ScreenContainer>
  );
}
