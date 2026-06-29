import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Table, message } from "antd";
import {
  DeleteOutlined, EditOutlined, PlusOutlined,
  CarOutlined, TeamOutlined, NodeIndexOutlined,
  EnvironmentOutlined, SwapOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAssignment, fetchAssignableStudents, fetchAssignments,
  fetchRoutes, fetchVehicles, saveAssignment,
} from "../../../features/transportSlice";
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

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StatusBadge = ({ active }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: active ? C.successLight : "#F1F5F9",
    color: active ? "#15803D" : C.textSub,
    border: `1px solid ${active ? "#86EFAC" : C.border}`,
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: active ? C.success : C.textMuted,
      display: "inline-block",
    }} />
    {active ? "Active" : "Inactive"}
  </span>
);

const Assignments = () => {
  const dispatch = useDispatch();
  const { assignments, students, routes, vehicles, loading } = useSelector((s) => s.transport);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAssignableStudents());
    dispatch(fetchRoutes());
    dispatch(fetchVehicles());
    dispatch(fetchAssignments());
  }, [dispatch]);

  const studentOptions = useMemo(
    () => students.map((s) => ({
      value: s._id,
      label: `${s.name} (${s.registrationNumber})`,
    })),
    [students],
  );
  const routeOptions  = useMemo(() => routes.map((r) => ({ value: r._id, label: r.name })), [routes]);
  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v._id, label: `${v.busNumber} (${v.vehicleType})` })),
    [vehicles],
  );

  const dataSource = useMemo(
    () => assignments.map((a) => ({
      key: a._id, _id: a._id,
      studentEnrollmentId: a.studentEnrollmentId?._id,
      studentName:     a.studentEnrollmentId?.studentId?.userId?.name || "-",
      registrationNumber: a.studentEnrollmentId?.registrationNumber || "-",
      className:       a.studentEnrollmentId?.schoolClassId?.name || "-",
      sectionName:     a.studentEnrollmentId?.sectionId?.name || "-",
      routeName:       a.routeId?.name || "-",
      vehicleNumber:   a.vehicleId?.busNumber || "-",
      pickupStop:      a.pickupStop || "-",
      dropStop:        a.dropStop || "-",
      isActive:        a.isActive,
    })),
    [assignments],
  );

  const closeModal = () => {
    setModalVisible(false);
    setEditingAssignment(null);
    form.resetFields();
  };

  const handleSaveAssignment = async (values) => {
    try {
      await dispatch(saveAssignment({
        studentEnrollmentId: values.studentEnrollmentId,
        routeId:    values.routeId,
        vehicleId:  values.vehicleId,
        pickupStop: values.pickupStop,
        dropStop:   values.dropStop,
      })).unwrap();
      message.success(editingAssignment ? "Assignment updated" : "Assignment created");
      closeModal();
      dispatch(fetchAssignments());
    } catch (err) {
      message.error(err || "Unable to save assignment");
    }
  };

  const handleEdit = (record) => {
    setEditingAssignment(record);
    form.setFieldsValue({
      studentEnrollmentId: record.studentEnrollmentId,
      routeId:    routes.find((r) => r.name === record.routeName)?._id,
      vehicleId:  vehicles.find((v) => v.busNumber === record.vehicleNumber)?._id,
      pickupStop: record.pickupStop === "-" ? "" : record.pickupStop,
      dropStop:   record.dropStop   === "-" ? "" : record.dropStop,
    });
    setModalVisible(true);
  };

  const handleDelete = (record) =>
    Modal.confirm({
      title: "Remove assignment?",
      content: `This will remove transport assignment for ${record.studentName}.`,
      okText: "Remove", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteAssignment(record._id)).unwrap();
          message.success("Assignment removed");
        } catch (err) {
          message.error(err || "Unable to delete assignment");
        }
      },
    });

  const stats = {
    assignments: assignments.length,
    students:    students.length,
    routes:      routes.length,
    vehicles:    vehicles.length,
  };

  const columns = [
    {
      title: "Student",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            color: "#fff", fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.studentName)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{r.studentName}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{r.registrationNumber}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Class",
      render: (_, r) => (
        <span style={{
          padding: "3px 10px", borderRadius: 20,
          background: C.purpleLight, color: C.purple,
          border: "1px solid #DDD6FE",
          fontSize: 12, fontWeight: 700,
        }}>
          {r.className} {r.sectionName}
        </span>
      ),
    },
    {
      title: "Route",
      dataIndex: "routeName",
      render: (v) => v === "-" ? (
        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
      ) : (
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
      ),
    },
    {
      title: "Vehicle",
      dataIndex: "vehicleNumber",
      render: (v) => v === "-" ? (
        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
      ) : (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 11px", borderRadius: 20,
          background: C.primaryLighter, color: C.primary,
          border: "1px solid " + C.primaryLight,
          fontSize: 12, fontWeight: 700,
        }}>
          <CarOutlined style={{ fontSize: 10 }} />
          {v}
        </span>
      ),
    },
    {
      title: "Pickup",
      dataIndex: "pickupStop",
      render: (v) => v === "-" ? (
        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
      ) : (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 12, color: C.textSub, fontWeight: 500,
        }}>
          <EnvironmentOutlined style={{ fontSize: 10, color: C.success }} />
          {v}
        </span>
      ),
    },
    {
      title: "Drop",
      dataIndex: "dropStop",
      render: (v) => v === "-" ? (
        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
      ) : (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 12, color: C.textSub, fontWeight: 500,
        }}>
          <EnvironmentOutlined style={{ fontSize: 10, color: C.danger }} />
          {v}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <StatusBadge active={v} />,
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
      <style>{tableHeadCss("assign-tbl")}</style>

      <PageHeader
        title="Transport Assignments"
        subtitle="Assign routes and vehicles to students for daily commute"
        icon={<SwapOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Assign Transport
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(160), margin: "20px 0 20px" }}>
        {[
          { icon: <SwapOutlined />,     label: "Total Assignments", value: stats.assignments, color: C.primary },
          { icon: <TeamOutlined />,     label: "Students",          value: stats.students,    color: C.accent },
          { icon: <NodeIndexOutlined />, label: "Routes",           value: stats.routes,      color: C.purple },
          { icon: <CarOutlined />,      label: "Vehicles",          value: stats.vehicles,    color: "#F97316" },
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
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Assignments</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {assignments.length}
          </span>
        </div>
        <Table
          className="assign-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} assignments` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No transport assignments yet. Click 'Assign Transport' to add one." }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>
              {editingAssignment ? "Edit Assignment" : "Assign Transport"}
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
            {editingAssignment ? "Update" : "Assign"}
          </Button>,
        ]}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAssignment} style={{ marginTop: 8 }}>
          <Form.Item
            label="Student"
            name="studentEnrollmentId"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select
              showSearch optionFilterProp="label"
              options={studentOptions}
              placeholder="Search student…"
              size="large"
            />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="Route"
              name="routeId"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                showSearch optionFilterProp="label"
                options={routeOptions}
                placeholder="Select route"
              />
            </Form.Item>
            <Form.Item
              label="Vehicle"
              name="vehicleId"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                showSearch optionFilterProp="label"
                options={vehicleOptions}
                placeholder="Select vehicle"
              />
            </Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Pickup Stop" name="pickupStop">
              <Input
                placeholder="e.g. Main Gate"
                prefix={<EnvironmentOutlined style={{ color: C.success, fontSize: 12 }} />}
              />
            </Form.Item>
            <Form.Item label="Drop Stop" name="dropStop">
              <Input
                placeholder="e.g. Bus Stand"
                prefix={<EnvironmentOutlined style={{ color: C.danger, fontSize: 12 }} />}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Assignments;
