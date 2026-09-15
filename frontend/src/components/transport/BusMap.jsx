import React, { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import { DEFAULT_CENTRE, MAP_COLORS, pinIcon } from "../maps/osm";
import OsmTileLayer from "../maps/OsmTileLayer";

/**
 * The one map every bus view uses — office, driver and parent — so the three never draw the same
 * trip differently.
 *
 * Tiles and markers come from the shared Leaflet / OpenStreetMap setup in components/maps/osm.js,
 * which every map in the portal uses: no API key, but it needs an internet connection.
 */

const BUS_ICON = pinIcon(MAP_COLORS.primary, "\u{1F68C}");
const STOP_DONE_ICON = pinIcon(MAP_COLORS.success, "✓", 26);
const STOP_ICON = pinIcon(MAP_COLORS.muted, "", 20);

/** Keeps the bus in view as it moves, without fighting a user who has panned deliberately. */
const FollowBus = ({ position, follow }) => {
  const map = useMap();
  const lat = position?.[0];
  const lng = position?.[1];
  useEffect(() => {
    if (follow && lat != null && lng != null) map.panTo([lat, lng], { animate: true });
  }, [map, follow, lat, lng]);
  return null;
};

/** Frames the whole route the first time there is something to frame. */
const FitOnce = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    // Deliberately runs only on the first usable set of bounds — refitting on every ping would
    // yank the map out from under anyone trying to look at something.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, bounds?.length]);
  return null;
};

const BusMap = ({
  stops = [],
  trail = [],
  bus = null,
  arrivedSequences = [],
  height = 420,
  follow = true,
}) => {
  const arrived = useMemo(() => new Set(arrivedSequences), [arrivedSequences]);

  const busPos = bus?.lat != null ? [bus.lat, bus.lng] : null;
  const trailPositions = useMemo(() => trail.map((p) => [p.lat, p.lng]), [trail]);
  const bounds = useMemo(() => {
    const points = [...stops.map((s) => [s.lat, s.lng]), ...trailPositions];
    if (busPos) points.push(busPos);
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, trailPositions.length, busPos?.[0], busPos?.[1]]);

  const centre = busPos || (stops.length ? [stops[0].lat, stops[0].lng] : DEFAULT_CENTRE);

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border-muted)" }}>
      <MapContainer center={centre} zoom={13} style={{ height, width: "100%" }} scrollWheelZoom>
        <OsmTileLayer />

        <FitOnce bounds={bounds} />
        <FollowBus position={busPos} follow={follow} />

        {/* The route as planned, so a bus that has wandered off it is obvious. */}
        {stops.length > 1 && (
          <Polyline
            positions={stops.map((s) => [s.lat, s.lng])}
            pathOptions={{ color: "#94A3B8", weight: 3, dashArray: "6 8" }}
          />
        )}

        {/* Where the bus actually went. */}
        {trailPositions.length > 1 && (
          <Polyline positions={trailPositions} pathOptions={{ color: "#2563EB", weight: 4 }} />
        )}

        {stops.map((stop) => (
          <React.Fragment key={`${stop.sequence}-${stop.name}`}>
            <Circle
              center={[stop.lat, stop.lng]}
              radius={stop.radiusMeters || 150}
              pathOptions={{
                color: arrived.has(stop.sequence) ? "#16A34A" : "#94A3B8",
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
            <Marker
              position={[stop.lat, stop.lng]}
              icon={arrived.has(stop.sequence) ? STOP_DONE_ICON : STOP_ICON}
            >
              <Tooltip>{`${stop.sequence + 1}. ${stop.name}`}</Tooltip>
            </Marker>
          </React.Fragment>
        ))}

        {busPos && (
          <Marker position={busPos} icon={BUS_ICON}>
            <Popup>
              <b>Bus</b>
              <br />
              {bus.speedKph != null ? `${Math.round(bus.speedKph)} km/h` : "Speed not reported"}
              <br />
              {bus.recordedAt ? new Date(bus.recordedAt).toLocaleTimeString("en-IN") : ""}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default BusMap;
