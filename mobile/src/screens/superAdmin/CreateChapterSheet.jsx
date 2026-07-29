import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateChapterMutation } from '../../store/api/apiSlice';

export function CreateChapterSheet({ visible, onDismiss, onCreated, boardClassId, subjects, subjectId, onSubjectChange }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createChapter, createState] = useCreateChapterMutation();

  const [name, setName] = useState('');
  const [chapterNo, setChapterNo] = useState('');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setChapterNo('');
      setDescription('');
      setIsGlobal(false);
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim() || !subjectId) {
      setError('Chapter name and subject are both required');
      return;
    }
    try {
      await createChapter({
        name: name.trim(),
        chapterNo: chapterNo.trim() || undefined,
        description: description.trim() || undefined,
        boardClassId,
        subjectId,
        isGlobal,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create chapter');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Chapter</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {subjects.map((s) => (
              <Chip key={s._id} selected={s._id === subjectId} onPress={() => onSubjectChange(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Chapter Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
          <FormField label="Chapter No. (optional)" value={chapterNo} onChangeText={setChapterNo} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={createState.isLoading} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Global (visible to every school)</Text>
            <Switch value={isGlobal} onValueChange={setIsGlobal} disabled={createState.isLoading} />
          </View>

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
