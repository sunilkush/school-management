import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyTasksQuery, useUpdateMyTaskStatusMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { todo: '#94A3B8', in_progress: '#F59E0B', done: '#22C55E' };
const PRIORITY_COLOR = { low: '#64748B', medium: '#2563EB', high: '#F59E0B', urgent: '#EF4444' };
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const NEXT_LABEL = { todo: 'Start', in_progress: 'Mark Done', done: 'Reopen' };

/** "My Tasks" — tasks assigned to the signed-in user by a School Admin. Non-admin roles can only
 * update their own assigneeStatus (task.controllers.js updateTask's non-admin branch), not any
 * other task field, so this is a status-only view, not a full task editor. */
export function MyTasksView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyTasksQuery();
  const [updateStatus, updateState] = useUpdateMyTaskStatusMutation();
  const tasks = data ?? [];

  const myStatusFor = (task) => {
    const entry = task.assigneeStatus?.find((a) => a.userId === user?._id || a.userId?._id === user?._id);
    return entry?.status || 'todo';
  };

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={tasks.length === 0}
        emptyIcon="format-list-checks"
        emptyLabel="No tasks assigned to you"
      >
        {tasks.map((task) => {
          const myStatus = myStatusFor(task);
          return (
            <AccentListCard
              key={task._id}
              accent={PRIORITY_COLOR[task.priority] || colors.primary}
              avatar={<IconWell icon="format-list-checks" color={PRIORITY_COLOR[task.priority] || colors.primary} size={40} />}
              title={task.title}
              subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              badge={<StatusPill label={myStatus.replace('_', ' ')} color={STATUS_COLOR[myStatus]} />}
              meta={[
                ...(task.description ? [{ label: 'Description', value: task.description }] : []),
                { label: 'Priority', value: task.priority },
                { label: 'Assigned By', value: task.assignedBy?.name ?? '—' },
              ]}
              actions={
                <Button
                  size="small"
                  mode="contained-tonal"
                  onPress={() => updateStatus({ id: task._id, myStatus: NEXT_STATUS[myStatus] })}
                  loading={updateState.isLoading}
                  disabled={updateState.isLoading}
                >
                  {NEXT_LABEL[myStatus]}
                </Button>
              }
              expandable
            />
          );
        })}
      </QueryState>
    </ScreenContainer>
  );
}
