import React from "react";

const C = {
  primary: "#2563EB",
  success: "#22C55E",
  danger:  "#EF4444",
  accent:  "#14B8A6",
  warning: "#F59E0B",
  border:  "#E2E8F0",
  text:    "#0F172A",
  textSub: "#64748B",
  textMuted: "#94A3B8",
  surface: "#F8FAFC",
};

/*
  Pure SVG geofence visualization — no external map library.
  Props:
    userPosition  { lat, lng, accuracy }
    schoolCoords  { lat, lng, radius }  | null
    distanceInfo  { dist, radius, inside, pct } | null
*/
const AttendanceMap = ({ userPosition, schoolCoords, distanceInfo }) => {
  const SIZE   = 260;        // SVG viewBox size
  const CX     = SIZE / 2;   // centre x
  const CY     = SIZE / 2;   // centre y
  const GFENCE = (SIZE / 2) - 28; // geofence circle visual radius

  /* position user dot relative to school centre */
  let userDotX = CX;
  let userDotY = CY;
  let showUser = false;

  if (distanceInfo && schoolCoords) {
    showUser = true;
    const { dist, radius } = distanceInfo;
    if (dist === 0) {
      userDotX = CX;
      userDotY = CY;
    } else {
      /* bearing: use lat/lng difference to get approximate direction */
      const dLat = userPosition.lat - schoolCoords.lat;
      const dLng = userPosition.lng - schoolCoords.lng;
      const angle = Math.atan2(dLng, dLat); // radians, North=0

      /* scale: if dist <= radius, place inside; otherwise outside */
      const visualDist = Math.min(dist / radius, 1.5) * GFENCE;
      userDotX = CX + Math.sin(angle) * visualDist;
      userDotY = CY - Math.cos(angle) * visualDist;
    }
  } else if (userPosition) {
    showUser = true;
    /* no school configured — put user in centre */
  }

  const inside = distanceInfo ? distanceInfo.inside : true;
  const fenceColor = inside ? C.success : C.danger;
  const userColor  = inside ? C.primary : C.danger;

  return (
    <div style={{
      width: "100%", height: "100%", background: C.surface,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "8px 0",
    }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        style={{ maxHeight: 220, overflow: "visible" }}
      >
        {/* Outer subtle grid rings */}
        {[0.33, 0.66, 1].map((s) => (
          <circle
            key={s}
            cx={CX} cy={CY}
            r={GFENCE * s}
            fill="none"
            stroke={C.border}
            strokeWidth={s === 1 ? 0 : 0.5}
            strokeDasharray={s === 1 ? "0" : "3 4"}
            opacity={0.6}
          />
        ))}

        {/* ── Geofence circle ── */}
        {schoolCoords && (
          <>
            <circle
              cx={CX} cy={CY} r={GFENCE}
              fill={fenceColor + "14"}
              stroke={fenceColor}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            {/* Animated pulse on the geofence ring */}
            <circle
              cx={CX} cy={CY} r={GFENCE}
              fill="none"
              stroke={fenceColor}
              strokeWidth={3}
              opacity={0.3}
            >
              <animate attributeName="r" from={GFENCE} to={GFENCE + 8} dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from={0.3} to={0} dur="2s" repeatCount="indefinite" />
            </circle>

            {/* School centre dot */}
            <circle cx={CX} cy={CY} r={8} fill={C.accent} opacity={0.9} />
            <circle cx={CX} cy={CY} r={4} fill="#fff" />
            {/* S label */}
            <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fontWeight="800" fill="#fff">S</text>
          </>
        )}

        {/* No school configured — show placeholder */}
        {!schoolCoords && (
          <>
            <circle cx={CX} cy={CY} r={GFENCE}
              fill={C.accent + "10"} stroke={C.accent} strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={CX} y={CY - 14} textAnchor="middle" fontSize="11" fill={C.textMuted}>No geofence set</text>
            <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fill={C.textMuted}>Check-in allowed</text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontSize="10" fill={C.textMuted}>from anywhere</text>
          </>
        )}

        {/* ── User position dot ── */}
        {showUser && (
          <>
            {/* Line from school to user (if school exists) */}
            {schoolCoords && distanceInfo && distanceInfo.dist > 0 && (
              <line
                x1={CX} y1={CY}
                x2={userDotX} y2={userDotY}
                stroke={userColor} strokeWidth={1}
                strokeDasharray="3 3" opacity={0.5}
              />
            )}

            {/* User dot outer ring */}
            <circle cx={userDotX} cy={userDotY} r={13}
              fill={userColor + "22"} stroke={userColor} strokeWidth={1.5} />
            {/* User dot */}
            <circle cx={userDotX} cy={userDotY} r={7} fill={userColor} />
            <circle cx={userDotX} cy={userDotY} r={3} fill="#fff" />
            {/* U label */}
            <text x={userDotX} y={userDotY + 0.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="5" fontWeight="800" fill="#fff">U</text>

            {/* Pulsing ring on user */}
            <circle cx={userDotX} cy={userDotY} r={13} fill="none" stroke={userColor} strokeWidth={2} opacity={0.4}>
              <animate attributeName="r" from="13" to="22" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Cardinal directions */}
        {[
          { label: "N", x: CX,       y: 10      },
          { label: "S", x: CX,       y: SIZE - 6 },
          { label: "E", x: SIZE - 8, y: CY + 4  },
          { label: "W", x: 8,        y: CY + 4  },
        ].map((d) => (
          <text key={d.label} x={d.x} y={d.y} textAnchor="middle"
            fontSize="9" fontWeight="700" fill={C.textMuted}>
            {d.label}
          </text>
        ))}
      </svg>

      {/* Bottom info bar */}
      <div style={{
        display: "flex", gap: 18, marginTop: 4, fontSize: 11,
        color: C.textSub, justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
          School
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary }} />
          You
        </div>
        {distanceInfo && (
          <div style={{
            color: fenceColor, fontWeight: 700,
          }}>
            {distanceInfo.inside ? "Inside" : "Outside"} ({distanceInfo.dist}m)
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMap;
