import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Modal, Input, Select, Button, Space, Tooltip, Popconfirm, Tag, message,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, TeamOutlined,
  CheckCircleOutlined, TagOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, KeyOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser, deleteUser, currentUser, assignAdditionalRoles } from "../../../features/authSlice";
import { fetchRoles } from "../../../features/roleSlice";
import RegisterForm from "../../../components/forms/RegisterForm";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableHeadCss,
  avatarStyle, pill, emptyState, statCard, statLabel, statValue, statGrid,
} from "../../../styles/pageStyles";

const ROLE_COLORS = {
  teacher:            { color: "var(--accent)", bg: "rgba(var(--accent-rgb), 0.2)" },
  "school admin":     { color: "var(--primary)", bg: "rgba(219,234,254,0.2)" },
  principal:          { color: "var(--success)", bg: "var(--success-light)" },
  accountant:         { color: "var(--primary)", bg: "var(--info-light)" },
  staff:              { color: "var(--text-secondary)", bg: "var(--surface-soft)" },
  librarian:          { color: "var(--pink-hover)", bg: "var(--danger-light)" },
  "hostel warden":    { color: "var(--warning-hover)", bg: "rgba(var(--warning-rgb), 0.08)" },
  "transport manager":{ color: "var(--cyan-hover)", bg: "var(--cyan-light)" },
  receptionist:       { color: "var(--purple-hover)", bg: "rgba(var(--purple-rgb), 0.08)" },
};

const getRoleStyle = (name = "") => ROLE_COLORS[name.toLowerCase()] || { color: "var(--text-secondary)", bg: "var(--surface-soft)" };

const STAT_META = [
  { key: "total",  label: "Total Staff", icon: <TeamOutlined />,         color: "var(--accent)" },
  { key: "active", label: "Active",       icon: <CheckCircleOutlined />,  color: "var(--success)" },
  { key: "roles",  label: "Roles",        icon: <TagOutlined />,          color: "var(--warning)" },
];

const TeacherList = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { users = [] } = useSelector((s) => s.auth);
  const loggedIn  = useSelector((s) => s.auth.user);

  const myRole    = (loggedIn?.role?.name || "").toLowerCase();
  const isAdmin   = ["super admin", "school admin"].includes(myRole);

  const [searchText,      setSearchText]      = useState("");
  const [selectedRole,    setSelectedRole]    = useState("all");
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [deletingId,      setDeletingId]      = useState(null);
  const [roleModal,       setRoleModal]       = useState({ open: false, user: null });
  const [selectedExtraRoles, setSelectedExtraRoles] = useState([]);
  const [savingRoles,     setSavingRoles]     = useState(false);

  const { roles: allRoles = [] } = useSelector((s) => s.role || {});

  const schoolId   = loggedIn?.school?._id || loggedIn?.schoolId;
  const hiddenRoles = ["student", "parent"];

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ isActive: true }));
  }, [dispatch, schoolId]);
  useEffect(() => { dispatch(fetchRoles()); }, [dispatch]);

  const openRoleModal = (record) => {
    const existing = (record.additionalRoles || []).map((r) =>
      typeof r === "string" ? r : r?._id
    ).filter(Boolean);
    setSelectedExtraRoles(existing);
    setRoleModal({ open: true, user: record });
  };

  const handleSaveRoles = async () => {
    setSavingRoles(true);
    try {
      await dispatch(assignAdditionalRoles({
        userId: roleModal.user._id,
        additionalRoleIds: selectedExtraRoles,
      })).unwrap();
      message.success("Additional roles saved");
      dispatch(fetchAllUser({ isActive: true }));
      setRoleModal({ open: false, user: null });
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to save roles");
    } finally {
      setSavingRoles(false);
    }
  };

  const filteredUsers = useMemo(() =>
    users.filter((u) => {
      const uid  = u?.school?._id || u?.schoolId;
      const role = u?.role?.name?.trim()?.toLowerCase();
      if (!u?.isActive) return false;
      if (schoolId && uid !== schoolId) return false;
      if (hiddenRoles.includes(role)) return false;
      const kw = searchText.trim().toLowerCase();
      const matchSearch = !kw || [u?.name, u?.email, u?.phone?.toString()]
        .some((f) => f?.toLowerCase()?.includes(kw));
      const matchRole = selectedRole === "all" || role === selectedRole;
      return matchSearch && matchRole;
    }),
    [users, schoolId, searchText, selectedRole]
  );

  const roleOptions = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const uid  = u?.school?._id || u?.schoolId;
      const name = u?.role?.name?.trim();
      const val  = name?.toLowerCase();
      if (!u?.isActive || (schoolId && uid !== schoolId)) return;
      if (!name || hiddenRoles.includes(val)) return;
      if (!map.has(val)) map.set(val, name);
    });
    return [{ value: "all", label: "All Roles" }, ...[...map.entries()].map(([v, l]) => ({ value: v, label: l }))];
  }, [users, schoolId]);

  const stats = useMemo(() => ({
    total:  filteredUsers.length,
    active: filteredUsers.filter((u) => u?.isActive).length,
    roles:  roleOptions.length - 1,
  }), [filteredUsers, roleOptions]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await dispatch(deleteUser(id)).unwrap();
      dispatch(fetchAllUser({ isActive: true }));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Staff Member",
      key: "user",
      render: (_, r) => (
        <Space>
          <div style={avatarStyle(r?.name || "?", 40)}>{(r?.name || "?").charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{r?.name || "Unnamed"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{r?.email || "No email"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      render: (_, r) => <span style={{ fontSize: 13, color: r?.phone ? "var(--text-secondary)" : "var(--text-muted)" }}>{r?.phone || "—"}</span>,
    },
    {
      title: "Role",
      key: "role",
      render: (_, r) => {
        const roleName = r?.role?.name || "N/A";
        const s = getRoleStyle(roleName);
        return <span style={pill(s.color, s.bg)}>{roleName}</span>;
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => {
        const active = r?.isActive;
        const color  = active ? "var(--success-hover)" : "var(--danger-hover)";
        const dot    = active ? "var(--success)" : "var(--danger)";
        const dotRing = active ? "rgba(var(--success-rgb), 0.19)" : "rgba(var(--danger-rgb), 0.19)";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, boxShadow: `0 0 0 2px ${dotRing}` }} />
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{active ? "Active" : "Inactive"}</span>
          </div>
        );
      },
    },
    ...(isAdmin ? [{
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text" size="small" icon={<EyeOutlined />}
              style={{ color: "var(--primary)" }}
              onClick={() => navigate(`/dashboard/schooladmin/users/employee-details?id=${r._id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text" size="small" icon={<EditOutlined />}
              style={{ color: "var(--warning)" }}
              onClick={() => navigate(`/dashboard/schooladmin/users/employee-form?id=${r._id}`)}
            />
          </Tooltip>
          <Tooltip title="Assign Additional Roles">
            <Button
              type="text" size="small" icon={<KeyOutlined />}
              style={{ color: "var(--purple)" }}
              onClick={() => openRoleModal(r)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this staff member?"
              description="This action cannot be undone."
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r._id)}
            >
              <Button
                type="text" size="small" danger icon={<DeleteOutlined />}
                loading={deletingId === r._id}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <style>{tableHeadCss("staff-table")}</style>

      <PageHeader
        title="Staff Directory"
        subtitle="Manage teachers, admins and staff in one place"
        icon={<TeamOutlined />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAllUser({ isActive: true }))} />
            </Tooltip>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Add Staff
              </Button>
            )}
          </Space>
        }
      />

      <div style={pageWrapper}>
        <Modal
          open={isAdmin && isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          width={680}
          centered
          destroyOnClose
          title={
            <Space>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "var(--primary-light)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🧑‍🏫</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Add New Staff Member</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the details below</div>
              </div>
            </Space>
          }
        >
          <RegisterForm onClose={() => setIsModalOpen(false)} />
        </Modal>

        {/* ── Assign Additional Roles Modal ── */}
        <Modal
          open={roleModal.open}
          title={
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                Assign Additional Roles
              </div>
              {roleModal.user && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, marginTop: 2 }}>
                  {roleModal.user.name} · Primary: {roleModal.user.role?.name}
                </div>
              )}
            </div>
          }
          onOk={handleSaveRoles}
          onCancel={() => setRoleModal({ open: false, user: null })}
          okText="Save Roles"
          confirmLoading={savingRoles}
          width={480}
        >
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
              Select one or more additional roles. These allow the user to access extra sidebar sections and pages.
            </div>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select additional roles…"
              value={selectedExtraRoles}
              onChange={setSelectedExtraRoles}
              optionFilterProp="label"
              options={allRoles
                .filter((r) => r._id !== roleModal.user?.role?._id && r._id !== roleModal.user?.roleId)
                .map((r) => ({ value: r._id, label: r.name }))}
            />
            {selectedExtraRoles.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedExtraRoles.map((id) => {
                  const r = allRoles.find((x) => x._id === id);
                  return r ? (
                    <Tag key={id} color="purple" style={{ borderRadius: 8 }}>{r.name}</Tag>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </Modal>

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            {/* KPI row */}
            <div className="stat-grid" style={statGrid(200)}>
              {STAT_META.map(({ key, label, icon, color }) => (
                <div key={key} style={statCard({ color })}>
                  <div>
                    <div style={statLabel(color)}>{label}</div>
                    <div style={statValue(color)}>{stats[key]}</div>
                  </div>
                  <div style={{ fontSize: 24, color, opacity: 0.6 }}>{icon}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Staff
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                placeholder="Search by name, email or phone…"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260 }}
              />
              <Select
                value={selectedRole}
                options={roleOptions}
                onChange={(v) => setSelectedRole(v)}
                style={{ width: 160 }}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={emptyState}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🧑‍🏫</div>
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  {searchText || selectedRole !== "all" ? "No staff match your filters" : "No staff found"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {searchText || selectedRole !== "all"
                    ? "Try clearing your search or role filter"
                    : "Add a staff member to get started"}
                </div>
              </div>
            </div>
          ) : (
            <div className="staff-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
              <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showTotal: (total) => (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} staff members</span>
                  ),
                }}
                scroll={{ x: 700 }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherList;
