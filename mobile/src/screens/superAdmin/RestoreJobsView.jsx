import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { RequestRestoreSheet } from './RequestRestoreSheet';
import { ApproveRestoreSheet } from './ApproveRestoreSheet';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetRestoreJobsQuery, useRunRestoreJobMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { pending_approval: '#F59E0B', running: '#2563EB', success: '#22C55E', failed: '#EF4444' };

// Limited state machine confirmed from the backend: request -> approve -> run. There is no
// reject/deny action at all (the model doesn't support it), so no reject button is built. "run"
// is a synchronous state-transition stub only — it does not actually restore data from the backup
// file back into the DB, it just flips status to "success".
export function RestoreJobsView() {
  const { colors, spacing } = useAppTheme();
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetRestoreJobsQuery();
  const jobs = data ?? [];
  const [runRestore, runState] = useRunRestoreJobMutation();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setRequesting(true)}>
          Request Restore
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={jobs.length === 0}
        emptyIcon="restore"
        emptyLabel="No restore jobs yet"
      >
        {jobs.map((j) => (
          <AccentListCard
            key={j._id}
            accent={STATUS_COLOR[j.status] || colors.primary}
            avatar={<IconWell icon="restore" color={STATUS_COLOR[j.status] || colors.primary} size={38} />}
            title={j.backupId?.backupNo ?? 'Unknown Backup'}
            subtitle={`${j.restoreType} · ${j.dryRun ? 'Dry run' : 'Live'}`}
            badge={<StatusPill label={j.status.replace('_', ' ')} color={STATUS_COLOR[j.status] || colors.textMuted} />}
            meta={[
              { label: 'Requested By', value: j.requestedBy?.name ?? '—' },
              ...(j.approvedBy ? [{ label: 'Approved By', value: j.approvedBy?.name ?? '—' }] : []),
              ...(j.startedAt ? [{ label: 'Started', value: formatDate(j.startedAt) }] : []),
              ...(j.completedAt ? [{ label: 'Completed', value: formatDate(j.completedAt) }] : []),
            ]}
            expandable
            actions={
              <>
                {j.status === 'pending_approval' && (
                  <Button size="small" mode="contained-tonal" compact onPress={() => setApproving(j)}>
                    Approve
                  </Button>
                )}
                {j.status === 'running' && (
                  <Button size="small" mode="contained" compact loading={runState.isLoading} disabled={runState.isLoading} onPress={() => runRestore(j._id)}>
                    Run
                  </Button>
                )}
              </>
            }
          />
        ))}
      </QueryState>

      <RequestRestoreSheet visible={requesting} onDismiss={() => setRequesting(false)} onCreated={() => setRequesting(false)} />
      <ApproveRestoreSheet visible={!!approving} job={approving} onDismiss={() => setApproving(null)} onApproved={() => setApproving(null)} />
    </View>
  );
}
