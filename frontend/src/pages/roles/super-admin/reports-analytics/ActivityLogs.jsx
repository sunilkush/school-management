import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Typography,
  Select,
  Table,
  Space,
  Button,
  Input,
  Tag,
  Avatar,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../../features/schoolSlice";
import { fetchActivityLogs } from "../../../../features/activitySlice";

const { Text } = Typography;
const { Option } = Select;

// ── Design tokens ───────────────────────────────────────────────────────────
const TOKEN = {
  bg: "#F5F4F1",
  surface: "#FFFFFF",
  border: "#E4E2DC",
  borderLight: "#F1EFE8",
  text: "#1A1A18",
  textMuted: "#888780",
  textFaint: "#B4B2A9",
};

const AVATAR_PALETTES = [
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FAEEDA", color: "#854F0B" },
];

const ROLE_STYLES = {
  Parent:   { bg: "#EEEDFE", color: "#534AB7" },
  Teacher: { bg: "#E1F5EE", color: "#0F6E56" },
  Student: { bg: "#E6F1FB", color: "#185FA5" },
  "Super Admin": { bg: "#FDECF7", color: "#9B2C6A" },
  "School Admin": { bg: "#E8F0FE", color: "#1F4E8C" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getPalette(name = "") {
  return AVATAR_PALETTES[(name.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    + " " + dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isToday(d) {
  return new Date(d).toDateString() === new Date().toDateString();
}

// ── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }) => (
  <div
    style={{
      background: TOKEN.surface,
      border: `0.5px solid ${TOKEN.border}`,
      borderRadius: 10,
      padding: "14px 18px",
      flex: "1 1 130px",
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: TOKEN.textFaint,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: TOKEN.text,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: TOKEN.textMuted, marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ActivityLogs = () => {
  const dispatch = useDispatch();
  const { schools = [] } = useSelector((state) => state.school);
  const { logs = [], loading, error } = useSelector((state) => state.activity);

  const [selectedSchool, setSelectedSchool] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchActivityLogs());
  }, [dispatch]);

const normalizedLogs = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      roleName:
        typeof log.role === "string"
          ? log.role
          : log.role?.name || "—",
      eventDate: log.date || log.createdAt || log.updatedAt || null,
    }));
  }, [logs]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const todayCount = normalizedLogs.filter((l) => l.eventDate && isToday(l.eventDate)).length;
    const uniqueUsers = new Set(normalizedLogs.map((l) => l.user?.name).filter(Boolean)).size;
    const uniqueSchools = new Set(normalizedLogs.map((l) => l.school?.name).filter(Boolean)).size;
    return {
      total: normalizedLogs.length,
      today: todayCount,
      users: uniqueUsers,
      schools: uniqueSchools,
    };
  }, [normalizedLogs]);

  // ── Filtered + searched logs ──────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
   return normalizedLogs.filter((log) => {
      const matchSchool = selectedSchool === "All" || log.school?.name === selectedSchool;
      const matchRole   = selectedRole === "All" || log.roleName === selectedRole;
      const matchSearch = !q
        || (log.user?.name || "").toLowerCase().includes(q)
        || (log.action || "").toLowerCase().includes(q)
        || (log.description || "").toLowerCase().includes(q);
      return matchSchool && matchRole && matchSearch;
    });
  }, [normalizedLogs, selectedSchool, selectedRole, search]);

  const roleOptions = useMemo(() => {
    const discoveredRoles = new Set(
      normalizedLogs.map((log) => log.roleName).filter((roleName) => roleName && roleName !== "—")
    );
    return ["All", ...discoveredRoles];
  }, [normalizedLogs]);

  const handleExport = useCallback(() => {
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      log.user?.name || "—",
      log.roleName || "—",
      log.action || "—",
      log.description || "—",
      log.school?.name || "—",
      formatDate(log.eventDate),
    ]);

    const csvHeader = ["#", "User", "Role", "Action", "Description", "School", "Date"];
    const csvContent = [csvHeader, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredLogs]);


  const schoolOptions = ["All", ...schools.map((s) => s.name).filter(Boolean)];

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: "#",
      key: "index",
      width: 52,
      render: (_, __, i) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: TOKEN.textFaint }}>
          {String(i + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      sorter: (a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""),
      render: (user) => {
        const name = user?.name || "—";
        const { bg, color } = getPalette(name);
        return (
          <Space size={8}>
            <Avatar size={26} style={{ background: bg, color, fontSize: 10, fontWeight: 600 }}>
              {getInitials(name)}
            </Avatar>
            <span style={{ fontWeight: 500, color: TOKEN.text, fontSize: 13 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const name = typeof role === "string" ? role : role?.name || "—";
        const style = ROLE_STYLES[name] || { bg: TOKEN.borderLight, color: TOKEN.textMuted };
        return (
          <Tag
            style={{
              background: style.bg,
              color: style.color,
              border: "none",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
            }}
          >
            {name}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "#FAEEDA",
            color: "#854F0B",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 8px",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#854F0B",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {action || "—"}
        </span>
      ),
    },
    {
      title: "School",
      dataIndex: "school",
      key: "school",
      render: (school) => (
        <span style={{ color: "#5F5E5A", fontSize: 13 }}>{school?.name || "—"}</span>
      ),
    },
    {
       title: "Date",
      dataIndex: "eventDate",
      key: "date",
      sorter: (a, b) => new Date(a.eventDate) - new Date(b.eventDate),
      defaultSortOrder: "descend",
      render: (date) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: TOKEN.textMuted }}>
          {formatDate(date)}
        </span>
      ),
    },
  ];

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle = {
    borderRadius: 7,
    fontSize: 13,
    height: 34,
    border: `0.5px solid ${TOKEN.border}`,
    background: "#FAFAF8",
  };

  return (
    <div style={{ padding: "28px 24px", background: TOKEN.bg, minHeight: "100vh" }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: TOKEN.textFaint,
            marginBottom: 4,
          }}
        >
          System Overview
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: TOKEN.text,
            letterSpacing: "-0.02em",
            marginBottom: 2,
          }}
        >
          Activity Logs
        </div>
        <div style={{ fontSize: 13, color: TOKEN.textMuted }}>
          Track user and system activities across schools
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total Events" value={stats.total} sub="all time" />
        <StatCard label="Today"        value={stats.today} sub="last 24 hrs" />
        <StatCard label="Unique Users" value={stats.users} sub="active" />
        <StatCard label="Schools"      value={stats.schools} sub="monitored" />
      </div>

      {/* ── Table card ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: TOKEN.surface,
          border: `0.5px solid ${TOKEN.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: `0.5px solid ${TOKEN.border}`,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Space wrap size={8}>
            <Input
              placeholder="Search user or action…"
              prefix={<SearchOutlined style={{ color: TOKEN.textFaint, fontSize: 13 }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 210 }}
              allowClear
            />
            <Select
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 180, fontSize: 13 }}
              dropdownStyle={{ fontSize: 13, borderRadius: 8 }}
            >
              {schoolOptions.map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 140, fontSize: 13 }}
              dropdownStyle={{ fontSize: 13, borderRadius: 8 }}
            >
             {roleOptions.map((r) => (
                <Option key={r} value={r}>{r === "All" ? "All roles" : r}</Option>
              ))}
            </Select>
          </Space>

          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchActivityLogs())}
              style={{
                borderRadius: 7,
                fontSize: 13,
                height: 34,
                border: `0.5px solid ${TOKEN.border}`,
                background: "#FAFAF8",
                color: "#444441",
              }}
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
                onClick={handleExport}
              style={{
                borderRadius: 7,
                fontSize: 13,
                height: 34,
                background: TOKEN.text,
                border: "none",
              }}
            >
              Export
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey={(record) => record._id}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            style: { padding: "12px 20px", margin: 0 },
          }}
          scroll={{ x: "max-content" }}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          rowClassName={() => "log-row"}
          onHeaderRow={() => ({
            style: {
              background: TOKEN.surface,
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: TOKEN.textFaint,
            },
          })}
        />

        {error && (
          <div style={{ padding: "12px 20px" }}>
            <Text type="danger" style={{ fontSize: 13 }}>{error}</Text>
          </div>
        )}
      </div>

      {/* Row hover style */}
      <style>{`
        .log-row td { border-bottom: 0.5px solid #F1EFE8 !important; }
        .log-row:hover td { background: #FAFAF8 !important; }
        .ant-table-thead > tr > th {
          background: #fff !important;
          border-bottom: 0.5px solid #E4E2DC !important;
        }
      `}</style>
    </div>
  );
};

export default ActivityLogs;