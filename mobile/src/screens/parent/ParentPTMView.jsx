import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetMyChildrenQuery,
  useGetAvailablePTMSlotsQuery,
  useGetMyPTMBookingsQuery,
  useBookPTMSlotMutation,
  useCancelPTMBookingMutation,
} from '../../store/api/apiSlice';

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** PTM booking is genuinely per-child (unlike Certificates/ID Cards' pre-aggregated self-service
 * reads) — GET /ptm/slots/available requires an explicit schoolClassId/sectionId, which only a
 * specific child's own enrollment gives you, so ChildPicker is needed here. */
export function ParentPTMView() {
  const { colors, typography, spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const [tab, setTab] = useState('book');

  const childrenQuery = useGetMyChildrenQuery();
  const children = childrenQuery.data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const availableQuery = useGetAvailablePTMSlotsQuery(
    { schoolClassId: activeChild?.classId, sectionId: activeChild?.sectionId },
    { skip: !activeChild?.classId || !activeChild?.sectionId || tab !== 'book' }
  );
  const availableSlots = availableQuery.data ?? [];

  const bookingsQuery = useGetMyPTMBookingsQuery(undefined, { skip: tab !== 'bookings' });
  const bookings = bookingsQuery.data ?? [];

  const [bookSlot, bookState] = useBookPTMSlotMutation();
  const [cancelBooking, cancelState] = useCancelPTMBookingMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="calendar-clock-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Parent-Teacher Meetings</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Book a slot or manage your bookings
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={childrenQuery.isLoading}
        isError={childrenQuery.isError}
        error={childrenQuery.error}
        onRetry={childrenQuery.refetch}
        isEmpty={children.length === 0}
        emptyIcon="account-child-outline"
        emptyLabel="No children linked to your account yet"
      >
        <ChildPicker children={children} selectedId={activeChild?._id} onSelect={setSelectedChild} />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md }}>
          <Chip selected={tab === 'book'} onPress={() => setTab('book')}>Book a Slot</Chip>
          <Chip selected={tab === 'bookings'} onPress={() => setTab('bookings')}>My Bookings</Chip>
        </View>

        {tab === 'book' ? (
          <QueryState
            isLoading={availableQuery.isLoading || availableQuery.isFetching}
            isError={availableQuery.isError}
            error={availableQuery.error}
            onRetry={availableQuery.refetch}
            isEmpty={availableSlots.length === 0}
            emptyIcon="calendar-remove-outline"
            emptyLabel="No slots currently available for this child's class"
          >
            {availableSlots.map((slot) => (
              <AccentListCard
                key={slot._id}
                accent={colors.primary}
                title={slot.session?.title || 'PTM Slot'}
                subtitle={`${fmtDateTime(slot.startTime)} · ${slot.session?.teacherId?.name || 'Teacher'}`}
                meta={[{ label: 'Location', value: slot.session?.location || '—' }]}
                expandable
                actions={
                  <Button
                    compact
                    mode="contained"
                    loading={bookState.isLoading}
                    disabled={bookState.isLoading}
                    onPress={() => bookSlot({ id: slot._id, studentId: activeChild._id })}
                  >
                    Book
                  </Button>
                }
              />
            ))}
          </QueryState>
        ) : (
          <QueryState
            isLoading={bookingsQuery.isLoading || bookingsQuery.isFetching}
            isError={bookingsQuery.isError}
            error={bookingsQuery.error}
            onRetry={bookingsQuery.refetch}
            isEmpty={bookings.length === 0}
            emptyIcon="calendar-blank-outline"
            emptyLabel="No PTM bookings yet"
          >
            {bookings.map((slot) => (
              <AccentListCard
                key={slot._id}
                accent={slot.status === 'Booked' ? colors.primary : '#94A3B8'}
                title={slot.ptmSessionId?.title || 'PTM Slot'}
                subtitle={`${fmtDateTime(slot.startTime)} · For ${slot.studentName}`}
                badge={<StatusPill label={slot.status} color={slot.status === 'Booked' ? colors.primary : '#94A3B8'} />}
                meta={[
                  { label: 'Class', value: [slot.ptmSessionId?.schoolClassId?.name, slot.ptmSessionId?.sectionId?.name].filter(Boolean).join(' - ') || '—' },
                  { label: 'Teacher', value: slot.ptmSessionId?.teacherId?.name || '—' },
                  { label: 'Location', value: slot.ptmSessionId?.location || '—' },
                ]}
                expandable
                actions={slot.status === 'Booked' ? (
                  <Button compact textColor={colors.danger} loading={cancelState.isLoading} disabled={cancelState.isLoading} onPress={() => cancelBooking(slot._id)}>
                    Cancel
                  </Button>
                ) : null}
              />
            ))}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
