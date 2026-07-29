import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useGenerateCertificateMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

const CERTIFICATE_TYPES = ['Transfer Certificate', 'Bonafide Certificate', 'Character Certificate', 'Study Certificate'];

/** Same class → section → student picker as LogHealthVisitSheet (Health Records batch) — School
 * Admin/Principal/Vice Principal only, per GET /school-class/class-detailes + /student/
 * roll-numbers's own role gates. */
export function GenerateCertificateSheet({ visible, onDismiss, onCreated }) {
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

  const [certificateType, setCertificateType] = useState('Bonafide Certificate');
  const [purpose, setPurpose] = useState('');
  const [conduct, setConduct] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const [generateCertificate, genState] = useGenerateCertificateMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setStudentId(null); setStudentName('');
      setCertificateType('Bonafide Certificate'); setPurpose(''); setConduct(''); setReasonForLeaving(''); setRemarks('');
      setError(null);
    }
  }, [visible]);

  const isTransfer = certificateType === 'Transfer Certificate';

  const handleGenerate = async () => {
    if (!studentId) { setError('Select a student'); return; }
    if (!isTransfer && !purpose.trim()) { setError('Enter a purpose'); return; }
    try {
      await generateCertificate({
        studentId,
        certificateType,
        purpose: !isTransfer ? purpose.trim() : undefined,
        conduct: isTransfer ? conduct.trim() : undefined,
        reasonForLeaving: isTransfer ? reasonForLeaving.trim() : undefined,
        remarks: remarks.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to generate certificate');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Generate Certificate</Text>

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

          {studentId && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CERTIFICATE TYPE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
                {CERTIFICATE_TYPES.map((t) => (
                  <Chip key={t} selected={t === certificateType} onPress={() => setCertificateType(t)}>{t}</Chip>
                ))}
              </View>

              {isTransfer ? (
                <>
                  <TextInput label="Conduct" value={conduct} onChangeText={setConduct} mode="outlined" style={{ marginBottom: spacing.sm }} />
                  <TextInput label="Reason for leaving" value={reasonForLeaving} onChangeText={setReasonForLeaving} mode="outlined" style={{ marginBottom: spacing.sm }} />
                </>
              ) : (
                <TextInput label="Purpose" value={purpose} onChangeText={setPurpose} mode="outlined" style={{ marginBottom: spacing.sm }} />
              )}
              <TextInput label="Remarks (optional)" value={remarks} onChangeText={setRemarks} mode="outlined" multiline style={{ marginBottom: spacing.md }} />
            </>
          )}

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
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
