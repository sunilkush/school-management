import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetAllSchoolsQuery, useGetClassDetailsQuery, useGetSectionsQuery } from '../store/api/apiSlice';

/** Read-only class/section explorer across any school — a student-of-Classes index distinct from
 * the Classes screen's own subject-teacher view. Mirrors frontend's ClassSectionList.jsx. */
export function ClassSectionsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [schoolId, setSchoolId] = useState(null);
  const [classId, setClassId] = useState(null);

  const schoolsQuery = useGetAllSchoolsQuery({});
  const schools = schoolsQuery.data?.schools ?? [];

  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];

  const sectionsQuery = useGetSectionsQuery(
    { schoolId, academicYearId, schoolClassId: classId || undefined },
    { skip: !schoolId || !academicYearId }
  );
  const sections = sectionsQuery.data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="view-grid-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Class Sections</Text>
        </View>
      </View>

      <QueryState isLoading={schoolsQuery.isLoading} isError={schoolsQuery.isError} error={schoolsQuery.error} onRetry={schoolsQuery.refetch} isEmpty={schools.length === 0} emptyIcon="domain" emptyLabel="No schools found">
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {schools.map((s) => (
            <Chip key={s._id} selected={s._id === schoolId} onPress={() => { setSchoolId(s._id); setClassId(null); }}>
              {s.name}
            </Chip>
          ))}
        </ScrollView>

        {schoolId && classes.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CLASS (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
              <Chip selected={!classId} onPress={() => setClassId(null)}>
                All Classes
              </Chip>
              {classes.map((c) => (
                <Chip key={c._id} selected={c._id === classId} onPress={() => setClassId(c._id)}>
                  {c.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {schoolId && (
          <QueryState
            isLoading={activeYearQuery.isLoading || sectionsQuery.isLoading || sectionsQuery.isFetching}
            isError={sectionsQuery.isError}
            error={sectionsQuery.error}
            onRetry={sectionsQuery.refetch}
            isEmpty={sections.length === 0}
            emptyIcon="view-grid-outline"
            emptyLabel="No sections found for this school"
          >
            {sections.map((s) => (
              <AccentListCard
                key={s._id}
                accent={colors.primary}
                avatar={<IconWell icon="view-grid-outline" color={colors.primary} size={38} />}
                title={`${s.schoolClassId?.name ?? ''} ${s.name}`}
                subtitle={s.classTeacherId?.name ? `Class Teacher: ${s.classTeacherId.name}` : 'No class teacher assigned'}
                meta={[{ label: 'Capacity', value: s.capacity ?? '—' }]}
              />
            ))}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
