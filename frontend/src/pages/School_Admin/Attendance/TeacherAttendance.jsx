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
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAllUser } from "../../../features/authSlice";
import { markBulkAttendance } from "../../../features/attendanceSlice";
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
  { value: "present", label: "P",  fullLabel: "Present",  color: "#16a34a" },
  { value: "absent",  label: "A",  fullLabel: "Absent",   color: "#dc2626" },
  { value: "late",    label: "L",  fullLabel: "Late",     color: "#d97706" },
  { value: "halfday", label: "H",  fullLabel: "Half Day", color: "#f97316" },
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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchText,   setSearchText]   = useState("");

  /* ── Fetch ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ schoolId, isActive: true }));
  }, [schoolId, dispatch]);

  /* ── Helpers ── */
  const getRole = (u) => u?.role?.name || u?.roleId?.name || "";

  const teacherList = useMemo(
    () =>
      users.filter(
        (u) => u?.role?.name === "Teacher" || getRole(u) === "Teacher"
      ),
    [users]
  );

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
  };

  const handleSubmit = async () => {
    if (!schoolId) return message.error("School not found");

    const records = Object.entries(attendance)
      .filter(([, status]) => Boolean(status))
      .map(([userId, status]) => {
        const rec = { userId, status };
        if (checkIns[userId])  rec.checkInAt  = checkIns[userId].toISOString();
        if (checkOuts[userId]) rec.checkOutAt = checkOuts[userId].toISOString();
        return rec;
      });

    if (!records.length) return message.warning("Mark attendance for at least one teacher");

    try {
      await dispatch(
        markBulkAttendance({
          schoolId,
          date: selectedDate.startOf("day").toISOString(),
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
        const name = r?.name || "—";
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
              <div style={{ fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {r?.employeeId || "—"}
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
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
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
          { key: "marked",  label: "Marked",   color: "#7c3aed"        },
          { key: "present", label: "Present",  color: "#16a34a"        },
          { key: "absent",  label: "Absent",   color: "#dc2626"        },
          { key: "late",    label: "Late",     color: "#d97706"        },
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
            strokeColor="#16a34a"
            trailColor="var(--border-muted)"
            size="small"
            format={(p) => (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{p}%</span>
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
