import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { formatDateOnly } from '../../utils/format';
import {
  useCreateTeacherHomeworkMutation,
  useGetSubjectsQuery,
  useUpdateTeacherHomeworkMutation,
} from '../../store/api/apiSlice';

/** Due date is a plain YYYY-MM-DD text field rather than a native date picker — adding one would
 * mean a new native dependency (@react-native-community/datetimepicker) not otherwise used in this
 * app; the field validates the format instead. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Create AND edit — mirrors web's Assignments.jsx reusing one modal for both. Unlike web, the
 * edit path here only exposes Title/Description/Due Date: the backend's updateTeacherHomework
 * controller only ever reads those fields off req.body (plus attachments/status) — Class/Section/
 * Subject are silently ignored on update even though web's edit form still shows them as if
 * editable. Class/Section/Subject are shown read-only here instead of replicating that no-op. */
export function CreateHomeworkSheet({ visible, onDismiss, onCreated, classes, academicYearId, editing }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const [createHomework, createState] = useCreateTeacherHomeworkMutation();
  const [updateHomework, updateState] = useUpdateTeacherHomeworkMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(editing?.schoolClassId ?? null);
      setSectionId(editing?.sectionId ?? null);
      setSubjectId(editing?.subjectId ?? null);
      setTitle(editing?.title ?? '');
      setDescription(editing?.description ?? '');
      setDueDate(editing?.dueDate ? formatDateOnly(new Date(editing.dueDate)) : '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !dueDate.trim()) {
      setError('Title, description and due date are all required');
      return;
    }
    if (!DATE_PATTERN.test(dueDate.trim())) {
      setError('Due date must be in YYYY-MM-DD format');
      return;
    }

    try {
      if (editing) {
        await updateHomework({
          id: editing._id,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate.trim(),
        }).unwrap();
      } else {
        if (!classId || !subjectId) {
          setError('Class and subject are required');
          return;
        }
        await createHomework({
          academicYearId,
          schoolClassId: classId,
          sectionId: sectionId || undefined,
          subjectId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate.trim(),
        }).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || `Failed to ${editing ? 'update' : 'create'} homework`);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            {editing ? 'Edit Assignment' : 'New Homework'}
          </Text>

          {editing ? (
            <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {editing.class}{editing.section ? ` · ${editing.section}` : ''} · {editing.subject}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                Class, section and subject can't be changed after creation
              </Text>
            </View>
          ) : (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {classes.map((c) => (
                  <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
                    {c.name}
                  </Chip>
                ))}
              </ScrollView>

              {sections.length > 0 && (
                <>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                    {sections.map((s) => (
                      <Chip key={s.sectionId._id} selected={s.sectionId._id === sectionId} onPress={() => setSectionId(s.sectionId._id)}>
                        {s.sectionId.name}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBJECT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {subjects.map((s) => (
                  <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <FormField label="Title" value={title} onChangeText={setTitle} style={{ marginTop: spacing.sm }} disabled={saving} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={saving} />
          <FormField label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} disabled={saving} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
