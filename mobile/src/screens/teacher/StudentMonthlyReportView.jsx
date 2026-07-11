import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { avatarColorFor } from '../../theme/patterns';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAssignedClassesQuery, useGetMonthlyAttendanceReportQuery } from '../../store/api/apiSlice';

const now = new Date();

/** Per-student attendance % for the current month, for a class/section the teacher teaches —
 * GET /attendance/report/monthly defaults to this calendar month when no month/year is passed. */
export function StudentMonthlyReportView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const schoolId = user?.school?._id;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const reportQuery = useGetMonthlyAttendanceReportQuery(
    {
      schoolId,
      schoolClassId: classId,
      sectionId: sectionId || undefined,
      role: 'student',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    { skip: !classId || !sectionId }
  );
  const report = reportQuery.data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={classesQuery.isLoading}
        isError={classesQuery.isError}
        error={classesQuery.error}
        onRetry={classesQuery.refetch}
        isEmpty={classes.length === 0}
        emptyIcon="google-classroom"
        emptyLabel="No classes are assigned to you yet"
      >
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {classes.map((c) => (
            <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {sections.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
              {sections.map((s) => (
                <Chip key={s.sectionId._id} selected={s.sectionId._id === sectionId} onPress={() => setSectionId(s.sectionId._id)}>
                  {s.sectionId.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {sectionId && (
          <QueryState
            isLoading={reportQuery.isLoading || reportQuery.isFetching}
            isError={reportQuery.isError}
            error={reportQuery.error}
            onRetry={reportQuery.refetch}
            isEmpty={report.length === 0}
            emptyIcon="chart-bar"
            emptyLabel="No attendance records for this class/section this month"
          >
            {report.map((row) => (
              <AccentListCard
                key={row.userId}
                accent={row.attendancePercentage >= 75 ? colors.success : colors.danger}
                avatar={<AvatarInitials name={row.name} size={38} />}
                title={row.name}
                subtitle={`${row.presentDays}/${row.totalDays} days present`}
                badge={<StatusPill label={`${row.attendancePercentage}%`} color={row.attendancePercentage >= 75 ? colors.success : colors.danger} />}
              />
            ))}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
