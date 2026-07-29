import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateLessonPlanMutation } from '../../store/api/apiSlice';

// Plain YYYY-MM-DD text field rather than a native date picker — same tradeoff as
// CreateHomeworkSheet (no @react-native-community/datetimepicker dependency in this app).
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function CreateLessonPlanSheet({ visible, onDismiss, onCreated, classes, academicYearId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createLessonPlan, createState] = useCreateLessonPlanMutation();

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [objectives, setObjectives] = useState('');
  const [content, setContent] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(null);
      setSectionId(null);
      setSubjectId(null);
      setTitle('');
      setObjectives('');
      setContent('');
      setPlannedDate('');
      setError(null);
    }
  }, [visible]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];
  const subjects = selectedClass?.subjects ?? [];

  const handleCreate = async () => {
    if (!classId || !subjectId || !title.trim() || !plannedDate.trim()) {
      setError('Class, subject, title and planned date are all required');
      return;
    }
    if (!DATE_PATTERN.test(plannedDate.trim())) {
      setError('Planned date must be in YYYY-MM-DD format');
      return;
    }

    try {
      await createLessonPlan({
        academicYearId,
        schoolClassId: classId,
        sectionId: sectionId || undefined,
        subjectId,
        title: title.trim(),
        objectives: objectives.trim(),
        content: content.trim(),
        plannedDate: plannedDate.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create lesson plan');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Lesson Plan</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); setSubjectId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          {sections.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {sections.map((s) => (
                  <Chip key={s.sectionId._id} selected={s.sectionId._id === sectionId} onPress={() => setSectionId(s.sectionId._id)}>
                    {s.sectionId.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {subjects.map((s) => (
              <Chip key={s.subjectId._id} selected={s.subjectId._id === subjectId} onPress={() => setSubjectId(s.subjectId._id)}>
                {s.subjectId.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Title" value={title} onChangeText={setTitle} style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />
          <FormField label="Objectives" value={objectives} onChangeText={setObjectives} multiline numberOfLines={2} disabled={createState.isLoading} />
          <FormField label="Content" value={content} onChangeText={setContent} multiline numberOfLines={3} disabled={createState.isLoading} />
          <FormField label="Planned Date (YYYY-MM-DD)" value={plannedDate} onChangeText={setPlannedDate} disabled={createState.isLoading} />

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
