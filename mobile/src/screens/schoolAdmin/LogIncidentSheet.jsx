import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useCreateIncidentMutation,
} from '../../store/api/apiSlice';

const CATEGORIES = ['Attendance', 'Behavior', 'Academic Integrity', 'Property Damage', 'Bullying', 'Other'];
const SEVERITIES = ['Minor', 'Moderate', 'Major'];

/** Same class → section → student picker as Health Records / Certificates — School Admin/
 * Principal/Vice Principal/Teacher only, per the shared class/section/roll-number endpoints' role
 * gates. Class Teacher also has this nav item but is NOT in those endpoints' role gates either
 * (only "Teacher" is) — a real pre-existing gap, same class of issue flagged in Batch 1. */
export function LogIncidentSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  const academicYearId = user?.academicYear?._id;

  const [schoolClassId, setSchoolClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');

  const [category, setCategory] = useState('Behavior');
  const [severity, setSeverity] = useState('Minor');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [demeritPoints, setDemeritPoints] = useState('');
  const [parentMeetingRequired, setParentMeetingRequired] = useState(false);
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const [createIncident, createState] = useCreateIncidentMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setStudentId(null); setStudentName('');
      setCategory('Behavior'); setSeverity('Minor'); setDescription(''); setActionTaken('');
      setDemeritPoints(''); setParentMeetingRequired(false); setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentId) { setError('Select a student'); return; }
    if (!description.trim()) { setError('Describe the incident'); return; }
    try {
      await createIncident({
        studentId,
        category,
        severity,
        description: description.trim(),
        actionTaken: actionTaken.trim(),
        demeritPoints: demeritPoints ? Number(demeritPoints) : 0,
        parentMeetingRequired,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to record incident');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Log Discipline Incident</Text>

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
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}>
                {CATEGORIES.map((c) => <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>{c}</Chip>)}
              </ScrollView>

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SEVERITY</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                {SEVERITIES.map((s) => <Chip key={s} selected={s === severity} onPress={() => setSeverity(s)}>{s}</Chip>)}
              </View>

              <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />
              <TextInput label="Action taken (optional)" value={actionTaken} onChangeText={setActionTaken} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />
              <TextInput label="Demerit points (optional)" value={demeritPoints} onChangeText={setDemeritPoints} mode="outlined" keyboardType="number-pad" style={{ marginBottom: spacing.sm }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Text style={[typography.body, { color: colors.text }]}>Parent meeting required</Text>
                <Switch value={parentMeetingRequired} onValueChange={setParentMeetingRequired} />
              </View>

              {(severity === 'Moderate' || severity === 'Major') && (
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
                  Parents will be auto-notified for {severity.toLowerCase()} incidents.
                </Text>
              )}
            </>
          )}

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading || !studentId} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
