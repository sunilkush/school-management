import React from "react";
import GeofenceMap from "../../components/maps/GeofenceMap";
import { MAP_COLORS } from "../../components/maps/osm";

/*
  Where you are against the school's check-in radius, on a real (Leaflet / OpenStreetMap) map.

  This used to be a hand-drawn SVG that placed "you" by compass direction only, with the distance
  capped at one and a half radii — so someone 5 km away was drawn standing just outside the gate.
  Distances on this map are the real ones.

  Props:
    userPosition  { lat, lng, accuracy }
    schoolCoords  { lat, lng, radius }  | null
    distanceInfo  { dist, radius, inside, pct } | null
*/
const Dot = ({ color }) => (
  <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
);

const AttendanceMap = ({ userPosition, schoolCoords, distanceInfo, height = 240 }) => {
  const inside = distanceInfo ? distanceInfo.inside : true;
  const youColor = inside ? MAP_COLORS.primary : MAP_COLORS.danger;

  const points = userPosition
    ? [{
        key: "you",
        lat: userPosition.lat,
        lng: userPosition.lng,
        accuracy: userPosition.accuracy,
        color: youColor,
        label: distanceInfo ? `You · ${distanceInfo.dist}m from school` : "You",
      }]
    : [];

  return (
    <div>
      <GeofenceMap school={schoolCoords} points={points} height={height} />

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 8, fontSize: 11,
        color: "var(--text-secondary)", justifyContent: "center", alignItems: "center",
      }}>
        {schoolCoords ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Dot color={MAP_COLORS.school} /> School · {schoolCoords.radius}m zone
          </span>
        ) : (
          <span>No geofence set — check-in is allowed from anywhere</span>
        )}
        {userPosition && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Dot color={youColor} /> You
            {userPosition.accuracy ? ` (±${Math.round(userPosition.accuracy)}m)` : ""}
          </span>
        )}
        {distanceInfo && (
          <span style={{ fontWeight: 700, color: inside ? "var(--success)" : "var(--danger)" }}>
            {inside ? "Inside" : "Outside"} ({distanceInfo.dist}m)
          </span>
        )}
      </div>
    </div>
  );
};

export default AttendanceMap;
