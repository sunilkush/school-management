import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Empty, Spin, Table } from "antd";
import { CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import AttendanceMonthGrid from "../../components/attendance/AttendanceMonthGrid";
import { ATTENDANCE_STATUS, attendanceLabel, workedText } from "../../utils/attendanceStatus";

const STATUS = ATTENDANCE_STATUS;
const label = attendanceLabel;
const worked = (r) => workedText(r.checkInAt, r.checkOutAt);

const Chip = ({ text, value, color }) => (
  <span style={{
    display: "inline-flex", alignItems: "baseline", gap: 5, padding: "4px 10px", borderRadius: 20,
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
    background: `color-mix(in srgb, ${color} 8%, transparent)`, fontSize: 12, color: "var(--text-secondary)",
  }}>
    <b style={{ color, fontSize: 14 }}>{value}</b>{text}
  </span>
);

/**
 * My attendance for one month: a compact month grid (one small tile per day) and the day-wise
 * list. Replaces a full-screen calendar that filled the page with mostly empty cells.
 */
const MyAttendanceMonthlyReport = () => {
  const dispatch = useDispatch();
  const { myAttendance = [], reportLoading, loading } = useSelector((s) => s.attendance || {});
  const [month, setMonth] = useState(dayjs().startOf("month"));

  useEffect(() => {
    dispatch(fetchMyAttendance({ month: month.month() + 1, year: month.year() }));
  }, [month, dispatch]);

  const summary = useMemo(() => {
    const s = { present: 0, late: 0, halfday: 0, absent: 0, leave: 0 };
    myAttendance.forEach((r) => { if (s[r.status] !== undefined) s[r.status] += 1; });
    // Approved leave is not a day missed, so it is left out of the percentage.
    const marked = myAttendance.length - s.leave;
    const attended = s.present + s.late + s.halfday * 0.5;
    return { ...s, marked, pct: marked > 0 ? Math.round((attended / marked) * 1000) / 10 : null };
  }, [myAttendance]);

  const today = dayjs();
  const isLoading = loading || reportLoading;
  const rows = [...myAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Monthly Report"
        subtitle="Your attendance for the month, day by day"
        icon={<CalendarOutlined />}
        extra={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button type="button" className="ant-btn ant-btn-default ant-btn-sm" onClick={() => setMonth((m) => m.subtract(1, "month"))} aria-label="Previous month"><LeftOutlined /></button>
            <DatePicker picker="month" size="small" value={month} allowClear={false} format="MMM YYYY"
              onChange={(v) => v && setMonth(v.startOf("month"))} disabledDate={(d) => d && d.isAfter(today, "month")} />
            <button type="button" className="ant-btn ant-btn-default ant-btn-sm" disabled={month.isSame(today, "month")}
              onClick={() => setMonth((m) => m.add(1, "month"))} aria-label="Next month"><RightOutlined /></button>
          </div>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
        <Chip text="attendance" value={summary.pct == null ? "—" : `${summary.pct}%`} color="var(--primary)" />
        {Object.entries(STATUS).map(([k, cfg]) => <Chip key={k} text={cfg.label} value={summary[k]} color={cfg.color} />)}
      </div>

      <Spin spinning={isLoading}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, alignItems: "start" }}>
          <div className="section-panel" style={{ margin: 0, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{month.format("MMMM YYYY")}</div>
            <AttendanceMonthGrid month={month} records={myAttendance} />
            <div className="u-muted" style={{ fontSize: 11, marginTop: 8 }}>
              P present · L late · ½A / ½B half day (1st / 2nd half) · A absent · Lv leave · · not recorded
            </div>
          </div>

          <div className="section-panel" style={{ margin: 0, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Day-wise records</div>
            <Table
              size="small" rowKey={(r) => r._id || r.date} dataSource={rows}
              pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: "max-content" }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing recorded this month" /> }}
              columns={[
                { title: "Date", dataIndex: "date", render: (v) => <span style={{ whiteSpace: "nowrap" }}><b>{dayjs(v).format("DD MMM")}</b> <span className="u-muted">{dayjs(v).format("ddd")}</span></span> },
                { title: "Status", render: (_, r) => <span style={{ color: STATUS[r.status]?.color, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{label(r)}</span> },
                { title: "In – Out", render: (_, r) => r.checkInAt ? <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{dayjs(r.checkInAt).format("hh:mm")}{r.checkOutAt ? ` – ${dayjs(r.checkOutAt).format("hh:mm A")}` : ""}</span> : "—" },
                { title: "Worked", render: (_, r) => worked(r) || "—" },
                { title: "Remarks", dataIndex: "remarks", ellipsis: true, render: (v) => v ? <span className="u-muted" style={{ fontSize: 12 }}>{v}</span> : "—" },
              ]}
            />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default MyAttendanceMonthlyReport;
