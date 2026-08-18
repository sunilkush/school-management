import React, { useEffect, useState } from "react";
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Statistic, Spin, App, Drawer, Descriptions, Divider, List,
  Popconfirm,
} from "antd";
import {
  CarOutlined, ToolOutlined, TeamOutlined, PlusOutlined,
  EyeOutlined, EditOutlined, EnvironmentOutlined, SwapOutlined,
  NodeIndexOutlined, PhoneOutlined, UserOutlined, CalendarOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles, fetchRoutes } from "../../features/transportSlice";
import {
  fetchMaintenanceRecords, fetchMaintenanceStats,
  createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
} from "../../features/vehicleMaintenanceSlice";
import { getEmployees, updateEmployee } from "../../features/employeeSlice";

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
    dispatch(fetchRoutes());
    dispatch(fetchMaintenanceStats());
    // Backend defaults to limit=50; the dashboard/table below render straight from this array
    // with client-side-only Table pagination (no `total` override), so a school with more than
    // 50 records ever had would silently lose the older ones from view.
    dispatch(fetchMaintenanceRecords({ limit: 500 }));
  }, [dispatch]);

  const statCards = [
    { title: "Total Vehicles",       value: vehicles.length,               color: "var(--primary)", icon: <CarOutlined /> },
    { title: "Active Routes",        value: routes.length,                 color: "var(--purple)", icon: <EnvironmentOutlined /> },
    { title: "Pending Maintenance",  value: stats.scheduled ?? 0,          color: "var(--danger)", icon: <ToolOutlined /> },
    { title: "Completed This Month", value: stats.completedThisMonth ?? 0, color: "var(--success)", icon: <TeamOutlined /> },
  ];

  const upcoming = records
    .filter((r) => r.status === "Scheduled")
    .slice(0, 5);

  const maintCols = [
    { title: "Vehicle",      dataIndex: "vehicleName", render: (v, r) => v || r.vehicleNo || "—" },
    { title: "Service",      dataIndex: "serviceType" },
    { title: "Scheduled",    dataIndex: "scheduledDate", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Est. Cost",    dataIndex: "estimatedCost", render: (v) => v ? `₹${v.toLocaleString()}` : "—" },
    {
      title: "Status", dataIndex: "status",
      render: (v) => <Tag color={v === "Completed" ? "green" : v === "Scheduled" ? "blue" : "orange"}>{v}</Tag>,
    },
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

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<><CarOutlined /> Fleet Status</>} size="small">
            {vehicles.length === 0 ? (
              <Text type="secondary">No vehicles added yet.</Text>
            ) : (
              <List
                size="small"
                dataSource={vehicles.slice(0, 5)}
                renderItem={(v) => (
                  <List.Item>
                    <Text strong>{v.busNumber || v.vehicleNo || "—"}</Text>
                    <Tag color={v.status === "Available" ? "green" : v.status === "In Use" ? "orange" : "default"} style={{ marginLeft: 8 }}>
                      {v.status}
                    </Tag>
                    <Text type="secondary" style={{ marginLeft: "auto", fontSize: 12 }}>{v.route || "No route"}</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><ToolOutlined /> Upcoming Maintenance</>} size="small">
            {upcoming.length === 0 ? (
              <Text type="secondary">No scheduled maintenance.</Text>
            ) : (
              <Table
                dataSource={upcoming}
                columns={maintCols}
                rowKey="_id"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

/* ══════════════════════════════════════════
   DRIVERS PAGE
══════════════════════════════════════════ */
export const DriversPage = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((s) => s.employee);
  const [viewDriver, setViewDriver]   = useState(null);
  const [editDriver, setEditDriver]   = useState(null);
  const [editForm] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => { dispatch(getEmployees()); }, [dispatch]);

  const drivers = employees.filter(
    (e) => e.department?.toLowerCase().includes("transport") || e.designation?.toLowerCase().includes("driver")
  );

  const handleEdit = (record) => {
    setEditDriver(record);
    editForm.setFieldsValue({
      designation: record.designation,
      department:  record.department,
      phoneNo:     record.phoneNo,
    });
  };

  const handleEditSave = async (values) => {
    const res = await dispatch(updateEmployee({ id: editDriver._id, payload: values }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Driver info updated");
      setEditDriver(null);
      dispatch(getEmployees());
    } else {
      message.error(res.payload?.message || "Update failed");
    }
  };

  const cols = [
    { title: "Name",        render: (_, r) => r.userId?.name || r.name || "—" },
    { title: "Phone",       dataIndex: "phoneNo",     render: (v) => v || "—" },
    { title: "Designation", dataIndex: "designation", render: (v) => v || "Driver" },
    { title: "Department",  dataIndex: "department",  render: (v) => v || "Transport" },
    { title: "Join Date",   dataIndex: "joinDate",    render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Status",      dataIndex: "isActive",    render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag> },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setViewDriver(r)}>View</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageWrap title="Drivers" icon={<TeamOutlined />}>
      <Card>
        <Table
          dataSource={drivers}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          locale={{ emptyText: "No drivers found. Add employees with Transport department or Driver designation." }}
        />
      </Card>

      {/* View Drawer */}
      <Drawer
        title="Driver Details"
        open={!!viewDriver}
        onClose={() => setViewDriver(null)}
        width={400}
      >
        {viewDriver && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--purple))",
                color: "#fff", fontSize: 24, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 10px",
              }}>
                {(viewDriver.userId?.name || viewDriver.name || "D")[0].toUpperCase()}
              </div>
              <Title level={4} style={{ margin: 0 }}>{viewDriver.userId?.name || viewDriver.name || "—"}</Title>
              <Tag color={viewDriver.isActive ? "green" : "red"} style={{ marginTop: 4 }}>
                {viewDriver.isActive ? "Active" : "Inactive"}
              </Tag>
            </div>
            <Divider />
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {viewDriver.phoneNo || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<><UserOutlined /> Designation</>}>
                {viewDriver.designation || "Driver"}
              </Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> Department</>}>
                {viewDriver.department || "Transport"}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Join Date</>}>
                {viewDriver.joinDate ? new Date(viewDriver.joinDate).toLocaleDateString() : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewDriver.userId?.email || viewDriver.email || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {viewDriver.address || "—"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>

      {/* Edit Modal */}
      <Modal
        title="Edit Driver Info"
        open={!!editDriver}
        onCancel={() => { setEditDriver(null); editForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          <Form.Item label="Designation" name="designation">
            <Input placeholder="e.g. Senior Driver" />
          </Form.Item>
          <Form.Item label="Department" name="department">
            <Input placeholder="e.g. Transport" />
          </Form.Item>
          <Form.Item label="Phone Number" name="phoneNo">
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Save</Button>
              <Button onClick={() => { setEditDriver(null); editForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
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
    dispatch(fetchMaintenanceRecords({ limit: 500 }));
    dispatch(fetchMaintenanceStats());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleCreate = async (values) => {
    const vehicle = vehicles.find((v) => v._id === values.vehicleId);
    const res = await dispatch(createMaintenanceRecord({
      ...values,
      vehicleNo:   vehicle?.vehicleNo || vehicle?.registrationNo || vehicle?.busNumber || "",
      vehicleName: vehicle?.name || vehicle?.busNumber || "",
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

  const handleDelete = async (id) => {
    const res = await dispatch(deleteMaintenanceRecord(id));
    if (res.meta.requestStatus === "fulfilled") message.success("Record deleted");
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
      render: (_, r) => (
        <Space size={4}>
          {r.status !== "Completed" && (
            <Button size="small" type="primary" onClick={() => handleMarkDone(r._id)}>Mark Done</Button>
          )}
          <Popconfirm title="Delete this maintenance record?" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(r._id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageWrap title="Vehicle Maintenance" icon={<ToolOutlined />}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: "Completed This Month", value: stats.completedThisMonth ?? 0,                              color: "var(--success)" },
          { label: "Scheduled",            value: stats.scheduled ?? 0,                                        color: "var(--primary)" },
          { label: "Total Cost (Month)",   value: `₹${(stats.totalCostThisMonth ?? 0).toLocaleString()}`,     color: "var(--purple)" },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{s.label}</div>
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
                label: `${v.busNumber || v.vehicleNo || v.registrationNo || ""} ${v.name ? `(${v.name})` : ""}`.trim(),
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
