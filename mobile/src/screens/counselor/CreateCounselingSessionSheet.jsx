import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateCounselingSessionMutation } from '../../store/api/apiSlice';

const MOODS = ['Happy', 'Neutral', 'Anxious', 'Sad', 'Angry'];

export function CreateCounselingSessionSheet({ visible, type, title, issueLabel, dateLabel, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createSession, createState] = useCreateCounselingSessionMutation();

  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [issue, setIssue] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [duration, setDuration] = useState('30');
  const [mood, setMood] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStudentName('');
      setStudentClass('');
      setIssue('');
      setSessionDate('');
      setDuration('30');
      setMood(null);
      setNotes('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentName.trim() || !issue.trim() || !sessionDate.trim()) {
      setError(`Student name, ${issueLabel.toLowerCase()} and ${dateLabel.toLowerCase()} are all required`);
      return;
    }
    try {
      await createSession({
        type,
        studentName: studentName.trim(),
        studentClass: studentClass.trim() || undefined,
        issue: issue.trim(),
        sessionDate: sessionDate.trim(),
        duration: Number(duration) || 30,
        mood: mood || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{title}</Text>

          <FormField label="Student Name" value={studentName} onChangeText={setStudentName} disabled={createState.isLoading} />
          <FormField label="Class (optional)" value={studentClass} onChangeText={setStudentClass} disabled={createState.isLoading} />
          <FormField label={issueLabel} value={issue} onChangeText={setIssue} multiline numberOfLines={2} disabled={createState.isLoading} />
          <FormField label={`${dateLabel} (YYYY-MM-DD)`} value={sessionDate} onChangeText={setSessionDate} disabled={createState.isLoading} />
          <FormField label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>MOOD (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {MOODS.map((m) => (
              <Chip key={m} selected={m === mood} onPress={() => setMood(m === mood ? null : m)}>
                {m}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={2} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Create
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
