import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Tag, Space, Typography, Select, Input, Empty } from "antd";
import {
  SafetyOutlined, TeamOutlined, ReloadOutlined,
  LoginOutlined, LogoutOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchGateEntries, fetchGateStats } from "../../features/gateEntrySlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, sectionPanel, iconWell, tableHeadCss, avatarStyle,
} from "../../styles/pageStyles";
import { EntryStatusBadge, getInitials } from "./securityShared";

const { Text } = Typography;

const GATE_OPTIONS = ["All", "Main", "Side", "Back", "Other"];
const TYPE_OPTIONS = ["All", "Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"];

const fmtLogTime = (v) =>
  v ? new Date(v).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const GateLogs = () => {
  const dispatch = useDispatch();
  const { entries, loading, stats } = useSelector((s) => s.gateEntries);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gateFilter, setGateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchGateEntries({ limit: 500 }));
    dispatch(fetchGateStats());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchGateEntries({ limit: 500 }));
    dispatch(fetchGateStats());
  };

  const filteredEntries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesGate = gateFilter === "All" || e.gate === gateFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      const matchesSearch =
        !q || e.name?.toLowerCase().includes(q) || e.vehicleNo?.toLowerCase().includes(q);
      return matchesType && matchesGate && matchesStatus && matchesSearch;
    });
  }, [entries, searchText, typeFilter, gateFilter, statusFilter]);

  const cols = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={avatarStyle(r.name, 34)}>{getInitials(r.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.type}</div>
          </div>
        </div>
      ),
    },
    { title: "Vehicle No", dataIndex: "vehicleNo", render: (v) => v || "—" },
    { title: "Gate", dataIndex: "gate", render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag> },
    { title: "Entry Time", dataIndex: "entryTime", render: fmtLogTime },
    { title: "Exit Time", dataIndex: "exitTime", render: fmtLogTime },
    { title: "Status", dataIndex: "status", render: (v) => <EntryStatusBadge status={v} /> },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("gatelog-tbl")}</style>

      <PageHeader
        title="Gate Logs"
        subtitle="Complete history of visitor, vendor & staff gate activity"
        icon={<SafetyOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        }
      />

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        {[
          { label: "Currently Inside", value: stats.inside ?? 0,       icon: <TeamOutlined />,   color: "var(--success)" },
          { label: "Today's Entries",  value: stats.todayEntries ?? 0, icon: <LoginOutlined />,  color: "var(--primary)" },
          { label: "Today's Exits",    value: stats.todayExits ?? 0,   icon: <LogoutOutlined />, color: "var(--purple)" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity table ────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>All Gate Activity</Text>
          <Space wrap>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
              options={["All", "Inside", "Exited"].map((v) => ({ value: v, label: v }))} />
            <Select value={gateFilter} onChange={setGateFilter} style={{ width: 120 }}
              options={GATE_OPTIONS.map((v) => ({ value: v, label: v }))} />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}
              options={TYPE_OPTIONS.map((v) => ({ value: v, label: v }))} />
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search name, vehicle..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
          </Space>
        </div>
        <Table
          className="gatelog-tbl"
          dataSource={filteredEntries}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ["15", "25", "50", "100"] }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No gate activity found" /> }}
        />
      </div>
    </div>
  );
};

export default GateLogs;
