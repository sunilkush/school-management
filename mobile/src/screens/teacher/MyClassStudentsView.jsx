import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetAssignedClassesQuery, useGetStudentsBySchoolQuery } from '../../store/api/apiSlice';

/** Class-teacher-only view — mirrors frontend's MyStudents.jsx exactly: only shows students in
 * sections where this user is the assigned class teacher (Section.classTeacherId), not every
 * class they teach a subject in. Confirmed this is genuinely class-teacher-scoped on the web app
 * itself (its own UI literally shows a "Class Teacher View" tag), not a general roster browser —
 * a Sports Teacher/Lab Technician/etc. who isn't assigned as any section's class teacher will
 * correctly see the same "not assigned" empty state the web app shows. */
export function MyClassStudentsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [sectionId, setSectionId] = useState(null);

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];

  const classTeacherSections = useMemo(() => {
    const result = [];
    classes.forEach((cls) => {
      (cls.sections ?? []).forEach((sec) => {
        if (sec.isClassTeacher && sec.sectionId?._id) {
          result.push({
            key: `${cls._id}_${sec.sectionId._id}`,
            classId: cls._id,
            className: cls.name,
            sectionId: sec.sectionId._id,
            sectionName: sec.sectionId.name,
            studentCount: sec.studentCount ?? 0,
          });
        }
      });
    });
    return result;
  }, [classes]);

  const selectedSection = classTeacherSections.find((s) => s.sectionId === sectionId) ?? classTeacherSections[0] ?? null;

  const studentsQuery = useGetStudentsBySchoolQuery(
    { schoolId, academicYearId, sectionId: selectedSection?.sectionId },
    { skip: !selectedSection || !schoolId || !academicYearId }
  );
  const students = studentsQuery.data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-group-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>My Class Students</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Only sections where you are the class teacher
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={classesQuery.isLoading}
        isError={classesQuery.isError}
        error={classesQuery.error}
        onRetry={classesQuery.refetch}
        isEmpty={classTeacherSections.length === 0}
        emptyIcon="account-group-outline"
        emptyLabel="You haven't been assigned as a class teacher for any section yet"
      >
        {classTeacherSections.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
            {classTeacherSections.map((s) => (
              <Chip key={s.key} selected={s.sectionId === selectedSection?.sectionId} onPress={() => setSectionId(s.sectionId)}>
                {s.className} · {s.sectionName}
              </Chip>
            ))}
          </ScrollView>
        )}

        {selectedSection && (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{selectedSection.className} · {selectedSection.sectionName}</Text>
            <StatusPill label="Class Teacher" color={colors.primary} />
          </View>
        )}

        <QueryState
          isLoading={studentsQuery.isLoading || studentsQuery.isFetching}
          isError={studentsQuery.isError}
          error={studentsQuery.error}
          onRetry={studentsQuery.refetch}
          isEmpty={students.length === 0}
          emptyIcon="account-off-outline"
          emptyLabel="No students enrolled in this section yet"
        >
          {students.map((enrollment) => (
            <AccentListCard
              key={enrollment._id}
              accent={colors.primary}
              avatar={<AvatarInitials name={enrollment.user?.name} size={40} />}
              title={enrollment.user?.name ?? 'Unknown Student'}
              subtitle={enrollment.user?.email}
              meta={[
                { label: 'Roll No.', value: enrollment.rollNumber ?? '—' },
                { label: 'Class', value: `${enrollment.schoolClass?.name ?? '—'} · ${enrollment.section?.name ?? '—'}` },
              ]}
              expandable
            />
          ))}
        </QueryState>
      </QueryState>
    </ScreenContainer>
  );
}
