import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { QueryState } from '../../../components/ui/QueryState';
import { AccentListCard } from '../../../components/ui/AccentListCard';
import { IconWell } from '../../../components/ui/IconWell';
import { StatusPill } from '../../../components/ui/StatusPill';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import {
  useGetBoardsQuery,
  useGetSchoolBoardsQuery,
  useAssignSchoolBoardMutation,
  useRemoveSchoolBoardMutation,
} from '../../../store/api/apiSlice';

/** Web enforces one board per school — replicated: the picker/Assign button hide once one is
 * assigned, matching SchoolBoard.jsx's own `hasAssignedBoard` gate. */
export function BoardStep() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;

  const boardsQuery = useGetBoardsQuery();
  const boards = boardsQuery.data?.boards ?? [];
  const schoolBoardsQuery = useGetSchoolBoardsQuery(schoolId, { skip: !schoolId });
  const schoolBoards = schoolBoardsQuery.data ?? [];
  const hasAssignedBoard = schoolBoards.length > 0;

  const assignedIds = new Set(schoolBoards.map((sb) => sb.boardId?._id || sb.boardId));
  const availableBoards = hasAssignedBoard ? [] : boards.filter((b) => !assignedIds.has(b._id));

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [assignBoard, assignState] = useAssignSchoolBoardMutation();
  const [removeBoard, removeState] = useRemoveSchoolBoardMutation();
  const [error, setError] = useState(null);

  const handleAssign = async () => {
    if (!selectedBoard) { setError('Select a board first'); return; }
    try {
      await assignBoard({ schoolId, boardId: selectedBoard }).unwrap();
      setSelectedBoard(null);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to assign board');
    }
  };

  return (
    <View>
      {!hasAssignedBoard && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Assign Examination Board</Text>
          <QueryState isLoading={boardsQuery.isLoading} isError={boardsQuery.isError} error={boardsQuery.error} onRetry={boardsQuery.refetch} isEmpty={availableBoards.length === 0} emptyIcon="apps" emptyLabel="No boards available">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' }}>
              {availableBoards.map((b) => (
                <Chip key={b._id} selected={selectedBoard === b._id} onPress={() => setSelectedBoard(b._id)}>{b.name}</Chip>
              ))}
            </ScrollView>
            {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}
            <Button mode="contained" icon="plus" onPress={handleAssign} loading={assignState.isLoading} disabled={assignState.isLoading || !selectedBoard}>
              Assign
            </Button>
          </QueryState>
        </View>
      )}

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ASSIGNED BOARDS</Text>
      <QueryState isLoading={schoolBoardsQuery.isLoading} isError={schoolBoardsQuery.isError} error={schoolBoardsQuery.error} onRetry={schoolBoardsQuery.refetch} isEmpty={schoolBoards.length === 0} emptyIcon="apps" emptyLabel="No boards assigned yet">
        {schoolBoards.map((sb) => (
          <AccentListCard
            key={sb._id}
            accent={colors.primary}
            avatar={<IconWell icon="apps" color={colors.primary} size={40} />}
            title={sb.boardId?.name || 'Unnamed Board'}
            badge={<StatusPill label={sb.isActive ? 'Active' : 'Inactive'} color={sb.isActive ? colors.success : '#F59E0B'} />}
            actions={
              <Button compact textColor={colors.danger} loading={removeState.isLoading} disabled={removeState.isLoading} onPress={() => removeBoard({ schoolId, boardId: sb.boardId?._id || sb.boardId })}>
                Unassign
              </Button>
            }
          />
        ))}
      </QueryState>
    </View>
  );
}
