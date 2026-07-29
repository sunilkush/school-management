import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateTaskSheet } from './CreateTaskSheet';
import { formatDate } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeleteTaskMutation, useGetMyTasksQuery, useUpdateTaskMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { todo: '#94A3B8', in_progress: '#F59E0B', done: '#22C55E', cancelled: '#EF4444' };
const PRIORITY_COLOR = { low: '#64748B', medium: '#2563EB', high: '#F59E0B', urgent: '#EF4444' };
const STATUS_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'cancelled', cancelled: 'todo' };

/** School Admin's task management — GET /tasks already returns every task in the school for this
 * role (listTasks only scopes to assignedTo for non-admins), so the "all tasks" view is the same
 * endpoint Teacher's MyTasksView reads, just unfiltered. Full create/edit-status/delete here since
 * only School Admin gets those fields server-side. */
export function TaskManagementView() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  // School Admin sees every task in the school (not just self-assigned), so the backend's
  // default limit=50 with no override was a real truncation risk here — missed in the earlier
  // pagination pass since this call wasn't parameterless.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyTasksQuery({ status: status || undefined, limit: 500 });
  const tasks = data ?? [];
  const [updateTask, updateState] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="format-list-checks" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Task Management</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Assign, track and manage tasks across the school
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Task
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {STATUS_OPTIONS.map((opt) => (
          <Chip key={opt.label} selected={status === opt.value} onPress={() => setStatus(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={tasks.length === 0}
        emptyIcon="format-list-checks"
        emptyLabel="No tasks yet"
      >
        {tasks.map((task) => (
          <AccentListCard
            key={task._id}
            accent={PRIORITY_COLOR[task.priority] || colors.primary}
            avatar={<IconWell icon="format-list-checks" color={PRIORITY_COLOR[task.priority] || colors.primary} size={40} />}
            title={task.title}
            subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
            badge={<StatusPill label={task.status.replace('_', ' ')} color={STATUS_COLOR[task.status]} />}
            meta={[
              ...(task.description ? [{ label: 'Description', value: task.description }] : []),
              { label: 'Priority', value: task.priority },
              {
                label: 'Assigned To',
                value: task.assignedTo?.length ? task.assignedTo.map((u) => u.name).join(', ') : 'Unassigned',
              },
            ]}
            actions={
              <>
                <Button
                  size="small"
                  mode="contained-tonal"
                  onPress={() => updateTask({ id: task._id, status: NEXT_STATUS[task.status] })}
                  loading={updateState.isLoading}
                  disabled={updateState.isLoading}
                >
                  Advance
                </Button>
                <IconButton icon="delete-outline" size={18} onPress={() => confirmDelete(() => deleteTask(task._id), 'this task')} />
              </>
            }
            expandable
          />
        ))}
      </QueryState>

      <CreateTaskSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}
