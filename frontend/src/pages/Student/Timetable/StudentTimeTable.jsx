import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import {
  CalendarDays, Clock, User, MapPin, ChevronRight, Zap, RefreshCw,
  BookOpen, ListChecks, Coffee, TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import { fetchStudentTimetable } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, pill, emptyState,
  statGrid, statCard, statLabel, statValue, iconWell,
} from "../../../styles/pageStyles.js";
import { categoricalColorFor } from "../../../utils/colorPalette";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Shared design tokens (see index.css). PRIMARY/SUCCESS/INFO are the fixed accent
// colors used outside the per-subject categorical palette below.
const PRIMARY = "var(--primary)";
const SUCCESS = "var(--success)";
const INFO = "var(--info)";

// RGB triples for the categorical palette + the fixed tokens above, keyed by their
// var(--x) string. Used by tint() to build alpha-tinted backgrounds/shadows from a
// CSS custom property — `${"var(--x)"}NN` hex-alpha-suffix concatenation (the old
// approach here) doesn't work with var() values, so we go through rgba() instead.
const CATEGORICAL_RGB = {
  "var(--primary)": "var(--primary-rgb)",
  "var(--accent)":  "var(--accent-rgb)",
  "var(--purple)":  "var(--purple-rgb)",
  "var(--success)": "var(--success-rgb)",
  "var(--warning)": "var(--warning-rgb)",
  "var(--danger)":  "var(--danger-rgb)",
  "var(--pink)":    "236,72,153",
  "var(--cyan)":    "6,182,212",
  "var(--info)":    "59,130,246",
  "var(--orange)":  "249,115,22",
};
const tint = (colorVar, alpha) => `rgba(${CATEGORICAL_RGB[colorVar] || "100,116,139"}, ${alpha})`;

/* ── Period card ─────────────────────────────────────────────────── */
function PeriodCard({ entry, isActive }) {
  const subject = entry.subjectId?.name || "Subject";
  const teacher = entry.teacherId?.name || "TBA";
  const color = categoricalColorFor(subject);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        border: `1.5px solid ${isActive ? color : "var(--border-muted)"}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: isActive ? `0 4px 20px ${tint(color, 0.13)}` : "none",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 24px ${tint(color, 0.125)}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isActive ? `0 4px 20px ${tint(color, 0.13)}` : "none";
      }}
    >
      {/* Time column */}
      <div
        style={{
          width: 88,
          flexShrink: 0,
          background: tint(color, 0.07),
          borderRight: `3px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 8px",
          gap: 3,
        }}
      >
        <Clock size={13} color={color} strokeWidth={2} />
        <span style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1.3, textAlign: "center" }}>
          {entry.startTime}
        </span>
        <span style={{ fontSize: 10, color: tint(color, 0.5), fontWeight: 600 }}>—</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1.3, textAlign: "center" }}>
          {entry.endTime}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          minWidth: 0,
        }}
      >
        {/* Avatar */}
        <div style={iconWell(color, 44, { fontSize: 18, fontWeight: 800, background: tint(color, 0.13) })}>
          {subject[0].toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {subject}
            </span>
            {isActive && (
              <span
                style={{
                  ...pill(SUCCESS, tint(SUCCESS, 0.08)),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                }}
              >
                <Zap size={10} strokeWidth={2.5} />
                NOW
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <User size={12} strokeWidth={2} />
              {teacher}
            </span>
            {entry.room && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                <MapPin size={12} strokeWidth={2} />
                Room {entry.room}
              </span>
            )}
          </div>
        </div>

        {/* Status pill */}
        <span style={{ ...pill(color, tint(color, 0.08)), flexShrink: 0, fontSize: 11 }}>
          Scheduled
        </span>
      </div>
    </div>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────── */
const StatTile = ({ icon, label, value, color }) => (
  <div style={statCard({ color })}>
    <div>
      <div style={statLabel(color)}>{label}</div>
      <div style={statValue(color)}>{value}</div>
    </div>
    <div style={iconWell(color, 40, { background: tint(color, 0.13) })}>{icon}</div>
  </div>
);

/* ── Main page ───────────────────────────────────────────────────── */
export default function StudentTimeTable() {
  const dispatch = useDispatch();
  const { timetable = [], loading } = useSelector((s) => s.studentPortal || {});
  const [activeDay, setActiveDay] = useState(dayjs().format("dddd"));

  useEffect(() => {
    dispatch(fetchStudentTimetable());
  }, [dispatch]);

  useEffect(() => {
    if (!DAY_ORDER.includes(activeDay)) setActiveDay("Monday");
  }, [activeDay]);

  const sortedData = useMemo(
    () =>
      [...timetable].sort((a, b) => {
        const dd = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
        return dd !== 0 ? dd : String(a.startTime).localeCompare(String(b.startTime));
      }),
    [timetable]
  );

  const dayWise = useMemo(
    () => sortedData.filter((e) => e.day === activeDay),
    [sortedData, activeDay]
  );

  // Next upcoming class
  const nextClass = useMemo(() => {
    const now = dayjs();
    const nowIdx = DAY_ORDER.indexOf(now.format("dddd"));
    return sortedData.find((e) => {
      const eIdx = DAY_ORDER.indexOf(e.day);
      if (eIdx < nowIdx) return false;
      if (eIdx > nowIdx) return true;
      return dayjs(e.startTime, "HH:mm").isAfter(now);
    });
  }, [sortedData]);

  // Active period right now
  const activePeriodId = useMemo(() => {
    if (dayjs().format("dddd") !== activeDay) return null;
    const now = dayjs();
    return (
      dayWise.find((e) =>
        now.isAfter(dayjs(e.startTime, "HH:mm")) &&
        now.isBefore(dayjs(e.endTime, "HH:mm"))
      )?._id || null
    );
  }, [dayWise, activeDay]);

  // Period count per day for badge
  const countPerDay = useMemo(() => {
    const m = {};
    DAY_ORDER.forEach((d) => {
      m[d] = sortedData.filter((e) => e.day === d).length;
    });
    return m;
  }, [sortedData]);

  const today = dayjs().format("dddd");

  // Header summary stats
  const stats = useMemo(() => {
    const entries = Object.entries(countPerDay);
    const busiest = entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max), ["—", 0]);
    return {
      total: sortedData.length,
      todayCount: countPerDay[today] || 0,
      freeDays: DAY_ORDER.filter((d) => !countPerDay[d]).length,
      busiestDay: busiest[1] > 0 ? busiest[0].slice(0, 3) : "—",
    };
  }, [sortedData.length, countPerDay, today]);

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <PageHeader
        title="My Timetable"
        subtitle="Your weekly class schedule with subjects and teachers"
        icon={<CalendarDays size={20} />}
        extra={
          <button
            onClick={() => dispatch(fetchStudentTimetable())}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9,
              border: "1px solid var(--border-muted)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} strokeWidth={2} />
            Refresh
          </button>
        }
      />

      {/* Summary stats */}
      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatTile icon={<BookOpen size={18} />}    label="Periods This Week" value={stats.total}       color={PRIMARY} />
        <StatTile icon={<ListChecks size={18} />}  label="Today's Classes"   value={stats.todayCount}  color={SUCCESS} />
        <StatTile icon={<TrendingUp size={18} />}  label="Busiest Day"       value={stats.busiestDay}  color="var(--purple)" />
        <StatTile icon={<Coffee size={18} />}      label="Free Days"         value={stats.freeDays}    color="var(--warning)" />
      </div>

      {/* Next class banner */}
      {!loading && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: 14,
            background: nextClass ? tint(SUCCESS, 0.06) : tint(INFO, 0.06),
            border: `1px solid ${nextClass ? tint(SUCCESS, 0.19) : tint(INFO, 0.19)}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={iconWell(nextClass ? SUCCESS : INFO, 36, { background: tint(nextClass ? SUCCESS : INFO, 0.13) })}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </div>
          <div>
            {nextClass ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: SUCCESS }}>
                  Next: {nextClass.subjectId?.name || "Class"} — {nextClass.day} at{" "}
                  {nextClass.startTime}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Teacher: {nextClass.teacherId?.name || "TBA"}
                  {nextClass.room ? ` · Room ${nextClass.room}` : ""}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: INFO }}>
                No upcoming classes found for this week.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Day selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {DAY_ORDER.map((day) => {
          const active = activeDay === day;
          const isToday = day === today;
          const count = countPerDay[day] || 0;

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: active
                  ? `1.5px solid ${PRIMARY}`
                  : "1px solid var(--border-muted)",
                background: active ? PRIMARY : "var(--surface)",
                color: active ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              {day.slice(0, 3)}
              {isToday && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 99,
                    lineHeight: "16px",
                    background: active ? "rgba(255,255,255,0.22)" : tint(PRIMARY, 0.08),
                    color: active ? "#fff" : PRIMARY,
                  }}
                >
                  TODAY
                </span>
              )}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "0 6px",
                    borderRadius: 99,
                    lineHeight: "18px",
                    background: active ? "rgba(255,255,255,0.22)" : "var(--surface-soft)",
                    color: active ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Periods */}
      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          {activeDay} &nbsp;·&nbsp; {dayWise.length} period
          {dayWise.length !== 1 ? "s" : ""}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Spin size="large" />
          </div>
        ) : dayWise.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              No Classes on {activeDay}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Enjoy your free day — no periods scheduled!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dayWise.map((entry, i) => (
              <PeriodCard
                key={entry._id || i}
                entry={entry}
                isActive={entry._id === activePeriodId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
