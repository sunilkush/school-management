import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetQuestionsQuery, useGetSubjectsQuery } from '../../store/api/apiSlice';

const DIFFICULTY_COLOR = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };

/** Read-only question bank browse — creating a question needs a full MCQ options/correct-answers
 * editor per question type, a separate, larger feature not built here (matches how
 * TeacherExamsView.jsx already defers marks entry/evaluation). */
export function QuestionBankView() {
  const { colors, typography, spacing } = useAppTheme();
  const [subjectId, setSubjectId] = useState(null);

  const { data: subjects = [] } = useGetSubjectsQuery();
  // Backend default limit=10 (the lowest of any list endpoint in the app) with no override meant
  // any subject with more than 10 questions silently hid the rest.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetQuestionsQuery({ subjectId: subjectId || undefined, limit: 500 });
  const questions = data?.questions ?? [];

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
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
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}
