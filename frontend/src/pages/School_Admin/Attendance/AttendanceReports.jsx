import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  DatePicker,
  Input,
  Table,
  Tag,
  Spin,
  Empty,
  Segmented,
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAttendance } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
  sectionPanel,
  toolbarRow,
} from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

/* ── Constants ───────────────────────────────────────────────────── */
const TABLE_CLS = "att-report-tbl";

const STATUS_COLOR = {
  present: "green",
  absent:  "red",
  late:    "orange",
  halfday: "volcano",
  leave:   "blue",
};

const REPORT_TYPES = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Staff",   value: "staff"   },
];

/* ── CSV export utility ──────────────────────────────────────────── */
const downloadCSV = (data, filename) => {
  const rows = data.map((r) => [
    r.userId?.name || "",
    dayjs(r.date).format("DD-MM-YYYY"),
    r.status,
    r.remarks || "",
  ]);
  const header = ["Name", "Date", "Status", "Remarks"];
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Main component ──────────────────────────────────────────────── */
const AttendanceReports = () => {
  const dispatch = useDispatch();
  const { list = [], loading }         = useSelector((s) => s.attendance || {});
  const { schoolClasses = [] }         = useSelector((s) => s.schoolClass || {});
  const { user: currentUser }          = useSelector((s) => s.auth || {});

  const schoolId = currentUser?.school?._id;

  /* ── Filters state ── */
  const [reportType,       setReportType]       = useState("student");
  const [selectedClass,    setSelectedClass]    = useState(null);
  const [selectedSection,  setSelectedSection]  = useState(null);
  const [dateRange,        setDateRange]        = useState([dayjs().startOf("month"), dayjs()]);
  const [searchText,       setSearchText]       = useState("");

  /* ── Normalised classes ── */
  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const selectedClassObj = useMemo(
    () => classes.find((c) => c._id === selectedClass) || null,
    [classes, selectedClass]
  );

  const sectionOptions = useMemo(
    () => (selectedClassObj?.sections || []).map((s) => ({ value: s._id, label: s.name })),
    [selectedClassObj]
  );

  /* ── Fetch on mount ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSchoolClasses({ schoolId }));
  }, [schoolId, dispatch]);

  /* ── Fetch attendance on filter change ── */
  const fetchReport = useCallback(() => {
    if (!schoolId) return;
    const params = {
      schoolId,
      role: reportType,
      limit: 500,
    };
    if (selectedClass)   params.classId   = selectedClass;
    if (selectedSection) params.sectionId = selectedSection;
    if (dateRange?.[0])  params.startDate = dateRange[0].startOf("day").toISOString();
    if (dateRange?.[1])  params.endDate   = dateRange[1].endOf("day").toISOString();
    dispatch(fetchAttendance(params));
  }, [schoolId, reportType, selectedClass, selectedSection, dateRange, dispatch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ── Handle class change ── */
  const handleClassChange = (val) => {
    setSelectedClass(val || null);
    setSelectedSection(null);
  };

  /* ── Filtered list (client-side search) ── */
  const filteredList = useMemo(() => {
    if (!searchText.trim()) return list;
    const q = searchText.toLowerCase();
    return list.filter((r) =>
      (r.userId?.name || "").toLowerCase().includes(q)
    );
  }, [list, searchText]);

  /* ── Summary counts ── */
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    filteredList.forEach((r) => {
      if (r.status === "present")          counts.present++;
      else if (r.status === "absent")      counts.absent++;
      else if (r.status === "late")        counts.late++;
      else if (r.status === "leave" || r.status === "halfday") counts.leave++;
    });
    return counts;
  }, [filteredList]);

  /* ── Working-hours helper ── */
  const workingHours = (r) => {
    if (!r.checkInAt || !r.checkOutAt) return "—";
    const diff = dayjs(r.checkOutAt).diff(dayjs(r.checkInAt), "minute");
    if (diff <= 0) return "—";
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  /* ── Table columns ── */
  const studentColumns = [
    {
      title: "Student Name",
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {r.userId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Class",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.schoolClassId?.name || r.classId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Section",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.sectionId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Date",
      render: (_, r) => dayjs(r.date).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={STATUS_COLOR[r.status] || "default"}>
          {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—"}
        </Tag>
      ),
    },
    {
      title: "Remarks",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.remarks || "—"}
        </span>
      ),
    },
  ];

  const staffColumns = [
    {
      title: "Name",
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {r.userId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Role / Dept",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.userId?.role?.name || r.userId?.department || "—"}
        </span>
      ),
    },
    {
      title: "Date",
      render: (_, r) => dayjs(r.date).format("DD MMM YYYY"),
    },
    {
      title: "Check In",
      render: (_, r) =>
        r.checkInAt ? dayjs(r.checkInAt).format("HH:mm") : "—",
    },
    {
      title: "Check Out",
      render: (_, r) =>
        r.checkOutAt ? dayjs(r.checkOutAt).format("HH:mm") : "—",
    },
    {
      title: "Working Hrs",
      render: (_, r) => (
        <span
          style={{
            fontSize: 12,
            color: workingHours(r) !== "—" ? "#22C55E" : "var(--text-muted)",
            fontWeight: workingHours(r) !== "—" ? 600 : 400,
          }}
        >
          {workingHours(r)}
        </span>
      ),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={STATUS_COLOR[r.status] || "default"}>
          {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—"}
        </Tag>
      ),
    },
  ];

  const columns = reportType === "student" ? studentColumns : staffColumns;

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Reports"
        subtitle="View and export attendance records by role, class and date range"
        icon={<FileTextOutlined />}
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCSV(
                filteredList,
                `attendance-${reportType}-${dayjs().format("YYYY-MM-DD")}.csv`
              )
            }
            disabled={!filteredList.length}
          >
            Export CSV
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <Segmented
            options={REPORT_TYPES}
            value={reportType}
            onChange={(val) => {
              setReportType(val);
              setSelectedClass(null);
              setSelectedSection(null);
            }}
          />
        </div>

        <div style={toolbarRow}>
          {reportType === "student" && (
            <>
              <Select
                placeholder="Select Class"
                value={selectedClass}
                onChange={handleClassChange}
                options={classes.map((c) => ({ value: c._id, label: c.name }))}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Section"
                value={selectedSection}
                onChange={(v) => setSelectedSection(v || null)}
                options={sectionOptions}
                allowClear
                disabled={!selectedClass}
                style={{ width: 120 }}
              />
            </>
          )}

          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range || [dayjs().startOf("month"), dayjs()])}
            disabledDate={(c) => c && c > dayjs().endOf("day")}
            style={{ flex: "1 1 220px", minWidth: 220 }}
          />

          <Input
            placeholder="Search name…"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 180 }}
          />

          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={fetchReport}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div style={statGrid(130)}>
        {[
          { key: "present", label: "Present", color: "#22C55E" },
          { key: "absent",  label: "Absent",  color: "#EF4444" },
          { key: "late",    label: "Late",    color: "#F59E0B" },
          { key: "leave",   label: "Leave",   color: "#0891b2" },
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
              <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
                {summary[key]}
              </div>
            </div>
          </div>
        ))}

        {/* Total records */}
        <div
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
          <div style={iconWell("var(--primary)", 34)}>
            <FileTextOutlined style={{ fontSize: 14 }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}
            >
              Total Records
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>
              {filteredList.length}
            </div>
          </div>
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
        <Spin spinning={loading}>
          {filteredList.length > 0 ? (
            <Table
              className={TABLE_CLS}
              rowKey="_id"
              columns={columns}
              dataSource={filteredList}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} records` }}
              scroll={{ x: 700 }}
            />
          ) : (
            <div style={{ padding: "56px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    {loading
                      ? "Loading records…"
                      : "No attendance records found. Adjust filters and click Generate Report."}
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

export default AttendanceReports;
