import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Switch, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetPTMSessionSlotsQuery, useMarkPTMAttendanceMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { Available: '#94A3B8', Booked: '#2563EB', Completed: '#22C55E', Cancelled: '#EF4444' };
const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

function SlotRow({ slot }) {
  const { colors } = useAppTheme();
  const [markAttendance, markState] = useMarkPTMAttendanceMutation();
  const [attended, setAttended] = useState(true);

  return (
    <AccentListCard
      accent={STATUS_COLOR[slot.status] || colors.primary}
      title={`${fmtTime(slot.startTime)} – ${fmtTime(slot.endTime)}`}
      subtitle={slot.studentName || 'Unbooked'}
      badge={<StatusPill label={slot.status} color={STATUS_COLOR[slot.status] || colors.textMuted} />}
      actions={
        slot.status === 'Booked' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Attended</Text>
              <Switch value={attended} onValueChange={setAttended} />
            </View>
            <Button compact mode="contained-tonal" loading={markState.isLoading} disabled={markState.isLoading} onPress={() => markAttendance({ id: slot._id, attended })}>
              Mark Complete
            </Button>
          </>
        ) : null
      }
    />
  );
}

/** Opened for a specific PTM session — shows generated slots with booking/attendance status.
 * Controlled by whether `session` is set (matches this batch's other sheet-controller pattern). */
export function SessionSlotsSheet({ session, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const slotsQuery = useGetPTMSessionSlotsQuery(session?._id, { skip: !session });
  const slots = slotsQuery.data?.slots ?? [];

  return (
    <Portal>
      <Modal visible={!!session} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{session?.title} — Slots</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <QueryState
            isLoading={slotsQuery.isLoading}
            isError={slotsQuery.isError}
            error={slotsQuery.error}
            onRetry={slotsQuery.refetch}
            isEmpty={slots.length === 0}
            emptyIcon="calendar-clock-outline"
            emptyLabel="No slots generated for this session"
          >
            {slots.map((slot) => <SlotRow key={slot._id} slot={slot} />)}
          </QueryState>
        </ScrollView>
        <Button mode="outlined" onPress={onDismiss} style={{ marginTop: spacing.md }}>Close</Button>
      </Modal>
    </Portal>
  );
}
