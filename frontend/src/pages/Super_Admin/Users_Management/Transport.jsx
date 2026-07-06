import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
<<<<<<< HEAD
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import { Table, Input, Select, message, Spin, Tabs } from "antd";
import { Truck, Bus, UserCheck, UserX, Users, Search, RefreshCw, Filter } from "lucide-react";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, avatarStyle, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#F97316";

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function StatusPill({ isActive }) {
  return (
    <span style={pill(isActive ? "#16A34A" : "#DC2626", isActive ? "rgba(220,252,231,0.4)" : "rgba(254,226,226,0.4)")}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function UserTable({ data, loading, onToggle, tableClass, emptyLabel, icon }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "active") d = d.filter((u) => u.isActive);
    if (statusFilter === "inactive") d = d.filter((u) => !u.isActive);
    return d;
  }, [data, search, statusFilter]);

  const columns = [
    {
      title: emptyLabel,
      key: "user",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...avatarStyle(record.name, 36), borderRadius: 10, overflow: "hidden" }}>
            {record.avatar ? <img src={record.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(record.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{record.email}</div>
          </div>
        </div>
=======
import { Table, Button, Tabs, Space, message } from "antd";
import { ReloadOutlined, PlusOutlined, CheckCircleOutlined, StopOutlined, CarOutlined } from "@ant-design/icons";
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, avatarStyle,
} from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const StatusBadge = ({ isActive }) => (
  <span style={pill(isActive ? "#15803D" : "#DC2626", isActive ? "rgba(220,252,231,0.5)" : "rgba(254,226,226,0.5)")}>
    {isActive ? "Active" : "Inactive"}
  </span>
);

const Transport = () => {
  const dispatch = useDispatch();
  const { users = [], loading, user: currentUser } = useSelector((state) => state.auth || {});
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch, refreshTick]);

  const drivers = useMemo(() => users.filter((u) => u?.role?.name === "Driver"), [users]);
  const transporters = useMemo(() => users.filter((u) => u?.role?.name === "Transporter"), [users]);

  const handleToggleStatus = (targetUser) => {
    if (targetUser._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }
    dispatch(targetUser.isActive ? deleteUser(targetUser._id) : activeUser(targetUser._id)).then(() => {
      message.success("Status updated successfully");
      setRefreshTick((t) => t + 1);
    });
  };

  const columns = [
    {
      title: "Name",
      key: "user",
      render: (_, record) => (
        <Space>
          <div style={avatarStyle(record.name, 34)}>
            {record.avatar ? <img src={record.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : null}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{record.email}</div>
          </div>
        </Space>
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
      ),
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
<<<<<<< HEAD
      render: (v) => v ? <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    { title: "Status", dataIndex: "isActive", render: (v) => <StatusPill isActive={v} /> },
=======
      render: (school) => school
        ? <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{school}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => <StatusBadge isActive={isActive} />,
    },
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
<<<<<<< HEAD
        <button
          onClick={() => onToggle(record)}
          style={{ ...pill(record.isActive ? "#DC2626" : "#16A34A", record.isActive ? "rgba(254,226,226,0.3)" : "rgba(220,252,231,0.3)"), cursor: "pointer", border: `1px solid ${record.isActive ? "#FCA5A5" : "#86EFAC"}`, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </button>
=======
        <Button
          size="middle"
          danger={record.isActive}
          type={record.isActive ? "default" : "primary"}
          icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
          onClick={() => handleToggleStatus(record)}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </Button>
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
      ),
    },
  ];

  return (
<<<<<<< HEAD
    <>
      <style>{tableHeadCss(tableClass)}</style>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Input prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />} placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 230, borderRadius: 8 }} />
        <Select placeholder="All Status" allowClear value={statusFilter || undefined} onChange={(v) => setStatusFilter(v ?? "")} style={{ width: 120 }} suffixIcon={<Filter size={11} />}>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
        </Select>
        <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} / {data.length}
        </span>
      </div>
      <Spin spinning={!!loading}>
        <div className={tableClass}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
            locale={{ emptyText: <div style={emptyState}>{icon}<div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>No {emptyLabel.toLowerCase()} found</div></div> }}
          />
        </div>
      </Spin>
    </>
  );
}

const Transport = () => {
  const dispatch = useDispatch();
  const { users = [], loading, user: currentUser } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchAllUser()); }, [dispatch]);

  const refresh = () => dispatch(fetchAllUser());

  const drivers = useMemo(() => users.filter((u) => u?.role?.name === "Driver"), [users]);
  const transporters = useMemo(() => users.filter((u) => u?.role?.name === "Transporter"), [users]);

  const allTransport = [...drivers, ...transporters];
  const activeCount = allTransport.filter((u) => u.isActive).length;
  const inactiveCount = allTransport.length - activeCount;

  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) { message.warning("You cannot change your own status"); return; }
    dispatch(user.isActive ? deleteUser({ id: user._id, isActive: false }) : activeUser({ id: user._id, isActive: true }))
      .then(() => dispatch(fetchAllUser()));
  };

  return (
    <>
      <div style={pageWrapper}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell(ACCENT, 44)}><Truck size={22} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Transport Management</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Manage drivers and transporters across schools</div>
            </div>
          </div>
          <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface-soft)", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div style={statGrid(160)}>
          {[
            { label: "Drivers", value: drivers.length, color: ACCENT, icon: <Truck size={18} /> },
            { label: "Transporters", value: transporters.length, color: "#6366F1", icon: <Bus size={18} /> },
            { label: "Active", value: activeCount, color: "#22C55E", icon: <UserCheck size={18} /> },
            { label: "Inactive", value: inactiveCount, color: "#EF4444", icon: <UserX size={18} /> },
          ].map((s) => (
            <div key={s.label} style={statCard({ color: s.color, bg: "var(--surface)", accentBar: s.color })}>
              <div>
                <div style={statLabel(s.color)}>{s.label}</div>
                <div style={statValue(s.color)}>{s.value}</div>
              </div>
              <div style={iconWell(s.color, 40)}>{s.icon}</div>
            </div>
          ))}
        </div>

        <div style={sectionPanel}>
          <Tabs
            defaultActiveKey="drivers"
            items={[
              {
                key: "drivers",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Truck size={14} /> Drivers ({drivers.length})
                  </span>
                ),
                children: (
                  <UserTable
                    data={drivers}
                    loading={loading}
                    onToggle={handleToggleStatus}
                    tableClass="drivers-tbl"
                    emptyLabel="Drivers"
                    icon={<Truck size={32} color="var(--text-muted)" style={{ margin: "0 auto" }} />}
                  />
                ),
              },
              {
                key: "transporters",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bus size={14} /> Transporters ({transporters.length})
                  </span>
                ),
                children: (
                  <UserTable
                    data={transporters}
                    loading={loading}
                    onToggle={handleToggleStatus}
                    tableClass="transporters-tbl"
                    emptyLabel="Transporters"
                    icon={<Bus size={32} color="var(--text-muted)" style={{ margin: "0 auto" }} />}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
=======
    <div style={pageWrapper}>
      <PageHeader
        title="Transport Management"
        subtitle="Manage drivers and transporters across schools"
        icon={<CarOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => setRefreshTick((t) => t + 1)}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Transport User</Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<CarOutlined />} label="Drivers" value={drivers.length} color="#2563EB" />
        <StatCard icon={<CarOutlined />} label="Transporters" value={transporters.length} color="#7C3AED" />
        <StatCard icon={<CheckCircleOutlined />} label="Active" value={[...drivers, ...transporters].filter((u) => u.isActive).length} color="#22C55E" />
        <StatCard icon={<StopOutlined />} label="Inactive" value={[...drivers, ...transporters].filter((u) => !u.isActive).length} color="#EF4444" />
      </div>

      <style>{tableHeadCss("transport-tbl")}</style>

      <div style={sectionPanel}>
        <Tabs
          defaultActiveKey="drivers"
          items={[
            {
              key: "drivers",
              label: `Drivers (${drivers.length})`,
              children: (
                <div className="transport-tbl" style={tableContainer}>
                  <Table rowKey="_id" columns={columns} dataSource={drivers} loading={loading} pagination={{ pageSize: 8 }} />
                </div>
              ),
            },
            {
              key: "transporters",
              label: `Transporters (${transporters.length})`,
              children: (
                <div className="transport-tbl" style={tableContainer}>
                  <Table rowKey="_id" columns={columns} dataSource={transporters} loading={loading} pagination={{ pageSize: 8 }} />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
  );
};

export default Transport;
