import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateCounselingSessionSheet } from './CreateCounselingSessionSheet';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetCounselingSessionsQuery, useUpdateCounselingSessionMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { Scheduled: '#2563EB', Completed: '#22C55E', Cancelled: '#94A3B8', 'No Show': '#EF4444' };

/** Shared list/create/status-transition view for both "Counseling Sessions" and "Appointments" —
 * confirmed to be the exact same CounselingSession model and /counseling-sessions endpoints on
 * the web app, just filtered by `type` with different field labels ("Issue"/"Purpose",
 * "Session Date"/"Appointment Date", "Complete"/"Confirm", "Cancel"/"Decline"). There is no
 * reject/deny action beyond Cancel — matches the web app's own limited state machine
 * (Scheduled → Completed | Cancelled, "No Show" is schema-legal but never set by any UI action). */
export function CounselingSessionListView({ type, icon, screenTitle, issueLabel, dateLabel, completeLabel, cancelLabel, createLabel, emptyLabel }) {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  // Backend default limit=50 with no override would silently truncate the list.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetCounselingSessionsQuery({ type, limit: 500 });
  const sessions = data?.sessions ?? [];
  const [updateSession, updateState] = useUpdateCounselingSessionMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon={icon} color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>{screenTitle}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          {createLabel}
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={sessions.length === 0}
        emptyIcon={icon}
        emptyLabel={emptyLabel}
      >
        {sessions.map((s) => (
          <AccentListCard
            key={s._id}
            accent={STATUS_COLOR[s.status] || colors.primary}
            avatar={<IconWell icon={icon} color={STATUS_COLOR[s.status] || colors.primary} size={40} />}
            title={s.studentName || 'Unknown Student'}
            subtitle={s.studentClass}
            badge={<StatusPill label={s.status} color={STATUS_COLOR[s.status] || colors.textMuted} />}
            meta={[
              { label: issueLabel, value: s.issue },
              { label: dateLabel, value: formatDate(s.sessionDate) },
              { label: 'Duration', value: `${s.duration ?? 30} min` },
              ...(s.mood ? [{ label: 'Mood', value: s.mood }] : []),
              { label: 'Counselor', value: s.counselorId?.name ?? '—' },
              ...(s.notes ? [{ label: 'Notes', value: s.notes }] : []),
            ]}
            expandable
            actions={
              s.status === 'Scheduled' ? (
                <>
                  <Button size="small" mode="contained-tonal" compact disabled={updateState.isLoading} onPress={() => updateSession({ id: s._id, status: 'Completed' })}>
                    {completeLabel}
                  </Button>
                  <Button size="small" mode="text" compact textColor={colors.danger} disabled={updateState.isLoading} onPress={() => updateSession({ id: s._id, status: 'Cancelled' })}>
                    {cancelLabel}
                  </Button>
                </>
              ) : null
            }
          />
        ))}
      </QueryState>

      <CreateCounselingSessionSheet
        visible={creating}
        type={type}
        title={createLabel}
        issueLabel={issueLabel}
        dateLabel={dateLabel}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
      />
    </ScreenContainer>
  );
}
