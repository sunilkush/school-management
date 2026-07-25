import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Form, Input, InputNumber, Modal, Select, Space, Table, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CarOutlined, UserOutlined, NodeIndexOutlined,
  ToolOutlined, TeamOutlined, PhoneOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createVehicle, deleteVehicle, fetchRoutes, fetchVehicles, updateVehicle,
} from "../../../features/transportSlice";
import { getEmployees } from "../../../features/employeeSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  success: "#22C55E", successLight: "#DCFCE7",
  danger: "#EF4444", dangerLight: "#FEE2E2",
  purple: "#7C3AED", purpleLight: "#F5F3FF",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF",
};

const VEHICLE_TYPE_CFG = {
  Bus: { color: C.primary,  bg: C.primaryLighter, border: C.primaryLight,  icon: "🚌" },
  Van: { color: C.accent,   bg: C.accentLight,    border: "#99F6E4",        icon: "🚐" },
  Car: { color: C.purple,   bg: C.purpleLight,    border: "#DDD6FE",        icon: "🚗" },
};

const STATUS_CFG = {
  "Available":   { color: "#15803D", bg: C.successLight, border: "#86EFAC", dot: C.success },
  "In Use":      { color: "#B45309", bg: C.warningLight,  border: "#FDE68A", dot: C.warning },
  "Maintenance": { color: C.textSub, bg: "#F1F5F9",       border: C.border,  dot: C.textMuted },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Maintenance"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.dot, display: "inline-block",
      }} />
      {status}
    </span>
  );
};

const Vehicles = () => {
  const dispatch = useDispatch();
  const { vehicles, routes, loading } = useSelector((s) => s.transport);
  const { employees = [] }            = useSelector((s) => s.employee);
  const [driverAccounts, setDriverAccounts] = useState([]);

  const [modalVisible, setModalVisible]   = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchRoutes());
    dispatch(getEmployees());
    apiClient
      .get("/user/all", { params: { roleName: "Driver" } })
      .then((r) => setDriverAccounts(Array.isArray(r?.data?.data) ? r.data.data : []))
      .catch(() => setDriverAccounts([]));
  }, [dispatch]);

  // The driver name/contact shown on a vehicle is free text — it doesn't require a login
  // account, so most schools just record it against the Employee roster (department/designation
  // based, same as the Drivers page). driverAccounts below is a separate, optional link to a
  // real "Driver" role User account, only needed if that driver should see their own vehicle
  // on their own dashboard.
  const driverOptions = useMemo(
    () => employees
      .filter((e) => e.department?.toLowerCase().includes("transport") || e.designation?.toLowerCase().includes("driver"))
      .map((e) => ({
        value: e.userId?.name || e.name,
        label: e.userId?.name || e.name,
        contact: e.phoneNo || e.userId?.email || "",
      })),
    [employees],
  );

  const driverAccountOptions = useMemo(
    () => driverAccounts.map((u) => ({ value: u._id, label: `${u.name} (${u.email || "no email"})` })),
    [driverAccounts],
  );

  const routeOptions = useMemo(
    () => routes.map((r) => ({ value: r.name, label: r.name })),
    [routes],
  );

  const dataSource = useMemo(
    () => vehicles.map((v) => ({
      key: v._id, _id: v._id,
      type:           v.vehicleType,
      number:         v.busNumber,
      driver:         v.driverName,
      driverId:       v.driverId,
      driverContact:  v.driverContact,
      drivingLicense: v.drivingLicense,
      capacity:       v.capacity,
      status:         v.status,
      route:          v.route,
    })),
    [vehicles],
  );

  const closeModal = () => {
    setModalVisible(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  const handleSaveVehicle = async (values) => {
    try {
      if (editingVehicle?._id) {
        await dispatch(updateVehicle({ id: editingVehicle._id, payload: values })).unwrap();
        message.success("Vehicle updated successfully");
      } else {
        await dispatch(createVehicle(values)).unwrap();
        message.success("Vehicle added successfully");
      }
      closeModal();
    } catch (err) {
      message.error(err || "Unable to save vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue(vehicle);
    setModalVisible(true);
  };

  const handleDriverChange = (name) => {
    const info = driverOptions.find((d) => d.value === name);
    form.setFieldsValue({ driver: name, driverContact: info?.contact || "" });
  };

  const handleDelete = (vehicle) =>
    Modal.confirm({
      title: "Delete vehicle?",
      content: `Remove vehicle ${vehicle.number} from the fleet?`,
      okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteVehicle(vehicle._id)).unwrap();
          message.success("Vehicle deleted");
        } catch (err) {
          message.error(err || "Unable to delete vehicle");
        }
      },
    });

  const stats = {
    total:     dataSource.length,
    inUse:     dataSource.filter((v) => v.status === "In Use").length,
    available: dataSource.filter((v) => v.status === "Available").length,
    maintenance: dataSource.filter((v) => v.status === "Maintenance").length,
  };

  const columns = [
    {
      title: "Vehicle",
      render: (_, r) => {
        const cfg = VEHICLE_TYPE_CFG[r.type] || { color: C.textSub, bg: "#F1F5F9", border: C.border, icon: "🚗" };
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: cfg.bg, border: "1.5px solid " + cfg.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: C.text, fontSize: 14, letterSpacing: "0.01em" }}>
                {r.number}
              </div>
              <span style={{
                fontSize: 11, padding: "1px 8px", borderRadius: 20,
                background: cfg.bg, color: cfg.color,
                border: `1px solid ${cfg.border}`, fontWeight: 700,
              }}>
                {r.type}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Driver",
      render: (_, r) => (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              color: "#fff", fontSize: 9, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {(r.driver || "?")[0]?.toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{r.driver || "—"}</span>
          </div>
          {r.driverContact && (
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, color: C.textMuted,
            }}>
              <PhoneOutlined style={{ fontSize: 9 }} />
              {r.driverContact}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      render: (v) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 11px", borderRadius: 20,
          background: "#F8FAFC", border: "1px solid " + C.border,
          fontSize: 12, fontWeight: 700, color: C.textSub,
        }}>
          <TeamOutlined style={{ fontSize: 10 }} />
          {v} seats
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: ["Available", "In Use", "Maintenance"].map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: "Route",
      dataIndex: "route",
      render: (v) => v ? (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 11px", borderRadius: 20,
          background: C.accentLight, color: "#0F766E",
          border: "1px solid #99F6E4",
          fontSize: 12, fontWeight: 700,
        }}>
          <NodeIndexOutlined style={{ fontSize: 10 }} />
          {v}
        </span>
      ) : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>,
    },
    {
      title: "Actions",
      width: 110,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => handleEdit(r)}
            style={{ borderRadius: 7, borderColor: C.primary, color: C.primary, background: C.primaryLighter }}
          />
          <Button
            size="small" icon={<DeleteOutlined />}
            onClick={() => handleDelete(r)}
            style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("veh-tbl")}</style>

      <PageHeader
        title="School Vehicles"
        subtitle="Manage your fleet — buses, vans, and driver assignments"
        icon={<CarOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Add Vehicle
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <CarOutlined />,    label: "Total Vehicles", value: stats.total,       color: C.primary },
          { icon: <CarOutlined />,    label: "In Use",         value: stats.inUse,        color: C.warning },
          { icon: <CarOutlined />,    label: "Available",      value: stats.available,    color: C.success },
          { icon: <ToolOutlined />,   label: "Maintenance",    value: stats.maintenance,  color: C.textSub },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface, borderRadius: 14,
            border: "1px solid " + C.border,
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>{s.icon}</div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: s.color,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Fleet</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {vehicles.length}
          </span>
        </div>
        <Table
          className="veh-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `${t} vehicles` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No vehicles added yet. Click 'Add Vehicle' to get started." }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={
          <Space>
            <CarOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>
              {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
            Cancel
          </Button>,
          <Button key="save" onClick={() => form.submit()}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}>
            {editingVehicle ? "Update" : "Add"}
          </Button>,
        ]}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveVehicle} style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Vehicle Type" name="type" rules={[{ required: true, message: "Required" }]}>
              <Select placeholder="Select type">
                <Select.Option value="Bus">🚌 Bus</Select.Option>
                <Select.Option value="Van">🚐 Van</Select.Option>
                <Select.Option value="Car">🚗 Car</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Vehicle Number" name="number" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="e.g. MH-12-AB-1234" />
            </Form.Item>
          </div>

          <Form.Item label="Driver Name" name="driver" rules={[{ required: true, message: "Select driver" }]}>
            <Select
              showSearch optionFilterProp="label"
              placeholder="Search driver…"
              options={driverOptions}
              onChange={handleDriverChange}
              suffixIcon={<UserOutlined style={{ color: C.textMuted }} />}
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Driver Contact" name="driverContact">
              <Input
                placeholder="Auto-filled from profile"
                readOnly
                prefix={<PhoneOutlined style={{ color: C.textMuted, fontSize: 12 }} />}
              />
            </Form.Item>
            <Form.Item label="Driving License" name="drivingLicense">
              <Input placeholder="License number" />
            </Form.Item>
          </div>

          <Form.Item
            label="Linked Driver Account (optional)"
            name="driverId"
            tooltip="Only needed if this driver has a login account and should see this vehicle on their own dashboard."
          >
            <Select
              allowClear showSearch optionFilterProp="label"
              placeholder="Search a Driver account to link…"
              options={driverAccountOptions}
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="0" addonAfter="seats" />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true, message: "Required" }]}>
              <Select placeholder="Select status">
                <Select.Option value="Available">Available</Select.Option>
                <Select.Option value="In Use">In Use</Select.Option>
                <Select.Option value="Maintenance">Maintenance</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Route Assigned" name="route">
            <Select
              allowClear showSearch optionFilterProp="label"
              placeholder="Select route (optional)"
              options={routeOptions}
              suffixIcon={<NodeIndexOutlined style={{ color: C.textMuted }} />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Vehicles;
