import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { TEACHING_ENTRY_TYPES, TIMETABLE_ENTRY_TYPES } from '../../utils/timetable';
import { useCreateTimetableEntryMutation, useUpdateTimetableEntryMutation } from '../../store/api/apiSlice';

/** Create or edit a single period. `context` = {day, timeSlot} for a new entry in an empty slot;
 * `entry` = an existing populated Timetable row for editing. The backend rejects overlapping
 * teacher/room bookings and duplicate class+section+day+slot combinations with a 409 — that error
 * message is surfaced directly rather than a generic "failed to save". */
export function PeriodEntrySheet({ visible, context, entry, onDismiss, onSaved, classId, sectionId, academicYearId, subjects, teachers, rooms }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createEntry, createState] = useCreateTimetableEntryMutation();
  const [updateEntry, updateState] = useUpdateTimetableEntryMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [type, setType] = useState('regular');
  const [subjectId, setSubjectId] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  const day = entry?.dayOfWeek ?? context?.day;
  const timeSlot = entry?.timeSlotId ?? context?.timeSlot;

  useEffect(() => {
    if (visible) {
      setType(entry?.type ?? 'regular');
      setSubjectId(entry?.subjectId?._id ?? null);
      setTeacherId(entry?.teacherId?._id ?? null);
      setRoomId(entry?.roomId?._id ?? null);
      setNote(entry?.note ?? '');
      setError(null);
    }
  }, [visible, entry]);

  const needsTeaching = TEACHING_ENTRY_TYPES.has(type);

  const handleSave = async () => {
    if (needsTeaching && (!subjectId || !teacherId)) {
      setError('Subject and teacher are required for this period type');
      return;
    }
    const payload = {
      academicYearId,
      schoolClassId: classId,
      sectionId,
      dayOfWeek: day,
      timeSlotId: timeSlot?._id,
      type,
      subjectId: needsTeaching ? subjectId : undefined,
      teacherId: needsTeaching ? teacherId : undefined,
      roomId: roomId || undefined,
      note: note.trim() || undefined,
    };

    try {
      if (entry) {
        await updateEntry({ id: entry._id, ...payload }).unwrap();
      } else {
        await createEntry(payload).unwrap();
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save period');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{entry ? 'Edit Period' : 'Add Period'}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
            {timeSlot?.name} · {timeSlot?.startTime} – {timeSlot?.endTime}
          </Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
            {TIMETABLE_ENTRY_TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </View>

          {needsTeaching && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {subjects.map((s) => (
                  <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TEACHER</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {teachers.map((t) => (
                  <Chip key={t._id} selected={t._id === teacherId} onPress={() => setTeacherId(t._id)}>
                    {t.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ROOM (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {rooms.map((r) => (
              <Chip key={r._id} selected={r._id === roomId} onPress={() => setRoomId(r._id === roomId ? null : r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Note (optional)" value={note} onChangeText={setNote} disabled={saving} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
