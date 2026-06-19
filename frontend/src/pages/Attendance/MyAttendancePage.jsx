import React, { useEffect, useMemo, useState } from "react";
import {
  DatePicker, Button, Spin, Progress, Tooltip,
} from "antd";
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, MinusCircleOutlined, QuestionCircleOutlined,
  LoginOutlined, LogoutOutlined, AimOutlined, EnvironmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper } from "../../styles/pageStyles";

/* ── theme ── */
const C = {
  primary:    "#2563EB", primaryLight:  "#DBEAFE", primaryLighter: "#EFF6FF",
  accent:     "#14B8A6", accentLight:   "#CCFBF1",
  success:    "#22C55E", successLight:  "#DCFCE7",
  warning:    "#F59E0B", warningLight:  "#FEF3C7",
  danger:     "#EF4444", dangerLight:   "#FEE2E2",
  purple:     "#8B5CF6", purpleLight:   "#EDE9FE",
  cyan:       "#06B6D4", cyanLight:     "#CFFAFE",
  border:     "#E2E8F0", text:          "#0F172A",
  textSub:    "#64748B", textMuted:     "#94A3B8",
  surface:    "#FFFFFF", surfaceSoft:   "#F8FAFC",
};

const PANEL = {
  background: C.surface, borderRadius: 14,
  border: `1px solid ${C.border}`, padding: 20,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const STATUS = {
  present: { color: C.success, bg: C.successLight, border: "#86EFAC", label: "Present",  icon: <CheckCircleOutlined /> },
  absent:  { color: C.danger,  bg: C.dangerLight,  border: "#FCA5A5", label: "Absent",   icon: <CloseCircleOutlined /> },
  late:    { color: C.warning, bg: C.warningLight, border: "#FCD34D", label: "Late",     icon: <ClockCircleOutlined /> },
  halfday: { color: C.purple,  bg: C.purpleLight,  border: "#C4B5FD", label: "Half Day", icon: <MinusCircleOutlined /> },
  leave:   { color: C.cyan,    bg: C.cyanLight,    border: "#67E8F9", label: "On Leave", icon: <QuestionCircleOutlined /> },
};

/* ── helpers ── */
function fmtTime(d) {
  return d ? dayjs(d).format("hh:mm A") : null;
}

function workingHours(ci, co) {
  if (!ci || !co) return null;
  const diff = new Date(co) - new Date(ci);
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

/* ── sub-components ── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS[status];
  if (!cfg) return <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const StatCard = ({ label, value, color, bg, icon, suffix }) => (
  <div style={{
    background: bg, borderRadius: 12, padding: "14px 16px",
    border: `1px solid ${color}30`,
    display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 100,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: color + "22", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 16, color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.15 }}>
        {value}{suffix && <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 2 }}>{suffix}</span>}
      </div>
    </div>
  </div>
);

const Th = ({ children }) => (
  <th style={{
    padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
    color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: `2px solid ${C.border}`, background: C.surfaceSoft, whiteSpace: "nowrap",
  }}>
    {children}
  </th>
);

const Td = ({ children, style: s }) => (
  <td style={{ padding: "11px 14px", fontSize: 13, color: C.text, ...s }}>
    {children}
  </td>
);

/* ════════════════════════════════════════════════════ */
const MyAttendancePage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();

  const { myAttendance = [], loading } = useSelector((s) => s.attendance);
  const [month, setMonth] = useState(dayjs());

  /* resolve GPS page path relative to current role (teacher/staff/etc.) */
  const gpsPath = useMemo(() => {
    /* location.pathname = /dashboard/teacher/attendance/my */
    const parts = location.pathname.split("/").filter(Boolean);
    /* find the role segment index (after "dashboard") */
    const dashIdx = parts.indexOf("dashboard");
    if (dashIdx !== -1 && parts[dashIdx + 1]) {
      return `/dashboard/${parts[dashIdx + 1]}/attendance/self`;
    }
    return null;
  }, [location.pathname]);

  /* fetch */
  useEffect(() => {
    dispatch(fetchMyAttendance({ month: month.month() + 1, year: month.year() }));
  }, [month]);

  /* summary */
  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0 };
    myAttendance.forEach((r) => { if (s[r.status] !== undefined) s[r.status]++; });
    const total = myAttendance.length;
    const attended = s.present + s.late * 0.5 + s.halfday * 0.5;
    const pct = total ? Math.round((attended / total) * 100) : 0;
    return { ...s, total, pct };
  }, [myAttendance]);

  /* today's record */
  const todayKey    = dayjs().format("YYYY-MM-DD");
  const isThisMonth = month.isSame(dayjs(), "month");
  const todayRecord = isThisMonth
    ? myAttendance.find((r) => dayjs(r.date).format("YYYY-MM-DD") === todayKey)
    : null;

  const checkedIn  = !!todayRecord?.checkInAt;
  const checkedOut = !!todayRecord?.checkOutAt;
  const wh         = workingHours(todayRecord?.checkInAt, todayRecord?.checkOutAt);
  const pctColor   = summary.pct >= 90 ? C.success : summary.pct >= 75 ? C.warning : C.danger;
  const sorted     = [...myAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));

  /* ── Today Banner ── */
  const todayCfg = todayRecord ? STATUS[todayRecord.status] : null;
  const bannerBg = todayCfg ? todayCfg.bg : C.primaryLighter;
  const bannerBorder = todayCfg ? todayCfg.border : C.primaryLight;

  const todayBannerIcon = todayCfg
    ? todayCfg.icon
    : <EnvironmentOutlined />;

  const todayBannerColor = todayCfg ? todayCfg.color : C.primary;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Attendance"
        subtitle="Monthly attendance history with GPS check-in/out times"
        icon={<CalendarOutlined />}
        extra={
          <DatePicker
            picker="month"
            value={month}
            onChange={(v) => setMonth(v || dayjs())}
            style={{ borderRadius: 8 }}
            allowClear={false}
          />
        }
      />

      {/* ─────────────── TODAY STATUS BANNER ─────────────── */}
      {isThisMonth && (
        <div style={{
          ...PANEL, marginTop: 16,
          background: bannerBg,
          border: `1px solid ${bannerBorder}`,
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16,
        }}>
          {/* icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: todayBannerColor + "22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: todayBannerColor,
          }}>
            {todayBannerIcon}
          </div>

          {/* info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Today — {dayjs().format("dddd, DD MMM YYYY")}
            </div>

            {todayRecord ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: todayCfg?.color || C.text, marginTop: 3 }}>
                  {todayCfg?.label || todayRecord.status}
                </div>

                {/* times row */}
                <div style={{ display: "flex", gap: 18, marginTop: 5, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: C.success + "22",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <LoginOutlined style={{ color: C.success, fontSize: 12 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Check-In</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, color: checkedIn ? C.success : C.textMuted, fontSize: 14 }}>
                        {fmtTime(todayRecord.checkInAt) || "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: C.danger + "22",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <LogoutOutlined style={{ color: C.danger, fontSize: 12 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Check-Out</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, color: checkedOut ? C.danger : C.textMuted, fontSize: 14 }}>
                        {fmtTime(todayRecord.checkOutAt) || "—"}
                      </div>
                    </div>
                  </div>

                  {wh && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: C.accent + "22",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ClockCircleOutlined style={{ color: C.accent, fontSize: 12 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Duration</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: C.accent, fontSize: 14 }}>{wh}</div>
                      </div>
                    </div>
                  )}

                  {todayRecord.gpsVerified && (
                    <Tooltip title={todayRecord.distanceFromSchool != null ? `${todayRecord.distanceFromSchool}m from school` : "GPS Verified"}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.accent, fontWeight: 600 }}>
                        <AimOutlined /> GPS Verified
                      </div>
                    </Tooltip>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: C.textMuted, marginTop: 3 }}>
                Not marked yet for today
              </div>
            )}
          </div>

          {/* GPS Punch button */}
          {gpsPath && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {!checkedIn ? (
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => navigate(gpsPath)}
                  style={{
                    background: C.success, borderColor: C.success,
                    borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 20,
                    boxShadow: `0 2px 8px ${C.success}44`,
                  }}
                >
                  Punch In  <ArrowRightOutlined />
                </Button>
              ) : !checkedOut ? (
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => navigate(gpsPath)}
                  style={{
                    background: C.danger, borderColor: C.danger,
                    borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 20,
                    boxShadow: `0 2px 8px ${C.danger}44`,
                  }}
                >
                  Punch Out  <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(gpsPath)}
                  style={{
                    borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 20,
                    color: C.textSub, borderColor: C.border,
                  }}
                >
                  View GPS Page  <ArrowRightOutlined />
                </Button>
              )}
              <div style={{ fontSize: 11, color: C.textMuted, textAlign: "right" }}>
                {!checkedIn
                  ? "Use GPS Check-In/Out to mark attendance"
                  : !checkedOut
                  ? "Remember to punch out when leaving"
                  : "Attendance complete for today"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── STAT CARDS ─────────────── */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <StatCard label="Present"  value={summary.present}  color={C.success} bg={C.successLight} icon={<CheckCircleOutlined />} />
        <StatCard label="Absent"   value={summary.absent}   color={C.danger}  bg={C.dangerLight}  icon={<CloseCircleOutlined />} />
        <StatCard label="Late"     value={summary.late}     color={C.warning} bg={C.warningLight} icon={<ClockCircleOutlined />} />
        <StatCard label="Half Day" value={summary.halfday}  color={C.purple}  bg={C.purpleLight}  icon={<MinusCircleOutlined />} />
        <StatCard label="Leave"    value={summary.leave}    color={C.cyan}    bg={C.cyanLight}    icon={<QuestionCircleOutlined />} />

        {/* Attendance % */}
        <div style={{ ...PANEL, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 160 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: pctColor, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
              Attendance %
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1, marginBottom: 6 }}>
              {summary.pct}%
            </div>
            <Progress percent={summary.pct} strokeColor={pctColor} trailColor={C.border} showInfo={false} size="small" />
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: pctColor + "15", border: `2px solid ${pctColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: pctColor, flexShrink: 0,
          }}>
            {summary.pct}%
          </div>
        </div>
      </div>

      {/* ─────────────── RECORDS TABLE ─────────────── */}
      <div style={{ ...PANEL, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
            Records — {month.format("MMMM YYYY")}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(STATUS).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        <Spin spinning={loading}>
          {sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted }}>
              <CalendarOutlined style={{ fontSize: 36, marginBottom: 12, display: "block", color: C.border }} />
              No attendance records for {month.format("MMMM YYYY")}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Date</Th>
                    <Th>Day</Th>
                    <Th>Status</Th>
                    <Th>Check-In</Th>
                    <Th>Check-Out</Th>
                    <Th>Working Hrs</Th>
                    <Th>GPS</Th>
                    <Th>Remarks</Th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => {
                    const d  = dayjs(r.date);
                    const whr = workingHours(r.checkInAt, r.checkOutAt);
                    const isToday = d.format("YYYY-MM-DD") === todayKey;

                    return (
                      <tr
                        key={r._id}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: isToday ? C.primaryLighter : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => !isToday && (e.currentTarget.style.background = C.surfaceSoft)}
                        onMouseLeave={(e) => !isToday && (e.currentTarget.style.background = "transparent")}
                      >
                        <Td style={{ color: C.textMuted, fontSize: 12 }}>{sorted.length - i}</Td>

                        <Td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {d.format("DD MMM YYYY")}
                            {isToday && (
                              <span style={{
                                marginLeft: 6, fontSize: 9, fontWeight: 800,
                                background: C.primary, color: "#fff",
                                padding: "1px 6px", borderRadius: 20, verticalAlign: "middle",
                              }}>TODAY</span>
                            )}
                          </div>
                        </Td>

                        <Td style={{ color: C.textSub, fontSize: 12 }}>{d.format("ddd")}</Td>

                        <Td><StatusBadge status={r.status} /></Td>

                        <Td>
                          {r.checkInAt ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: 12, color: C.success, fontWeight: 600 }}>
                              <LoginOutlined style={{ fontSize: 11 }} />
                              {fmtTime(r.checkInAt)}
                            </span>
                          ) : (
                            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                          )}
                        </Td>

                        <Td>
                          {r.checkOutAt ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: 12, color: C.danger, fontWeight: 600 }}>
                              <LogoutOutlined style={{ fontSize: 11 }} />
                              {fmtTime(r.checkOutAt)}
                            </span>
                          ) : (
                            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                          )}
                        </Td>

                        <Td style={{ color: C.accent, fontWeight: 600, fontSize: 12 }}>{whr || "—"}</Td>

                        <Td>
                          {r.gpsVerified ? (
                            <Tooltip title={r.distanceFromSchool != null ? `${r.distanceFromSchool}m from school` : "GPS Verified"}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.accent, fontSize: 12, fontWeight: 600 }}>
                                <AimOutlined /> Verified
                              </span>
                            </Tooltip>
                          ) : (
                            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                          )}
                        </Td>

                        <Td style={{ color: C.textSub, fontSize: 12, fontStyle: r.remarks ? "italic" : "normal" }}>
                          {r.remarks || "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default MyAttendancePage;
