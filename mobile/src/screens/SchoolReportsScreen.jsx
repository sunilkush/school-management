import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { Panel } from '../components/ui/Panel';
import { DonutChart } from '../components/charts/DonutChart';
import { STAT_COLORS } from '../theme/patterns';
import { roleColor } from '../utils/roleColors';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetAllSchoolsQuery, useGetSchoolReportQuery } from '../store/api/apiSlice';

function ChartTitle({ title }) {
  const { colors, typography, spacing } = useAppTheme();
  return <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>{title}</Text>;
}

/** Single-school drill-down report — mirrors frontend's SchoolReports.jsx: pick a school, resolve
 * its active academic year, then render the same GET /report/school/:id/academic-year/:id
 * overview report ReportsScreen.jsx already uses (School Admin/Principal/VP see it directly for
 * their own school; Super Admin picks which school first). */
export function SchoolReportsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [schoolId, setSchoolId] = useState(null);

  const schoolsQuery = useGetAllSchoolsQuery({});
  const schools = schoolsQuery.data?.schools ?? [];

  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const reportQuery = useGetSchoolReportQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const data = reportQuery.data;

  const roleWiseData = useMemo(
    () => (data?.roleWise ?? []).map((r, i) => ({ label: r._id ?? 'Unknown', value: r.count, color: roleColor(r._id, null) ?? STAT_COLORS[i % STAT_COLORS.length] })),
    [data]
  );

  const stats = [
    { key: 'students', label: 'Students', icon: 'school-outline', color: '#0EA472', value: data?.summary?.studentCount ?? 0 },
    { key: 'teachers', label: 'Teachers', icon: 'account-tie-outline', color: '#14B8A6', value: data?.summary?.teacherCount ?? 0 },
    { key: 'parents', label: 'Parents', icon: 'account-child-outline', color: '#7C3AED', value: data?.summary?.parentCount ?? 0 },
    { key: 'admins', label: 'Admins', icon: 'shield-account-outline', color: '#2563EB', value: data?.summary?.adminCount ?? 0 },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>School Reports</Text>
        </View>
      </View>

      <QueryState isLoading={schoolsQuery.isLoading} isError={schoolsQuery.isError} error={schoolsQuery.error} onRetry={schoolsQuery.refetch} isEmpty={schools.length === 0} emptyIcon="domain" emptyLabel="No schools found">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
          {schools.map((s) => (
            <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
              {s.name}
            </Chip>
          ))}
        </ScrollView>

        {schoolId && (
          <QueryState
            isLoading={activeYearQuery.isLoading || reportQuery.isLoading || reportQuery.isFetching}
            isError={reportQuery.isError}
            error={reportQuery.error}
            onRetry={reportQuery.refetch}
            isEmpty={!academicYearId || !data}
            emptyIcon="chart-box-outline"
            emptyLabel="No active academic year or report data for this school"
          >
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
              {data?.academicYear ?? 'Current'} Academic Year
            </Text>

            <View style={{ marginBottom: spacing.lg }}>
              <StatGrid>
                {stats.map((s) => (
                  <StatCard key={s.key} label={s.label} metric={s} />
                ))}
              </StatGrid>
            </View>

            {roleWiseData.length > 0 && (
              <Panel style={{ marginBottom: 0 }}>
                <ChartTitle title="Role Distribution" />
                <DonutChart data={roleWiseData} centerLabel="Users" />
              </Panel>
            )}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
