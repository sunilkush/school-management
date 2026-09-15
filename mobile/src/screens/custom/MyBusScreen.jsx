import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { formatTime, timeAgo } from '../../utils/format';
import { useGetMyBusQuery } from '../../store/api/apiSlice';
import { LeafletMap } from '../../components/map/LeafletMap';
import { MAP_COLORS } from '../../components/map/leafletHtml';

// Past this, a position is old enough that presenting it as "where the bus is" would be a lie.
// Matches the backend's own view that a stale fix is worse than no fix.
const STALE_AFTER_SECONDS = 180;

function Line({ label, value, tone }) {
  const { colors, typography, spacing } = useAppTheme();
  if (!value) return null;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.body, { color: tone ?? colors.text, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

/**
 * What the map draws for a running trip: the route's stops (reached ones ticked, the child's own
 * starred and labelled), the planned route, and the bus.
 *
 * An out-of-date position is drawn grey and labelled with its age, and the map does not follow it —
 * the words above say "this position is out of date", and the map must not contradict them by
 * presenting it as where the bus is now. Returns null when there is nothing to put on a map.
 */
export function busMapLayers(data, isStale) {
  const stops = (data?.stops ?? [])
    .filter((s) => Number.isFinite(s?.lat) && Number.isFinite(s?.lng))
    .sort((a, b) => a.sequence - b.sequence);
  const fix = data?.lastLocation;
  const bus = Number.isFinite(fix?.lat) && Number.isFinite(fix?.lng) ? { lat: fix.lat, lng: fix.lng } : null;
  if (!stops.length && !bus) return null;

  const reached = new Set((data?.stopArrivals ?? []).map((s) => s.sequence));
  const mine = data?.stopSequence;

  const markers = stops.map((stop) => {
    const isMine = stop.sequence === mine;
    const done = reached.has(stop.sequence);
    return {
      lat: stop.lat,
      lng: stop.lng,
      color: isMine ? MAP_COLORS.warning : done ? MAP_COLORS.success : MAP_COLORS.muted,
      glyph: isMine ? '★' : done ? '✓' : String(stop.sequence + 1),
      size: isMine ? 30 : 22,
      label: isMine ? `Your stop: ${stop.name}` : `${stop.sequence + 1}. ${stop.name}`,
      labelAlways: isMine,
    };
  });
  if (bus) {
    markers.push({
      ...bus,
      color: isStale ? MAP_COLORS.stale : MAP_COLORS.primary,
      glyph: '\u{1F68C}',
      size: 34,
      label: isStale ? `Last known position · ${timeAgo(fix.recordedAt)}` : 'Bus',
      labelAlways: isStale,
    });
  }

  return {
    markers,
    circles: stops.map((stop) => ({
      lat: stop.lat,
      lng: stop.lng,
      radius: stop.radiusMeters || 150,
      color: reached.has(stop.sequence) ? MAP_COLORS.success : MAP_COLORS.muted,
      weight: 1,
    })),
    lines: stops.length > 1 ? [{ points: stops, color: MAP_COLORS.muted, dashed: true }] : [],
    follow: bus && !isStale ? bus : null,
  };
}

function Centered({ icon, title, body }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', marginTop: spacing.xxxl }}>
      <Icon source={icon} size={46} color={colors.textMuted} />
      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>{title}</Text>
      {body ? (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Where my child's bus is.
 *
 * It answers the question a parent opens it for — *has it left, where is it, when will it reach my
 * stop* — in words first, then on a map. The map is Leaflet on OpenStreetMap inside a WebView, the
 * same map the web portal draws (decided 2026-09-15: no Google Maps API key). The words stay on top
 * because they still work when the map cannot load.
 *
 * Everything shown here comes from the backend's own honest reporting, and none of it is
 * embellished:
 * - The only position source is the **driver's phone**. There is no hardware tracker, so when the
 *   driver's app is closed or out of signal, positions simply stop arriving.
 * - A fix older than a few minutes is labelled as old rather than drawn as the bus's location.
 * - The ETA is explicitly an **estimate** — straight lines between stops and a flat assumed speed.
 *   Good enough to decide when to walk to the stop, not good enough to quote to the minute.
 * - When there is no ETA the backend says *why* (the stop is not on the route map, the bus has not
 *   reported yet, the stop is already passed), and that reason is shown verbatim.
 */
export function MyBusScreen() {
  const { colors, typography, spacing } = useAppTheme();
  // No polling interval: the API is rate limited at ~800 requests per window and a bus screen left
  // open would burn through it. Pull to refresh, and it refetches on focus.
  const { data, isLoading, isError, error, refetch, isFetching } = useGetMyBusQuery();

  const ageSeconds = data?.lastLocation?.recordedAt
    ? Math.round((Date.now() - new Date(data.lastLocation.recordedAt).getTime()) / 1000)
    : null;
  const isStale = ageSeconds != null && ageSeconds > STALE_AFTER_SECONDS;

  const map = busMapLayers(data, isStale);

  return (
    <ScreenContainer scrollable>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={!data}>
        <>
          {data?.assigned === false ? (
            <Centered icon="bus-alert" title="No school transport" body="This student is not assigned to a bus route." />
          ) : data?.running === false ? (
            <Centered
              icon="bus-clock"
              title="The bus is not running"
              body={
                data?.routeName
                  ? `Nothing is on the road for ${data.routeName} right now. This page updates once a driver starts a trip.`
                  : 'This page updates once a driver starts a trip.'
              }
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>{data?.routeName ?? 'Your bus'}</Text>
                <StatusPill label={data?.direction ?? 'running'} color="#15803D" />
              </View>

              <Panel>
                {/* The headline answer. "About" is the backend's own framing, kept word for word. */}
                {data?.eta?.available ? (
                  <>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      Arriving at {data?.stopName ?? 'your stop'}
                    </Text>
                    <Text style={[typography.h2, { color: colors.primary, marginTop: 2 }]}>
                      in about {data.eta.minutes} min
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                      {data.eta.stopsAway} stop{data.eta.stopsAway === 1 ? '' : 's'} away · estimated, not exact
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {data?.stopName ? `Your stop: ${data.stopName}` : 'Your stop'}
                    </Text>
                    {/* The backend's own explanation, shown as written — a blank here would just
                        look broken. */}
                    <Text style={[typography.body, { color: colors.text, marginTop: 4 }]}>
                      {data?.eta?.reason ?? 'No arrival time available'}
                    </Text>
                    {data?.eta?.arrivedAt ? (
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                        Reached at {formatTime(data.eta.arrivedAt)}
                      </Text>
                    ) : null}
                  </>
                )}
              </Panel>

              {map ? (
                <LeafletMap
                  markers={map.markers}
                  circles={map.circles}
                  lines={map.lines}
                  follow={map.follow}
                  height={280}
                  style={{ marginBottom: spacing.lg }}
                />
              ) : null}

              <Panel>
                <Line
                  label="Last reported"
                  value={
                    data?.lastLocation?.recordedAt
                      ? `${timeAgo(data.lastLocation.recordedAt)}${isStale ? ' — this position is out of date' : ''}`
                      : 'The bus has not reported a position yet'
                  }
                  tone={isStale ? colors.warning : undefined}
                />
                <Line
                  label="Speed"
                  value={
                    // Speed from an old fix is not the bus's speed now, so it is withheld rather
                    // than shown next to a stale timestamp.
                    !isStale && data?.lastLocation?.speedKph != null
                      ? `${Math.round(data.lastLocation.speedKph)} km/h`
                      : null
                  }
                />
                <Line
                  label="Stops reached so far"
                  value={
                    data?.stopArrivals?.length
                      ? data.stopArrivals.map((stop) => stop.name).join(' → ')
                      : 'None yet'
                  }
                />
                <Line
                  label="Started"
                  value={data?.startedAt ? formatTime(data.startedAt) : null}
                />
              </Panel>

              {data?.hasMappedStops === false ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  This route has no stops on the map yet, so arrival times cannot be worked out. The
                  school office can add them.
                </Text>
              ) : null}

              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
                Positions come from the driver’s phone. If their app is closed or out of signal,
                updates stop until it reconnects.
                {isFetching ? ' Refreshing…' : ' Pull down to refresh.'}
              </Text>
            </>
          )}
        </>
      </QueryState>
    </ScreenContainer>
  );
}
