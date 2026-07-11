import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTeacherHomeworkMutation, useGetSubjectsQuery } from '../../store/api/apiSlice';

/** Due date is a plain YYYY-MM-DD text field rather than a native date picker — adding one would
 * mean a new native dependency (@react-native-community/datetimepicker) not otherwise used in this
 * app; the field validates the format instead. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function CreateHomeworkSheet({ visible, onDismiss, onCreated, classes, academicYearId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const [createHomework, createState] = useCreateTeacherHomeworkMutation();

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(null);
      setSectionId(null);
      setSubjectId(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setError(null);
    }
  }, [visible]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const handleCreate = async () => {
    if (!classId || !subjectId || !title.trim() || !description.trim() || !dueDate.trim()) {
      setError('Class, subject, title, description and due date are all required');
      return;
    }
    if (!DATE_PATTERN.test(dueDate.trim())) {
      setError('Due date must be in YYYY-MM-DD format');
      return;
    }

    try {
      await createHomework({
        academicYearId,
        schoolClassId: classId,
        sectionId: sectionId || undefined,
        subjectId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create homework');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Homework</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          {sections.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
                {sections.map((s) => (
                  <Chip key={s.sectionId._id} selected={s.sectionId._id === sectionId} onPress={() => setSectionId(s.sectionId._id)}>
                    {s.sectionId.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {subjects.map((s) => (
              <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Title" value={title} onChangeText={setTitle} style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />
          <FormField label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} disabled={createState.isLoading} />

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
