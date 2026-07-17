import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useMarkAsAlumniMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

/** Same class → section → student picker as the other batches — Alumni's ALUMNI_ROLES (Super
 * Admin/School Admin/Principal/Vice Principal) match the class/section/roll-number endpoints'
 * role gates exactly, so unlike Health Records/Sports/Discipline there's no permission gap here. */
export function MarkAlumniSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [schoolClassId, setSchoolClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [graduationYear, setGraduationYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const [markAsAlumni, markState] = useMarkAsAlumniMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setStudentId(null); setStudentName('');
      setGraduationYear(String(new Date().getFullYear())); setError(null);
    }
  }, [visible]);

  const handleMark = async () => {
    if (!studentId) { setError('Select a student'); return; }
    if (!graduationYear.trim()) { setError('Enter a graduation year'); return; }
    try {
      await markAsAlumni({ studentId, graduationYear: Number(graduationYear) }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to mark as alumni');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Mark as Alumni</Text>

          <QueryState
            isLoading={classesQuery.isLoading}
            isError={classesQuery.isError}
            error={classesQuery.error}
            onRetry={classesQuery.refetch}
            isEmpty={classes.length === 0}
            emptyIcon="google-classroom"
            emptyLabel="No classes available for your role"
          >
            {!studentId ? (
              <>
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
                        <Chip key={s.studentId} icon="account-outline" onPress={() => { setStudentId(s.studentId); setStudentName(s.studentName); }}>
                          {s.studentName} {s.rollNumber ? `· Roll ${s.rollNumber}` : ''}
                        </Chip>
                      ))}
                    </View>
                  </QueryState>
                )}
              </>
            ) : (
              <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{studentName}</Text>
                <Button compact onPress={() => setStudentId(null)}>Change</Button>
              </View>
            )}
          </QueryState>

          {studentId && (
            <TextInput label="Graduation year" value={graduationYear} onChangeText={setGraduationYear} mode="outlined" keyboardType="number-pad" style={{ marginBottom: spacing.md }} />
          )}

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={markState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleMark} loading={markState.isLoading} disabled={markState.isLoading || !studentId} style={{ flex: 1 }}>
              Mark as Alumni
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
