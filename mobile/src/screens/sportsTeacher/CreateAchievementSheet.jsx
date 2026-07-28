import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useGetSportsTeamsQuery,
  useCreateAchievementMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

const LEVELS = ['School', 'District', 'State', 'National', 'International'];

/** Student achievements need the class → section → student picker — Sports Teacher is included in
 * that picker's role gates (schoolClass.routes.js READ_ROLES, student.routes.js /roll-numbers).
 * Team achievements only need a team, which Sports Teacher can always see either way. */
export function CreateAchievementSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [holderType, setHolderType] = useState('Student');
  const [schoolClassId, setSchoolClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [teamId, setTeamId] = useState(null);

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('School');
  const [position, setPosition] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || holderType !== 'Student' || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const rollQuery = useGetClassRollNumbersQuery(
    { schoolId, academicYearId, schoolClassId, sectionId },
    { skip: !visible || holderType !== 'Student' || !schoolClassId || !sectionId }
  );
  const students = rollQuery.data?.students ?? [];

  const teamsQuery = useGetSportsTeamsQuery(undefined, { skip: !visible || holderType !== 'Team' });
  const teams = teamsQuery.data ?? [];

  const [createAchievement, createState] = useCreateAchievementMutation();

  useEffect(() => {
    if (visible) {
      setHolderType('Student'); setSchoolClassId(null); setSectionId(null); setStudentId(null);
      setStudentName(''); setTeamId(null); setTitle(''); setLevel('School'); setPosition('');
      setEventName(''); setDescription(''); setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (holderType === 'Student' && !studentId) { setError('Select a student'); return; }
    if (holderType === 'Team' && !teamId) { setError('Select a team'); return; }
    if (!title.trim()) { setError('Enter a title'); return; }
    try {
      await createAchievement({
        holderType,
        studentId: holderType === 'Student' ? studentId : undefined,
        teamId: holderType === 'Team' ? teamId : undefined,
        title: title.trim(),
        level,
        position: position.trim(),
        eventName: eventName.trim(),
        description: description.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to record achievement');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Achievement</Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Chip selected={holderType === 'Student'} onPress={() => { setHolderType('Student'); setTeamId(null); }}>Student</Chip>
            <Chip selected={holderType === 'Team'} onPress={() => { setHolderType('Team'); setStudentId(null); }}>Team</Chip>
          </View>

          {holderType === 'Student' ? (
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
          ) : (
            <QueryState
              isLoading={teamsQuery.isLoading}
              isError={teamsQuery.isError}
              error={teamsQuery.error}
              onRetry={teamsQuery.refetch}
              isEmpty={teams.length === 0}
              emptyIcon="account-group-outline"
              emptyLabel="No teams created yet"
            >
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TEAM</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}>
                {teams.map((t) => (
                  <Chip key={t._id} selected={t._id === teamId} onPress={() => setTeamId(t._id)}>{t.name}</Chip>
                ))}
              </ScrollView>
            </QueryState>
          )}

          <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={{ marginBottom: spacing.sm }} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>LEVEL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            {LEVELS.map((l) => <Chip key={l} selected={l === level} onPress={() => setLevel(l)}>{l}</Chip>)}
          </ScrollView>

          <TextInput label="Position (e.g. 1st Place, optional)" value={position} onChangeText={setPosition} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Event name (optional)" value={eventName} onChangeText={setEventName} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Description (optional)" value={description} onChangeText={setDescription} mode="outlined" multiline style={{ marginBottom: spacing.md }} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>Save</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
