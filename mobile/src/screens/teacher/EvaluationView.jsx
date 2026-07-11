import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { avatarColorFor } from '../../theme/patterns';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useEnterExamMarksBulkMutation, useGetExamsQuery, useGetStudentsByRoleQuery } from '../../store/api/apiSlice';

/** Marks entry for one exam at a time — pick the exam, then enter each enrolled student's
 * obtainedMarks (totalMarks/passingMarks come from the exam itself, not re-entered per student).
 * enterMarksBulk upserts, so re-opening an exam and saving again just updates the same records. */
export function EvaluationView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const schoolId = user?.school?._id;

  const [examId, setExamId] = useState(null);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [snackbar, setSnackbar] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];
  const exam = exams.find((e) => e._id === examId);

  const rosterQuery = useGetStudentsByRoleQuery(
    { schoolId, academicYearId, schoolClassId: exam?.schoolClassId?._id },
    { skip: !exam?.schoolClassId?._id }
  );
  const roster = useMemo(() => {
    const all = rosterQuery.data?.students ?? [];
    if (!exam?.sectionId?._id) return all;
    return all.filter((e) => e.sectionId?._id === exam.sectionId._id);
  }, [rosterQuery.data, exam]);

  const [enterMarks, enterState] = useEnterExamMarksBulkMutation();

  useEffect(() => {
    setMarksByStudent({});
  }, [examId]);

  const handleSubmit = async () => {
    try {
      await enterMarks({
        examId,
        marks: roster.map((e) => ({
          studentId: e.studentId.userId._id,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          obtainedMarks: Number(marksByStudent[e.studentId.userId._id]) || 0,
        })),
      }).unwrap();
      setSnackbar({ message: `Marks saved for ${roster.length} students`, isError: false });
    } catch (err) {
      setSnackbar({ message: err?.message || 'Failed to save marks', isError: true });
    }
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EXAM</Text>
      <QueryState
        isLoading={examsQuery.isLoading}
        isError={examsQuery.isError}
        error={examsQuery.error}
        onRetry={examsQuery.refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams available yet"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        {exam && (
          <QueryState
            isLoading={rosterQuery.isLoading || rosterQuery.isFetching}
            isError={rosterQuery.isError}
            error={rosterQuery.error}
            onRetry={rosterQuery.refetch}
            isEmpty={roster.length === 0}
            emptyIcon="account-group-outline"
            emptyLabel="No students enrolled in this exam's class/section"
          >
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              Total Marks: {exam.totalMarks} · Passing: {exam.passingMarks}
            </Text>

            {roster.map((e) => {
              const userId = e.studentId.userId._id;
              const name = e.studentId.userId.name;
              return (
                <View
                  key={e._id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                    borderLeftWidth: 3, borderLeftColor: avatarColorFor(name).color,
                    borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm,
                  }}
                >
                  <AvatarInitials name={name} size={38} />
                  <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={1}>{name}</Text>
                  <TextInput
                    mode="outlined"
                    dense
                    value={marksByStudent[userId] ?? ''}
                    onChangeText={(v) => setMarksByStudent((prev) => ({ ...prev, [userId]: v }))}
                    keyboardType="numeric"
                    placeholder={`/ ${exam.totalMarks}`}
                    style={{ width: 90 }}
                  />
                </View>
              );
            })}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={enterState.isLoading}
              disabled={enterState.isLoading}
              style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
            >
              Save Marks
            </Button>
          </QueryState>
        )}
      </QueryState>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={3000} style={snackbar?.isError ? { backgroundColor: colors.danger } : undefined}>
        {snackbar?.message}
      </Snackbar>
    </ScreenContainer>
  );
}
