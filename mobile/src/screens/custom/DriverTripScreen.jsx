import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { formatTime, timeAgo } from '../../utils/format';
import {
  useGetMyTripQuery,
  useGetTransportRoutesQuery,
  useGetVehiclesQuery,
  useStartTripMutation,
  usePingTripMutation,
  useEndTripMutation,
} from '../../store/api/apiSlice';

// Far enough apart that a bus stopped at a light does not spam the server, close enough that the
// parent watching at home sees it actually moving.
const PING_DISTANCE_METRES = 50;
const PING_INTERVAL_MS = 15000;

const DRIVER_ROLES = ['Driver', 'Super Admin', 'School Admin', 'Transport Manager'];

/**
 * The driver's end of bus tracking: start a trip, feed positions while driving, end it.
 *
 * **This tracks only while the app is open and on screen — and it says so, loudly.** Background
 * tracking (phone in a pocket, screen off) needs `expo-task-manager` plus a development build;
 * Expo Go cannot do it at all. Rather than register a background task that silently does nothing,
 * the screen keeps itself awake, tells the driver plainly what is required of them, and stops
 * pretending the moment they leave.
 *
 * That honesty matters more here than anywhere else in the app: a parent is standing at a bus stop
 * reading the dot this screen produces. A tracker that quietly stopped is worse than one that
 * never started, because the parent has no way to tell the difference.
 */
export function DriverTripScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const ctx = useModuleContext();

  const trip = useGetMyTripQuery();
  const routes = useGetTransportRoutesQuery();
  const vehicles = useGetVehiclesQuery();

  const [startTrip, { isLoading: starting }] = useStartTripMutation();
  const [pingTrip] = usePingTripMutation();
  const [endTrip, { isLoading: ending }] = useEndTripMutation();

  const [routeId, setRouteId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [direction, setDirection] = useState('pickup');

  const [permission, setPermission] = useState('unknown');
  const [sent, setSent] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

  const watcher = useRef(null);
  const activeTrip = trip.data;
  const tripId = activeTrip?.tripId;

  const routeList = Array.isArray(routes.data) ? routes.data : routes.data?.routes ?? [];
  const vehicleList = Array.isArray(vehicles.data) ? vehicles.data : vehicles.data?.vehicles ?? [];

  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
    deactivateKeepAwake();
  }, []);

  const startWatching = useCallback(async () => {
    if (!tripId || watcher.current) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    if (status !== 'granted') return;

    // Without this the screen sleeps, location updates stop, and the bus silently freezes on the
    // parent's screen while the driver believes it is still being tracked.
    await activateKeepAwakeAsync();

    watcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: PING_DISTANCE_METRES,
        timeInterval: PING_INTERVAL_MS,
      },
      (position) => {
        pingTrip({
          id: tripId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speedKph: position.coords.speed != null && position.coords.speed >= 0
            ? position.coords.speed * 3.6
            : null,
          headingDeg: position.coords.heading >= 0 ? position.coords.heading : null,
          // The time the FIX was taken, not the time it was uploaded. The backend uses this to
          // order pings, so a position recorded in a tunnel and sent on the other side does not
          // drag the bus backwards.
          recordedAt: new Date(position.timestamp).toISOString(),
        })
          .unwrap()
          .then(() => {
            setSent((n) => n + 1);
            setLastSentAt(new Date());
            setTrackingError(null);
          })
          .catch(() => setTrackingError('A position could not be sent. Retrying on the next fix.'));
      }
    );
  }, [tripId, pingTrip]);

  // Track only while a trip is running AND this screen is in the foreground.
  useEffect(() => {
    if (tripId) startWatching();
    else stopWatching();
    return stopWatching;
  }, [tripId, startWatching, stopWatching]);

  // Leaving the app stops the watcher — so say so rather than letting it look alive.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (tripId) startWatching();
      } else {
        stopWatching();
      }
    });
    return () => sub.remove();
  }, [tripId, startWatching, stopWatching]);

  const onStart = () => {
    if (!routeId || !vehicleId) return;
    startTrip({ routeId, vehicleId, direction })
      .unwrap()
      .then(() => {
        setSent(0);
        setLastSentAt(null);
      })
      // errorMiddleware.js already alerts on a rejected mutation — "this vehicle is not assigned
      // to you" surfaces there.
      .catch(() => {});
  };

  const onEnd = () => {
    stopWatching();
    endTrip(tripId).unwrap().catch(() => {});
  };

  if (!ctx.is(...DRIVER_ROLES)) {
    return (
      <ScreenContainer>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xxxl, textAlign: 'center' }]}>
          Only a driver can run a bus trip.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={trip.isLoading || routes.isLoading || vehicles.isLoading}
        isError={trip.isError}
        error={trip.error}
        onRetry={trip.refetch}
      >
        {activeTrip ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>{activeTrip.routeName ?? 'Trip'}</Text>
              <StatusPill label={activeTrip.direction} color="#15803D" />
            </View>

            <Panel>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Positions sent</Text>
              <Text style={[typography.h2, { color: colors.primary, marginTop: 2 }]}>{sent}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                {lastSentAt ? `Last sent ${timeAgo(lastSentAt)}` : 'Waiting for the first position…'}
                {activeTrip.startedAt ? ` · started ${formatTime(activeTrip.startedAt)}` : ''}
              </Text>
            </Panel>

            {permission !== 'granted' && permission !== 'unknown' ? (
              <Panel>
                <Text style={[typography.bodyStrong, { color: colors.danger }]}>Location permission denied</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Nobody can see this bus until location is allowed for this app.
                </Text>
              </Panel>
            ) : null}

            {trackingError ? (
              <Text style={[typography.caption, { color: colors.warning, marginBottom: spacing.md }]}>
                {trackingError}
              </Text>
            ) : null}

            {/* The single most important sentence on this screen. */}
            <Panel>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>Keep this screen open</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                Tracking only works while this screen is showing. If you switch apps or lock the
                phone, the bus stops moving for parents watching it — it does not keep tracking in
                the background.
              </Text>
            </Panel>

            <Button mode="contained" onPress={onEnd} loading={ending} disabled={ending} buttonColor={colors.danger}>
              End trip
            </Button>
          </>
        ) : (
          <>
            <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Start a trip</Text>

            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ROUTE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
              {routeList.map((route) => (
                <Chip
                  key={route._id}
                  selected={route._id === routeId}
                  showSelectedCheck={false}
                  onPress={() => setRouteId(route._id)}
                  compact
                >
                  {route.name}
                </Chip>
              ))}
            </View>

            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>VEHICLE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
              {vehicleList.map((vehicle) => (
                <Chip
                  key={vehicle._id}
                  selected={vehicle._id === vehicleId}
                  showSelectedCheck={false}
                  onPress={() => setVehicleId(vehicle._id)}
                  compact
                >
                  {vehicle.vehicleNumber ?? vehicle.registrationNumber ?? vehicle.name}
                </Chip>
              ))}
            </View>

            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>DIRECTION</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
              {['pickup', 'drop'].map((value) => (
                <Chip
                  key={value}
                  selected={value === direction}
                  showSelectedCheck={false}
                  onPress={() => setDirection(value)}
                  compact
                >
                  {value === 'pickup' ? 'Morning pickup' : 'Afternoon drop'}
                </Chip>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={onStart}
              loading={starting}
              disabled={starting || !routeId || !vehicleId}
            >
              Start trip
            </Button>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
              Once started, keep this screen open for the whole journey. Your phone is the only
              thing reporting where the bus is.
            </Text>
          </>
        )}
      </QueryState>
    </ScreenContainer>
  );
}
