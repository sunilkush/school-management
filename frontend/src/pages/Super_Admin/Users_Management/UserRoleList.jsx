import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Space, message, Select, Input, Popconfirm, Empty } from "antd";
import {
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  toolbarRow, tableContainer, tableHeadCss, avatarStyle, emptyState,
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
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block", marginRight: 5 }} />
    {isActive ? "Active" : "Inactive"}
  </span>
);

/**
 * Shared list/manage screen for Super Admin's per-role user pages
 * (Teachers, Staff, Students, Parents, Accountants, Librarians).
 */
const UserRoleList = ({
  roleNames,
  title,
  subtitle,
  icon = <TeamOutlined />,
  nounSingular = "user",
  nounPlural = "users",
  enableBulkActions = true,
  headerExtra = null,
  children,
}) => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector((state) => state.auth || {});
  const { schools = [] } = useSelector((state) => state.school || {});

  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = () => dispatch(fetchAllUser({ roleName: roleNames }));

  useEffect(() => {
    load();
    dispatch(fetchSchools());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const schoolNames = useMemo(
    () => ["All", ...new Set(schools.map((s) => s.name).filter(Boolean))],
    [schools]
  );

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.school?.name?.toLowerCase().includes(search.toLowerCase());
      const matchSchool = schoolFilter === "All" || u.school?.name === schoolFilter;
      const matchStatus = statusFilter === "" || (statusFilter === "active" ? u.isActive : !u.isActive);
      return matchSearch && matchSchool && matchStatus;
    });
  }, [users, search, schoolFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = Array.isArray(users) ? users.length : 0;
    const active = Array.isArray(users) ? users.filter((u) => u.isActive).length : 0;
    const schoolsCovered = Array.isArray(users)
      ? new Set(users.map((u) => u.school?.name).filter(Boolean)).size
      : 0;
    return { total, active, inactive: total - active, schoolsCovered };
  }, [users]);

  const handleToggleStatus = (targetUser) => {
    if (targetUser._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }
    Modal.confirm({
      title: targetUser.isActive ? `Deactivate this ${nounSingular}?` : `Activate this ${nounSingular}?`,
      content: `Are you sure you want to ${targetUser.isActive ? "deactivate" : "activate"} ${targetUser.name}?`,
      okText: "Yes, Confirm",
      cancelText: "Cancel",
      okButtonProps: { danger: targetUser.isActive },
      onOk: async () => {
        try {
          if (targetUser.isActive) {
            await dispatch(deleteUser(targetUser._id)).unwrap();
          } else {
            await dispatch(activeUser(targetUser._id)).unwrap();
          }
          message.success("Status updated successfully");
          load();
        } catch (err) {
          message.error(err || "Operation failed");
        }
      },
    });
  };

  const handleBulkAction = async (activate) => {
    const targets = filteredUsers.filter((u) => selectedRowKeys.includes(u._id) && u._id !== currentUser?._id);
    if (!targets.length) {
      message.warning("No eligible rows selected");
      return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(targets.map((u) => dispatch(activate ? activeUser(u._id) : deleteUser(u._id))));
      message.success(`${targets.length} ${targets.length === 1 ? nounSingular : nounPlural} ${activate ? "activated" : "deactivated"}`);
      setSelectedRowKeys([]);
      load();
    } catch {
      message.error("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = [
    {
      title: nounSingular.charAt(0).toUpperCase() + nounSingular.slice(1),
      key: "user",
      render: (_, record) => (
        <Space>
          <div style={avatarStyle(record.name, 36)}>
            {record.avatar ? <img src={record.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : null}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      render: (school) => school
        ? <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{school}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => <StatusBadge isActive={isActive} />,
    },
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <Button
          size="middle"
          danger={record.isActive}
          type={record.isActive ? "default" : "primary"}
          icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
          onClick={() => handleToggleStatus(record)}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        extra={
          <Space wrap>
            {headerExtra}
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<TeamOutlined />} label={`Total ${nounPlural}`} value={stats.total} color="#2563EB" />
        <StatCard icon={<CheckCircleOutlined />} label="Active" value={stats.active} color="#22C55E" />
        <StatCard icon={<StopOutlined />} label="Inactive" value={stats.inactive} color="#EF4444" />
        <StatCard icon={<SafetyCertificateOutlined />} label="Schools Covered" value={stats.schoolsCovered} color="#14B8A6" />
      </div>

      {error && (
        <div style={{ ...pill("#DC2626", "rgba(254,226,226,0.3)"), display: "block", padding: "10px 16px", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <style>{tableHeadCss("user-role-tbl")}</style>

      <div style={{ ...sectionPanel, padding: 0 }}>
        <div style={{ ...toolbarRow, padding: "16px 20px", marginBottom: 0, borderBottom: "1px solid var(--border-muted)" }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder={`Search by name, email or school...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={schoolFilter}
            onChange={setSchoolFilter}
            style={{ width: 200 }}
            options={schoolNames.map((name) => ({ label: name === "All" ? "All Schools" : name, value: name }))}
          />
          <Select
            allowClear
            placeholder="All Status"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? "")}
            style={{ width: 140 }}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
          />
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong style={{ color: "var(--text-primary)" }}>{filteredUsers.length}</strong> of <strong style={{ color: "var(--text-primary)" }}>{stats.total}</strong> {nounPlural}
          </span>
        </div>

        {enableBulkActions && selectedRowKeys.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "var(--surface-soft)", borderBottom: "1px solid var(--border-muted)" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{selectedRowKeys.length} selected</span>
            <Popconfirm title={`Activate ${selectedRowKeys.length} ${nounPlural}?`} onConfirm={() => handleBulkAction(true)} okText="Activate">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={bulkLoading}>Activate Selected</Button>
            </Popconfirm>
            <Popconfirm title={`Deactivate ${selectedRowKeys.length} ${nounPlural}?`} onConfirm={() => handleBulkAction(false)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<StopOutlined />} loading={bulkLoading}>Deactivate Selected</Button>
            </Popconfirm>
          </div>
        )}

        <div className="user-role-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            rowSelection={enableBulkActions ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
            pagination={{ pageSize: 8 }}
            locale={{
              emptyText: (
                <div style={{ ...emptyState, border: "none" }}>
                  <Empty description={`No ${nounPlural} found`} />
                </div>
              ),
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
};

export default UserRoleList;
