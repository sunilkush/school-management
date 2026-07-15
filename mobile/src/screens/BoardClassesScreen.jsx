import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateBoardClassSheet } from './superAdmin/CreateBoardClassSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteBoardClassMutation, useGetBoardClassesQuery, useGetBoardsQuery } from '../store/api/apiSlice';

export function BoardClassesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [boardId, setBoardId] = useState(null);
  const [creating, setCreating] = useState(false);

  const boardsQuery = useGetBoardsQuery({});
  const boards = boardsQuery.data?.boards ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetBoardClassesQuery(boardId, { skip: !boardId });
  const boardClasses = data ?? [];
  const [deleteBoardClass, deleteState] = useDeleteBoardClassMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="certificate-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Board Classes</Text>
        </View>
      </View>

      <QueryState isLoading={boardsQuery.isLoading} isError={boardsQuery.isError} error={boardsQuery.error} onRetry={boardsQuery.refetch} isEmpty={boards.length === 0} emptyIcon="certificate-outline" emptyLabel="No boards found — create one first">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {boards.map((b) => (
            <Chip key={b._id} selected={b._id === boardId} onPress={() => setBoardId(b._id)}>
              {b.name}
            </Chip>
          ))}
        </ScrollView>

        {boardId && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
              <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
                Add Class
              </Button>
            </View>

            <QueryState
              isLoading={isLoading || isFetching}
              isError={isError}
              error={error}
              onRetry={refetch}
              isEmpty={boardClasses.length === 0}
              emptyIcon="certificate-outline"
              emptyLabel="No classes added to this board yet"
            >
              {boardClasses.map((bc) => (
                <AccentListCard
                  key={bc._id}
                  accent={bc.status === 'active' ? '#22C55E' : '#94A3B8'}
                  avatar={<IconWell icon="google-classroom" color={colors.primary} size={38} />}
                  title={bc.classId?.name ?? bc.name}
                  badge={<StatusPill label={bc.status ?? 'active'} color={bc.status === 'active' ? '#22C55E' : '#94A3B8'} />}
                  meta={[...(bc.description ? [{ label: 'Description', value: bc.description }] : [])]}
                  expandable
                  actions={
                    <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => deleteBoardClass(bc._id)} />
                  }
                />
              ))}
            </QueryState>
          </>
        )}
      </QueryState>

      <CreateBoardClassSheet visible={creating} boardId={boardId} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}
