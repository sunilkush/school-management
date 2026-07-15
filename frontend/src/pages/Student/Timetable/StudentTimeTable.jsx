import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import { CalendarDays, Clock, User, MapPin, ChevronRight, Zap, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { fetchStudentTimetable } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, pill, emptyState } from "../../../styles/pageStyles.js";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

function pickColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

/* ── Period card ─────────────────────────────────────────────────── */
function PeriodCard({ entry, isActive }) {
  const subject = entry.subjectId?.name || "Subject";
  const teacher = entry.teacherId?.name || "TBA";
  const color = pickColor(subject);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        border: `1.5px solid ${isActive ? color : "var(--border-muted)"}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: isActive ? `0 4px 20px ${color}22` : "none",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 24px ${color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isActive ? `0 4px 20px ${color}22` : "none";
      }}
    >
      {/* Time column */}
      <div
        style={{
          width: 88,
          flexShrink: 0,
          background: `${color}12`,
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
        <span style={{ fontSize: 10, color: `${color}80`, fontWeight: 600 }}>—</span>
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
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            color,
          }}
        >
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
                  ...pill("#10b981", "#10b98115"),
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
        <span style={{ ...pill(color, `${color}15`), flexShrink: 0, fontSize: 11 }}>
          Scheduled
        </span>
      </div>
    </div>
  );
}

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

      {/* Next class banner */}
      {!loading && (
        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            borderRadius: 14,
            background: nextClass ? "#10b98110" : "#0ea5e910",
            border: `1px solid ${nextClass ? "#10b98130" : "#0ea5e930"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: nextClass ? "#10b98118" : "#0ea5e918",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight
              size={18}
              color={nextClass ? "#10b981" : "#0ea5e9"}
              strokeWidth={2.5}
            />
          </div>
          <div>
            {nextClass ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                  Next: {nextClass.subjectId?.name || "Class"} — {nextClass.day} at{" "}
                  {nextClass.startTime}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Teacher: {nextClass.teacherId?.name || "TBA"}
                  {nextClass.room ? ` · Room ${nextClass.room}` : ""}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0ea5e9" }}>
                No upcoming classes found for this week.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Day selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
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
                  ? "1.5px solid #6366f1"
                  : "1px solid var(--border-muted)",
                background: active ? "#6366f1" : "var(--surface)",
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
                    background: active ? "rgba(255,255,255,0.22)" : "#6366f115",
                    color: active ? "#fff" : "#6366f1",
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
      <div style={{ ...sectionPanel, marginTop: 16 }}>
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
