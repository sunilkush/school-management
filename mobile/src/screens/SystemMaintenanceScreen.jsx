import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateMaintenanceTaskSheet } from './itSupport/CreateMaintenanceTaskSheet';
import { formatDate } from '../utils/format';
import { confirmDelete } from '../utils/confirm';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteMaintenanceTaskMutation, useGetMaintenanceTasksQuery, useUpdateMaintenanceTaskMutation } from '../store/api/apiSlice';

const STATUS_COLOR = { pending: '#94A3B8', in_progress: '#F59E0B', done: '#22C55E' };
const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' };
const NEXT_STATUS = { pending: 'in_progress', in_progress: 'done' };

/** IT Support's maintenance task board — mirrors frontend/src/pages/IT_Support/ITSupportPages.jsx's
 * SystemMaintenance section (a real CRUD, /maintenance-tasks). Tapping the status pill advances
 * pending → in_progress → done; a "Done" task has no further action, only delete. */
export function SystemMaintenanceScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMaintenanceTasksQuery();
  const tasks = data ?? [];
  const [updateTask, updateState] = useUpdateMaintenanceTaskMutation();
  const [deleteTask, deleteState] = useDeleteMaintenanceTaskMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="wrench-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>System Maintenance</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Task
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={tasks.length === 0}
        emptyIcon="wrench-outline"
        emptyLabel="No maintenance tasks yet"
      >
        {tasks.map((t) => (
          <AccentListCard
            key={t._id}
            accent={STATUS_COLOR[t.status] || colors.primary}
            avatar={<IconWell icon="wrench-outline" color={STATUS_COLOR[t.status] || colors.primary} size={40} />}
            title={t.title}
            subtitle={t.description}
            badge={<StatusPill label={STATUS_LABEL[t.status] ?? t.status} color={STATUS_COLOR[t.status] || colors.textMuted} />}
            meta={[
              { label: 'Priority', value: t.priority ?? 'medium' },
              ...(t.dueDate ? [{ label: 'Due', value: formatDate(t.dueDate) }] : []),
              { label: 'Created By', value: t.createdBy?.name ?? '—' },
            ]}
            expandable
            actions={
              <>
                {NEXT_STATUS[t.status] && (
                  <Button
                    size="small"
                    mode="contained-tonal"
                    compact
                    disabled={updateState.isLoading}
                    onPress={() => updateTask({ id: t._id, status: NEXT_STATUS[t.status] })}
                  >
                    {t.status === 'pending' ? 'Start' : 'Mark Done'}
                  </Button>
                )}
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteTask(t._id), 'this task')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateMaintenanceTaskSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}
