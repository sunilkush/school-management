import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassesQuery,
  useGetAllUsersQuery,
  useAssignClassTeacherMutation,
} from '../../store/api/apiSlice';

/** Assign (or reassign) a section's class teacher — covers the web sidebar's "Class Teacher
 * Assignments" item via POST /sections/assign-teacher. Pick a class, then a section, then a
 * teacher from the school's teacher directory. */
export function ClassTeacherAssignmentsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [snackbar, setSnackbar] = useState('');

  const classesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];
  const selectedSection = sections.find((s) => s._id === sectionId);

  const teachersQuery = useGetAllUsersQuery({ schoolId, academicYearId, roleName: 'Teacher' }, { skip: !schoolId });
  const teachers = teachersQuery.data ?? [];

  const [assignClassTeacher, { isLoading: isAssigning }] = useAssignClassTeacherMutation();

  const handleAssign = async (teacherId) => {
    try {
      await assignClassTeacher({ sectionId, teacherId }).unwrap();
      setSnackbar('Class teacher assigned');
    } catch (err) {
      setSnackbar(err?.data?.message || 'Failed to assign class teacher');
    }
  };

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={classesQuery.isLoading}
        isError={classesQuery.isError}
        error={classesQuery.error}
        onRetry={classesQuery.refetch}
        isEmpty={classes.length === 0}
        emptyIcon="google-classroom"
        emptyLabel="No classes found"
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
                <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id)}>
                  {s.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {selectedSection && (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>CURRENT CLASS TEACHER</Text>
            <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]}>
              {selectedSection.teacher?.name ?? 'Unassigned'}
            </Text>
          </View>
        )}

        {sectionId && (
          <QueryState
            isLoading={teachersQuery.isLoading}
            isError={teachersQuery.isError}
            error={teachersQuery.error}
            onRetry={teachersQuery.refetch}
            isEmpty={teachers.length === 0}
            emptyIcon="account-tie-outline"
            emptyLabel="No teachers found"
          >
            {teachers.map((t) => (
              <AccentListCard
                key={t._id}
                accent={t._id === selectedSection?.teacher?._id ? colors.success : colors.primary}
                avatar={<AvatarInitials name={t.name} size={38} />}
                title={t.name}
                subtitle={t.email}
                badge={
                  <Button
                    mode={t._id === selectedSection?.teacher?._id ? 'outlined' : 'contained'}
                    compact
                    disabled={isAssigning || t._id === selectedSection?.teacher?._id}
                    onPress={() => handleAssign(t._id)}
                  >
                    {t._id === selectedSection?.teacher?._id ? 'Assigned' : 'Assign'}
                  </Button>
                }
              />
            ))}
          </QueryState>
        )}
      </QueryState>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}
