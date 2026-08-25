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
  Popconfirm,
  message,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActivityLogs, deleteActivityLog } from "../../../features/activitySlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  toolbarRow,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";
import { categoricalColorFor } from "../../../utils/colorPalette";

const { Text } = Typography;
const { Option } = Select;

// ── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// Deterministic color per name/role, drawn from the shared categorical palette
// (used to be a local hardcoded 5-color array duplicated across pages).
function getPalette(name = "") {
  const color = categoricalColorFor(name);
  return { bg: `color-mix(in srgb, ${color} 13%, transparent)`, color };
}

function getRoleStyle(name = "") {
  if (!name || name === "—") return { bg: "var(--surface-soft)", color: "var(--text-muted)" };
  const color = categoricalColorFor(name);
  return { bg: `color-mix(in srgb, ${color} 13%, transparent)`, color };
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
  <div style={{ ...sectionPanel, padding: "14px 18px", marginBottom: 0 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text-muted)",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: "var(--text-primary)",
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
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

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteActivityLog(id)).unwrap();
      message.success("Log entry deleted");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete log entry");
    }
  };

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
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
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
            <span style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>{name}</span>
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
        const style = getRoleStyle(name);
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
            background: "var(--warning-light)",
            color: "var(--warning-hover)",
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
              background: "var(--warning-hover)",
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
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{school?.name || "—"}</span>
      ),
    },
    {
       title: "Date",
      dataIndex: "eventDate",
      key: "date",
      sorter: (a, b) => new Date(a.eventDate) - new Date(b.eventDate),
      defaultSortOrder: "descend",
      render: (date) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this log entry?"
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record._id)}
        >
          <Button size="small" danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Activity Logs"
        subtitle="Track user and system activities across schools"
        icon={<HistoryOutlined />}
      />

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div style={{ ...statGrid(150), marginTop: 20 }}>
        <StatCard label="Total Events" value={stats.total} sub="all time" />
        <StatCard label="Today"        value={stats.today} sub="last 24 hrs" />
        <StatCard label="Unique Users" value={stats.users} sub="active" />
        <StatCard label="Schools"      value={stats.schools} sub="monitored" />
      </div>

      <style>{tableHeadCss("logs-tbl")}</style>

      {/* ── Table card ───────────────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            ...toolbarRow,
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-muted)",
            marginBottom: 0,
          }}
        >
          <Space wrap size={8}>
            <Input
              placeholder="Search user or action…"
              prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 210 }}
              allowClear
            />
            <Select
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 180, fontSize: 13 }}
            >
              {schoolOptions.map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 140, fontSize: 13 }}
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
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              onClick={handleExport}
            >
              Export
            </Button>
          </Space>
        </div>

        {/* Table */}
        <div className="logs-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
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
          />
        </div>

        {error && (
          <div style={{ padding: "12px 20px" }}>
            <Text type="danger" style={{ fontSize: 13 }}>{error}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
