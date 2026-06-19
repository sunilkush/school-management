import React, { useState } from "react";
import {
  Form, Input, Select, DatePicker, Button,
  Table, Space, message, Modal,
} from "antd";
import { PlusOutlined, DeleteOutlined, CreditCardOutlined } from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pageCard, tableHeadCss } from "../../../styles/pageStyles";

const { Option } = Select;

const C = {
  primary:   "#2563EB",
  primaryBg: "#EFF6FF",
  primaryBd: "#BFDBFE",
  danger:    "#EF4444",
  dangerBg:  "#FEF2F2",
  border:    "#E2E8F0",
  textSub:   "#64748B",
};

const LibraryCard = () => {
  const [form] = Form.useForm();
  const [cards, setCards]       = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateCard = (values) => {
    const newCard = {
      key:        Date.now(),
      name:       values.name,
      userType:   values.userType,
      class:      values.class || "-",
      section:    values.section || "-",
      studentId:  values.studentId,
      issueDate:  values.issueDate.format("DD-MM-YYYY"),
      expiryDate: values.expiryDate.format("DD-MM-YYYY"),
    };
    setCards((prev) => [newCard, ...prev]);
    message.success("Library card issued successfully!");
    form.resetFields();
    setModalOpen(false);
  };

  const handleRevoke = (key) => {
    setCards((prev) => prev.filter((c) => c.key !== key));
    message.success("Library card revoked.");
  };

  const columns = [
    { title: "Name",       dataIndex: "name",      key: "name",      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: "User Type",  dataIndex: "userType",  key: "userType"  },
    { title: "Class",      dataIndex: "class",     key: "class"     },
    { title: "Section",    dataIndex: "section",   key: "section"   },
    { title: "ID",         dataIndex: "studentId", key: "studentId" },
    { title: "Issue Date", dataIndex: "issueDate", key: "issueDate" },
    { title: "Expiry",     dataIndex: "expiryDate",key: "expiryDate"},
    {
      title: "Action",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleRevoke(record.key)}
            style={{
              borderRadius: 7, fontSize: 12,
              borderColor: C.danger, color: C.danger,
              background: C.dangerBg,
            }}
          >
            Revoke
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("lib-card-tbl")}</style>

      <PageHeader
        title="Library Cards"
        subtitle="Issue and manage library membership cards"
        icon={<CreditCardOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Issue Library Card
          </Button>
        }
      />

      {/* ── Cards table ── */}
      <div style={{ ...pageCard, margin: "20px 0", padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>
          Issued Library Cards
        </div>
        <Table
          className="lib-card-tbl"
          columns={columns}
          dataSource={cards}
          pagination={{ pageSize: 8 }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No library cards issued yet. Click 'Issue Library Card' to get started." }}
        />
      </div>

      {/* ── Issue Card Modal ── */}
      <Modal
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#2563EB" }} />
            <span style={{ fontWeight: 700 }}>Issue Library Card</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCard}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            label="User Type"
            name="userType"
            rules={[{ required: true, message: "Please select user type" }]}
          >
            <Select placeholder="Select user type">
              <Option value="Student">Student</Option>
              <Option value="Staff">Staff</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Class" name="class">
              <Input placeholder="e.g. 10" />
            </Form.Item>
            <Form.Item label="Section" name="section">
              <Input placeholder="e.g. A" />
            </Form.Item>
          </div>

          <Form.Item
            label="Student / Staff ID"
            name="studentId"
            rules={[{ required: true, message: "Please enter ID" }]}
          >
            <Input placeholder="Enter ID number" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="Issue Date"
              name="issueDate"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Expiry Date"
              name="expiryDate"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button
              onClick={() => { setModalOpen(false); form.resetFields(); }}
              style={{ borderRadius: 9, borderColor: C.border, color: C.textSub }}
            >
              Cancel
            </Button>
            <Button
              htmlType="submit"
              icon={<PlusOutlined />}
              style={{
                background: C.primary, borderColor: C.primary,
                color: "#fff", borderRadius: 9, fontWeight: 600,
              }}
            >
              Issue Card
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LibraryCard;
