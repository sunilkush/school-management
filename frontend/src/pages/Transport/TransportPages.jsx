import React, { useEffect, useState } from "react";
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Statistic, Spin, App,
} from "antd";
import {
  CarOutlined, ToolOutlined, TeamOutlined, PlusOutlined,
  EyeOutlined, EditOutlined, EnvironmentOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../features/transportSlice";
import {
  fetchMaintenanceRecords, fetchMaintenanceStats,
  createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
} from "../../features/vehicleMaintenanceSlice";
import { getEmployees } from "../../features/employeeSlice";

const { Title, Text } = Typography;

const PageWrap = ({ title, icon, children }) => (
  <div style={{ padding: 24 }}>
    <Title level={3} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {title}
    </Title>
    {children}
  </div>
);

/* ══════════════════════════════════════════
   TRANSPORT MANAGER DASHBOARD
══════════════════════════════════════════ */
export const TransportManagerDashboard = () => {
  const dispatch = useDispatch();
  const { vehicles, routes, loading: tLoading } = useSelector((s) => s.transport);
  const { stats, records } = useSelector((s) => s.vehicleMaintenance);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchMaintenanceStats());
    dispatch(fetchMaintenanceRecords({ status: "Scheduled" }));
  }, [dispatch]);

  const statCards = [
    { title: "Total Vehicles",      value: vehicles.length,              color: "#2563EB", icon: <CarOutlined /> },
    { title: "Active Routes",       value: routes.length,                color: "#7C3AED", icon: <EnvironmentOutlined /> },
    { title: "Pending Maintenance", value: stats.scheduled ?? 0,         color: "#EF4444", icon: <ToolOutlined /> },
    { title: "Completed This Month",value: stats.completedThisMonth ?? 0,color: "#10B981", icon: <TeamOutlined /> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Transport Manager Dashboard</Title>
        <Text type="secondary">Fleet overview — vehicles, routes, and maintenance status.</Text>
      </Card>
      <Spin spinning={tLoading}>
        <Row gutter={[16, 16]}>
          {statCards.map((s) => (
            <Col xs={24} sm={12} md={6} key={s.title}>
              <Card style={{ borderTop: `4px solid ${s.color}` }}>
                <Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </Space>
  );
};

/* ══════════════════════════════════════════
   DRIVERS PAGE
══════════════════════════════════════════ */
export const DriversPage = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((s) => s.employee);
  const [open, setOpen] = useState(false);
  const { message } = App.useApp();

  useEffect(() => { dispatch(getEmployees()); }, [dispatch]);

  const drivers = employees.filter(
    (e) => e.department?.toLowerCase().includes("transport") || e.designation?.toLowerCase().includes("driver")
  );

  const cols = [
    { title: "Name",        render: (_, r) => r.userId?.name || r.name || "—" },
    { title: "Phone",       dataIndex: "phoneNo", render: (v) => v || "—" },
    { title: "Designation", dataIndex: "designation", render: (v) => v || "Driver" },
    { title: "Department",  dataIndex: "department",  render: (v) => v || "Transport" },
    { title: "Join Date",   dataIndex: "joinDate",    render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Status",      dataIndex: "isActive",    render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag> },
    {
      title: "Action",
      render: () => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />}>View</Button>
          <Button size="small" type="link" icon={<EditOutlined />}>Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageWrap title="Drivers" icon={<TeamOutlined />}>
      <Card>
        <Table dataSource={drivers} rowKey="_id" columns={cols} loading={loading} size="middle"
          locale={{ emptyText: "No drivers found. Make sure driver employees are added with Transport department." }} />
      </Card>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   VEHICLE MAINTENANCE
══════════════════════════════════════════ */
export const VehicleMaintenance = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { records, stats, loading, saving } = useSelector((s) => s.vehicleMaintenance);
  const { vehicles } = useSelector((s) => s.transport);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchMaintenanceRecords({}));
    dispatch(fetchMaintenanceStats());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleCreate = async (values) => {
    const vehicle = vehicles.find((v) => v._id === values.vehicleId);
    const res = await dispatch(createMaintenanceRecord({
      ...values,
      vehicleNo:   vehicle?.vehicleNo || vehicle?.registrationNo || "",
      vehicleName: vehicle?.name || "",
    }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Maintenance scheduled");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleMarkDone = async (id) => {
    const res = await dispatch(updateMaintenanceRecord({ id, data: { status: "Completed" } }));
    if (res.meta.requestStatus === "fulfilled") message.success("Marked as completed");
    else message.error(res.payload || "Failed");
  };

  const cols = [
    { title: "Vehicle",      dataIndex: "vehicleName", render: (v, r) => v || r.vehicleNo || "—" },
    { title: "Service Type", dataIndex: "serviceType" },
    { title: "Scheduled",    dataIndex: "scheduledDate", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Est. Cost",    dataIndex: "estimatedCost", render: (v) => v ? `₹${v.toLocaleString()}` : "—" },
    { title: "Actual Cost",  dataIndex: "actualCost",    render: (v) => v ? `₹${v.toLocaleString()}` : "—" },
    {
      title: "Status", dataIndex: "status",
      render: (v) => <Tag color={v === "Completed" ? "green" : v === "Scheduled" ? "blue" : v === "In Progress" ? "orange" : "default"}>{v}</Tag>,
    },
    {
      title: "Action",
      render: (_, r) =>
        r.status !== "Completed"
          ? <Button size="small" type="primary" onClick={() => handleMarkDone(r._id)}>Mark Done</Button>
          : <Button size="small" type="link" icon={<EyeOutlined />}>Receipt</Button>,
    },
  ];

  return (
    <PageWrap title="Vehicle Maintenance" icon={<ToolOutlined />}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: "Completed This Month", value: stats.completedThisMonth ?? 0, color: "#10B981" },
          { label: "Scheduled",            value: stats.scheduled ?? 0,           color: "#2563EB" },
          { label: "Total Cost (Month)",   value: `₹${(stats.totalCostThisMonth ?? 0).toLocaleString()}`, color: "#7C3AED" },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: "#6B7280", fontSize: 13 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Schedule Service</Button>
        </Space>
        <Table dataSource={records} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Schedule Maintenance" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Vehicle" name="vehicleId" rules={[{ required: true }]}>
            <Select
              options={vehicles.map((v) => ({
                value: v._id,
                label: `${v.vehicleNo || v.registrationNo || ""} ${v.name ? `(${v.name})` : ""}`.trim(),
              }))}
              placeholder="Select vehicle"
            />
          </Form.Item>
          <Form.Item label="Service Type" name="serviceType" rules={[{ required: true }]}>
            <Select options={["Oil Change","Tyre Replacement","Engine Check","Brake Service","AC Service","Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Scheduled Date" name="scheduledDate" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Estimated Cost (₹)" name="estimatedCost">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};
