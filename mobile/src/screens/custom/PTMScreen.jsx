import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Divider, List, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatusPill } from '../../components/ui/StatusPill';
import { ScopePicker } from '../generic/ScopePicker';
import { useAppHeaderOptions } from '../../navigation/headerOptions';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { confirmDelete } from '../../utils/confirm';
import { formatDate, formatTime } from '../../utils/format';
import {
  useGetMyChildrenQuery,
  useGetMyPTMBookingsQuery,
  useGetAvailablePTMSlotsQuery,
  useBookPTMSlotMutation,
  useCancelPTMBookingMutation,
} from '../../store/api/apiSlice';

/** The children a parent can pick between, and the class/section each one's slots belong to. */
function useChildren(ctx) {
  const isParent = ctx.is('Parent');
  const { data, isLoading } = useGetMyChildrenQuery(undefined, { skip: !isParent });
  const children = data ?? [];
  // Student._id — `bookSlot` resolves the student with `Student.findOne({ _id: studentId })`,
  // the same id Fees and Timetable want, and NOT the User id homework/attendance use.
  const options = children.map((child) => ({ value: child._id, label: child.name }));
  return { children, options, isLoading };
}

function slotLabel(slot) {
  return `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
}

function MyBookings({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const ctx = useModuleContext();
  const { children, options, isLoading: childrenLoading } = useChildren(ctx);
  const [pick, setPick] = useState(null);
  const childId = pick ?? options[0]?.value ?? null;

  const bookings = useGetMyPTMBookingsQuery();
  const [cancelBooking] = useCancelPTMBookingMutation();

  // /ptm/slots/my-bookings returns every booking this parent holds, across children — so the
  // child chip filters it here rather than being a query parameter.
  const rows = useMemo(() => {
    const all = Array.isArray(bookings.data) ? bookings.data : [];
    if (!childId || options.length < 2) return all;
    return all.filter((slot) => String(slot.studentId) === String(childId));
  }, [bookings.data, childId, options.length]);

  const child = children.find((c) => String(c._id) === String(childId));

  return (
    <ScreenContainer scrollable>
      {options.length > 1 ? <ScopePicker options={options} value={childId} onChange={setPick} /> : null}

      <QueryState
        isLoading={bookings.isLoading || childrenLoading}
        isError={bookings.isError}
        error={bookings.error}
        onRetry={bookings.refetch}
        isEmpty={rows.length === 0}
        emptyIcon="account-child-outline"
        emptyLabel="You have no parent-teacher meetings booked"
      >
        <>
          {rows.map((slot) => (
            <View key={slot._id}>
              <List.Item
                title={slot.ptmSessionId?.title ?? 'Parent-teacher meeting'}
                titleStyle={[typography.bodyStrong, { color: colors.text }]}
                description={[
                  slot.ptmSessionId?.date ? formatDate(slot.ptmSessionId.date) : null,
                  slotLabel(slot),
                  slot.ptmSessionId?.teacherId?.name,
                  slot.ptmSessionId?.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                left={(props) => <List.Icon {...props} icon="calendar-account-outline" />}
                right={() => (
                  <View style={{ justifyContent: 'center' }}>
                    <StatusPill
                      label={slot.status?.toLowerCase() ?? 'booked'}
                      color={slot.status === 'Cancelled' ? '#DC2626' : '#15803D'}
                    />
                  </View>
                )}
              />
              {slot.status === 'Booked' ? (
                <Button
                  compact
                  textColor={colors.danger}
                  onPress={() =>
                    confirmDelete(() => {
                      cancelBooking(slot._id).unwrap().catch(() => {});
                    }, 'this booking')
                  }
                >
                  Cancel booking
                </Button>
              ) : null}
              <Divider style={{ backgroundColor: colors.borderMuted }} />
            </View>
          ))}
        </>
      </QueryState>

      <Button
        mode="contained"
        icon="plus"
        style={{ marginTop: spacing.lg }}
        // Available slots are looked up by class+section, which come from the child — so a child
        // has to be chosen before there is anything to show.
        disabled={!child}
        onPress={() => navigation.navigate('PTMBook', { child })}
      >
        Book a meeting
      </Button>
      {!child && !childrenLoading ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
          No children are linked to your account yet.
        </Text>
      ) : null}
    </ScreenContainer>
  );
}

function BookSlot({ route, navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const child = route.params?.child;

  const slots = useGetAvailablePTMSlotsQuery(
    { schoolClassId: child?.classId, sectionId: child?.sectionId },
    { skip: !child?.classId || !child?.sectionId }
  );
  const [book, { isLoading: booking }] = useBookPTMSlotMutation();

  const rows = Array.isArray(slots.data) ? slots.data : [];

  // Slots arrive flat but belong to sessions (a teacher, a date, a room) — grouping makes the
  // choice legible instead of one long undifferentiated list of times.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const slot of rows) {
      const key = String(slot.session?._id ?? slot.ptmSessionId);
      if (!map.has(key)) map.set(key, { session: slot.session, slots: [] });
      map.get(key).slots.push(slot);
    }
    return [...map.values()];
  }, [rows]);

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Booking for {child?.name}
        {child?.className ? ` · ${child.className}` : ''}
        {child?.sectionName ? ` ${child.sectionName}` : ''}
      </Text>

      <QueryState
        isLoading={slots.isLoading}
        isError={slots.isError}
        error={slots.error}
        onRetry={slots.refetch}
        isEmpty={rows.length === 0}
        emptyIcon="calendar-remove-outline"
        emptyLabel="No slots are open for this class right now"
      >
        <>
          {grouped.map(({ session, slots: sessionSlots }) => (
            <View key={String(session?._id ?? Math.random())} style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {session?.title ?? 'Parent-teacher meeting'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                {[
                  session?.date ? formatDate(session.date) : null,
                  session?.teacherId?.name,
                  session?.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {sessionSlots.map((slot) => (
                  <Button
                    key={slot._id}
                    mode="outlined"
                    compact
                    disabled={booking}
                    onPress={() =>
                      book({ id: slot._id, studentId: child._id })
                        .unwrap()
                        .then(() => navigation.goBack())
                        // errorMiddleware.js already alerts on a rejected mutation — a slot taken
                        // by someone else a moment earlier surfaces there.
                        .catch(() => {})
                    }
                  >
                    {slotLabel(slot)}
                  </Button>
                ))}
              </View>
            </View>
          ))}
        </>
      </QueryState>
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

/**
 * Parent-teacher meetings, from the parent's side: what is booked, and booking a new slot.
 *
 * Bespoke rather than a descriptor for two reasons. The list and the booking flow read from
 * different endpoints with different shapes (`/ptm/slots/my-bookings` vs
 * `/ptm/slots/available?schoolClassId=&sectionId=`), and the second needs the child's class and
 * section, not just an id — more than `scope` hands a descriptor. And choosing a slot is picking
 * one of many live options grouped by session, which `FormSheet`'s fixed field list cannot express.
 *
 * Running a PTM day — creating sessions, marking who turned up — is staff work with its own
 * screens, not this.
 */
export function PTMScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="PTMBookings" component={MyBookings} options={{ title: 'Parent Meetings' }} />
      <Stack.Screen name="PTMBook" component={BookSlot} options={{ title: 'Book a Slot' }} />
    </Stack.Navigator>
  );
}

PTMScreen.selfHeadered = true;
