import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useCreateHealthVisitMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

const SEVERITIES = ['Minor', 'Moderate', 'Severe'];

/**
 * Class → Section → Student picker followed by the visit form. The picker queries
 * (GET /school-class/class-detailes, GET /student/roll-numbers) are gated to School Admin/
 * Principal/Vice Principal/Teacher server-side, not Medical Officer — see HealthRecordsView's own
 * header comment. A Medical Officer opening this sheet will see that gap surface honestly as a
 * QueryState error on the class list, rather than a silent crash.
 */
export function LogHealthVisitSheet({ visible, onDismiss, onCreated }) {
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

  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('Minor');
  const [temperature, setTemperature] = useState('');
  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [referredToHospital, setReferredToHospital] = useState(false);
  const [referredTo, setReferredTo] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const [createHealthVisit, createState] = useCreateHealthVisitMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setStudentId(null); setStudentName('');
      setSymptoms(''); setSeverity('Minor'); setTemperature(''); setTreatmentGiven('');
      setReferredToHospital(false); setReferredTo(''); setParentNotified(false); setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentId) { setError('Select a student'); return; }
    if (!symptoms.trim()) { setError('Describe the symptoms'); return; }
    try {
      await createHealthVisit({
        studentId,
        symptoms: symptoms.trim(),
        severity,
        temperature: temperature ? Number(temperature) : undefined,
        treatmentGiven: treatmentGiven.trim(),
        referredToHospital,
        referredTo: referredToHospital ? referredTo.trim() : '',
        parentNotified,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to record visit');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Log Clinic Visit</Text>

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
                        return (
                          <Chip key={secId} selected={secId === sectionId} onPress={() => setSectionId(secId)}>{secName}</Chip>
                        );
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
              <TextInput
                label="Symptoms"
                value={symptoms}
                onChangeText={setSymptoms}
                mode="outlined"
                multiline
                style={{ marginBottom: spacing.sm }}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SEVERITY</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                {SEVERITIES.map((s) => (
                  <Chip key={s} selected={s === severity} onPress={() => setSeverity(s)}>{s}</Chip>
                ))}
              </View>

              <TextInput
                label="Temperature (°F, optional)"
                value={temperature}
                onChangeText={setTemperature}
                mode="outlined"
                keyboardType="decimal-pad"
                style={{ marginBottom: spacing.sm }}
              />
              <TextInput
                label="Treatment given"
                value={treatmentGiven}
                onChangeText={setTreatmentGiven}
                mode="outlined"
                multiline
                style={{ marginBottom: spacing.sm }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text style={[typography.body, { color: colors.text }]}>Referred to hospital</Text>
                <Switch value={referredToHospital} onValueChange={setReferredToHospital} />
              </View>
              {referredToHospital && (
                <TextInput
                  label="Referred to (hospital/clinic)"
                  value={referredTo}
                  onChangeText={setReferredTo}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Text style={[typography.body, { color: colors.text }]}>Parent notified</Text>
                <Switch value={parentNotified} onValueChange={setParentNotified} />
              </View>
            </>
          )}

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading || !studentId} style={{ flex: 1 }}>
              Save Visit
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
