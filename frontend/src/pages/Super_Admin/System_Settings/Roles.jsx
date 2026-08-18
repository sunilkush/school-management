import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  message,
} from "antd";
import {
  CrownOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  UserSwitchOutlined,
  LockOutlined,
  DeleteOutlined,
  StopOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles, updateRole, deleteRole } from "../../../features/roleSlice";
import apiClient from "../../../api/httpClient";
import AddRoleForm from "../../../components/forms/AddRoleForm";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, modalTitle,
} from "../../../styles/pageStyles";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROLE_TEMPLATES = {
  small: ["School Admin", "Teacher", "Accountant", "Receptionist"],
  medium: [
    "School Admin",
    "Principal",
    "Teacher",
    "Librarian",
    "Accountant",
    "IT Support",
  ],
  enterprise: [
    "School Admin",
    "Principal",
    "Vice Principal",
    "Teacher",
    "Librarian",
    "Accountant",
    "IT Support",
    "Transport Manager",
    "Hostel Warden",
  ],
};

const templateMeta = {
  small: {
    title: "Small School",
    color: "#2563EB",
    desc: "Basic school operations ke liye recommended roles.",
  },
  medium: {
    title: "Medium School",
    color: "#14B8A6",
    desc: "Growing school ke liye admin + operation roles.",
  },
  enterprise: {
    title: "Enterprise School",
    color: "#22C55E",
    desc: "Large schools ke liye complete governance roles.",
  },
};

const statusPill = (status) =>
  status === "Active"
    ? pill("var(--success-hover)", "var(--success-light)")
    : pill("var(--text-muted)", "var(--surface-soft)");

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Roles = () => {
  const dispatch = useDispatch();
  const { roles = [] } = useSelector((state) => state.role);

  const [selectedTemplate, setSelectedTemplate] = useState("small");
  const [tempAccessOpen, setTempAccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [temporaryAccess, setTemporaryAccess] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [form] = Form.useForm();

  const [editingRole, setEditingRole] = useState(null);
  const [editRoleForm] = Form.useForm();
  const [savingRole, setSavingRole] = useState(false);

  const templateRoles = useMemo(
    () => ROLE_TEMPLATES[selectedTemplate] || [],
    [selectedTemplate]
  );

  // Load roles and temp access records on mount
  useEffect(() => {
    dispatch(fetchRoles());
    loadTempAccess();
  }, [dispatch]);

  const loadTempAccess = async () => {
    setLoadingAccess(true);
    try {
      const res = await apiClient.get("/role/temp-access");
      setTemporaryAccess(res.data?.data || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load temporary access records");
    } finally {
      setLoadingAccess(false);
    }
  };

  // Fetch users when the modal opens
  const handleOpenModal = async () => {
    setTempAccessOpen(true);
    if (allUsers.length) return;
    try {
      const res = await apiClient.get("/user/all");
      const users = res.data?.data?.users || res.data?.data || [];
      setAllUsers(Array.isArray(users) ? users : []);
    } catch {
      // modal will still open; user can type manually
    }
  };

  // ---------------------------------------------------------------------------
  // Grant temporary access via API
  // ---------------------------------------------------------------------------
  const createTemporaryAccess = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      await apiClient.post("/role/temp-access", {
        userId: values.userId,
        roleId: values.roleId,
        scope: values.scope || "global",
        reason: values.reason,
        validTill: values.validTill ? values.validTill.format("YYYY-MM-DD") : undefined,
      });

      message.success("Temporary access granted successfully.");
      form.resetFields();
      setTempAccessOpen(false);
      loadTempAccess();
    } catch (err) {
      if (err && err.errorFields) return;
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to grant temporary access."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Revoke a temporary-access record
  // ---------------------------------------------------------------------------
  const revokeTempAccess = async (id) => {
    try {
      await apiClient.patch(`/role/temp-access/${id}/revoke`);
      message.success("Temporary access revoked.");
      loadTempAccess();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to revoke access.");
    }
  };

  // ---------------------------------------------------------------------------
  // Delete a temporary-access record
  // ---------------------------------------------------------------------------
  const deleteTemporaryAccess = async (id) => {
    try {
      await apiClient.delete(`/role/temp-access/${id}`);
      message.success("Temporary access record deleted.");
      loadTempAccess();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete record.");
    }
  };

  // ---------------------------------------------------------------------------
  // Role edit / delete
  // ---------------------------------------------------------------------------
  const openEditRole = (role) => {
    setEditingRole(role);
    editRoleForm.setFieldsValue({ name: role.name, description: role.description });
  };

  const closeEditRole = () => {
    setEditingRole(null);
    editRoleForm.resetFields();
  };

  const handleSaveRole = async () => {
    try {
      const values = await editRoleForm.validateFields();
      setSavingRole(true);
      await dispatch(updateRole({ id: editingRole._id, ...values })).unwrap();
      message.success("Role updated successfully");
      closeEditRole();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    try {
      await dispatch(deleteRole(role._id)).unwrap();
      message.success("Role deleted successfully");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete role");
    }
  };

  const roleColumns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name, r) => (
        <Space>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
          {r.type === "system" && <span style={pill("var(--text-muted)")}>System</span>}
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v) => v || <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      width: 110,
      render: (perms) => <span style={pill("var(--primary)", "var(--primary-light)")}>{perms?.length || 0}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, role) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            title="Edit"
            disabled={role.type === "system"}
            onClick={() => openEditRole(role)}
          />
          <Popconfirm
            title="Delete this role?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            disabled={role.type === "system"}
            onConfirm={() => handleDeleteRole(role)}
          >
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              title="Delete"
              disabled={role.type === "system"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  const columns = [
    {
      title: "User",
      dataIndex: "userId",
      render: (user) => <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{user?.name || user?.email || "—"}</span>,
    },
    {
      title: "Role",
      dataIndex: "roleId",
      render: (role) => <span style={pill("var(--primary)", "var(--primary-light)")}>{role?.name || "—"}</span>,
    },
    {
      title: "Scope",
      dataIndex: "scope",
      render: (value) => <span style={{ color: "var(--text-muted)" }}>{value}</span>,
    },
    {
      title: "Valid Till",
      dataIndex: "validTill",
      render: (value) => (
        <span style={pill("var(--warning-hover)", "var(--warning-light)")}>
          <ClockCircleOutlined /> {value ? new Date(value).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <span style={statusPill(status)}>{status}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === "Active" && (
            <Popconfirm
              title="Revoke this temporary access?"
              okText="Revoke"
              okButtonProps={{ danger: true }}
              onConfirm={() => revokeTempAccess(record._id)}
            >
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                title="Revoke"
              />
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this record permanently?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteTemporaryAccess(record._id)}
          >
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Role Governance"
        subtitle="Role templates, custom roles aur time-bound access manage karein"
        icon={<SafetyCertificateOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Grant Temporary Access
          </Button>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ borderRadius: 14, margin: "20px 0" }}
        message="Role Governance Hardening"
        description="Role templates + time-bound access yahan manage hoga. Permission diff aur high-risk approvals Permissions module me handle honge."
      />

      <div style={statGrid(170)}>
        <StatCard icon={<CrownOutlined />} label="Selected Template Roles" value={templateRoles.length} color="var(--accent)" />
        <StatCard icon={<UserSwitchOutlined />} label="Temporary Grants" value={temporaryAccess.length} color="var(--primary)" />
        <StatCard icon={<LockOutlined />} label="Security Mode" value="RBAC" color="var(--success)" />
      </div>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <TeamOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Role Templates by School Size</span>
        </div>

        <Row gutter={[16, 16]}>
          {Object.keys(ROLE_TEMPLATES).map((key) => {
            const meta = templateMeta[key];
            const active = selectedTemplate === key;

            return (
              <Col xs={24} md={8} key={key}>
                <div
                  onClick={() => setSelectedTemplate(key)}
                  style={{
                    cursor: "pointer",
                    borderRadius: 14,
                    padding: 16,
                    border: active ? `1px solid ${meta.color}` : "1px solid var(--border-muted)",
                    boxShadow: active ? `0 0 0 3px ${meta.color}22` : "none",
                    background: "var(--surface)",
                    transition: "0.15s ease",
                  }}
                >
                  <Space align="start">
                    <div style={iconWell(meta.color, 44)}>
                      <CrownOutlined />
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                        {meta.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {meta.desc}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span style={pill("var(--purple-hover)", "rgba(var(--purple-rgb), 0.12)")}>
                          {ROLE_TEMPLATES[key].length} roles
                        </span>
                      </div>
                    </div>
                  </Space>
                </div>
              </Col>
            );
          })}
        </Row>

        <div style={{ marginTop: 18 }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Included Roles</span>
          <div style={{ marginTop: 10 }}>
            <Space wrap>
              {templateRoles.map((role) => (
                <span key={role} style={pill("var(--purple-hover)", "rgba(var(--purple-rgb), 0.12)")}>
                  {role}
                </span>
              ))}
            </Space>
          </div>
        </div>
      </div>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <SafetyCertificateOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>All Roles</span>
          <span style={pill("var(--primary)")}>{roles.length}</span>
        </div>

        <style>{tableHeadCss("roles-all-tbl")}</style>
        <div className="roles-all-tbl" style={tableContainer}>
          <Table
            rowKey="_id"
            columns={roleColumns}
            dataSource={roles}
            pagination={{ pageSize: 6 }}
            locale={{ emptyText: <Empty description="No roles yet" /> }}
          />
        </div>
      </div>

      <Modal
        open={!!editingRole}
        title={`Edit Role — ${editingRole?.name ?? ""}`}
        onCancel={closeEditRole}
        onOk={handleSaveRole}
        confirmLoading={savingRole}
        okText="Save Changes"
        destroyOnClose
      >
        <Form form={editRoleForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <PlusOutlined style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Create / Manage Roles</span>
            </div>

            <span style={{ color: "var(--text-muted)" }}>
              Role definitions aur permissions ke liye existing role form use karein.
            </span>

            <div style={{ marginTop: 16 }}>
              <AddRoleForm />
            </div>
          </div>
        </Col>

        <Col xs={24} xl={14}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <ClockCircleOutlined style={{ color: "var(--warning)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Time-bound Temporary Access</span>
              <span style={pill("var(--primary)")}>{temporaryAccess.length}</span>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                style={{ marginLeft: "auto" }}
                onClick={handleOpenModal}
              >
                Grant Access
              </Button>
            </div>

            <style>{tableHeadCss("roles-temp-access-tbl")}</style>
            <div className="roles-temp-access-tbl" style={tableContainer}>
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={temporaryAccess}
                loading={loadingAccess}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 6 }}
                locale={{
                  emptyText: (
                    <Empty description="No temporary access grants yet" />
                  ),
                }}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Grant Temporary Access Modal */}
      <Modal
        open={tempAccessOpen}
        title={modalTitle(<UserSwitchOutlined />, "Grant Temporary Access")}
        onCancel={() => {
          setTempAccessOpen(false);
          form.resetFields();
        }}
        onOk={createTemporaryAccess}
        okText="Grant Access"
        confirmLoading={submitting}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                name="userId"
                label="User"
                rules={[{ required: true, message: "User is required" }]}
              >
                <Select
                  showSearch
                  placeholder="Select user"
                  optionFilterProp="label"
                  options={allUsers.map((u) => ({
                    label: `${u.name || u.email} (${u.email})`,
                    value: u._id,
                  }))}
                  notFoundContent={allUsers.length === 0 ? <Spin size="small" /> : "No users"}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="roleId"
                label="Role"
                rules={[{ required: true, message: "Role is required" }]}
              >
                <Select
                  showSearch
                  placeholder="Select role"
                  optionFilterProp="label"
                  options={roles.map((r) => ({ label: r.name, value: r._id }))}
                  notFoundContent={roles.length === 0 ? <Spin size="small" /> : "No roles"}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="scope" label="Scope (optional)">
                <Select
                  placeholder="Select scope"
                  allowClear
                  options={[
                    { label: "Global", value: "global" },
                    { label: "School Level", value: "school" },
                    { label: "Exam Week", value: "exam-week" },
                    { label: "Event Only", value: "event" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="validTill"
                label="Valid Till"
                rules={[{ required: true, message: "Date is required" }]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="reason"
                label="Reason"
                rules={[{ required: true, message: "Reason is required" }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Why is temporary access needed?"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;
