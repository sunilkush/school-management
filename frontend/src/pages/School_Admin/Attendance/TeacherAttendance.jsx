import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  DatePicker,
  Input,
  Table,
  message,
  Spin,
  Empty,
  TimePicker,
  Progress,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAllUser } from "../../../features/authSlice";
import { markBulkAttendance, fetchAttendance } from "../../../features/attendanceSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
  sectionPanel,
} from "../../../styles/pageStyles";

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "present", label: "P",  fullLabel: "Present",  color: "#22C55E" },
  { value: "absent",  label: "A",  fullLabel: "Absent",   color: "#EF4444" },
  { value: "late",    label: "L",  fullLabel: "Late",     color: "#F59E0B" },
  { value: "halfday", label: "H",  fullLabel: "Half Day", color: "#F59E0B" },
  { value: "leave",   label: "Lv", fullLabel: "Leave",    color: "#0891b2" },
];

const TABLE_CLS = "teacher-att-tbl";

/* ── Inline status button ────────────────────────────────────────── */
const StatusBtn = ({ opt, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "4px 9px",
      borderRadius: 6,
      border: `1.5px solid ${active ? opt.color : "var(--border-muted)"}`,
      background: active ? `${opt.color}18` : "transparent",
      color: active ? opt.color : "var(--text-muted)",
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      fontSize: 12,
      lineHeight: 1.4,
      transition: "all 0.15s",
    }}
  >
    {opt.label}
  </button>
);

/* ── Working-hours helper ────────────────────────────────────────── */
const calcWorkingHours = (inTime, outTime) => {
  if (!inTime || !outTime) return null;
  const diff = outTime.diff(inTime, "minute");
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
};

const TeacherAttendance = () => {
  const dispatch   = useDispatch();
  const { users = [], loading: usersLoading, user: currentUser } =
    useSelector((s) => s.auth || {});
  const { loading: attLoading } = useSelector((s) => s.attendance || {});

  const schoolId = currentUser?.school?._id;

  const [attendance,   setAttendance]   = useState({});
  const [checkIns,     setCheckIns]     = useState({});
  const [checkOuts,    setCheckOuts]    = useState({});
  const [gpsRecords,   setGpsRecords]   = useState({});   // userId → { gpsVerified, checkInAt }
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchText,   setSearchText]   = useState("");

  /* ── Fetch only teachers via roleName filter ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ schoolId, isActive: true, roleName: "Teacher" }));
  }, [schoolId, dispatch]);

  /* ── Load existing attendance for the selected date ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(
      fetchAttendance({
        schoolId,
        // Local calendar-date string, not .toISOString() — avoids the day-shift toISOString()
        // causes near midnight for positive-UTC-offset zones (IST included); mirrors mobile's
        // formatDateOnly() fix for the same bug.
        date: selectedDate.format("YYYY-MM-DD"),
        role: "teacher",
        limit: 500,
        page: 1,
      })
    )
      .unwrap()
      .then((data) => {
        const att = {}, ci = {}, co = {}, gps = {};
        (data?.items || []).forEach((item) => {
          const uid = (item.userId?._id || item.userId || "").toString();
          if (!uid) return;
          att[uid] = item.status;
          if (item.checkInAt)  ci[uid]  = dayjs(item.checkInAt);
          if (item.checkOutAt) co[uid]  = dayjs(item.checkOutAt);
          if (item.gpsVerified || item.checkInAt) {
            gps[uid] = { gpsVerified: item.gpsVerified, checkInAt: item.checkInAt };
          }
        });
        setAttendance(att);
        setCheckIns(ci);
        setCheckOuts(co);
        setGpsRecords(gps);
      })
      .catch(() => {}); // silently skip — page still works without pre-population
  }, [schoolId, selectedDate, dispatch]);

  const teacherList = useMemo(() => users, [users]);

  const filteredTeachers = useMemo(() => {
    const q = searchText.toLowerCase();
    if (!q) return teacherList;
    return teacherList.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const emp  = `${u.employeeId || ""}`.toLowerCase();
      return name.includes(q) || emp.includes(q);
    });
  }, [teacherList, searchText]);

  /* ── Live summary ── */
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0, marked: 0 };
    Object.values(attendance).forEach((v) => {
      if (v && counts[v] !== undefined) { counts[v]++; counts.marked++; }
    });
    return { ...counts, total: teacherList.length };
  }, [attendance, teacherList]);

  /* ── Actions ── */
  const handleChange = (id, value) =>
    setAttendance((p) => ({ ...p, [id]: value }));

  const markAll = (status) => {
    const updated = {};
    filteredTeachers.forEach((t) => (updated[t._id] = status));
    setAttendance((p) => ({ ...p, ...updated }));
  };

  const resetAll = () => {
    setAttendance({});
    setCheckIns({});
    setCheckOuts({});
    setGpsRecords({});
  };

  const handleSubmit = async () => {
    if (!schoolId) return message.error("School not found");

    const records = Object.entries(attendance)
      .filter(([, status]) => Boolean(status))
      .map(([userId, status]) => {
        const rec = { userId, status };
        if (checkIns[userId]) {
          rec.checkInAt = selectedDate
            .hour(checkIns[userId].hour())
            .minute(checkIns[userId].minute())
            .second(0)
            .toISOString();
        }
        if (checkOuts[userId]) {
          rec.checkOutAt = selectedDate
            .hour(checkOuts[userId].hour())
            .minute(checkOuts[userId].minute())
            .second(0)
            .toISOString();
        }
        return rec;
      });

    if (!records.length) return message.warning("Mark attendance for at least one teacher");

    try {
      await dispatch(
        markBulkAttendance({
          schoolId,
          // Local calendar-date string, not .toISOString() — avoids the day-shift toISOString()
        // causes near midnight for positive-UTC-offset zones (IST included); mirrors mobile's
        // formatDateOnly() fix for the same bug.
        date: selectedDate.format("YYYY-MM-DD"),
          role: "teacher",
          records,
        })
      ).unwrap();
      message.success(`Attendance saved for ${records.length} teachers`);
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to save attendance");
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "Teacher",
      render: (_, r) => {
        const name   = r?.name || "—";
        const gpsRec = gpsRecords[r._id];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--primary-light)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}
            >
              {name[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {name}
                </span>
                {gpsRec?.gpsVerified && (
                  <span
                    title={`GPS self check-in at ${gpsRec.checkInAt ? dayjs(gpsRec.checkInAt).format("HH:mm") : "—"}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 2,
                      fontSize: 10, fontWeight: 700, color: "#22C55E",
                      background: "#22C55E18", borderRadius: 4,
                      padding: "1px 5px",
                    }}
                  >
                    <EnvironmentOutlined style={{ fontSize: 9 }} /> GPS
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {r?.email || "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Department",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r?.department || "—"}
        </span>
      ),
    },
    {
      title: "Attendance",
      render: (_, r) => {
        const current = attendance[r._id];
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((opt) => (
              <StatusBtn
                key={opt.value}
                opt={opt}
                active={current === opt.value}
                onClick={() => handleChange(r._id, opt.value)}
              />
            ))}
          </div>
        );
      },
    },
    {
      title: "Check In / Out",
      render: (_, r) => {
        const st      = attendance[r._id];
        const inVal   = checkIns[r._id]  || null;
        const outVal  = checkOuts[r._id] || null;
        const working = calcWorkingHours(inVal, outVal);

        return st === "present" || st === "late" ? (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: working ? 4 : 0 }}>
              <TimePicker
                size="small"
                format="HH:mm"
                placeholder="In"
                value={inVal}
                onChange={(t) => setCheckIns((p) => ({ ...p, [r._id]: t }))}
                style={{ width: 80 }}
              />
              <TimePicker
                size="small"
                format="HH:mm"
                placeholder="Out"
                value={outVal}
                onChange={(t) => setCheckOuts((p) => ({ ...p, [r._id]: t }))}
                style={{ width: 80 }}
              />
            </div>
            {working && (
              <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>
                {working} worked
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Teacher Attendance"
        subtitle="Mark daily attendance for all teachers"
        icon={<TeamOutlined />}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={attLoading}
            onClick={handleSubmit}
          >
            Save Attendance
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <DatePicker
            value={selectedDate}
            onChange={(d) => setSelectedDate(d || dayjs())}
            disabledDate={(c) => c && c > dayjs().endOf("day")}
            style={{ width: "100%" }}
          />
          <Input
            placeholder="Search name / employee ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* Mark-All row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginRight: 2 }}
          >
            Mark All:
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              onClick={() => markAll(opt.value)}
              style={{ borderColor: opt.color, color: opt.color, fontWeight: 600, fontSize: 12 }}
            >
              {opt.fullLabel}
            </Button>
          ))}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={resetAll}
            style={{ marginLeft: "auto" }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={statGrid(120)}>
        {[
          { key: "total",   label: "Total",    color: "var(--primary)" },
          { key: "marked",  label: "Marked",   color: "#14B8A6"        },
          { key: "present", label: "Present",  color: "#22C55E"        },
          { key: "absent",  label: "Absent",   color: "#EF4444"        },
          { key: "late",    label: "Late",     color: "#F59E0B"        },
        ].map(({ key, label, color }) => (
          <div
            key={key}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={iconWell(color, 34)}>
              <UserOutlined style={{ fontSize: 14 }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
                {summary[key]}
              </div>
            </div>
          </div>
        ))}

        {/* Present rate */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
            }}
          >
            Present Rate
          </div>
          <Progress
            percent={
              summary.total
                ? Math.round((summary.present / summary.total) * 100)
                : 0
            }
            strokeColor="#22C55E"
            trailColor="var(--border-muted)"
            size="small"
            format={(p) => (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>{p}%</span>
            )}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-muted)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <Spin spinning={usersLoading}>
          {filteredTeachers.length > 0 ? (
            <Table
              className={TABLE_CLS}
              rowKey="_id"
              columns={columns}
              dataSource={filteredTeachers}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              scroll={{ x: 640 }}
            />
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    {usersLoading ? "Loading teachers…" : "No teachers found"}
                  </span>
                }
              />
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default TeacherAttendance;
