import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateChapterSheet } from './superAdmin/CreateChapterSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteChapterMutation, useGetBoardClassesQuery, useGetBoardsQuery, useGetChaptersQuery, useGetSubjectsQuery } from '../store/api/apiSlice';

/** Board → BoardClass → Subject cascading pickers, then a flat filtered chapter list — a flatter
 * UI than web's 4-level tree view, but the same underlying data. Mirrors frontend's
 * ChaptersTopics.jsx. */
export function ChaptersTopicsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [boardId, setBoardId] = useState(null);
  const [boardClassId, setBoardClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [creating, setCreating] = useState(false);

  const boardsQuery = useGetBoardsQuery({});
  const boards = boardsQuery.data?.boards ?? [];

  const boardClassesQuery = useGetBoardClassesQuery(boardId, { skip: !boardId });
  const boardClasses = boardClassesQuery.data ?? [];

  const subjectsQuery = useGetSubjectsQuery();
  const subjects = subjectsQuery.data ?? [];

  const chaptersQuery = useGetChaptersQuery(
    { boardClassId, subjectId: subjectId || undefined },
    { skip: !boardClassId }
  );
  const chapters = chaptersQuery.data ?? [];
  const [deleteChapter, deleteState] = useDeleteChapterMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="format-list-bulleted" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Chapters & Topics</Text>
        </View>
      </View>

      <QueryState isLoading={boardsQuery.isLoading} isError={boardsQuery.isError} error={boardsQuery.error} onRetry={boardsQuery.refetch} isEmpty={boards.length === 0} emptyIcon="certificate-outline" emptyLabel="No boards found — create one first">
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>BOARD</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {boards.map((b) => (
            <Chip key={b._id} selected={b._id === boardId} onPress={() => { setBoardId(b._id); setBoardClassId(null); }}>
              {b.name}
            </Chip>
          ))}
        </ScrollView>

        {boardId && boardClasses.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CLASS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
              {boardClasses.map((bc) => (
                <Chip key={bc._id} selected={bc._id === boardClassId} onPress={() => setBoardClassId(bc._id)}>
                  {bc.classId?.name ?? bc.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {boardClassId && subjects.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBJECT (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
              <Chip selected={!subjectId} onPress={() => setSubjectId(null)}>
                All Subjects
              </Chip>
              {subjects.map((s) => (
                <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                  {s.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        {boardClassId && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
              <Button mode="contained" icon="plus" disabled={!subjectId} onPress={() => setCreating(true)}>
                New Chapter
              </Button>
            </View>

            <QueryState
              isLoading={chaptersQuery.isLoading || chaptersQuery.isFetching}
              isError={chaptersQuery.isError}
              error={chaptersQuery.error}
              onRetry={chaptersQuery.refetch}
              isEmpty={chapters.length === 0}
              emptyIcon="format-list-bulleted"
              emptyLabel="No chapters found for this selection"
            >
              {chapters.map((c) => (
                <AccentListCard
                  key={c._id}
                  accent={c.isGlobal ? '#7C3AED' : colors.primary}
                  avatar={<IconWell icon="format-list-bulleted" color={c.isGlobal ? '#7C3AED' : colors.primary} size={38} />}
                  title={c.name}
                  subtitle={c.subject?.name ?? ''}
                  badge={c.isGlobal ? <StatusPill label="Global" color="#7C3AED" /> : null}
                  meta={[
                    ...(c.chapterNo ? [{ label: 'Chapter No.', value: c.chapterNo }] : []),
                    ...(c.description ? [{ label: 'Description', value: c.description }] : []),
                  ]}
                  expandable
                  actions={
                    <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteChapter(c._id), 'this chapter')} />
                  }
                />
              ))}
            </QueryState>
          </>
        )}
      </QueryState>

      <CreateChapterSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        boardClassId={boardClassId}
        subjects={subjects}
        subjectId={subjectId}
        onSubjectChange={setSubjectId}
      />
    </ScreenContainer>
  );
}
