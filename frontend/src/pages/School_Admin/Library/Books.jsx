import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const Books = () => {
  const [books, setBooks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form] = Form.useForm();

  // 📌 Save / Update Book
  const handleSave = (values) => {
    if (editingBook) {
      setBooks((prev) =>
        prev.map((b) =>
          b.key === editingBook.key ? { ...values, key: b.key } : b
        )
      );
      message.success("Book updated successfully");
    } else {
      setBooks((prev) => [...prev, { ...values, key: Date.now() }]);
      message.success("Book added successfully");
    }
    setIsModalOpen(false);
    setEditingBook(null);
    form.resetFields();
  };

  // 📌 Delete Book
  const handleDelete = (key) => {
    setBooks((prev) => prev.filter((b) => b.key !== key));
    message.success("Book deleted");
  };

  // 📊 Table Columns
  const columns = [
    {
      title: "Book Name",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    { title: "Author", dataIndex: "author", key: "author" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Available",
      dataIndex: "quantity",
      key: "quantity",
      render: (q) =>
        q > 0 ? <Tag color="green">{q}</Tag> : <Tag color="red">Out</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "Available" ? (
          <Tag color="green">Available</Tag>
        ) : (
          <Tag color="orange">Issued</Tag>
        ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Book">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditingBook(record);
                form.setFieldsValue(record);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this book?"
            onConfirm={() => handleDelete(record.key)}
          >
            <Tooltip title="Delete Book">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* 🔹 Header */}
      <Row justify="space-between" align="middle">
        <Title level={3}>
          <BookOutlined /> Library Books
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Book
        </Button>
      </Row>

      {/* 🔹 Statistics */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Statistic title="Total Books" value={books.length} />
        </Col>
        <Col span={6}>
          <Statistic
            title="Available"
            value={books.filter((b) => b.quantity > 0).length}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Issued"
            value={books.filter((b) => b.status === "Issued").length}
          />
        </Col>
      </Row>

      {/* 🔹 Filters */}
      <Row gutter={16} style={{ margin: "16px 0" }}>
        <Col span={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search book / author"
          />
        </Col>
        <Col span={6}>
          <Select placeholder="Category" style={{ width: "100%" }}>
            <Option value="Academic">Academic</Option>
            <Option value="Novel">Novel</Option>
            <Option value="Science">Science</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Select placeholder="Status" style={{ width: "100%" }}>
            <Option value="Available">Available</Option>
            <Option value="Issued">Issued</Option>
          </Select>
        </Col>
      </Row>

      {/* 🔹 Table */}
      <Table
        columns={columns}
        dataSource={books}
        rowKey="key"
        bordered
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "No books found" }}
      />

      {/* 🔹 Modal */}
      <Modal
        title={editingBook ? "Edit Book" : "Add Book"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingBook(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="title"
            label="Book Title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="author"
            label="Author"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select>
              <Option value="Academic">Academic</Option>
              <Option value="Novel">Novel</Option>
              <Option value="Science">Science</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Available">Available</Option>
              <Option value="Issued">Issued</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Books;
