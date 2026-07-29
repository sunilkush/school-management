import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateFaqMutation, useUpdateFaqMutation } from '../../store/api/apiSlice';

const CATEGORIES = ['general', 'billing', 'technical', 'academic', 'other'];

export function CreateFaqSheet({ visible, onDismiss, onCreated, faq }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createFaq, createState] = useCreateFaqMutation();
  const [updateFaq, updateState] = useUpdateFaqMutation();
  const isEditing = Boolean(faq);
  const saveState = isEditing ? updateState : createState;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setQuestion(faq?.question ?? '');
      setAnswer(faq?.answer ?? '');
      setCategory(faq?.category ?? 'general');
      setError(null);
    }
  }, [visible, faq]);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are both required');
      return;
    }
    const payload = { question: question.trim(), answer: answer.trim(), category };
    try {
      if (isEditing) {
        await updateFaq({ id: faq._id, ...payload }).unwrap();
      } else {
        await createFaq(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save FAQ');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit FAQ' : 'New FAQ'}</Text>

          <FormField label="Question" value={question} onChangeText={setQuestion} multiline numberOfLines={2} disabled={saveState.isLoading} />
          <FormField label="Answer" value={answer} onChangeText={setAnswer} multiline numberOfLines={4} disabled={saveState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
