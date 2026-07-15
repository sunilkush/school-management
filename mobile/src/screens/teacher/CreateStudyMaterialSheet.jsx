import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateStudyMaterialMutation } from '../../store/api/apiSlice';

const TYPES = ['notes', 'book', 'video', 'assignment', 'question_paper', 'other'];

// Uses `externalLink` (a plain URL) rather than a file upload — createStudyMaterial only touches
// Cloudinary when a multipart file is present, so a link-only submission is a fully valid,
// simpler path that needs no document-picker dependency.
export function CreateStudyMaterialSheet({ visible, onDismiss, onCreated, classes, academicYearId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createStudyMaterial, createState] = useCreateStudyMaterialMutation();

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [type, setType] = useState('notes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(null);
      setSectionId(null);
      setSubjectId(null);
      setType('notes');
      setTitle('');
      setDescription('');
      setExternalLink('');
      setError(null);
    }
  }, [visible]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];
  const subjects = selectedClass?.subjects ?? [];

  const handleCreate = async () => {
    if (!classId || !subjectId || !title.trim()) {
      setError('Class, subject and title are all required');
      return;
    }

    try {
      await createStudyMaterial({
        academicYearId,
        schoolClassId: classId,
        sectionId: sectionId || undefined,
        subjectId,
        title: title.trim(),
        description: description.trim(),
        type,
        externalLink: externalLink.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create study material');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Study Material</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); setSubjectId(null); }}>
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
              <Chip key={s.subjectId._id} selected={s.subjectId._id === subjectId} onPress={() => setSubjectId(s.subjectId._id)}>
                {s.subjectId.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t.replace('_', ' ')}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Title" value={title} onChangeText={setTitle} style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={createState.isLoading} />
          <FormField label="Link (optional)" value={externalLink} onChangeText={setExternalLink} autoCapitalize="none" keyboardType="url" disabled={createState.isLoading} />

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
