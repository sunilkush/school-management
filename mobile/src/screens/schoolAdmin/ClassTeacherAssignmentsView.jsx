import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetAcademicYearsBySchoolQuery,
  useGetSchoolClassesQuery,
  useGetAllUsersQuery,
  useAssignClassTeacherMutation,
} from '../../store/api/apiSlice';

// Class names are plain strings like "Class 10", "Nursery", "UKG" — a plain alphabetical sort
// would put "Class 10" before "Class 2". Pre-primary names get a fixed rank ahead of any numbered
// class (matching real school progression); numbered classes sort on the number they contain;
// anything unrecognized falls back to alphabetical, after the numbered classes. Mirrors the same
// comparator added to the web app's class-teacher screens.
const PRE_PRIMARY_RANK = { 'pre-nursery': 0, playgroup: 1, nursery: 2, lkg: 3, kg: 3, ukg: 4 };

function classSortKey(name) {
  const n = (name || '').trim().toLowerCase();
  if (n in PRE_PRIMARY_RANK) return PRE_PRIMARY_RANK[n];
  const match = n.match(/(\d+)/);
  if (match) return 100 + Number(match[1]);
  return 9999;
}

function compareClassNames(a, b) {
  const diff = classSortKey(a) - classSortKey(b);
  return diff !== 0 ? diff : (a || '').localeCompare(b || '');
}

/** Assign (or reassign) a section's class teacher — covers the web sidebar's "Class Teacher
 * Assignments" item via POST /sections/assign-teacher. Pick a class, then a section, then a
 * teacher from the school's teacher directory. Class/section lists are scoped to the school's
 * active academic year — matching web's fetchActiveAcademicYear behavior — rather than trusting
 * user.academicYear off the profile, which isn't guaranteed to be the currently-active session and
 * left the class list unscoped (or scoped to a stale year) when it wasn't. */
export function ClassTeacherAssignmentsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;

  const yearsQuery = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const years = yearsQuery.data ?? [];
  const activeYear = years.find((y) => y.isActive);
  const academicYearId = activeYear?._id;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [snackbar, setSnackbar] = useState('');

  const classesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const classesRaw = classesQuery.data ?? [];
  const classes = useMemo(
    () => [...classesRaw].sort((a, b) => compareClassNames(a.name, b.name)),
    [classesRaw]
  );
  const selectedClass = classes.find((c) => c._id === classId);
  const sectionsRaw = selectedClass?.sections ?? [];
  const sections = useMemo(
    () => [...sectionsRaw].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [sectionsRaw]
  );
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

  const handleUnassign = async () => {
    try {
      await assignClassTeacher({ sectionId, teacherId: null }).unwrap();
      setSnackbar('Class teacher removed');
    } catch (err) {
      setSnackbar(err?.data?.message || 'Failed to remove class teacher');
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-tie-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Class Teacher Assignments</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {activeYear?.name ? `Active session: ${activeYear.name}` : 'Assign a teacher as class in-charge'}
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={yearsQuery.isLoading || classesQuery.isLoading}
        isError={yearsQuery.isError || classesQuery.isError}
        error={yearsQuery.error || classesQuery.error}
        onRetry={() => { yearsQuery.refetch(); classesQuery.refetch(); }}
        isEmpty={!yearsQuery.isLoading && (!activeYear || classes.length === 0)}
        emptyIcon="google-classroom"
        emptyLabel={!activeYear ? 'No active academic year set for this school yet' : 'No classes found for the active academic year'}
      >
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          {classes.map((c) => (
            <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {sections.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
              {sections.map((s) => (
                <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id)}>
                  {s.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {selectedSection && (
          <View style={{
            marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
          }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>CURRENT CLASS TEACHER</Text>
              <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]}>
                {selectedSection.teacher?.name ?? 'Unassigned'}
              </Text>
            </View>
            {selectedSection.teacher && (
              <Button mode="text" compact textColor={colors.danger} disabled={isAssigning} onPress={handleUnassign}>
                Unassign
              </Button>
            )}
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
