import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGradeSubmissionMutation } from '../../store/api/apiSlice';

export function GradeSubmissionSheet({ submission, onDismiss, onGraded }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [gradeSubmission, gradeState] = useGradeSubmissionMutation();

  useEffect(() => {
    if (submission) {
      setGrade(submission.grade != null ? String(submission.grade) : '');
      setFeedback(submission.feedback ?? '');
      setError(null);
    }
  }, [submission]);

  const handleSave = async () => {
    const numericGrade = Number(grade);
    if (!grade.trim() || !Number.isFinite(numericGrade) || numericGrade < 0) {
      setError('Enter a valid grade');
      return;
    }

    try {
      await gradeSubmission({ submissionId: submission._id, grade: numericGrade, feedback }).unwrap();
      onGraded?.();
    } catch (err) {
      setError(err?.message || 'Failed to save grade');
    }
  };

  const studentName = submission?.studentEnrollmentId?.studentId?.userId?.name ?? 'Student';

  return (
    <Portal>
      <Modal visible={Boolean(submission)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        {submission && (
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{studentName}</Text>
            {submission.remarks ? (
              <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>"{submission.remarks}"</Text>
            ) : null}

            <FormField label="Grade" value={grade} onChangeText={setGrade} keyboardType="numeric" disabled={gradeState.isLoading} />
            <FormField label="Feedback" value={feedback} onChangeText={setFeedback} multiline numberOfLines={3} disabled={gradeState.isLoading} />

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={gradeState.isLoading}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSave} loading={gradeState.isLoading} disabled={gradeState.isLoading} style={{ flex: 1 }}>
                Save Grade
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
