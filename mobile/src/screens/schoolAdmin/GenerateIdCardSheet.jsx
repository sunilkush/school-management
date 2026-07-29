import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useGenerateIdCardMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

/** Same class → section → student picker as GenerateCertificateSheet. Employee ID cards
 * (holderType: "Employee") are out of scope — see apiSlice.js's ID Cards comment. */
export function GenerateIdCardSheet({ visible, onDismiss, onCreated }) {
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
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const [generateIdCard, genState] = useGenerateIdCardMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setStudentId(null); setStudentName(''); setError(null);
    }
  }, [visible]);

  const handleGenerate = async () => {
    if (!studentId) { setError('Select a student'); return; }
    try {
      await generateIdCard({ holderType: 'Student', holderId: studentId }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to generate ID card');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Generate Student ID Card</Text>

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md, alignItems: 'center' }}>
                  {classes.map((c) => (
                    <Chip key={c._id} selected={c._id === schoolClassId} onPress={() => { setSchoolClassId(c._id); setSectionId(null); }}>{c.name}</Chip>
                  ))}
                </ScrollView>

                {schoolClassId && (
                  <>
                    <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SECTION</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md, alignItems: 'center' }}>
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

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={genState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleGenerate} loading={genState.isLoading} disabled={genState.isLoading || !studentId} style={{ flex: 1 }}>
              Generate
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
