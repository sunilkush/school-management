import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateBoardSheet } from './superAdmin/CreateBoardSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteBoardMutation, useGetBoardsQuery } from '../store/api/apiSlice';

export function BoardsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetBoardsQuery({});
  const boards = data?.boards ?? [];
  const [deleteBoard, deleteState] = useDeleteBoardMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="certificate-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Boards</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Board
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={boards.length === 0}
        emptyIcon="certificate-outline"
        emptyLabel="No boards yet"
      >
        {boards.map((b) => (
          <AccentListCard
            key={b._id}
            accent={b.isActive ? '#22C55E' : '#94A3B8'}
            avatar={<IconWell icon="certificate-outline" color={b.isActive ? '#22C55E' : '#94A3B8'} size={40} />}
            title={b.name}
            subtitle={b.code ?? ''}
            badge={<StatusPill label={b.isActive ? 'Active' : 'Inactive'} color={b.isActive ? '#22C55E' : '#94A3B8'} />}
            meta={[...(b.description ? [{ label: 'Description', value: b.description }] : [])]}
            expandable
            actions={
              <>
                <IconButton icon="pencil-outline" size={18} onPress={() => setEditingBoard(b)} />
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteBoard(b._id), 'this board')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateBoardSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <CreateBoardSheet visible={!!editingBoard} board={editingBoard} onDismiss={() => setEditingBoard(null)} onCreated={() => setEditingBoard(null)} />
    </ScreenContainer>
  );
}
