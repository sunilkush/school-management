import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import { Table, Modal, Input, Select, message, Spin, Popconfirm } from "antd";
import {
  ShieldCheck, Users, UserCheck, UserX, School2,
  Search, RefreshCw, Plus, Filter,
} from "lucide-react";
import RegisterForm from "../../../components/forms/RegisterForm";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, avatarStyle, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#14B8A6";

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

const Admins = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector((s) => s.auth || {});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { dispatch(fetchAllUser({ roleName: ["School Admin"], isActive: true })); }, [dispatch]);

  const refresh = () => dispatch(fetchAllUser({ roleName: ["School Admin"], isActive: true }));
  const handleCloseModal = () => { setIsModalOpen(false); refresh(); };

  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) { message.warning("You cannot change your own status"); return; }
    Modal.confirm({
      title: user.isActive ? "Deactivate Admin?" : "Activate Admin?",
      content: `Are you sure you want to ${user.isActive ? "deactivate" : "activate"} ${user.name}?`,
      okText: "Yes, Confirm", cancelText: "Cancel",
      okButtonProps: { danger: user.isActive },
      onOk: async () => {
        try {
          if (user.isActive) await dispatch(deleteUser(user._id)).unwrap();
          else await dispatch(activeUser(user._id)).unwrap();
          refresh();
        } catch { message.error("Operation failed"); }
      },
    });
  };

  const handleBulkAction = async (activate) => {
    const allUsers = Array.isArray(users) ? users : [];
    const targets = allUsers.filter((u) => selectedRowKeys.includes(u._id) && u._id !== currentUser?._id);
    if (!targets.length) { message.warning("No eligible rows selected"); return; }
    setBulkLoading(true);
    try {
      await Promise.all(targets.map((u) => dispatch(activate ? activeUser(u._id) : deleteUser(u._id))));
      message.success(`${targets.length} admin(s) ${activate ? "activated" : "deactivated"}`);
      setSelectedRowKeys([]);
      refresh();
    } catch { message.error("Bulk action failed"); }
    finally { setBulkLoading(false); }
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((u) => {
      const matchSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.school?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "" ? true : statusFilter === "active" ? u.isActive : !u.isActive;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  const totalAdmins = Array.isArray(users) ? users.length : 0;
  const activeCount = Array.isArray(users) ? users.filter((u) => u.isActive).length : 0;
  const inactiveCount = totalAdmins - activeCount;
  const schoolCount = Array.isArray(users) ? new Set(users.map((u) => u.school?.name).filter(Boolean)).size : 0;

  const columns = [
    {
      title: "Admin",
      key: "user",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...avatarStyle(record.name, 36), borderRadius: 10, overflow: "hidden" }}>
            {record.avatar
              ? <img src={record.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials(record.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: ["role", "name"],
      render: (role) => <span style={pill("#6D28D9", "rgba(139,92,246,0.12)")}>{role || "School Admin"}</span>,
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      render: (school) => school
        ? <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{school}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => <StatusPill isActive={isActive} />,
    },
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <button
          onClick={() => handleToggleStatus(record)}
          style={{
            ...pill(record.isActive ? "#DC2626" : "#16A34A", record.isActive ? "rgba(254,226,226,0.3)" : "rgba(220,252,231,0.3)"),
            cursor: "pointer", border: `1px solid ${record.isActive ? "#FCA5A5" : "#86EFAC"}`,
            padding: "5px 14px", fontSize: 12, fontWeight: 600,
          }}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("admins-tbl")}</style>
      <div style={pageWrapper}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell(ACCENT, 44)}><ShieldCheck size={22} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>School Admin Management</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Manage and monitor all school administrators</div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            <Plus size={15} /> Add School Admin
          </button>
        </div>

        {/* Stats */}
        <div style={statGrid(160)}>
          {[
            { label: "Total Admins", value: totalAdmins, color: ACCENT, icon: <Users size={18} /> },
            { label: "Active", value: activeCount, color: "#22C55E", icon: <UserCheck size={18} /> },
            { label: "Inactive", value: inactiveCount, color: "#EF4444", icon: <UserX size={18} /> },
            { label: "Schools", value: schoolCount, color: "#6366F1", icon: <School2 size={18} /> },
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

        {/* Table Panel */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Input
                prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
                placeholder="Search name, email or school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 260, borderRadius: 8 }}
              />
              <Select
                placeholder="All Status"
                allowClear
                value={statusFilter || undefined}
                onChange={(v) => setStatusFilter(v ?? "")}
                style={{ width: 130 }}
                suffixIcon={<Filter size={11} />}
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface-soft)", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{totalAdmins}</strong>
            </span>
          </div>

          {selectedRowKeys.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{selectedRowKeys.length} selected</span>
              <Popconfirm title={`Activate ${selectedRowKeys.length} admin(s)?`} onConfirm={() => handleBulkAction(true)} okText="Activate">
                <button style={{ ...pill("#16A34A", "rgba(220,252,231,0.4)"), cursor: "pointer", padding: "4px 12px", fontSize: 12 }}>Activate</button>
              </Popconfirm>
              <Popconfirm title={`Deactivate ${selectedRowKeys.length} admin(s)?`} onConfirm={() => handleBulkAction(false)} okText="Deactivate" okButtonProps={{ danger: true }}>
                <button style={{ ...pill("#DC2626", "rgba(254,226,226,0.4)"), cursor: "pointer", padding: "4px 12px", fontSize: 12 }}>Deactivate</button>
              </Popconfirm>
            </div>
          )}

          {error && <div style={{ ...pill("#DC2626", "rgba(254,226,226,0.3)"), marginBottom: 12, padding: "8px 14px" }}>{error}</div>}

          <Spin spinning={!!loading}>
            <div className="admins-tbl">
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={filteredUsers}
                rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
                pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
                locale={{ emptyText: <div style={emptyState}><Users size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} /><div style={{ color: "var(--text-muted)", fontSize: 13 }}>No admins found</div></div> }}
              />
            </div>
          </Spin>
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell(ACCENT, 34)}><ShieldCheck size={16} /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Register New School Admin</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the details below</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <RegisterForm onClose={handleCloseModal} />
      </Modal>
    </>
  );
};

export default Admins;
