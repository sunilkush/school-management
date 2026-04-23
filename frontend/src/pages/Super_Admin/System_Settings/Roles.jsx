import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import AddRoleForm from "../../../components/forms/AddRoleForm";

const { Title, Text } = Typography;

const ROLE_TEMPLATES = {
  small: ["School Admin", "Teacher", "Accountant", "Receptionist"],
  medium: ["School Admin", "Principal", "Teacher", "Librarian", "Accountant", "IT Support"],
  enterprise: ["School Admin", "Principal", "Vice Principal", "Teacher", "Librarian", "Accountant", "IT Support", "Transport Manager", "Hostel Warden"],
};

const Roles = () => {
  const [selectedTemplate, setSelectedTemplate] = useState("small");
  const [tempAccessOpen, setTempAccessOpen] = useState(false);
  const [form] = Form.useForm();
  const [temporaryAccess, setTemporaryAccess] = useState([]);

  const templateRoles = useMemo(() => ROLE_TEMPLATES[selectedTemplate] || [], [selectedTemplate]);

  const columns = [
    { title: "User", dataIndex: "user" },
    { title: "Role", dataIndex: "role", render: (role) => <Tag color="blue">{role}</Tag> },
    { title: "Scope", dataIndex: "scope" },
    { title: "Valid Till", dataIndex: "validTill" },
    { title: "Reason", dataIndex: "reason" },
    { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Active" ? "green" : "default"}>{status}</Tag> },
  ];

  const createTemporaryAccess = async () => {
    try {
      const values = await form.validateFields();
      const row = {
        id: `${Date.now()}`,
        user: values.user,
        role: values.role,
        scope: values.scope,
        validTill: values.validTill,
        reason: values.reason,
        status: "Active",
      };
      setTemporaryAccess((prev) => [row, ...prev]);
      form.resetFields();
      setTempAccessOpen(false);
      message.success("Temporary access created");
    } catch {
      // validation
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="Role Governance Hardening"
        description="Role templates + time-bound access are available here. Permission diff and high-risk approvals are in the Permissions module."
      />

      <Card>
        <Title level={4} style={{ marginBottom: 4 }}>Role Templates by School Size</Title>
        <Text type="secondary">Apply a recommended baseline role set based on organization complexity.</Text>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xs={24} md={8}>
            <Select
              style={{ width: "100%" }}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={[
                { label: "Small School Template", value: "small" },
                { label: "Medium School Template", value: "medium" },
                { label: "Enterprise School Template", value: "enterprise" },
              ]}
            />
          </Col>
          <Col xs={24} md={16}>
            <Space wrap>
              {templateRoles.map((role) => (
                <Tag key={role} color="purple">{role}</Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4} style={{ marginBottom: 4 }}>Create / Manage Roles</Title>
        <Text type="secondary">Use the existing role form to create role definitions and permissions.</Text>
        <div className="w-full flex gap-4" style={{ marginTop: 12 }}>
          <AddRoleForm />
        </div>
      </Card>

      <Card
        title="Time-bound Temporary Access"
        extra={<Button type="primary" onClick={() => setTempAccessOpen(true)}>Grant Temporary Access</Button>}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={temporaryAccess}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: "No temporary grants yet" }}
        />
      </Card>

      <Modal
        open={tempAccessOpen}
        title="Grant Temporary Access"
        onCancel={() => setTempAccessOpen(false)}
        onOk={createTemporaryAccess}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user" label="User" rules={[{ required: true }]}>
            <Input placeholder="name / email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Input placeholder="Exam Coordinator" />
          </Form.Item>
          <Form.Item name="scope" label="Scope" rules={[{ required: true }]}>
            <Input placeholder="Exam Week Access" />
          </Form.Item>
          <Form.Item name="validTill" label="Valid Till" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default Roles;