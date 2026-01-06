import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const LibraryCard = () => {
  const [form] = Form.useForm();
  const [cards, setCards] = useState([]);

  const handleCreateCard = (values) => {
    const newCard = {
      key: cards.length + 1,
      name: values.name,
      userType: values.userType,
      class: values.class || "-",
      section: values.section || "-",
      studentId: values.studentId,
      issueDate: values.issueDate.format("DD-MM-YYYY"),
      expiryDate: values.expiryDate.format("DD-MM-YYYY"),
    };
    setCards([...cards, newCard]);
    message.success("Library card issued successfully!");
    form.resetFields();
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "User Type", dataIndex: "userType", key: "userType" },
    { title: "Class", dataIndex: "class", key: "class" },
    { title: "Section", dataIndex: "section", key: "section" },
    { title: "Student ID", dataIndex: "studentId", key: "studentId" },
    { title: "Issue Date", dataIndex: "issueDate", key: "issueDate" },
    { title: "Expiry Date", dataIndex: "expiryDate", key: "expiryDate" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setCards(cards.filter((c) => c.key !== record.key));
              message.success("Library card removed");
            }}
          >
            Revoke
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Library</Breadcrumb.Item>
        <Breadcrumb.Item>Library Cards</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Library Card Form */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Issue a Library Card</h2>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateCard}
            style={{ maxWidth: 600 }}
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

            <Form.Item label="Class" name="class">
              <Input placeholder="Enter class (if student)" />
            </Form.Item>

            <Form.Item label="Section" name="section">
              <Input placeholder="Enter section (if student)" />
            </Form.Item>

            <Form.Item
              label="Student/Staff ID"
              name="studentId"
              rules={[{ required: true, message: "Please enter ID" }]}
            >
              <Input placeholder="Enter ID" />
            </Form.Item>

            <Form.Item
              label="Issue Date"
              name="issueDate"
              rules={[{ required: true, message: "Please select issue date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Expiry Date"
              name="expiryDate"
              rules={[{ required: true, message: "Please select expiry date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Issue Card
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Issued Cards Table */}
        <div>
          <h2 style={{ marginBottom: 16 }}>Issued Library Cards</h2>
          <Table
            columns={columns}
            dataSource={cards}
            pagination={{ pageSize: 5 }}
            rowKey="key"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default LibraryCard;
