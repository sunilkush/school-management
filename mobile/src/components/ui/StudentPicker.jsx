import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { QueryState } from './QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetSchoolClassDetailsQuery, useGetClassRollNumbersQuery } from '../../store/api/apiSlice';

/**
 * Shared class → section → student chip picker, extracted after the same inline pattern was
 * written for Health Records, Certificates, ID Cards, Discipline, and Alumni's create sheets.
 * Backed by GET /school-class/class-detailes + GET /student/roll-numbers — gated to Super Admin/
 * School Admin/Principal/Vice Principal/Teacher server-side. Roles outside that set (Medical
 * Officer, Sports Teacher) will see this render a clean QueryState error rather than a crash —
 * that's a real pre-existing gap in those endpoints' own role lists, not a bug here.
 *
 * <StudentPicker enabled={visible} selectedId={studentId} selectedName={studentName}
 *                onSelect={(id, name) => ...} onClear={() => ...} />
 */
export function StudentPicker({ enabled = true, selectedId, selectedName, onSelect, onClear }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  const academicYearId = user?.academicYear?._id;

  const [schoolClassId, setSchoolClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !enabled || !!selectedId || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !enabled || !!selectedId || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  if (selectedId) {
    return (
      <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{selectedName}</Text>
        <Button compact onPress={() => { setSchoolClassId(null); setSectionId(null); onClear?.(); }}>Change</Button>
      </View>
    );
  }

  return (
    <QueryState
      isLoading={classesQuery.isLoading}
      isError={classesQuery.isError}
      error={classesQuery.error}
      onRetry={classesQuery.refetch}
      isEmpty={classes.length === 0}
      emptyIcon="google-classroom"
      emptyLabel="No classes available for your role"
    >
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}>
        {classes.map((c) => (
          <Chip key={c._id} selected={c._id === schoolClassId} onPress={() => { setSchoolClassId(c._id); setSectionId(null); }}>{c.name}</Chip>
        ))}
      </ScrollView>

      {schoolClassId && (
        <>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SECTION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}>
            {sections.map((s) => {
              const secId = s.sectionId?._id ?? s.sectionId ?? s._id;
              const secName = s.sectionId?.name ?? s.name;
              return <Chip key={secId} selected={secId === sectionId} onPress={() => setSectionId(secId)}>{secName}</Chip>;
            })}
          </ScrollView>
        </>
      )}

      {sectionId && (
        <QueryState
          isLoading={rollQuery.isLoading}
          isError={rollQuery.isError}
          error={rollQuery.error}
          onRetry={rollQuery.refetch}
          isEmpty={students.length === 0}
          emptyIcon="account-off-outline"
          emptyLabel="No students enrolled in this section"
        >
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STUDENT</Text>
          <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
            {students.map((s) => (
              <Chip key={s.studentId} icon="account-outline" onPress={() => onSelect?.(s.studentId, s.studentName)}>
                {s.studentName} {s.rollNumber ? `· Roll ${s.rollNumber}` : ''}
              </Chip>
            ))}
          </View>
        </QueryState>
      )}
    </QueryState>
  );
}
