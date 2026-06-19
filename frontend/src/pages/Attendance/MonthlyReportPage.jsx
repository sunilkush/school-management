import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, DatePicker, Button, Table, Tag, Spin, Empty, message,
} from "antd";
import {
  BankOutlined, FileTextOutlined, DownloadOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchMonthlyReport }  from "../../features/attendanceSlice";
import { fetchSchoolClasses }  from "../../features/schoolClassSlice";
import { fetchSchools }        from "../../features/schoolSlice";
import PageHeader              from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss,
} from "../../styles/pageStyles";

const TABLE_CLS = "sa-monthly-tbl";

const ROLE_OPTIONS = [
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Staff",    value: "staff"   },
];

/* ── KPI mini card ──────────────────────────────────────────────────── */
const MiniStat = ({ label, value, color }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 12, padding: "14px 18px",
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={iconWell(color, 38)}>
      <span style={{ fontSize: 16, fontWeight: 800 }}>{value ?? "—"}</span>
    </div>
    <div style={{
      fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {label}
    </div>
  </div>
);

/* ── CSV export helper ──────────────────────────────────────────────── */
const exportCSV = (data, filename) => {
  if (!data?.length) return message.warning("No data to export");

  const headers = ["Name", "Email", "Present", "Absent", "Late", "Half Day", "Leave", "Total", "Attendance %"];
  const rows    = data.map((r) => [
    r.name || "",
    r.email || "",
    r.presentDays ?? 0,
    r.statusBreakdown?.absent   ?? 0,
    r.statusBreakdown?.late     ?? 0,
    r.statusBreakdown?.halfday  ?? 0,
    r.statusBreakdown?.leave    ?? 0,
    r.totalDays ?? 0,
    r.attendancePercentage ?? 0,
  ]);

  const csv  = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ── Filter label ───────────────────────────────────────────────────── */
const FL = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  }}>
    {children}
  </div>
);

/* ── Main component ─────────────────────────────────────────────────── */
const MonthlyReportPage = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector((s) => s.attendance || {});
  const { schoolClasses = [] }               = useSelector((s) => s.schoolClass || {});
  const { schools = [] }                     = useSelector((s) => s.school || {});
  const { user }                             = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }             = useSelector((s) => s.academicYear || {});

  const isSuperAdmin   = user?.role?.name === "Super Admin";
  const [saSchoolId, setSaSchoolId] = useState(null);
  const schoolId = isSuperAdmin ? saSchoolId : (user?.school?._id || null);

  const [month,     setMonth]    = useState(dayjs());
  const [role,      setRole]     = useState("student");
  const [classId,   setClassId]  = useState(null);
  const [sectionId, setSectionId] = useState(null);

  const academicYearId = selectedAcademicYear?._id || null;

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const selectedClass  = classes.find((c) => c._id === classId);
  const classOptions   = classes.map((c) => ({ value: c._id, label: c.name }));
  const sectionOptions = selectedClass?.sections?.map((s) => ({ value: s._id, label: s.name })) || [];

  /* ── Init ── */
  useEffect(() => {
    if (isSuperAdmin) dispatch(fetchSchools());
  }, [isSuperAdmin, dispatch]);

  /* ── Load classes when school changes ── */
  useEffect(() => {
    if (role === "student" && schoolId) {
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    }
  }, [role, schoolId, academicYearId, dispatch]);

  /* ── Generate ── */
  const handleGenerate = () => {
    if (!schoolId) return message.error("Please select a school first");
    dispatch(fetchMonthlyReport({
      schoolId,
      month:        month.month() + 1,
      year:         month.year(),
      role,
      schoolClassId: role === "student" ? classId  : undefined,
      sectionId:     role === "student" ? sectionId : undefined,
    }));
  };

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    const total = monthlyReport.length;
    const avg   = total > 0
      ? (monthlyReport.reduce((a, b) => a + (b.attendancePercentage || 0), 0) / total).toFixed(1)
      : 0;
    const low   = monthlyReport.filter((r) => (r.attendancePercentage || 0) < 75).length;
    const high  = monthlyReport.filter((r) => (r.attendancePercentage || 0) >= 90).length;
    return { total, avg, low, high };
  }, [monthlyReport]);

  /* ── Table columns ── */
  const columns = [
    {
      title: "#",
      render: (_, __, i) => (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</span>
      ),
      width: 44,
    },
    {
      title:  "Name",
      dataIndex: "name",
      render: (v) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</span>
      ),
    },
    {
      title:     "Present",
      dataIndex: "presentDays",
      align:     "center",
      width:     80,
      render:    (v) => <span style={{ color: "#5BA89A", fontWeight: 700 }}>{v ?? 0}</span>,
    },
    {
      title:  "Absent",
      align:  "center",
      width:  80,
      render: (_, r) => (
        <span style={{ color: "#D96B7A", fontWeight: 700 }}>
          {r?.statusBreakdown?.absent ?? 0}
        </span>
      ),
    },
    {
      title:  "Late",
      align:  "center",
      width:  70,
      render: (_, r) => (
        <span style={{ color: "#D4922A", fontWeight: 700 }}>
          {r?.statusBreakdown?.late ?? 0}
        </span>
      ),
    },
    {
      title:  "Leave",
      align:  "center",
      width:  70,
      render: (_, r) => (
        <span style={{ color: "#0891b2", fontWeight: 700 }}>
          {r?.statusBreakdown?.leave ?? 0}
        </span>
      ),
    },
    {
      title:     "Total",
      dataIndex: "totalDays",
      align:     "center",
      width:     70,
      render:    (v) => <span style={{ fontWeight: 600 }}>{v ?? 0}</span>,
    },
    {
      title:     "Attendance",
      dataIndex: "attendancePercentage",
      align:     "center",
      width:     100,
      sorter:    (a, b) => (a.attendancePercentage || 0) - (b.attendancePercentage || 0),
      render:    (v) => {
        const n = Number(v || 0);
        const color = n >= 90 ? "#5BA89A" : n >= 75 ? "#D4922A" : "#D96B7A";
        return (
          <Tag
            style={{
              background: `${color}15`, borderColor: `${color}30`,
              color, fontWeight: 700, fontSize: 12,
            }}
          >
            {n.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Monthly Attendance Report"
        subtitle="Track monthly attendance performance for any role across schools"
        icon={<FileTextOutlined />}
        extra={
          monthlyReport.length > 0 && (
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCSV(
                  monthlyReport,
                  `attendance_${role}_${month.format("YYYY-MM")}.csv`,
                )
              }
              style={{ borderColor: "var(--border-muted)" }}
            >
              Export CSV
            </Button>
          )
        }
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 14,
          alignItems: "end",
        }}>

          {/* School — Super Admin only */}
          {isSuperAdmin && (
            <div>
              <FL>School</FL>
              <Select
                showSearch
                placeholder="Select school"
                style={{ width: "100%" }}
                value={saSchoolId || undefined}
                options={schoolOptions}
                allowClear
                filterOption={(inp, opt) =>
                  opt.label.toLowerCase().includes(inp.toLowerCase())
                }
                onChange={(val) => {
                  setSaSchoolId(val || null);
                  setClassId(null);
                  setSectionId(null);
                }}
                suffixIcon={<BankOutlined />}
              />
            </div>
          )}

          {/* Month */}
          <div>
            <FL>Month</FL>
            <DatePicker
              picker="month"
              style={{ width: "100%" }}
              value={month}
              onChange={(v) => setMonth(v || dayjs())}
            />
          </div>

          {/* Role */}
          <div>
            <FL>Role</FL>
            <Select
              style={{ width: "100%" }}
              value={role}
              options={ROLE_OPTIONS}
              onChange={(v) => { setRole(v); setClassId(null); setSectionId(null); }}
            />
          </div>

          {/* Class — students only */}
          <div>
            <FL>Class</FL>
            <Select
              placeholder="All classes"
              style={{ width: "100%" }}
              allowClear
              disabled={role !== "student" || !schoolId}
              value={classId || undefined}
              options={classOptions}
              onChange={(v) => { setClassId(v || null); setSectionId(null); }}
            />
          </div>

          {/* Section */}
          <div>
            <FL>Section</FL>
            <Select
              placeholder="All sections"
              style={{ width: "100%" }}
              allowClear
              disabled={!classId || role !== "student"}
              value={sectionId || undefined}
              options={sectionOptions}
              onChange={(v) => setSectionId(v || null)}
            />
          </div>

          {/* Generate button */}
          <div>
            <FL>&nbsp;</FL>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ width: "100%" }}
              loading={reportLoading}
              disabled={!schoolId}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary stats ── */}
      {monthlyReport.length > 0 && (
        <div style={{ ...statGrid(140), marginBottom: 16 }}>
          <MiniStat label="Total"         value={summary.total} color="var(--primary)" />
          <MiniStat label={`Avg ${summary.avg}%`} value={null} color="#0891b2" />
          <MiniStat label="Below 75%"     value={summary.low}  color="#D96B7A" />
          <MiniStat label="Above 90%"     value={summary.high} color="#5BA89A" />
        </div>
      )}

      {/* ── Table ── */}
      <div style={sectionPanel}>
        {!schoolId && !reportLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "var(--text-muted)" }}>
                {isSuperAdmin
                  ? "Select a school and click Generate"
                  : "Click Generate to produce the report"}
              </span>
            }
          />
        ) : (
          <Spin spinning={reportLoading}>
            {monthlyReport.length === 0 && !reportLoading ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    No records found — try different filters
                  </span>
                }
              >
                <Button type="primary" onClick={handleGenerate} loading={reportLoading}>
                  Generate Report
                </Button>
              </Empty>
            ) : (
              <Table
                className={TABLE_CLS}
                rowKey="userId"
                loading={reportLoading}
                dataSource={monthlyReport}
                columns={columns}
                pagination={{
                  pageSize: 15,
                  showSizeChanger: false,
                  showTotal: (t) => `${t} records`,
                }}
                scroll={{ x: 700 }}
              />
            )}
          </Spin>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
