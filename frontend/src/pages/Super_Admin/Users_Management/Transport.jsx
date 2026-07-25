import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Tabs, Space, message, Modal } from "antd";
import { ReloadOutlined, PlusOutlined, CheckCircleOutlined, StopOutlined, CarOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import PageHeader from "../../../components/layout/PageHeader";
import RegisterForm from "../../../components/forms/RegisterForm";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, avatarStyle, modalTitle,
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch, refreshTick]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setRefreshTick((t) => t + 1);
  };

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
        title="Transport Management"
        subtitle="Manage drivers and transporters across schools"
        icon={<CarOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => setRefreshTick((t) => t + 1)}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add Transport User</Button>
          </Space>
        }
      />

      <Modal
        title={modalTitle(<UserSwitchOutlined />, "Register Transport User", "Select Driver or Transporter as the role")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <RegisterForm onClose={handleModalClose} allowedRoleNames={["Driver", "Transporter"]} />
      </Modal>

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
  );
};

export default Transport;
