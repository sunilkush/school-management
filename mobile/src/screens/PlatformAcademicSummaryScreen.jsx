import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAcademicSummaryQuery, useGetAllSchoolsQuery } from '../store/api/apiSlice';

/** Platform-wide (or single-school) academic headcounts — Super Admin's own "Academic Reports"
 * page (frontend/src/pages/Super_Admin/Reports_&Analytics/AcademicReports.jsx), a totally
 * different component from Principal's own AcademicReports (an ExamAttempt per-student report)
 * despite the shared display name — see PlatformAcademicSummary in constants/roles.js. */
export function PlatformAcademicSummaryScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [schoolId, setSchoolId] = useState(null);

  const schoolsQuery = useGetAllSchoolsQuery({});
  const schools = schoolsQuery.data?.schools ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAcademicSummaryQuery(schoolId || undefined);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="school-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Academic Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {schoolId ? 'Single school' : 'Platform-wide'}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        <Chip selected={!schoolId} onPress={() => setSchoolId(null)}>
          All Schools
        </Chip>
        {schools.map((s) => (
          <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
            {s.name}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="school-outline"
        emptyLabel="No academic data available yet"
      >
        <StatGrid>
          <StatCard label="Students" metric={{ label: 'Students', icon: 'school-outline', color: '#0EA472', value: data?.totalStudents ?? 0 }} />
          <StatCard label="Teachers" metric={{ label: 'Teachers', icon: 'account-tie-outline', color: '#14B8A6', value: data?.totalTeachers ?? 0 }} />
          <StatCard label="Subjects" metric={{ label: 'Subjects', icon: 'book-open-variant', color: '#2563EB', value: data?.totalSubjects ?? 0 }} />
          <StatCard label="Exams" metric={{ label: 'Exams', icon: 'pencil-box-outline', color: '#7C3AED', value: data?.totalExams ?? 0 }} />
          {!schoolId && (
            <StatCard label="Schools" metric={{ label: 'Schools', icon: 'domain', color: '#F59E0B', value: data?.totalSchools ?? 0 }} />
          )}
        </StatGrid>
      </QueryState>
    </ScreenContainer>
  );
}
