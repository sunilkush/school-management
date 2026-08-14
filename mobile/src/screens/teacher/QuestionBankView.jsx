import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateQuestionSheet } from './CreateQuestionSheet';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetActiveAcademicYearQuery,
  useGetAssignedClassesQuery,
  useGetQuestionsQuery,
  useGetSubjectsQuery,
} from '../../store/api/apiSlice';

const DIFFICULTY_COLOR = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };
// Scoped to just MCQ Single + True/False for now — see CreateQuestionSheet's own comment.
const EDITABLE_TYPES = new Set(['mcq_single', 'true_false']);

export function QuestionBankView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [subjectId, setSubjectId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const sheetVisible = creating || Boolean(editingQuestion);
  const closeSheet = () => { setCreating(false); setEditingQuestion(null); };

  const { data: subjects = [] } = useGetSubjectsQuery();
  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];
  // Backend default limit=10 (the lowest of any list endpoint in the app) with no override meant
  // any subject with more than 10 questions silently hid the rest.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetQuestionsQuery({ subjectId: subjectId || undefined, limit: 500 });
  const questions = data?.questions ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="help-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Question Bank</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Browse questions by subject and difficulty
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} disabled={!academicYearId}>
          New Question
        </Button>
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        <Chip selected={!subjectId} onPress={() => setSubjectId(null)}>All</Chip>
        {subjects.map((s) => (
          <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
            {s.name}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={questions.length === 0}
        emptyIcon="help-box-outline"
        emptyLabel="No questions found"
      >
        {questions.map((q) => (
          <AccentListCard
            key={q._id}
            accent={DIFFICULTY_COLOR[q.difficulty] || colors.primary}
            avatar={<IconWell icon="help-box-outline" color={DIFFICULTY_COLOR[q.difficulty] || colors.primary} size={40} />}
            title={q.statement}
            subtitle={`${q.subjectId?.name ?? ''}${q.schoolClassId?.name ? ` · ${q.schoolClassId.name}` : ''} · ${q.questionType.replace('_', ' ')}`}
            badge={<StatusPill label={q.difficulty} color={DIFFICULTY_COLOR[q.difficulty] || colors.textMuted} />}
            meta={[
              { label: 'Marks', value: q.marks },
              ...(q.options?.length ? [{ label: 'Options', value: q.options.map((o) => o.text).join(', ') }] : []),
              ...(q.correctAnswers?.length ? [{ label: 'Correct Answer', value: q.correctAnswers.join(', ') }] : []),
            ]}
            expandable
            actions={
              EDITABLE_TYPES.has(q.questionType) ? (
                <IconButton
                  icon="pencil-outline"
                  iconColor={colors.textSecondary}
                  size={18}
                  onPress={() => setEditingQuestion(q)}
                />
              ) : null
            }
          />
        ))}
      </QueryState>

      <CreateQuestionSheet
        visible={sheetVisible}
        question={editingQuestion}
        onDismiss={closeSheet}
        onCreated={closeSheet}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}
