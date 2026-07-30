import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Switch, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateScheduleSheet } from './CreateScheduleSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import { useDeleteBackupScheduleMutation, useGetBackupSchedulesQuery, useUpdateBackupScheduleMutation } from '../../store/api/apiSlice';

// There is no cron/scheduler actually running these server-side — confirmed nothing ever writes
// lastRunAt/nextRunAt except a client explicitly PATCHing them. This is metadata-only CRUD, not a
// real recurring-execution engine, so no "time until next run" countdown is shown. The active
// toggle uses the same generic PATCH /:id as any other field edit (no dedicated toggle endpoint).
export function BackupSchedulesView() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetBackupSchedulesQuery();
  const schedules = data ?? [];
  const [updateSchedule, updateState] = useUpdateBackupScheduleMutation();
  const [deleteSchedule, deleteState] = useDeleteBackupScheduleMutation();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Schedule
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={schedules.length === 0}
        emptyIcon="calendar-clock-outline"
        emptyLabel="No backup schedules yet"
      >
        {schedules.map((s) => (
          <AccentListCard
            key={s._id}
            accent={s.isActive ? '#22C55E' : '#94A3B8'}
            avatar={<IconWell icon="calendar-clock-outline" color={s.isActive ? '#22C55E' : '#94A3B8'} size={38} />}
            title={s.name}
            subtitle={`${s.type} · ${s.frequency}`}
            badge={<StatusPill label={s.isActive ? 'Active' : 'Paused'} color={s.isActive ? '#22C55E' : '#94A3B8'} />}
            meta={[
              { label: 'Time', value: s.time },
              { label: 'Timezone', value: s.timezone },
              { label: 'Retention', value: `${s.retentionDays} days` },
              { label: 'Created By', value: s.createdBy?.name ?? '—' },
            ]}
            expandable
            actions={
              <>
                <Switch value={!!s.isActive} disabled={updateState.isLoading} onValueChange={(next) => updateSchedule({ id: s._id, isActive: next })} />
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteSchedule(s._id), 'this backup schedule')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateScheduleSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </View>
  );
}
