import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { Alert, Button, Progress, Spin, Tag, Tooltip, message } from "antd";
import {
  AimOutlined, CheckCircleOutlined, EnvironmentOutlined, LeftOutlined,
  LoginOutlined, LogoutOutlined, RightOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSelfStatus, fetchSelfHistory, selfCheckIn, selfCheckOut,
  clearAttendanceFeedback, fetchMyAttendance,
} from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import AttendanceMonthGrid from "../../components/attendance/AttendanceMonthGrid";
import { ATTENDANCE_STATUS, attendanceLabel, workedText } from "../../utils/attendanceStatus";
import AttendanceMap from "./AttendanceMap";

/* ─── Constants ─────────────────────────────────────────────── */
const GPS_STATE = { IDLE: "idle", LOCATING: "locating", READY: "ready", ERROR: "error" };

// A phone's GPS is typically within 5–30m. A reading much looser than this is an estimate from
// Wi-Fi or the IP address, not a position to judge a 200–300m school zone with.
const COARSE_FIX_METRES = 100;
const formatAccuracy = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
const fmtTime = (d) => (d ? dayjs(d).format("hh:mm A") : "—");
const hoursText = (h) => (Number.isInteger(h) ? `${h}h` : `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`);

const card = { background: "var(--surface)", border: "1px solid var(--border-muted)", borderRadius: 14, padding: 14 };
const label = { fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" };

/* ─── GPS status, one small tag ─────────────────────────────── */
const GpsTag = ({ gpsState, distanceInfo, gpsError, onRetry }) => {
  if (gpsState === GPS_STATE.IDLE) return <Button size="small" icon={<EnvironmentOutlined />} onClick={onRetry}>Enable GPS</Button>;
  if (gpsState === GPS_STATE.LOCATING) return <Tag style={{ margin: 0 }}><Spin size="small" style={{ marginRight: 6 }} />Finding you…</Tag>;
  if (gpsState === GPS_STATE.ERROR) {
    return (
      <Tooltip title={gpsError || "Unable to get location"}>
        <Tag color="red" style={{ margin: 0, cursor: "pointer" }} onClick={onRetry}><WarningOutlined /> GPS error · retry</Tag>
      </Tooltip>
    );
  }
  if (!distanceInfo) return <Tag color="green" style={{ margin: 0 }}><AimOutlined /> GPS ready</Tag>;
  return distanceInfo.inside
    ? <Tag color="green" style={{ margin: 0 }}><AimOutlined /> Inside zone · {distanceInfo.dist}m</Tag>
    : <Tag color="orange" style={{ margin: 0 }}><WarningOutlined /> Outside zone · {distanceInfo.dist}m</Tag>;
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
  const [calMonth,   setCalMonth] = useState(dayjs().startOf("month"));
  const [now, setNow] = useState(() => new Date());
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
    // Retrying after an error must replace the old watch, not run a second one beside it.
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState(GPS_STATE.READY);
      },
      (err) => { setGpsState(GPS_STATE.ERROR); setGpsError(err.message || "Unable to get location"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearAttendanceFeedback());
    dispatch(fetchSelfStatus());
    startGPS();
  }, [dispatch, startGPS]);

  useEffect(() => {
    if (calMonth) dispatch(fetchSelfHistory({ month: calMonth.format("YYYY-MM") }));
  }, [calMonth, dispatch]);

  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  // Keeps "working for 2h 14m" honest while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // School hours and what a day counts as (same rules as the backend's workHours.service.js):
  // under halfDay hours absent, from it a half day, from fullDay hours (never more than the
  // school's own hours) a full day.
  const rules = useMemo(() => {
    const h = geofenceSettings?.attendanceHours;
    if (!h) return null;
    const mins = (hm, fb) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hm || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : fb; };
    const span = Math.max((mins(h.endTime, 900) - mins(h.startTime, 480)) / 60, 0);
    const full = Math.min(Number(h.fullDayHours ?? 8), span || 24);
    const half = Math.min(Number(h.halfDayHours ?? 4.5), full);
    return { start: h.startTime || "08:00", end: h.endTime || "15:00", full, half };
  }, [geofenceSettings]);

  /* ── Punch ── */
  const checkedIn  = !!selfStatus?.checkInAt;
  const checkedOut = !!selfStatus?.checkOutAt;
  const done       = checkedIn && checkedOut;
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

  // Check-in is refused outside school hours, so say so on the button rather than after a press.
  // Check-out has no such limit.
  const nowHm = dayjs(now).format("HH:mm");
  const outsideHours = Boolean(rules) && !checkedIn && (nowHm < rules.start || nowHm > rules.end);

  const statusCfg = ATTENDANCE_STATUS[selfStatus?.status];
  const worked = checkedIn ? workedText(selfStatus.checkInAt, checkedOut ? selfStatus.checkOutAt : now) : null;
  const workedHours = checkedIn ? Math.max(0, (new Date(checkedOut ? selfStatus.checkOutAt : now) - new Date(selfStatus.checkInAt)) / 3600000) : 0;
  const history = selfHistory || [];
  const counts = Object.fromEntries(Object.keys(ATTENDANCE_STATUS).map((k) => [k, history.filter((r) => r.status === k).length]));
  const recent = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const today = dayjs();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Attendance"
        subtitle={rules ? `Check in from school between ${rules.start} and ${rules.end}` : "GPS-based self check-in and check-out"}
        icon={<EnvironmentOutlined />}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
        gap: 12, marginTop: 14, alignItems: "start",
      }}>

        {/* ════ Today: status, times, location and the one button ════ */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={label}>Today</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{today.format("ddd, DD MMM YYYY")}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {statusCfg
                ? <Tag color={statusCfg.color} style={{ margin: 0 }}>{attendanceLabel(selfStatus)}</Tag>
                : <Tag style={{ margin: 0 }}>Not marked</Tag>}
              <GpsTag gpsState={gpsState} distanceInfo={distanceInfo} gpsError={gpsError} onRetry={startGPS} />
            </div>
          </div>

          {/* In · Out · Worked, on one line */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "12px 0" }}>
            {[
              { k: "In", v: fmtTime(selfStatus?.checkInAt), on: checkedIn, color: "var(--success)" },
              { k: "Out", v: fmtTime(selfStatus?.checkOutAt), on: checkedOut, color: "var(--danger)" },
              { k: checkedOut ? "Worked" : "Working", v: worked || "—", on: checkedIn, color: "var(--primary)" },
            ].map((x) => (
              <div key={x.k} style={{ border: "1px solid var(--border-muted)", borderRadius: 10, padding: "6px 10px" }}>
                <div style={label}>{x.k}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: x.on ? x.color : "var(--text-muted)" }}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* How the hours count */}
          {rules && (
            <div style={{ marginBottom: 12 }}>
              <Progress
                percent={Math.min(100, Math.round((workedHours / (rules.full || 1)) * 100))}
                showInfo={false} size={[null, 6]} trailColor="var(--border-muted)"
                strokeColor={workedHours >= rules.full ? "var(--success)" : workedHours >= rules.half ? "var(--purple)" : "var(--warning)"}
              />
              <div className="u-muted" style={{ fontSize: 11, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span>Half day from {hoursText(rules.half)} · full day from {hoursText(rules.full)}</span>
                {checkedIn && !checkedOut && (
                  <span>
                    {workedHours >= rules.full ? "Full day reached" : workedHours >= rules.half ? `Half day reached · ${hoursText(rules.full - workedHours)} to a full day` : `${hoursText(rules.half - workedHours)} to a half day`}
                  </span>
                )}
              </div>
            </div>
          )}

          {reduxError && (
            <Alert type="error" showIcon closable message={reduxError}
              onClose={() => dispatch(clearAttendanceFeedback())} style={{ marginBottom: 10, fontSize: 12 }} />
          )}

          {/* A browser on a laptop or desktop has no GPS chip: it estimates from Wi-Fi or the
              internet connection and can be kilometres off. Without saying so, someone standing
              inside the school sees "you are 4 km away" and assumes the app is broken. */}
          {gpsState === GPS_STATE.READY && position?.accuracy > COARSE_FIX_METRES && (
            <Alert
              type="warning" showIcon style={{ marginBottom: 10, fontSize: 12 }}
              message={`Location is approximate (±${formatAccuracy(position.accuracy)}): this device is guessing from Wi-Fi, not GPS. Check in from a phone with location on.`}
            />
          )}

          {/* Map: how someone sees where they are against the school zone. */}
          {gpsState === GPS_STATE.READY && position && (
            <div style={{ marginBottom: 10 }}>
              <AttendanceMap userPosition={position} schoolCoords={schoolCoords} distanceInfo={distanceInfo} height={170} />
            </div>
          )}

          {gpsState === GPS_STATE.READY && distanceInfo && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 10, color: distanceInfo.inside ? "var(--success)" : "var(--warning-hover)" }}>
              <span>{distanceInfo.inside ? "Within the school zone" : "Move closer to school"}</span>
              <span>{distanceInfo.dist}m of {distanceInfo.radius}m{position?.accuracy ? ` · ±${Math.round(position.accuracy)}m` : ""}</span>
            </div>
          )}
          {gpsState === GPS_STATE.READY && !schoolCoords && (
            <div className="u-muted" style={{ fontSize: 12, marginBottom: 10 }}>No school zone set: check-in is allowed from anywhere.</div>
          )}

          <Button
            block size="large" type="primary" danger={checkedIn && !done}
            icon={done ? <CheckCircleOutlined /> : checkedIn ? <LogoutOutlined /> : <LoginOutlined />}
            disabled={done || !gpsReady || outsideHours} loading={actLoading} onClick={handlePunch}
            style={{ height: 46, fontWeight: 800, borderRadius: 12 }}
          >
            {done ? "Done for today" : checkedIn ? "Punch Out" : "Punch In"}
          </Button>
          {outsideHours ? (
            <div className="u-muted" style={{ fontSize: 12, textAlign: "center", marginTop: 6 }}>
              Check-in is open {rules.start}–{rules.end}. {nowHm > rules.end ? "It has closed for today." : "It has not opened yet."}
            </div>
          ) : !gpsReady && !done ? (
            <div className="u-muted" style={{ fontSize: 12, textAlign: "center", marginTop: 6 }}>Waiting for your location…</div>
          ) : null}
          {selfStatus?.gpsVerified && (
            <div style={{ fontSize: 11, textAlign: "center", marginTop: 6, color: "var(--success)" }}>
              <AimOutlined /> Check-in verified {selfStatus.distanceFromSchool}m from school
            </div>
          )}
        </div>

        {/* ════ This month: counts, the month grid, and the latest days ════ */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{calMonth.format("MMMM YYYY")}</div>
            <div style={{ display: "flex", gap: 4 }}>
              <Button size="small" icon={<LeftOutlined />} aria-label="Previous month" onClick={() => setCalMonth((m) => m.subtract(1, "month"))} />
              <Button size="small" icon={<RightOutlined />} aria-label="Next month" disabled={calMonth.isSame(today, "month")} onClick={() => setCalMonth((m) => m.add(1, "month"))} />
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {Object.entries(ATTENDANCE_STATUS).map(([k, cfg]) => (
              <span key={k} style={{
                fontSize: 12, padding: "2px 9px", borderRadius: 20, color: "var(--text-secondary)",
                border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`, background: `color-mix(in srgb, ${cfg.color} 8%, transparent)`,
              }}>
                <b style={{ color: cfg.color }}>{counts[k]}</b> {cfg.label}
              </span>
            ))}
          </div>

          <Spin spinning={selfLoading}>
            <AttendanceMonthGrid month={calMonth} records={history} tile={38} />
          </Spin>

          <div style={{ ...label, margin: "12px 0 4px" }}>Latest days</div>
          {recent.length ? recent.map((r, i) => {
            const cfg = ATTENDANCE_STATUS[r.status] || {};
            return (
              <div key={r._id || r.date} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i ? "1px solid var(--border-muted)" : "none", fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color || "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ fontWeight: 700, width: 74, flexShrink: 0 }}>{dayjs(r.date).format("ddd, DD MMM")}</span>
                <span style={{ color: cfg.color, fontWeight: 700, whiteSpace: "nowrap" }}>{attendanceLabel(r)}</span>
                <span className="u-muted" style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
                  {r.checkInAt ? `${dayjs(r.checkInAt).format("hh:mm")} – ${r.checkOutAt ? dayjs(r.checkOutAt).format("hh:mm A") : "…"}` : r.remarks || ""}
                  {workedText(r.checkInAt, r.checkOutAt) ? ` · ${workedText(r.checkInAt, r.checkOutAt)}` : ""}
                </span>
                {r.gpsVerified && (
                  <Tooltip title={`${r.distanceFromSchool}m from school`}><AimOutlined style={{ color: "var(--success)", flexShrink: 0 }} /></Tooltip>
                )}
              </div>
            );
          }) : (
            <div className="u-muted" style={{ fontSize: 12, padding: "10px 0" }}>Nothing recorded this month.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelfAttendance;
