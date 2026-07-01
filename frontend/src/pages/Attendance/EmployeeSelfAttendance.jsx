import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Alert, Button, Calendar, Col, Progress, Row, Spin, Tag, Timeline, Tooltip, message,
} from "antd";
import {
  AimOutlined, CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined,
  LoginOutlined, LogoutOutlined, ReloadOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSelfStatus, fetchSelfHistory, selfCheckIn, selfCheckOut,
  clearAttendanceFeedback, fetchMyAttendance,
} from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper } from "../../styles/pageStyles";
import AttendanceMap from "./AttendanceMap";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6",  accentLight: "#CCFBF1",
  success: "#22C55E", successLight: "#DCFCE7",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  danger:  "#EF4444", dangerLight:  "#FEE2E2",
  border:  "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const PANEL = {
  background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
  padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const GPS_STATE = { IDLE: "idle", LOCATING: "locating", READY: "ready", ERROR: "error" };

const STATUS_CFG = {
  present: { color: C.success, bg: C.successLight, border: "#86EFAC", label: "Present"  },
  absent:  { color: "#EF4444", bg: "#FEE2E2",      border: "#FCA5A5", label: "Absent"   },
  late:    { color: C.warning, bg: C.warningLight,  border: "#FCD34D", label: "Late"     },
  halfday: { color: "#8B5CF6", bg: "#EDE9FE",      border: "#C4B5FD", label: "Half Day" },
  leave:   { color: "#06B6D4", bg: "#CFFAFE",      border: "#67E8F9", label: "On Leave" },
};

function fmtTime(d) {
  return d ? dayjs(d).format("hh:mm A") : "—";
}

function workingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const diff = new Date(checkOut) - new Date(checkIn);
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

/* ─── Punch Button ─────────────────────────────────────── */
const PunchButton = ({ checkedIn, checkedOut, canAct, distOk, loading, onPunch }) => {
  const done = checkedIn && checkedOut;
  const label = done
    ? "Done for Today"
    : checkedIn
    ? "Punch Out"
    : "Punch In";

  const colors = done
    ? { bg: "#F1F5F9", text: C.textMuted, border: C.border, glow: "none" }
    : checkedIn
    ? { bg: C.danger,   text: "#fff", border: C.danger,   glow: `0 0 24px ${C.danger}55` }
    : { bg: C.success,  text: "#fff", border: C.success,  glow: `0 0 24px ${C.success}55` };

  // distOk is shown as a warning only — backend does the authoritative geofence check.
  // GPS accuracy variance (5-30m) would otherwise block teachers who are physically inside.
  const disabled = done || !canAct;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "4px 0 8px" }}>
      {/* outer ring pulse */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        {!done && canAct && (
          <span style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: `2px solid ${colors.bg}`,
            animation: "punching 2s ease-in-out infinite",
            opacity: 0.6,
            pointerEvents: "none",
          }} />
        )}
        <button
          onClick={!disabled && !loading ? onPunch : undefined}
          disabled={disabled || loading}
          style={{
            width: 120, height: 120, borderRadius: "50%",
            background: disabled ? "#F1F5F9" : colors.bg,
            border: `3px solid ${disabled ? C.border : colors.border}`,
            color: disabled ? C.textMuted : colors.text,
            fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
            boxShadow: disabled ? "none" : colors.glow,
            transition: "all 0.25s",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            letterSpacing: "0.02em",
          }}
        >
          {loading ? (
            <Spin size="default" style={{ color: "#fff" }} />
          ) : (
            <>
              {done ? (
                <CheckCircleOutlined style={{ fontSize: 28 }} />
              ) : checkedIn ? (
                <LogoutOutlined style={{ fontSize: 28 }} />
              ) : (
                <LoginOutlined style={{ fontSize: 28 }} />
              )}
              <span style={{ fontSize: 13 }}>{label}</span>
            </>
          )}
        </button>
      </div>

      {!canAct && !done && (
        <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>
          Enable GPS to punch
        </div>
      )}
      {canAct && !distOk && !done && (
        <div style={{ fontSize: 12, color: C.danger, textAlign: "center", display: "flex", gap: 4, alignItems: "center" }}>
          <WarningOutlined /> Outside geofence
        </div>
      )}

      <style>{`
        @keyframes punching {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.2); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────── */
const EmployeeSelfAttendance = () => {
  const dispatch = useDispatch();
  const { selfStatus, selfHistory, selfLoading, geofenceSettings, error: reduxError } =
    useSelector((s) => s.attendance);

  const [gpsState, setGpsState] = useState(GPS_STATE.IDLE);
  const [position, setPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [actionLoading, setAL]  = useState(false);
  const [calMonth, setCalMonth] = useState(dayjs());
  const watchRef = useRef(null);

  /* ── GPS ── */
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState(GPS_STATE.ERROR);
      setGpsError("Geolocation not supported in this browser.");
      return;
    }
    setGpsState(GPS_STATE.LOCATING);
    setGpsError(null);
    dispatch(clearAttendanceFeedback()); // clear any stale punch rejection error
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState(GPS_STATE.READY);
      },
      (err) => { setGpsState(GPS_STATE.ERROR); setGpsError(err.message || "Unable to get location"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setGpsState(GPS_STATE.IDLE);
    setPosition(null);
  }, []);

  /* ── load on mount + auto-start GPS ── */
  useEffect(() => {
    dispatch(clearAttendanceFeedback());
    dispatch(fetchSelfStatus());
    dispatch(fetchSelfHistory({ month: dayjs().format("YYYY-MM") }));
    startGPS();
  }, [dispatch, startGPS]);

  useEffect(() => {
    if (calMonth) dispatch(fetchSelfHistory({ month: calMonth.format("YYYY-MM") }));
  }, [calMonth, dispatch]);

  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  /* ── distance calc ── */
  const distanceInfo = useMemo(() => {
    if (!position || !geofenceSettings?.location?.lat) return null;
    const { lat: sLat, lng: sLng, geofenceRadius = 200 } = geofenceSettings.location;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(position.lat - sLat);
    const dLon = toRad(position.lng - sLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(sLat)) * Math.cos(toRad(position.lat)) * Math.sin(dLon / 2) ** 2;
    const dist = Math.round(R * 2 * Math.asin(Math.sqrt(a)));
    return { dist, radius: geofenceRadius, inside: dist <= geofenceRadius, pct: Math.min(100, Math.round((dist / geofenceRadius) * 100)) };
  }, [position, geofenceSettings]);

  /* ── Auto-clear stale rejection error once GPS confirms teacher is inside ── */
  useEffect(() => {
    if (reduxError && distanceInfo?.inside) {
      dispatch(clearAttendanceFeedback());
    }
  }, [distanceInfo?.inside, reduxError, dispatch]);

  const schoolCoords = useMemo(() => {
    const loc = geofenceSettings?.location;
    if (loc?.lat != null && loc?.lng != null) return { lat: loc.lat, lng: loc.lng, radius: loc.geofenceRadius || 200 };
    return null;
  }, [geofenceSettings]);

  /* ── punch action ── */
  const checkedIn  = !!selfStatus?.checkInAt;
  const checkedOut = !!selfStatus?.checkOutAt;
  const gpsReady   = gpsState === GPS_STATE.READY && !!position;
  const distOk     = !distanceInfo || distanceInfo.inside; // allow if no geofence configured

  const handlePunch = async () => {
    if (!position) return;
    dispatch(clearAttendanceFeedback());
    setAL(true);
    try {
      if (!checkedIn) {
        await dispatch(selfCheckIn(position)).unwrap();
        message.success("Punched In successfully!");
      } else {
        await dispatch(selfCheckOut(position)).unwrap();
        message.success("Punched Out successfully!");
      }
      // Refresh GPS page data
      dispatch(fetchSelfStatus());
      dispatch(fetchSelfHistory({ month: calMonth.format("YYYY-MM") }));
      // Also refresh myAttendance so the "My Attendance" table shows updated times immediately
      dispatch(fetchMyAttendance({ month: calMonth.month() + 1, year: calMonth.year() }));
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Punch failed. Please try again.";
      message.error(msg);
    } finally {
      setAL(false);
    }
  };

  /* ── calendar cell ── */
  const historyByDate = useMemo(() => {
    const m = {};
    (selfHistory || []).forEach((r) => { m[dayjs(r.date).format("YYYY-MM-DD")] = r; });
    return m;
  }, [selfHistory]);

  const dateCellRender = (date, info) => {
    if (info?.type !== "date") return null;
    const rec = historyByDate[date.format("YYYY-MM-DD")];
    if (!rec) return null;
    const cfg = STATUS_CFG[rec.status] || {};
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color || C.textMuted }} />
      </div>
    );
  };

  const wh = workingHours(selfStatus?.checkInAt, selfStatus?.checkOutAt);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Attendance"
        subtitle="GPS-based self check-in and check-out"
        icon={<EnvironmentOutlined />}
      />

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>

        {/* ════════ LEFT COLUMN ════════ */}
        <Col xs={24} lg={10}>

          {/* Today Card */}
          <div style={{ ...PANEL, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 12 }}>
              {dayjs().format("dddd, DD MMM YYYY")}
            </div>

            {/* Status badge */}
            {selfStatus ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
                padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12,
                background: STATUS_CFG[selfStatus.status]?.bg || C.surfaceSoft,
                color:      STATUS_CFG[selfStatus.status]?.color || C.textSub,
                border:     `1px solid ${STATUS_CFG[selfStatus.status]?.border || C.border}`,
              }}>
                <CheckCircleOutlined />
                {STATUS_CFG[selfStatus.status]?.label || selfStatus.status}
              </span>
            ) : (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
                padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12,
                background: C.surfaceSoft, color: C.textMuted, border: `1px solid ${C.border}`,
              }}>
                <ClockCircleOutlined /> Not Marked
              </span>
            )}

            {/* Time cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Check-In",  val: fmtTime(selfStatus?.checkInAt),  icon: <LoginOutlined />,  color: C.success },
                { label: "Check-Out", val: fmtTime(selfStatus?.checkOutAt), icon: <LogoutOutlined />, color: C.danger  },
              ].map((item) => (
                <div key={item.label} style={{
                  background: C.surfaceSoft, borderRadius: 10, padding: "10px 12px",
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 10, color: item.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "monospace" }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {wh && (
              <div style={{ background: C.primaryLighter, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: C.primary, fontWeight: 700, display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <ClockCircleOutlined /> Working hours: {wh}
              </div>
            )}
            {selfStatus?.gpsVerified && (
              <div style={{ background: C.accentLight, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#0F766E", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                <AimOutlined /> GPS Verified{selfStatus.distanceFromSchool != null && ` · ${selfStatus.distanceFromSchool}m from school`}
              </div>
            )}
          </div>

          {/* GPS + Map Panel */}
          <div style={PANEL}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>
              Location & Geofence
            </div>

            {/* Backend error from last punch attempt */}
            {reduxError && (
              <Alert
                type="error"
                showIcon
                message={reduxError}
                style={{ marginBottom: 12, borderRadius: 8 }}
                closable
                onClose={() => dispatch(clearAttendanceFeedback())}
              />
            )}

            {/* GPS IDLE */}
            {gpsState === GPS_STATE.IDLE && (
              <Button
                block icon={<AimOutlined />} onClick={startGPS}
                style={{ height: 44, borderRadius: 10, fontWeight: 700, borderColor: C.primary, color: C.primary, background: C.primaryLighter, marginBottom: 16 }}
              >
                Enable GPS
              </Button>
            )}

            {/* GPS LOCATING */}
            {gpsState === GPS_STATE.LOCATING && (
              <div style={{ textAlign: "center", padding: "20px 0", marginBottom: 16 }}>
                <Spin size="large" />
                <div style={{ marginTop: 10, color: C.textSub, fontSize: 13 }}>Acquiring GPS signal…</div>
              </div>
            )}

            {/* GPS ERROR */}
            {gpsState === GPS_STATE.ERROR && (
              <Alert type="error" showIcon message="GPS Error" description={gpsError}
                style={{ marginBottom: 12, borderRadius: 8 }}
                action={<Button size="small" onClick={startGPS}>Retry</Button>}
              />
            )}

            {/* MAP — shown when GPS is ready */}
            {gpsState === GPS_STATE.READY && position && (
              <>
                {/* Map */}
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 12, height: 240 }}>
                  <AttendanceMap
                    userPosition={position}
                    schoolCoords={schoolCoords}
                    distanceInfo={distanceInfo}
                  />
                </div>

                {/* Coords row */}
                <div style={{
                  background: C.surfaceSoft, borderRadius: 8, padding: "8px 12px",
                  marginBottom: 10, border: `1px solid ${C.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 2 }}>YOUR LOCATION</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: C.text }}>
                      {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                    </div>
                    {position.accuracy && (
                      <div style={{ fontSize: 10, color: C.textMuted }}>±{Math.round(position.accuracy)}m accuracy</div>
                    )}
                  </div>
                  <Button size="small" type="text" icon={<ReloadOutlined />} onClick={stopGPS}
                    style={{ color: C.textMuted, fontSize: 11 }}>
                    Disable
                  </Button>
                </div>

                {/* Distance bar */}
                {distanceInfo && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 5, color: distanceInfo.inside ? C.success : C.danger }}>
                      <span>{distanceInfo.inside ? "Inside Geofence" : "Outside Geofence"}</span>
                      <span>{distanceInfo.dist}m / {distanceInfo.radius}m</span>
                    </div>
                    <Progress percent={distanceInfo.pct} strokeColor={distanceInfo.inside ? C.success : C.danger} showInfo={false} size="small" />
                    {!distanceInfo.inside && (
                      <div style={{ fontSize: 11, color: C.danger, marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}>
                        <WarningOutlined /> Move {distanceInfo.dist - distanceInfo.radius}m closer to school
                      </div>
                    )}
                  </div>
                )}

                {!schoolCoords && (
                  <Alert type="info" showIcon style={{ marginBottom: 12, borderRadius: 8 }}
                    message="No geofence set"
                    description="Admin hasn't configured school GPS. Check-in allowed from anywhere."
                  />
                )}
              </>
            )}

            {/* ─── PUNCH BUTTON ─── */}
            <PunchButton
              checkedIn={checkedIn}
              checkedOut={checkedOut}
              canAct={gpsReady}
              distOk={distOk}
              loading={actionLoading}
              onPunch={handlePunch}
            />
          </div>
        </Col>

        {/* ════════ RIGHT COLUMN ════════ */}
        <Col xs={24} lg={14}>

          {/* Calendar */}
          <div style={{ ...PANEL, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>
              {calMonth.format("MMMM YYYY")} — Monthly Overview
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textSub }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                  {cfg.label}
                </div>
              ))}
            </div>
            <Spin spinning={selfLoading}>
              <Calendar
                fullscreen={false}
                value={calMonth}
                onPanelChange={(v) => setCalMonth(v)}
                cellRender={dateCellRender}
                style={{ border: "none" }}
              />
            </Spin>
          </div>

          {/* Month stats */}
          <div style={{ ...PANEL, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Month Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                const count = (selfHistory || []).filter((r) => r.status === key).length;
                return (
                  <div key={key} style={{ background: cfg.bg, borderRadius: 10, padding: "8px 0", border: `1px solid ${cfg.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
                    <div style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Timeline */}
          <div style={PANEL}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Recent Records</div>
            {selfHistory?.length ? (
              <Timeline
                items={[...selfHistory].reverse().slice(0, 7).map((r) => {
                  const cfg = STATUS_CFG[r.status] || {};
                  const whr = workingHours(r.checkInAt, r.checkOutAt);
                  return {
                    color: cfg.color || C.textMuted,
                    children: (
                      <div style={{ paddingBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                          {dayjs(r.date).format("ddd, DD MMM")}
                          <Tag style={{ marginLeft: 8, fontSize: 10, padding: "0 6px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                          {fmtTime(r.checkInAt)} → {fmtTime(r.checkOutAt)}
                          {whr && <span style={{ marginLeft: 8, color: C.accent, fontWeight: 600 }}>{whr}</span>}
                          {r.gpsVerified && (
                            <Tooltip title={`${r.distanceFromSchool}m from school`}>
                              <AimOutlined style={{ color: C.accent, marginLeft: 6, fontSize: 11 }} />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <div style={{ textAlign: "center", color: C.textMuted, padding: "20px 0", fontSize: 13 }}>
                No records for this month
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeSelfAttendance;
