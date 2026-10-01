import React, { useMemo } from "react";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import { ATTENDANCE_STATUS, attendanceLabel } from "../../utils/attendanceStatus";

/**
 * A month as a small grid, one coloured tile per day (P, L, ½A / ½B, A, Lv; Sunday "off";
 * a dot where nothing is recorded). Hover a tile for the times and the remark.
 *
 * @param month    dayjs of any day in the month
 * @param records  attendance rows of that month ({ date, status, halfDaySession, checkInAt, … })
 */
const AttendanceMonthGrid = ({ month, records = [], tile = 42 }) => {
  const byDate = useMemo(() => {
    const m = {};
    records.forEach((r) => { m[dayjs(r.date).format("YYYY-MM-DD")] = r; });
    return m;
  }, [records]);

  // Weeks start on Monday; blanks before the 1st.
  const cells = useMemo(() => {
    const first = month.startOf("month");
    const out = Array.from({ length: (first.day() + 6) % 7 }, () => null);
    for (let d = 1; d <= month.daysInMonth(); d += 1) out.push(first.date(d));
    return out;
  }, [month]);

  const today = dayjs();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textAlign: "center", paddingBottom: 2 }}>{d}</div>
      ))}
      {cells.map((d, i) => {
        if (!d) return <div key={`b${i}`} />;
        const r = byDate[d.format("YYYY-MM-DD")];
        const cfg = r ? ATTENDANCE_STATUS[r.status] : null;
        const future = d.isAfter(today, "day");
        const box = (
          <div style={{
            height: tile, borderRadius: 8, padding: "3px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between",
            border: d.isSame(today, "day") ? "2px solid var(--primary)" : "1px solid var(--border-muted)",
            background: cfg ? `color-mix(in srgb, ${cfg.color} 14%, transparent)` : "var(--surface)",
            opacity: future ? 0.45 : 1,
          }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1 }}>{d.date()}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: cfg?.color || "var(--text-muted)", textAlign: "center", lineHeight: 1.1 }}>
              {cfg ? `${cfg.short}${r.halfDaySession || ""}` : d.day() === 0 ? "off" : future ? "" : "·"}
            </span>
          </div>
        );
        return r ? (
          <Tooltip key={d.format("D")} title={(
            <div style={{ fontSize: 12 }}>
              <b>{d.format("ddd, DD MMM")}</b> · {attendanceLabel(r)}
              {r.checkInAt ? <div>In {dayjs(r.checkInAt).format("hh:mm A")}{r.checkOutAt ? ` · Out ${dayjs(r.checkOutAt).format("hh:mm A")}` : ""}</div> : null}
              {r.remarks ? <div style={{ opacity: 0.8 }}>{r.remarks}</div> : null}
            </div>
          )}>{box}</Tooltip>
        ) : <div key={d.format("D")}>{box}</div>;
      })}
    </div>
  );
};

export default AttendanceMonthGrid;
