import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Select, Spin, Table, Tooltip } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  FileText, Users, CalendarCheck, BarChart3, Clock, FolderOpen,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";
import { fetchReports } from "../../../features/reportSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState,
} from "../../../styles/pageStyles.js";

const normalizeUserContext = (rawUser) => {
  const roleName =
    (typeof rawUser?.role === "string" ? rawUser?.role : rawUser?.role?.name) || "";
  return {
    role:        roleName,
    teacherId:   rawUser?._id       || "",
    schoolId:    rawUser?.school?._id || rawUser?.schoolId || "",
    teacherName: rawUser?.name      || "Teacher",
  };
};

const typeColor = (type = "") => {
  const map = {
    attendance: { color: "#6366f1", bg: "#6366f115" },
    exam:       { color: "#0ea5e9", bg: "#0ea5e915" },
    result:     { color: "#10b981", bg: "#10b98115" },
    academic:   { color: "#f59e0b", bg: "#f59e0b15" },
    behaviour:  { color: "#ec4899", bg: "#ec489915" },
  };
  const key = type.toLowerCase();
  return map[key] || { color: "#8b5cf6", bg: "#8b5cf615" };
};

/* ── Stat card ───────────────────────────────────────────────────── */
const Stat = ({ icon: Icon, label, value, color, loading }) => (
  <div style={statCard({ color, bg: "var(--surface)", accentBar: color })}>
    <div>
      <div style={statLabel(color)}>{label}</div>
      <div style={statValue(color)}>{loading ? "…" : (value ?? 0)}</div>
    </div>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={20} color={color} strokeWidth={1.8} />
    </div>
  </div>
);

/* ── Main page ───────────────────────────────────────────────────── */
const TeacherReports = () => {
  const dispatch = useDispatch();
  const { user }  = useSelector((s) => s.auth     || {});
  const { summary = [], loading: summaryLoading, error: summaryError } =
    useSelector((s) => s.dashboard || {});
  const { items = [], loading: reportsLoading, error: reportsError } =
    useSelector((s) => s.reports  || {});

  const [searchText,   setSearchText]   = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const { role, teacherId, schoolId, teacherName } = useMemo(
    () => normalizeUserContext(user), [user]
  );

  const refreshAll = () => {
    if (role) dispatch(fetchDashboardSummary({ role, schoolId }));
    dispatch(fetchReports({ sort: "-createdAt", school: schoolId, generatedBy: teacherId }));
  };

  useEffect(() => { refreshAll(); }, [role, schoolId]); // eslint-disable-line

  /* ── Filtered reports ── */
  const filteredReports = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    return items.filter((r) => {
      const matchType = selectedType === "all" || r?.type === selectedType;
      if (!matchType) return false;
      if (!kw) return true;
      return [r?.title, r?.type, r?.generatedBy?.name, r?.school?.name]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
    });
  }, [items, searchText, selectedType]);

  /* ── Type dropdown options ── */
  const reportTypeOptions = useMemo(() => {
    const types = new Set(items.map((i) => i?.type).filter(Boolean));
    return [
      { label: "All Types", value: "all" },
      ...[...types].map((t) => ({
        label: t.charAt(0).toUpperCase() + t.slice(1),
        value: t,
      })),
    ];
  }, [items]);

  /* ── Summary stat values ── */
  const studentCount    = summary.find((i) => i.title === "Students")?.value          || 0;
  const attendanceCount = summary.find((i) => i.title === "Attendance Marked")?.value || 0;

  /* ── Table columns ── */
  const columns = [
    {
      title: "Report Title",
      dataIndex: "title",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: "#6366f115",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={14} color="#6366f1" strokeWidth={1.8} />
          </div>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
            {v || "Untitled Report"}
          </span>
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 130,
      render: (v) => {
        const c = typeColor(v || "");
        return <span style={pill(c.color, c.bg)}>{(v || "unknown").toUpperCase()}</span>;
      },
    },
    {
      title: "Created By", dataIndex: ["generatedBy", "name"], width: 160,
      render: (v) => (
        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v || "—"}</span>
      ),
    },
    {
      title: "Created On", dataIndex: "createdAt", width: 140,
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} color="var(--text-muted)" />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {v ? dayjs(v).format("DD MMM YYYY") : "—"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("reports-table")}</style>

      <PageHeader
        title={`${teacherName} — Reports`}
        subtitle="View and track all your generated reports"
        icon={<BarChart3 size={20} />}
        extra={
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={refreshAll} />
          </Tooltip>
        }
      />

      {summaryError && (
        <Alert type="error" showIcon message={summaryError} style={{ marginTop: 16, borderRadius: 10 }} />
      )}
      {reportsError && (
        <Alert type="error" showIcon message={reportsError} style={{ marginTop: 8, borderRadius: 10 }} />
      )}

      {/* ── Stat cards ── */}
      <div style={{ ...statGrid(150), marginTop: 20 }}>
        <Stat icon={Users}         label="Linked Students"   value={studentCount}    color="#6366f1" loading={summaryLoading} />
        <Stat icon={CalendarCheck} label="Attendance Marked" value={attendanceCount} color="#0ea5e9" loading={summaryLoading} />
        <Stat icon={FolderOpen}    label="Reports Available" value={items.length}    color="#10b981" loading={reportsLoading} />
      </div>

      {/* ── Reports table ── */}
      <div style={sectionPanel}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          flexWrap: "wrap", marginBottom: 16,
          justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
            {selectedType !== "all" || searchText ? " (filtered)" : ""}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Input
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search title, type, creator…"
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              style={{ width: 240, borderRadius: 9 }}
            />
            <Select
              style={{ width: 160 }}
              options={reportTypeOptions}
              value={selectedType}
              onChange={setSelectedType}
              placeholder="Filter by type"
            />
          </div>
        </div>

        {reportsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Spin size="large" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              No Reports Found
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {items.length === 0
                ? "No reports have been generated yet."
                : "No reports match your current filter."}
            </div>
          </div>
        ) : (
          <Table
            className="reports-table"
            rowKey={(r) => r._id}
            columns={columns}
            dataSource={filteredReports}
            pagination={{ pageSize: 8, showSizeChanger: false, size: "small" }}
            size="small"
            scroll={{ x: 600 }}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherReports;
