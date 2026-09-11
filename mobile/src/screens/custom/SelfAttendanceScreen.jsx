import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { formatTime } from '../../utils/format';
import {
  useGetSelfAttendanceStatusQuery,
  useCheckInSelfAttendanceMutation,
  useCheckOutSelfAttendanceMutation,
} from '../../store/api/apiSlice';

/**
 * Marking yourself present — the staff equivalent of a punch clock, and the single most-reached
 * destination in the app (20 roles have it).
 *
 * Bespoke rather than a descriptor because it is not a list of anything: it is today's one record,
 * two buttons, and a GPS read.
 *
 * **The backend does the deciding, not this screen.** It rejects a check-in outside school hours,
 * and rejects one taken further from school than the geofence radius, with the actual distance in
 * the message. So nothing here pre-judges whether you are close enough — that would either
 * duplicate the rule or, worse, disagree with it. The phone's job is to produce an honest fix and
 * show whatever the server says back.
 */
export function SelfAttendanceScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isError, error, refetch } = useGetSelfAttendanceStatusQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInSelfAttendanceMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutSelfAttendanceMutation();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const record = data?.record ?? null;
  const school = data?.school ?? null;
  const busy = checkingIn || checkingOut || locating;

  const withPosition = async (run) => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is needed to mark attendance.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await run({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
        .unwrap()
        // errorMiddleware.js alerts on the rejection, which is where the server's own reason
        // ("You are 340m from school…", "only allowed during school hours…") reaches the user.
        .catch(() => {});
    } catch (err) {
      setLocationError(err?.message || 'Could not read your location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <>
          <Text style={[typography.h2, { color: colors.text }]}>
            {record?.checkOutAt ? 'Done for today' : record?.checkInAt ? 'You are checked in' : 'Not checked in yet'}
          </Text>
          {school?.name ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.md }]}>
              {school.name}
            </Text>
          ) : null}

          <Panel>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Checked in</Text>
              <Text style={[typography.body, { color: colors.text }]}>
                {record?.checkInAt ? formatTime(record.checkInAt) : '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Checked out</Text>
              <Text style={[typography.body, { color: colors.text }]}>
                {record?.checkOutAt ? formatTime(record.checkOutAt) : '—'}
              </Text>
            </View>
            {record?.status ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Marked as</Text>
                <StatusPill label={record.status} color={record.status === 'present' ? '#15803D' : '#B45309'} />
                {/* Whether the fix was inside the geofence is recorded on the attendance row, and
                    it is what an audit would look at — so it is shown rather than hidden. */}
                {record.gpsVerified ? <StatusPill label="GPS verified" color="#2563EB" /> : null}
              </View>
            ) : null}
          </Panel>

          {locationError ? (
            <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>
              {locationError}
            </Text>
          ) : null}

          {!record?.checkInAt ? (
            <Button mode="contained" icon="login" loading={busy} disabled={busy} onPress={() => withPosition(checkIn)}>
              Check in
            </Button>
          ) : !record?.checkOutAt ? (
            <Button mode="contained" icon="logout" loading={busy} disabled={busy} onPress={() => withPosition(checkOut)}>
              Check out
            </Button>
          ) : (
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              Both check-in and check-out are recorded for today.
            </Text>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.lg }]}>
            Your location is read once, at the moment you tap — it is not tracked in the background.
            {school?.location?.geofenceRadius
              ? ` Check-in must be within ${school.location.geofenceRadius}m of school.`
              : ''}
          </Text>
        </>
      </QueryState>
    </ScreenContainer>
  );
}
