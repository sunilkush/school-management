import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useAssignFeesToStudentsMutation,
  useGetActiveAcademicYearQuery,
  useGetClassDetailsQuery,
  useGetFeeStructuresQuery,
  useGetStudentsByRoleQuery,
} from '../../store/api/apiSlice';

/** Assign a Fee Structure to every student currently enrolled in a class (optionally narrowed to
 * one section) — mirrors the "Bulk" mode of
 * frontend/src/pages/School_Admin/Fees_Management/AssignStudentFeeForm.jsx. The assign endpoint
 * only takes explicit student ids, so the class/section roster is resolved client-side first via
 * GET /student/by-role, same as the web app does. */
export function AssignFeesView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [feeStructureIds, setFeeStructureIds] = useState([]);
  const [snackbar, setSnackbar] = useState('');

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const structuresQuery = useGetFeeStructuresQuery({ schoolId, academicYearId, schoolClassId: classId }, { skip: !schoolId || !classId });
  const structures = structuresQuery.data ?? [];

  const studentsQuery = useGetStudentsByRoleQuery({ schoolId, academicYearId, schoolClassId: classId }, { skip: !schoolId || !classId });
  const enrollments = studentsQuery.data?.students ?? [];
  const roster = sectionId ? enrollments.filter((e) => e.sectionId?._id === sectionId) : enrollments;

  const [assignFees, { isLoading: isAssigning }] = useAssignFeesToStudentsMutation();

  const toggleStructure = (id) => {
    setFeeStructureIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleAssign = async () => {
    if (!classId || feeStructureIds.length === 0) {
      setSnackbar('Pick a class and at least one fee structure');
      return;
    }
    const studentIds = roster.map((e) => e.studentId?._id).filter(Boolean);
    if (studentIds.length === 0) {
      setSnackbar('No enrolled students found for this class/section');
      return;
    }
    try {
      const results = await Promise.all(
        feeStructureIds.map((feeStructureId) =>
          assignFees({ feeStructureId, academicYearId, schoolId, studentIds }).unwrap()
        )
      );
      const assignedCount = results.reduce((sum, r) => sum + (r?.assignedCount ?? 0), 0);
      setSnackbar(`Assigned to ${assignedCount} student(s)`);
      setFeeStructureIds([]);
    } catch (err) {
      setSnackbar(err?.data?.message || 'Failed to assign fees');
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-plus" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Assign Fees</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Bulk-assign a fee structure to a class or section
          </Text>
        </View>
      </View>

      <Panel>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); setFeeStructureIds([]); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          {sections.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
                {sections.map((s) => (
                  <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id === sectionId ? null : s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}
        </QueryState>
      </Panel>

      {classId && (
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Students in Selection" metric={{ value: studentsQuery.isLoading ? '…' : roster.length, icon: 'account-group-outline', color: colors.primary }} />
            <StatCard label="Structures Selected" metric={{ value: feeStructureIds.length, icon: 'file-table-outline', color: colors.success }} />
          </StatGrid>
        </View>
      )}

      {classId && (
        <Panel>
          <QueryState
            isLoading={structuresQuery.isLoading}
            isError={structuresQuery.isError}
            error={structuresQuery.error}
            onRetry={structuresQuery.refetch}
            isEmpty={structures.length === 0}
            emptyIcon="file-table-outline"
            emptyLabel="No fee structures set up for this class yet"
          >
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
              FEE STRUCTURES ({feeStructureIds.length} selected)
            </Text>
            <View style={{ gap: spacing.xs }}>
              {structures.map((fs) => (
                <Chip
                  key={fs._id}
                  selected={feeStructureIds.includes(fs._id)}
                  onPress={() => toggleStructure(fs._id)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {fs.feeHeadId?.name} · ₹{fs.amount} ({fs.frequency})
                </Chip>
              ))}
            </View>
          </QueryState>
        </Panel>
      )}

      {classId && structures.length > 0 && (
        <Button mode="contained" onPress={handleAssign} loading={isAssigning} disabled={isAssigning || roster.length === 0} style={{ marginBottom: spacing.xl }}>
          Assign to {roster.length} Student(s)
        </Button>
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}
