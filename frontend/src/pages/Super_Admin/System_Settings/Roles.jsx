import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
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
  Statistic,
  Table,
  Tag,
  Typography,
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
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../../../features/roleSlice";
import apiClient from "../../../api/httpClient";
import AddRoleForm from "../../../components/forms/AddRoleForm";

const { Title, Text } = Typography;

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
    color: "#2563eb",
    bg: "#dbeafe",
    desc: "Basic school operations ke liye recommended roles.",
  },
  medium: {
    title: "Medium School",
    color: "#7c3aed",
    bg: "#ede9fe",
    desc: "Growing school ke liye admin + operation roles.",
  },
  enterprise: {
    title: "Enterprise School",
    color: "#16a34a",
    bg: "#dcfce7",
    desc: "Large schools ke liye complete governance roles.",
  },
};

const statusConfig = {
  Active: "success",
  Expired: "default",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const css = `
.roles-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #fdf2f8 100%);
}

.roles-hero {
  background: #ffffffcc;
  backdrop-filter: blur(14px);
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  padding: 24px;
  margin-bottom: 18px;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.roles-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.roles-card {
  border-radius: 24px !important;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.template-card {
  cursor: pointer;
  border-radius: 20px !important;
  transition: 0.2s ease;
  border: 1px solid #e2e8f0 !important;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15,23,42,0.1);
}

.template-card.active {
  border-color: #7c3aed !important;
  box-shadow: 0 0 0 4px #ede9fe;
}

.role-chip {
  border-radius: 999px !important;
  padding: 4px 10px !important;
  font-weight: 600;
}

.access-modal .ant-modal-content {
  border-radius: 24px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .roles-page {
    padding: 14px;
  }
}
`;

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
  // Table columns
  // ---------------------------------------------------------------------------
  const columns = [
    {
      title: "User",
      dataIndex: "userId",
      render: (user) => <Text strong>{user?.name || user?.email || "—"}</Text>,
    },
    {
      title: "Role",
      dataIndex: "roleId",
      render: (role) => (
        <Tag color="blue" className="role-chip">
          {role?.name || "—"}
        </Tag>
      ),
    },
    {
      title: "Scope",
      dataIndex: "scope",
      render: (value) => <Text type="secondary">{value}</Text>,
    },
    {
      title: "Valid Till",
      dataIndex: "validTill",
      render: (value) => (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          {value ? new Date(value).toLocaleDateString() : "—"}
        </Tag>
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
      render: (status) => (
        <Tag color={statusConfig[status] || "default"} className="role-chip">
          {status}
        </Tag>
      ),
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
    <>
      <style>{css}</style>

      <div className="roles-page">
        {/* Hero header */}
        <div className="roles-hero">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={14}>
              <Space align="center">
                <div className="roles-icon">
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Role Governance
                  </Title>
                  <Text style={{ color: "var(--textMuted, #64748b)" }}>
                    Role templates, custom roles aur time-bound access manage
                    karein.
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenModal}
                >
                  Grant Temporary Access
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Info alert */}
        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 16, marginBottom: 18 }}
          message="Role Governance Hardening"
          description="Role templates + time-bound access yahan manage hoga. Permission diff aur high-risk approvals Permissions module me handle honge."
        />


        {/* Stat cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="roles-card">
              <Statistic
                title="Selected Template Roles"
                value={templateRoles.length}
                prefix={<CrownOutlined style={{ color: "var(--purple, #7c3aed)" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="roles-card">
              <Statistic
                title="Temporary Grants"
                value={temporaryAccess.length}
                prefix={<UserSwitchOutlined style={{ color: "var(--primary, #2563eb)" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="roles-card">
              <Statistic
                title="Security Mode"
                value="RBAC"
                prefix={<LockOutlined style={{ color: "var(--success, #16a34a)" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Role Templates */}
        <Card
          bordered={false}
          className="roles-card"
          style={{ marginBottom: 18 }}
          title={
            <Space>
              <TeamOutlined style={{ color: "var(--purple, #7c3aed)" }} />
              <span>Role Templates by School Size</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            {Object.keys(ROLE_TEMPLATES).map((key) => {
              const meta = templateMeta[key];
              const active = selectedTemplate === key;

              return (
                <Col xs={24} md={8} key={key}>
                  <Card
                    bordered
                    className={`template-card ${active ? "active" : ""}`}
                    onClick={() => setSelectedTemplate(key)}
                    bodyStyle={{ padding: 18 }}
                  >
                    <Space align="start">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 16,
                          background: meta.bg,
                          color: meta.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        <CrownOutlined />
                      </div>

                      <div>
                        <Text strong style={{ fontSize: 15 }}>
                          {meta.title}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {meta.desc}
                        </Text>
                        <div style={{ marginTop: 10 }}>
                          <Tag color="purple" className="role-chip">
                            {ROLE_TEMPLATES[key].length} roles
                          </Tag>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <div style={{ marginTop: 18 }}>
            <Text strong>Included Roles</Text>
            <div style={{ marginTop: 10 }}>
              <Space wrap>
                {templateRoles.map((role) => (
                  <Tag key={role} color="purple" className="role-chip">
                    {role}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        </Card>

        {/* Role Management + Temp Access Table */}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card
              bordered={false}
              className="roles-card"
              title={
                <Space>
                  <PlusOutlined style={{ color: "var(--primary, #2563eb)" }} />
                  <span>Create / Manage Roles</span>
                </Space>
              }
            >
              <Text type="secondary">
                Role definitions aur permissions ke liye existing role form use
                karein.
              </Text>

              <div style={{ marginTop: 16 }}>
                <AddRoleForm />
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <Card
              bordered={false}
              className="roles-card"
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: "#d97706" }} />
                  <span>Time-bound Temporary Access</span>
                  <Tag color="blue">{temporaryAccess.length}</Tag>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenModal}
                >
                  Grant Access
                </Button>
              }
            >
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
            </Card>
          </Col>
        </Row>

        {/* Grant Temporary Access Modal */}
        <Modal
          open={tempAccessOpen}
          title={
            <Space>
              <UserSwitchOutlined style={{ color: "#7c3aed" }} />
              <span>Grant Temporary Access</span>
            </Space>
          }
          onCancel={() => {
            setTempAccessOpen(false);
            form.resetFields();
          }}
          onOk={createTemporaryAccess}
          okText="Grant Access"
          confirmLoading={submitting}
          width={620}
          destroyOnClose
          className="access-modal"
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
    </>
  );
};

export default Roles;
