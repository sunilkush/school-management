import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreatePTMSessionSheet } from './CreatePTMSessionSheet';
import { SessionSlotsSheet } from './SessionSlotsSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCancelPTMSessionMutation, useGetPTMSessionsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Scheduled: '#2563EB', Completed: '#22C55E', Cancelled: '#EF4444' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Reused across School Admin, Principal, Vice Principal, Teacher, Class Teacher — same
 * PTM_STAFF_ROLES gate as web's ptm.routes.js. */
export function PTMSessionsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPTMSessionsQuery();
  const sessions = data ?? [];
  const [cancelSession, cancelState] = useCancelPTMSessionMutation();

  // Parents may already have booked slots within this session, so cancelling isn't a low-stakes
  // toggle — it's confirmed like the app's other irreversible actions.
  const confirmCancel = (session) => {
    Alert.alert('Cancel Session', `Cancel "${session.title}"? Parents who already booked a slot will lose their booking.`, [
      { text: 'Keep Session', style: 'cancel' },
      { text: 'Cancel Session', style: 'destructive', onPress: () => cancelSession(session._id) },
    ]);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="calendar-clock-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>PTM Sessions</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {sessions.length} sessions
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New</Button>
      </View>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={sessions.length === 0}
        emptyIcon="calendar-clock-outline"
        emptyLabel="No PTM sessions scheduled yet"
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
      >
        {sessions.map((session) => (
          <AccentListCard
            key={session._id}
            accent={STATUS_COLOR[session.status] || colors.primary}
            avatar={<IconWell icon="calendar-clock-outline" color={STATUS_COLOR[session.status] || colors.primary} size={40} />}
            title={session.title}
            subtitle={[session.schoolClassId?.name, session.sectionId?.name].filter(Boolean).join(' - ') || '—'}
            badge={<StatusPill label={session.status} color={STATUS_COLOR[session.status] || colors.textMuted} />}
            meta={[
              { label: 'Date', value: fmtDate(session.date) },
              { label: 'Teacher', value: session.teacherId?.name || '—' },
              { label: 'Location', value: session.location || '—' },
              { label: 'Slot Length', value: `${session.slotDurationMinutes} min` },
            ]}
            expandable
            actions={
              <>
                <Button compact onPress={() => setViewingSession(session)}>View Slots</Button>
                {session.status === 'Scheduled' && (
                  <Button compact textColor={colors.danger} loading={cancelState.isLoading} disabled={cancelState.isLoading} onPress={() => cancelSession(session._id)}>
                    Cancel
                  </Button>
                )}
              </>
            }
          />
        ))}
      </QueryState>

      <CreatePTMSessionSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <SessionSlotsSheet session={viewingSession} onDismiss={() => setViewingSession(null)} />
    </ScreenContainer>
  );
}
