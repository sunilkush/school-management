import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  activeUser,
} from "../../../features/authSlice";

import {
  Layout,
  Table,
  Button,
  Avatar,
  Modal,
  Typography,
  Space,
  message,
  Card,
  Input,
  Select,
  ConfigProvider,
  Tag,
} from "antd";

import {
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
} from "@ant-design/icons";

import RegisterForm from "../../../components/forms/RegisterForm";

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

/* ─── Avatar colour palette ─── */
const AV_COLORS = [
  { bg: "#D4E9F7", color: "#2E6A9A" },
  { bg: "#E6D9F3", color: "#6B4F96" },
  { bg: "#D4F0E8", color: "#2E7A6E" },
  { bg: "#FDDDE4", color: "#9E3A4A" },
  { bg: "#FDF2D6", color: "#8A5E10" },
  { bg: "#D4E9F7", color: "#2E6A9A" },
  { bg: "#E6D9F3", color: "#6B4F96" },
  { bg: "#D4F0E8", color: "#2E7A6E" },
];

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

/* ─── Status Badge ─── */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isActive ? "rgba(184,224,210,0.22)" : "rgba(255,202,212,0.22)",
      color: isActive ? "#2E7A6E" : "#9E3A4A",
      border: `1px solid ${isActive ? "rgba(184,224,210,0.5)" : "rgba(255,202,212,0.5)"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#5BA89A" : "#D96B7A",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, accentColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        borderTop: `3px solid ${accentColor}`,
        boxShadow: hovered ? "0 8px 24px rgba(91,158,201,0.15)" : "0 2px 12px rgba(91,158,201,0.07)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
      bodyStyle={{ padding: "18px 20px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{
            fontSize: 26, fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            color: "#141414", letterSpacing: -0.5,
          }}>{value}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: accentColor,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Component ─── */
const Admins = () => {
  const dispatch = useDispatch();

  const {
    users = [],
    error,
    user: currentUser,
  } = useSelector((state) => state.auth || {});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ── Fetch ── */
  useEffect(() => {
    dispatch(fetchAllUser({ roleName: ["School Admin"], isActive: true }));
  }, [dispatch]);

  /* ── Toggle Status ── */
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }
    Modal.confirm({
      title: user.isActive ? "Deactivate Admin?" : "Activate Admin?",
      content: `Are you sure you want to ${user.isActive ? "deactivate" : "activate"} ${user.name}?`,
      okText: "Yes, Confirm",
      cancelText: "Cancel",
      okButtonProps: { danger: user.isActive },
      onOk: async () => {
        try {
          if (user.isActive) {
            await dispatch(deleteUser(user._id)).unwrap();
          } else {
            await dispatch(activeUser(user._id)).unwrap();
          }
          dispatch(fetchAllUser({ roleName: ["School Admin"], isActive: true }));
        } catch (err) {
          message.error("Operation failed", err.message || err.toString());
        }
      },
    });
  };

  /* ── Filtered Data ── */
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.school?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === ""
          ? true
          : statusFilter === "active"
          ? u.isActive
          : !u.isActive;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  /* ── Stats ── */
  const totalAdmins = Array.isArray(users) ? users.length : 0;
  const activeCount = Array.isArray(users) ? users.filter((u) => u.isActive).length : 0;
  const inactiveCount = totalAdmins - activeCount;
  const schoolCount = Array.isArray(users)
    ? new Set(users.map((u) => u.school?.name).filter(Boolean)).size
    : 0;


    const handleCloseModal = () => {
  setIsModalOpen(false);

  // 🔥 reload users
  dispatch(fetchAllUser({ roleName: ["School Admin"], isActive: true }));
};
  /* ── Columns ── */
  const columns = [
    {
      title: "Admin",
      key: "user",
      render: (_, record, index) => {
        const ac = AV_COLORS[index % AV_COLORS.length];
        return (
          <Space>
            <Avatar
              src={record.avatar || undefined}
              size={36}
              shape="square"
              style={{
                borderRadius: 10,
                background: !record.avatar ? ac.bg : undefined,
                color: !record.avatar ? ac.color : undefined,
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {!record.avatar && initials(record.name)}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13, color: "#141414" }}>{record.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Role",
      dataIndex: ["role", "name"],
      render: (role) => (
        <span style={{
          background: "rgba(205,180,219,0.2)", color: "#6B4F96",
          border: "1px solid rgba(205,180,219,0.5)",
          borderRadius: 6, padding: "3px 10px",
          fontSize: 12, fontWeight: 500,
        }}>
          {role || "School Admin"}
        </span>
      ),
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      render: (school) =>
        school ? (
          <span style={{ fontSize: 13, color: "#141414", display: "flex", alignItems: "center", gap: 5 }}>
            <BankOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
            {school}
          </span>
        ) : (
          <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>
        ),
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
          onClick={() => handleToggleStatus(record)}
          style={{
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 12,
            ...(record.isActive
              ? {
                  background: "rgba(255,202,212,0.2)",
                  borderColor: "rgba(255,202,212,0.5)",
                  color: "#9E3A4A",
                }
              : {
                  background: "rgba(184,224,210,0.2)",
                  borderColor: "rgba(184,224,210,0.5)",
                  color: "#2E7A6E",
                }),
          }}
          icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#5B9EC9",
          borderRadius: 12,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        },
      }}
    >
      <Layout style={{ background: "#F7F8FC", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Page Header ── */}
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(167,199,231,0.3)",
          padding: "20px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "#1E2A3A", fontSize: 18, fontWeight: 700 }}>School Admin Management</div>
            <div style={{ color: "#8A94A6", fontSize: 12, marginTop: 2 }}>
              Manage and monitor all school administrators
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "linear-gradient(135deg, #5B9EC9, #9B87B8)",
              borderColor: "transparent",
              borderRadius: 10,
              fontWeight: 600,
              height: 38,
              paddingInline: 20,
            }}
          >
            Add School Admin
          </Button>
        </div>

        <Content style={{ padding: "20px 20px" }}>

          {/* ── Stats Row ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}>
            <StatCard label="Total Admins"   value={totalAdmins} icon={<TeamOutlined />}              accentColor="#9B87B8" />
            <StatCard label="Active"          value={activeCount} icon={<CheckCircleOutlined />}        accentColor="#5BA89A" />
            <StatCard label="Inactive"        value={inactiveCount} icon={<StopOutlined />}             accentColor="#D96B7A" />
            <StatCard label="Schools Covered" value={schoolCount} icon={<SafetyCertificateOutlined />}  accentColor="#5B9EC9" />
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: "rgba(255,202,212,0.2)", border: "1px solid rgba(255,202,212,0.5)",
              borderRadius: 10, padding: "10px 16px",
              color: "#9E3A4A", fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* ── Table Card ── */}
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Filter Bar */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 10, padding: "16px 20px",
              borderBottom: "1px solid #f5f5f5",
            }}>
              <Space wrap>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Search by name, email or school..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 260, borderRadius: 10 }}
                  allowClear
                />
                <Select
                  placeholder="All Status"
                  allowClear
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v ?? "")}
                  style={{ width: 140, borderRadius: 10 }}
                  suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Showing <strong>{filteredUsers.length}</strong> of <strong>{totalAdmins}</strong> admins
              </Text>
            </div>

            {/* Table */}
            <Table
              rowKey="_id"
             
              columns={columns}
              dataSource={filteredUsers}
              pagination={{
                pageSize: 8,
                size: "small",
                showSizeChanger: false,
                style: { padding: "12px 20px" },
              }}
              onRow={(_, index) => ({
                style: {
                  background: index % 2 === 0 ? "#fff" : "#fafafa",
                  transition: "background 0.15s",
                },
                onMouseEnter: (e) => (e.currentTarget.style.background = "rgba(167,199,231,0.08)"),
                onMouseLeave: (e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafafa"),
              })}
              style={{ borderRadius: 0 }}
            />
          </Card>
        </Content>

        {/* ── Modal ── */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(205,180,219,0.2)", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <UserSwitchOutlined style={{ color: "#9B87B8", fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Register New School Admin</div>
                <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>Fill in the details below</div>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={720}
          destroyOnClose
          styles={{ header: { borderBottom: "1px solid #f5f5f5", paddingBottom: 16 } }}
        >
          <RegisterForm onClose={handleCloseModal} />
        </Modal>

      </Layout>
    </ConfigProvider>
  );
};

export default Admins;