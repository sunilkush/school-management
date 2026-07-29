import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSchoolClassDetailsQuery,
  useCreatePTMSessionMutation,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Class → section picker (no student needed — a PTM session is scheduled for a whole
 * class-section, individual parents book their own slot within it). Same class list as the other
 * sheets in this batch — School Admin/Principal/Vice Principal/Teacher/Class Teacher, matching
 * ptm.routes.js's own PTM_STAFF_ROLES. */
export function CreatePTMSessionSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [schoolClassId, setSchoolClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('10');
  const [location, setLocation] = useState('');
  const [error, setError] = useState(null);

  const classesQuery = useGetSchoolClassDetailsQuery({ schoolId, academicYearId }, { skip: !visible || !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const sections = useMemo(() => classes.find((c) => c._id === schoolClassId)?.sections ?? [], [classes, schoolClassId]);

  const [createSession, createState] = useCreatePTMSessionMutation();

  useEffect(() => {
    if (visible) {
      setSchoolClassId(null); setSectionId(null); setTitle(''); setDate(''); setStartTime('');
      setEndTime(''); setSlotDuration('10'); setLocation(''); setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!schoolClassId || !sectionId) { setError('Select a class and section'); return; }
    if (!title.trim()) { setError('Enter a title'); return; }
    if (!DATE_PATTERN.test(date)) { setError('Enter a valid date (YYYY-MM-DD)'); return; }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) { setError('Enter valid start/end times (HH:MM, 24-hour)'); return; }

    const startISO = new Date(`${date}T${startTime}:00`).toISOString();
    const endISO = new Date(`${date}T${endTime}:00`).toISOString();

    try {
      await createSession({
        title: title.trim(),
        schoolClassId,
        sectionId,
        date,
        startTime: startISO,
        endTime: endISO,
        slotDurationMinutes: slotDuration ? Number(slotDuration) : 10,
        location: location.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create session');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New PTM Session</Text>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md, alignItems: 'center' }}>
              {classes.map((c) => (
                <Chip key={c._id} selected={c._id === schoolClassId} onPress={() => { setSchoolClassId(c._id); setSectionId(null); }}>{c.name}</Chip>
              ))}
            </ScrollView>

            {schoolClassId && (
              <>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SECTION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md, alignItems: 'center' }}>
                  {sections.map((s) => {
                    const secId = s.sectionId?._id ?? s.sectionId ?? s._id;
                    const secName = s.sectionId?.name ?? s.name;
                    return <Chip key={secId} selected={secId === sectionId} onPress={() => setSectionId(secId)}>{secName}</Chip>;
                  })}
                </ScrollView>
              </>
            )}
          </QueryState>

          <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            <TextInput label="Start (HH:MM)" value={startTime} onChangeText={setStartTime} mode="outlined" style={{ flex: 1 }} />
            <TextInput label="End (HH:MM)" value={endTime} onChangeText={setEndTime} mode="outlined" style={{ flex: 1 }} />
          </View>
          <TextInput label="Slot duration (minutes)" value={slotDuration} onChangeText={setSlotDuration} mode="outlined" keyboardType="number-pad" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Location (optional)" value={location} onChangeText={setLocation} mode="outlined" style={{ marginBottom: spacing.md }} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Create
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
