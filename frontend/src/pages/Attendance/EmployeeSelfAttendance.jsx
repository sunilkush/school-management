import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { Alert, Calendar, Progress, Spin, Tooltip, message } from "antd";
import {
  AimOutlined, CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined,
  LoginOutlined, LogoutOutlined, WarningOutlined,
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

/* ─── Constants ─────────────────────────────────────────────── */
const GPS_STATE = { IDLE: "idle", LOCATING: "locating", READY: "ready", ERROR: "error" };

const STATUS_CFG = {
  present: { color: "var(--success)", bg: "var(--success-light)", border: "var(--success-light)", label: "Present"  },
  absent:  { color: "var(--danger)", bg: "var(--danger-light)", border: "var(--danger-light)", label: "Absent"   },
  late:    { color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning)", label: "Late"     },
  halfday: { color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.12)", border: "rgba(var(--purple-rgb), 0.5)", label: "Half Day" },
  leave:   { color: "var(--cyan)", bg: "var(--cyan-light)", border: "rgba(var(--cyan-rgb), 0.5)", label: "On Leave" },
};

function fmtTime(d) { return d ? dayjs(d).format("hh:mm A") : null; }

function calcWorkHours(a, b) {
  if (!a || !b) return null;
  const m = Math.round((new Date(b) - new Date(a)) / 60000);
  return m > 0 ? `${Math.floor(m / 60)}h ${m % 60}m` : null;
}

/* ─── GPS Status Pill ───────────────────────────────────────── */
const GpsPill = ({ gpsState, distanceInfo, gpsError, onEnable, onRetry }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    lineHeight: 1.4,
  };
  if (gpsState === GPS_STATE.IDLE) return (
    <button onClick={onEnable} style={{
      ...base,
      background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)",
      cursor: "pointer",
    }}>
      <EnvironmentOutlined /> Enable GPS
    </button>
  );
  if (gpsState === GPS_STATE.LOCATING) return (
    <span style={{ ...base, background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border-muted)" }}>
      <Spin size="small" /> Acquiring GPS…
    </span>
  );
  if (gpsState === GPS_STATE.ERROR) return (
    <Tooltip title={gpsError || "Unable to get location"}>
      <span style={{ ...base, background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger-light)", cursor: "default" }}>
        <WarningOutlined /> GPS Error ·&nbsp;
        <button onClick={onRetry} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 800, padding: 0, fontSize: 12 }}>Retry</button>
      </span>
    </Tooltip>
  );
  if (!distanceInfo) return (
    <span style={{ ...base, background: "var(--success-light)", color: "var(--success)", border: "1px solid var(--success-light)" }}>
      <AimOutlined /> GPS Ready
    </span>
  );
  const ok = distanceInfo.inside;
  return (
    <span style={{ ...base, background: ok ? "var(--success-light)" : "var(--warning-light)", color: ok ? "var(--success)" : "var(--warning-hover)", border: `1px solid ${ok ? "var(--success-light)" : "var(--warning-light)"}` }}>
      {ok ? <AimOutlined /> : <WarningOutlined />}
      {ok ? "Inside Zone" : "Outside Zone"} · {distanceInfo.dist}m
    </span>
  );
};

/* ─── Day Progress Track ────────────────────────────────────── */
const DayTrack = ({ checkedIn, checkedOut, checkInAt, checkOutAt }) => {
  const step   = checkedOut ? 2 : checkedIn ? 1 : 0;
  const wh     = calcWorkHours(checkInAt, checkOutAt);
  const nodes  = [
    { key: "in",  label: "Check In",  time: fmtTime(checkInAt),  color: "var(--success)", icon: <LoginOutlined  style={{ fontSize: 13 }} /> },
    { key: "out", label: "Check Out", time: fmtTime(checkOutAt), color: "var(--danger)", icon: <LogoutOutlined style={{ fontSize: 13 }} /> },
  ];
  return (
    <div style={{ padding: "2px 0 4px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {nodes.map((n, i) => (
          <React.Fragment key={n.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: (i === 0 && step >= 1) || (i === 1 && step >= 2) ? n.color : "var(--surface-soft)",
                border: `2px solid ${(i === 0 && step >= 1) || (i === 1 && step >= 2) ? n.color : "var(--border-muted)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: (i === 0 && step >= 1) || (i === 1 && step >= 2) ? "#fff" : "var(--text-muted)",
                transition: "all 0.3s",
              }}>
                {n.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginTop: 5, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {n.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: (i === 0 && step >= 1) || (i === 1 && step >= 2) ? n.color : "var(--text-muted)", fontFamily: "monospace", marginTop: 1 }}>
                {n.time || "—"}
              </div>
            </div>
            {i < nodes.length - 1 && (
              <div style={{ flex: 1, height: 3, marginTop: 16, background: step >= 2 ? "var(--success)" : "var(--border-muted)", transition: "background 0.4s" }} />
            )}
          </React.Fragment>
        ))}
      </div>
      {wh && (
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--success)", fontWeight: 700, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <ClockCircleOutlined /> {wh} worked
        </div>
      )}
    </div>
  );
};

/* ─── Punch Button ──────────────────────────────────────────── */
const PunchBtn = ({ checkedIn, checkedOut, canAct, loading, onPunch }) => {
  const done = checkedIn && checkedOut;
  const bg   = done ? "var(--surface-soft)" : checkedIn ? "var(--danger)" : "var(--success)";
  const label = done ? "Done for Today" : checkedIn ? "Punch Out" : "Punch In";
  const Icon  = done ? CheckCircleOutlined : checkedIn ? LogoutOutlined : LoginOutlined;
  const off   = done || !canAct;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "4px 0 2px" }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        {!off && (
          <span style={{
            position: "absolute", inset: -10, borderRadius: "50%",
            background: `color-mix(in srgb, ${bg} 16%, transparent)`,
            animation: "att-pulse 2s ease-in-out infinite",
            pointerEvents: "none",
          }} />
        )}
        <button
          onClick={!off && !loading ? onPunch : undefined}
          disabled={off || loading}
          style={{
            width: 148, height: 148, borderRadius: "50%",
            background: off ? "var(--surface-soft)" : bg,
            border: `3px solid ${off ? "var(--border-muted)" : bg}`,
            color: off ? "var(--text-muted)" : "#fff",
            fontSize: 14, fontWeight: 800,
            cursor: off ? "not-allowed" : "pointer",
            boxShadow: off ? "none" : `0 0 36px color-mix(in srgb, ${bg} 27%, transparent)`,
            transition: "all 0.25s",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6,
            letterSpacing: "0.02em",
          }}
        >
          {loading
            ? <Spin size="large" />
            : <>
                <Icon style={{ fontSize: 38 }} />
                <span style={{ fontSize: 13, lineHeight: 1.2, textAlign: "center" }}>{label}</span>
              </>
          }
        </button>
      </div>
      {!canAct && !done && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          Waiting for GPS…
        </div>
      )}
      <style>{`@keyframes att-pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.14);opacity:.15} }`}</style>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const EmployeeSelfAttendance = () => {
  const dispatch = useDispatch();
  const { selfStatus, selfHistory, selfLoading, geofenceSettings, error: reduxError } =
    useSelector((s) => s.attendance);

  const [gpsState,  setGpsState]  = useState(GPS_STATE.IDLE);
  const [position,  setPosition]  = useState(null);
  const [gpsError,  setGpsError]  = useState(null);
  const [actLoading, setActLoad]  = useState(false);
  const [calMonth,   setCalMonth] = useState(dayjs());
  const [mapOpen,    setMapOpen]  = useState(false);
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
    dispatch(clearAttendanceFeedback());
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState(GPS_STATE.READY);
      },
      (err) => { setGpsState(GPS_STATE.ERROR); setGpsError(err.message || "Unable to get location"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [dispatch]);

  const stopGPS = useCallback(() => {
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setGpsState(GPS_STATE.IDLE);
    setPosition(null);
  }, []);

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

  /* ── Haversine ── */
  const distanceInfo = useMemo(() => {
    if (!position || !geofenceSettings?.location?.lat) return null;
    const { lat: sLat, lng: sLng, geofenceRadius = 200 } = geofenceSettings.location;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(position.lat - sLat);
    const dLon = toRad(position.lng - sLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(sLat)) * Math.cos(toRad(position.lat)) * Math.sin(dLon / 2) ** 2;
    const dist = Math.round(R * 2 * Math.asin(Math.sqrt(a)));
    return { dist, radius: geofenceRadius, inside: dist <= geofenceRadius, pct: Math.min(100, Math.round((dist / geofenceRadius) * 100)) };
  }, [position, geofenceSettings]);

  /* ── Auto-clear stale rejection error when GPS shows inside ── */
  useEffect(() => {
    if (reduxError && distanceInfo?.inside) dispatch(clearAttendanceFeedback());
  }, [distanceInfo?.inside, reduxError, dispatch]);

  const schoolCoords = useMemo(() => {
    const loc = geofenceSettings?.location;
    if (loc?.lat != null && loc?.lng != null) return { lat: loc.lat, lng: loc.lng, radius: loc.geofenceRadius || 200 };
    return null;
  }, [geofenceSettings]);

  /* ── Punch ── */
  const checkedIn  = !!selfStatus?.checkInAt;
  const checkedOut = !!selfStatus?.checkOutAt;
  const gpsReady   = gpsState === GPS_STATE.READY && !!position;

  const handlePunch = async () => {
    if (!position) return;
    dispatch(clearAttendanceFeedback());
    setActLoad(true);
    try {
      if (!checkedIn) {
        await dispatch(selfCheckIn(position)).unwrap();
        message.success("Punched In successfully!");
      } else {
        await dispatch(selfCheckOut(position)).unwrap();
        message.success("Punched Out successfully!");
      }
      dispatch(fetchSelfStatus());
      dispatch(fetchSelfHistory({ month: calMonth.format("YYYY-MM") }));
      dispatch(fetchMyAttendance({ month: calMonth.month() + 1, year: calMonth.year() }));
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Punch failed. Try again.";
      message.error(msg);
    } finally {
      setActLoad(false);
    }
  };

  /* ── Calendar ── */
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
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color || "var(--text-muted)" }} />
      </div>
    );
  };

  const statusCfg = STATUS_CFG[selfStatus?.status];

  /* ── Panel style ── */
  const card = {
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 16, padding: "18px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Attendance"
        subtitle="GPS-based self check-in and check-out"
        icon={<EnvironmentOutlined />}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        gap: 14,
        marginTop: 16,
        alignItems: "start",
      }}>

        {/* ════ LEFT — Today status + punch ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Today Card ── */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Today
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginTop: 1 }}>
                  {dayjs().format("ddd, DD MMM YYYY")}
                </div>
              </div>
              {statusCfg ? (
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                  {statusCfg.label}
                </span>
              ) : (
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border-muted)" }}>
                  Not Marked
                </span>
              )}
            </div>

            <DayTrack
              checkedIn={checkedIn}
              checkedOut={checkedOut}
              checkInAt={selfStatus?.checkInAt}
              checkOutAt={selfStatus?.checkOutAt}
            />

            {selfStatus?.gpsVerified && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11, color: "var(--accent-hover)", fontWeight: 700, background: "var(--accent-light)", borderRadius: 6, padding: "3px 8px" }}>
                <AimOutlined /> GPS Verified · {selfStatus.distanceFromSchool}m from school
              </div>
            )}
          </div>

          {/* ── Punch Card ── */}
          <div style={card}>

            {/* GPS status + map toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <GpsPill
                gpsState={gpsState}
                distanceInfo={distanceInfo}
                gpsError={gpsError}
                onEnable={startGPS}
                onRetry={startGPS}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {gpsState === GPS_STATE.READY && position && (
                  <button
                    onClick={() => setMapOpen((v) => !v)}
                    style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "1px solid var(--border-muted)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}
                  >
                    {mapOpen ? "Hide Map" : "View Map"}
                  </button>
                )}
                {gpsState === GPS_STATE.READY && (
                  <button onClick={stopGPS} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, textDecoration: "underline" }}>
                    Disable
                  </button>
                )}
              </div>
            </div>

            {/* Error from last punch attempt */}
            {reduxError && (
              <Alert
                type="error" showIcon closable
                message={reduxError}
                onClose={() => dispatch(clearAttendanceFeedback())}
                style={{ marginBottom: 14, borderRadius: 10, fontSize: 12 }}
              />
            )}

            {/* Map (togglable) */}
            {mapOpen && gpsState === GPS_STATE.READY && position && (
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-muted)", marginBottom: 14, height: 200 }}>
                <AttendanceMap userPosition={position} schoolCoords={schoolCoords} distanceInfo={distanceInfo} />
              </div>
            )}

            {/* Distance bar — only when geofence is configured */}
            {gpsState === GPS_STATE.READY && distanceInfo && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4, color: distanceInfo.inside ? "var(--success)" : "var(--warning-hover)" }}>
                  <span>{distanceInfo.inside ? "✓ Within school zone" : "Move closer to school"}</span>
                  <span>{distanceInfo.dist}m / {distanceInfo.radius}m</span>
                </div>
                <Progress
                  percent={distanceInfo.pct}
                  strokeColor={distanceInfo.inside ? "var(--success)" : "var(--warning)"}
                  trailColor="var(--border-muted)"
                  showInfo={false}
                  size={[null, 6]}
                />
              </div>
            )}

            {/* No geofence info */}
            {gpsState === GPS_STATE.READY && !schoolCoords && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 10, padding: "6px 0" }}>
                No geofence configured — check-in allowed from anywhere
              </div>
            )}

            {/* THE BUTTON */}
            <PunchBtn
              checkedIn={checkedIn}
              checkedOut={checkedOut}
              canAct={gpsReady}
              loading={actLoading}
              onPunch={handlePunch}
            />

            {/* GPS accuracy */}
            {gpsState === GPS_STATE.READY && position?.accuracy && (
              <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                GPS accuracy: ±{Math.round(position.accuracy)}m
              </div>
            )}
          </div>

          {/* ── Month summary chips ── */}
          <div style={{ ...card, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              {calMonth.format("MMMM YYYY")} Summary
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                const count = (selfHistory || []).filter((r) => r.status === key).length;
                return (
                  <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>{count}</div>
                    <div style={{ fontSize: 9, color: cfg.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════ RIGHT — Calendar + History ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Calendar ── */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                {calMonth.format("MMMM YYYY")}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>
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

          {/* ── Recent Records ── */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
              Recent Records
            </div>
            {selfHistory?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...selfHistory].reverse().slice(0, 7).map((r) => {
                  const cfg = STATUS_CFG[r.status] || {};
                  const wh  = calcWorkHours(r.checkInAt, r.checkOutAt);
                  const inT = fmtTime(r.checkInAt);
                  const outT = fmtTime(r.checkOutAt);
                  return (
                    <div key={r._id || r.date} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: "var(--surface-soft)", border: "1px solid var(--border-muted)",
                    }}>
                      {/* Status dot */}
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color || "var(--text-muted)", flexShrink: 0 }} />
                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                            {dayjs(r.date).format("ddd, DD MMM")}
                          </span>
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <LoginOutlined style={{ fontSize: 10 }} />
                          <span>{inT || "—"}</span>
                          <span>→</span>
                          <LogoutOutlined style={{ fontSize: 10 }} />
                          <span>{outT || "—"}</span>
                          {wh && <span style={{ color: "var(--success)", fontWeight: 700 }}>· {wh}</span>}
                        </div>
                      </div>
                      {/* GPS badge */}
                      {r.gpsVerified && (
                        <Tooltip title={`${r.distanceFromSchool}m from school`}>
                          <AimOutlined style={{ color: "var(--accent)", fontSize: 13, flexShrink: 0 }} />
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                No records for this month
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelfAttendance;
