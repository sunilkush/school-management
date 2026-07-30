import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { formatDate } from '../../utils/format';
import { useGenerateExamAdmitCardsMutation, useGetExamAdmitCardsQuery, useGetExamsQuery } from '../../store/api/apiSlice';

function AdmitCardPreview({ card }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md }}>
      <Text style={[typography.h3, { color: colors.text }]}>{card.examTitle}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        {formatDate(card.examDate)} · {card.startTime}–{card.endTime}
      </Text>
      <View style={{ gap: 4, marginBottom: spacing.md }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{card.studentName}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Roll No: {card.rollNumber} · Seat: {card.seatNumber}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {card.className}{card.sectionName ? ` ${card.sectionName}` : ''} · {card.subjectName}
        </Text>
      </View>
      {card.instructions?.length > 0 && (
        <View>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>INSTRUCTIONS</Text>
          {card.instructions.map((line, i) => (
            <Text key={i} style={[typography.caption, { color: colors.textSecondary }]}>
              • {line}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** Generate + view admit cards for an exam — mirrors the web app's AdmitCardPage.jsx Preview mode.
 * The web app's PDF download opens a bearer-authenticated fetch as a blob; that needs a native
 * file-system/sharing dependency this app doesn't have yet (same reasoning as the deferred photo
 * upload on Profile), so this screen covers generate + on-screen preview, not PDF export. */
export function AdmitCardView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [examId, setExamId] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];

  const cardsQuery = useGetExamAdmitCardsQuery(examId, { skip: !examId });
  const cards = cardsQuery.data?.data ?? cardsQuery.data ?? [];
  const [generate, generateState] = useGenerateExamAdmitCardsMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="card-account-details-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Admit Cards</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Generate and preview exam admit cards
          </Text>
        </View>
      </View>

      <Panel>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>EXAM</Text>
        <QueryState
          isLoading={examsQuery.isLoading}
          isError={examsQuery.isError}
          error={examsQuery.error}
          onRetry={examsQuery.refetch}
          isEmpty={exams.length === 0}
          emptyIcon="pencil-box-outline"
          emptyLabel="No exams available yet"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
            {exams.map((e) => (
              <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
                {e.title}
              </Chip>
            ))}
          </ScrollView>
        </QueryState>
      </Panel>

      {examId && (
        <QueryState
          isLoading={cardsQuery.isLoading || cardsQuery.isFetching}
          isError={cardsQuery.isError}
          error={cardsQuery.error}
          onRetry={cardsQuery.refetch}
          isEmpty={cards.length === 0}
          emptyIcon="card-account-details-outline"
          emptyLabel="No admit cards generated yet for this exam"
        >
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{cards.length} card{cards.length !== 1 ? 's' : ''} generated</Text>
          {cards.map((card) => (
            <AdmitCardPreview key={card._id} card={card} />
          ))}
        </QueryState>
      )}

      {examId && cards.length === 0 && (
        <Button mode="contained" onPress={() => generate(examId)} loading={generateState.isLoading} disabled={generateState.isLoading} style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
          Generate Admit Cards
        </Button>
      )}
    </ScreenContainer>
  );
}
