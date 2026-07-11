import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useCheckInSelfAttendanceMutation,
  useCheckOutSelfAttendanceMutation,
  useGetSelfAttendanceStatusQuery,
} from '../../store/api/apiSlice';

const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

async function getCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to check in/out');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
}

/** GPS-verified daily check-in/out — the backend rejects a check-in/out outside the school's
 * geofence radius with a 403 (selfAttendance.controllers.js), surfaced here as a plain error
 * message rather than re-implemented client-side. */
export function SelfAttendanceView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSelfAttendanceStatusQuery();
  const [checkIn, checkInState] = useCheckInSelfAttendanceMutation();
  const [checkOut, checkOutState] = useCheckOutSelfAttendanceMutation();
  const [actionError, setActionError] = useState(null);

  const record = data?.record;
  const hasCheckedIn = Boolean(record?.checkInAt);
  const hasCheckedOut = Boolean(record?.checkOutAt);

  const handleCheckIn = async () => {
    setActionError(null);
    try {
      const coords = await getCoords();
      await checkIn(coords).unwrap();
      refetch();
    } catch (err) {
      setActionError(err?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    setActionError(null);
    try {
      const coords = await getCoords();
      await checkOut(coords).unwrap();
      refetch();
    } catch (err) {
      setActionError(err?.message || 'Check-out failed');
    }
  };

  return (
    <ScreenContainer scrollable>
      <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={[typography.h3, { color: colors.text }]}>Today</Text>
            <StatusPill
              label={hasCheckedOut ? 'Checked Out' : hasCheckedIn ? 'Checked In' : 'Not Checked In'}
              color={hasCheckedOut ? colors.textMuted : hasCheckedIn ? colors.success : colors.warning}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Check-In</Text>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{fmtTime(record?.checkInAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Check-Out</Text>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{fmtTime(record?.checkOutAt)}</Text>
          </View>

          {record?.distanceFromSchool != null && (
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
              {record.gpsVerified ? 'GPS verified · ' : ''}{record.distanceFromSchool}m from school
            </Text>
          )}

          {actionError && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{actionError}</Text>}

          {!hasCheckedIn && (
            <Button mode="contained" icon="map-marker-outline" onPress={handleCheckIn} loading={checkInState.isLoading} disabled={checkInState.isLoading}>
              Check In
            </Button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <Button mode="contained" icon="map-marker-outline" onPress={handleCheckOut} loading={checkOutState.isLoading} disabled={checkOutState.isLoading}>
              Check Out
            </Button>
          )}
          {hasCheckedOut && (
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>You're done for today</Text>
          )}
        </Panel>
      </QueryState>
    </ScreenContainer>
  );
}
