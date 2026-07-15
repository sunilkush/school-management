import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Snackbar, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { StatusPicker } from '../../components/ui/StatusPicker';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { avatarColorFor } from '../../theme/patterns';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetClassDetailsQuery, useGetStudentsByRoleQuery, useMarkBulkAttendanceMutation } from '../../store/api/apiSlice';
import { formatDateOnly } from '../../utils/format';

/** School-wide "Mark Attendance" — Principal (and other admin-attendance roles server-side) can
 * mark ANY class/section in the school, not just assigned ones like Teacher's own
 * TeacherMarkAttendanceView. Same markBulkAttendance mutation, classes sourced from
 * useGetClassDetailsQuery (all school classes) instead of useGetAssignedClassesQuery. */
export function PrincipalMarkAttendanceView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const schoolId = user?.school?._id;

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [date, setDate] = useState(() => new Date());
  const [statusByUser, setStatusByUser] = useState({});
  const [snackbar, setSnackbar] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const sections = selectedClass?.sections ?? [];

  const rosterQuery = useGetStudentsByRoleQuery(
    { schoolId, academicYearId, schoolClassId: selectedClassId },
    { skip: !selectedClassId || !academicYearId }
  );
  const roster = useMemo(
    () => (rosterQuery.data?.students ?? []).filter((enrollment) => enrollment.sectionId?._id === selectedSectionId),
    [rosterQuery.data, selectedSectionId]
  );
  const filteredRoster = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase();
    if (!query) return roster;
    return roster.filter((e) => e.studentId.userId.name?.toLowerCase().includes(query));
  }, [roster, rosterSearch]);

  const [markBulkAttendance, markState] = useMarkBulkAttendanceMutation();

  useEffect(() => {
    setStatusByUser(Object.fromEntries(roster.map((e) => [e.studentId.userId._id, 'present'])));
  }, [roster]);

  const shiftDay = (delta) => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));

  const handleSubmit = async () => {
    try {
      await markBulkAttendance({
        schoolId,
        date: formatDateOnly(date),
        role: 'student',
        schoolClassId: selectedClassId,
        sectionId: selectedSectionId,
        records: roster.map((e) => ({ userId: e.studentId.userId._id, status: statusByUser[e.studentId.userId._id] ?? 'present' })),
      }).unwrap();
      setSnackbar({ message: `Attendance saved for ${roster.length} students`, isError: false });
    } catch (err) {
      setSnackbar({ message: err?.message || 'Failed to save attendance', isError: true });
    }
  };

  if (!academicYearId) {
    return <QueryState isLoading={false} isError isEmpty={false} error={{ message: 'No active academic year on your profile yet.' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <QueryState
        isLoading={classesQuery.isLoading}
        isError={classesQuery.isError}
        error={classesQuery.error}
        onRetry={classesQuery.refetch}
        isEmpty={classes.length === 0}
        emptyIcon="google-classroom"
        emptyLabel="No classes found"
      >
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>CLASS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {classes.map((c) => (
            <Chip
              key={c._id}
              selected={c._id === selectedClassId}
              onPress={() => {
                setSelectedClassId(c._id);
                setSelectedSectionId(null);
                setRosterSearch('');
              }}
            >
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {selectedClass && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.sm }]}>SECTION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
              {sections.map((s) => (
                <Chip
                  key={s._id}
                  selected={s._id === selectedSectionId}
                  onPress={() => {
                    setSelectedSectionId(s._id);
                    setRosterSearch('');
                  }}
                >
                  {s.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {selectedSectionId && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
              <IconButton icon="chevron-left" onPress={() => shiftDay(-1)} />
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <IconButton icon="chevron-right" onPress={() => shiftDay(1)} disabled={formatDateOnly(date) === formatDateOnly(new Date())} />
            </View>

            <QueryState
              isLoading={rosterQuery.isLoading || rosterQuery.isFetching}
              isError={rosterQuery.isError}
              error={rosterQuery.error}
              onRetry={rosterQuery.refetch}
              isEmpty={roster.length === 0}
              emptyIcon="account-group-outline"
              emptyLabel="No students enrolled in this section yet"
            >
              {roster.length > 6 && (
                <SearchField
                  value={rosterSearch}
                  onChangeText={setRosterSearch}
                  placeholder="Search students"
                  style={{ marginTop: spacing.md }}
                />
              )}

              <QueryState
                isLoading={false}
                isError={false}
                isEmpty={filteredRoster.length === 0}
                emptyIcon="account-search-outline"
                emptyLabel={`No students match "${rosterSearch}"`}
              >
                <View style={{ marginTop: spacing.md }}>
                  {filteredRoster.map((enrollment) => {
                    const userId = enrollment.studentId.userId._id;
                    const name = enrollment.studentId.userId.name;
                    return (
                      <AccentListCard
                        key={enrollment._id}
                        accent={avatarColorFor(name).color}
                        avatar={<AvatarInitials name={name} size={38} />}
                        title={name}
                        badge={
                          <StatusPicker
                            value={statusByUser[userId] ?? 'present'}
                            onChange={(status) => setStatusByUser((prev) => ({ ...prev, [userId]: status }))}
                          />
                        }
                      />
                    );
                  })}
                </View>
              </QueryState>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={markState.isLoading}
                disabled={markState.isLoading}
                style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
              >
                Save Attendance
              </Button>
            </QueryState>
          </>
        )}
      </QueryState>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={3000} style={snackbar?.isError ? { backgroundColor: colors.danger } : undefined}>
        {snackbar?.message}
      </Snackbar>
    </View>
  );
}
