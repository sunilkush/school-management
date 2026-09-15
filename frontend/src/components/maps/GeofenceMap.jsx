import React, { useEffect, useRef } from "react";
import { Circle, MapContainer, Marker, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { DEFAULT_CENTRE, MAP_COLORS, pinIcon } from "./osm";
import OsmTileLayer from "./OsmTileLayer";

/**
 * The school, the radius a self check-in must fall inside, and any positions to judge against it —
 * a person's current fix, or where a recorded check-in and check-out were taken.
 *
 * With `editable`, clicking the map or dragging the school pin reports the new spot through
 * `onPick(lat, lng)`; the caller decides what to do with it (the geofence form fills its fields).
 *
 * Props
 *   school    { lat, lng, radius } | null
 *   points    [{ key, lat, lng, label, color, glyph, accuracy }]
 *   editable  boolean
 *   onPick    (lat, lng) => void
 *   height    number (px)
 */

const SCHOOL_ICON = pinIcon(MAP_COLORS.school, "\u{1F3EB}", 34);
const DRAG_SCHOOL_ICON = pinIcon(MAP_COLORS.school, "\u{1F3EB}", 40);

// One icon per colour and glyph, so a re-render does not hand Leaflet a new icon to swap in.
const pointIcons = new Map();
const pointIcon = (color, glyph) => {
  const key = `${color}|${glyph}`;
  if (!pointIcons.has(key)) pointIcons.set(key, pinIcon(color, glyph, 26));
  return pointIcons.get(key);
};

const valid = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);

/** Frames the school's circle and every point together, each time the set of things changes. */
const FitToContent = ({ bounds, fitKey }) => {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return undefined;
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 17 });
    };
    fit();
    // Again once the container has its final size (see SettleSize) — a fit made against a box
    // that was still opening frames the wrong area.
    const timer = setTimeout(fit, 260);
    return () => clearTimeout(timer);
    // Keyed on what is shown, not on the bounds object, which is new on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  return null;
};

/**
 * While picking: move the view to the school only when it was set from outside the map (typed in,
 * or detected from GPS). A spot the admin just clicked is already in view, and re-zooming the map
 * after every click would throw away the zoom they chose to place it precisely.
 */
const FollowPicked = ({ school, pickedRef }) => {
  const map = useMap();
  const lat = school?.lat;
  const lng = school?.lng;
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const picked = pickedRef.current;
    if (picked && picked.lat === lat && picked.lng === lng) return;
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [map, lat, lng, pickedRef]);
  return null;
};

/**
 * A map mounted inside a drawer, or a panel that has just been expanded, can measure its box before
 * the box has its final size and then draws grey tiles. Measure again once things have settled.
 */
const SettleSize = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const ClickToPick = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const round6 = (n) => Number(n.toFixed(6));

const GeofenceMap = ({ school = null, points = [], editable = false, onPick, height = 300 }) => {
  const pickedRef = useRef(null);
  const hasSchool = valid(school);
  const shownPoints = points.filter(valid);

  const pick = (lat, lng) => {
    const spot = { lat: round6(lat), lng: round6(lng) };
    pickedRef.current = spot;
    onPick?.(spot.lat, spot.lng);
  };

  let bounds = null;
  if (hasSchool) bounds = L.latLng(school.lat, school.lng).toBounds((school.radius || 200) * 2);
  for (const p of shownPoints) {
    const pb = L.latLng(p.lat, p.lng).toBounds(Math.max((p.accuracy || 0) * 2, 60));
    bounds = bounds ? bounds.extend(pb) : pb;
  }

  const fitKey = [
    hasSchool ? `${school.lat},${school.lng},${school.radius}` : "-",
    ...shownPoints.map((p) => `${p.key}:${p.lat},${p.lng}`),
  ].join("|");

  const centre = hasSchool ? [school.lat, school.lng] : shownPoints[0] ? [shownPoints[0].lat, shownPoints[0].lng] : DEFAULT_CENTRE;
  // Nothing to show yet (a school still picking its spot): open wide rather than on one random city.
  const zoom = hasSchool || shownPoints.length ? 16 : 5;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer
        center={centre}
        zoom={zoom}
        style={{ height, width: "100%", cursor: editable ? "crosshair" : undefined }}
        scrollWheelZoom
      >
        <OsmTileLayer />
        <SettleSize />

        {editable ? (
          <>
            <ClickToPick onPick={pick} />
            <FollowPicked school={hasSchool ? school : null} pickedRef={pickedRef} />
          </>
        ) : (
          <FitToContent bounds={bounds} fitKey={fitKey} />
        )}

        {hasSchool && (
          <>
            <Circle
              center={[school.lat, school.lng]}
              radius={school.radius || 200}
              pathOptions={{ color: MAP_COLORS.school, weight: 2, fillOpacity: 0.08 }}
            />
            <Marker
              position={[school.lat, school.lng]}
              icon={editable ? DRAG_SCHOOL_ICON : SCHOOL_ICON}
              draggable={editable}
              eventHandlers={
                editable
                  ? { dragend: (e) => { const ll = e.target.getLatLng(); pick(ll.lat, ll.lng); } }
                  : undefined
              }
            >
              <Tooltip>{`School · check-in within ${school.radius || 200}m`}</Tooltip>
            </Marker>
          </>
        )}

        {shownPoints.map((p) => (
          <React.Fragment key={p.key}>
            {/* How far the fix could be off. A reading that is "outside" by less than its own
                accuracy is not clearly outside at all, and this makes that visible. */}
            {p.accuracy > 0 && (
              <Circle
                center={[p.lat, p.lng]}
                radius={p.accuracy}
                pathOptions={{ color: p.color || MAP_COLORS.primary, weight: 1, fillOpacity: 0.1, dashArray: "4 4" }}
              />
            )}
            {hasSchool && (
              <Polyline
                positions={[[school.lat, school.lng], [p.lat, p.lng]]}
                pathOptions={{ color: p.color || MAP_COLORS.primary, weight: 2, dashArray: "6 6", opacity: 0.8 }}
              />
            )}
            <Marker position={[p.lat, p.lng]} icon={pointIcon(p.color || MAP_COLORS.primary, p.glyph || "")}>
              {p.label ? <Tooltip>{p.label}</Tooltip> : null}
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default GeofenceMap;
