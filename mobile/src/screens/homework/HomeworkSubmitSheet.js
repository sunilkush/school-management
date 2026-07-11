import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSubmitHomeworkMutation } from '../../store/api/apiSlice';

/** Remarks-only submission — file attachments are deferred (needs expo-document-picker, a new
 * native dependency not added here); the backend accepts a text-only submit as a complete,
 * real "Submitted" status (multer's attachments field has no minCount). */
export function HomeworkSubmitSheet({ assignment, onDismiss, onSubmitted }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);
  const [submitHomework, submitState] = useSubmitHomeworkMutation();

  useEffect(() => {
    if (assignment) {
      setRemarks('');
      setError(null);
    }
  }, [assignment]);

  const handleSubmit = async () => {
    try {
      await submitHomework({ assignmentId: assignment._id, remarks }).unwrap();
      onSubmitted?.();
    } catch (err) {
      setError(err?.message || 'Failed to submit');
    }
  };

  return (
    <Portal>
      <Modal visible={Boolean(assignment)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        {assignment && (
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{assignment.title}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
              Attachments aren't supported yet — this submits your remarks only.
            </Text>

            <FormField
              label="Remarks"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={4}
              disabled={submitState.isLoading}
            />

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={submitState.isLoading}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSubmit} loading={submitState.isLoading} disabled={submitState.isLoading} style={{ flex: 1 }}>
                Submit
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
