import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Checkbox,
  message,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

// Dummy API (replace with real backend)
const fetchBoards = async () => [
  { 
    _id: "b1", 
    name: "CBSE", 
    code: "CBSE123", 
    description: "Central Board of Secondary Education", 
    isActive: true,
    createdByRole: "Super Admin"
  },
  { 
    _id: "b2", 
    name: "ICSE", 
    code: "ICSE456", 
    description: "Indian Certificate of Secondary Education", 
    isActive: true,
    createdByRole: "School Admin"
  },
];

const SchoolBoards = () => {
  const [boards, setBoards] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [form] = Form.useForm();

  // Fetch boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      const data = await fetchBoards();
      setBoards(data);
    };
    loadBoards();
  }, []);

  const handleAddBoard = () => {
    form.resetFields();
    setEditingBoard(null);
    setModalVisible(true);
  };

  const handleEditBoard = (board) => {
    setEditingBoard(board);
    form.setFieldsValue({ ...board, isActive: board.isActive });
    setModalVisible(true);
  };

  const handleDeleteBoard = (boardId) => {
    setBoards(prev => prev.filter(b => b._id !== boardId));
    message.success("Board deleted successfully!");
  };

  const handleSubmit = (values) => {
    if (editingBoard) {
      // Edit existing board
      setBoards(prev =>
        prev.map(b => (b._id === editingBoard._id ? { ...b, ...values } : b))
      );
      message.success("Board updated successfully!");
    } else {
      // Add new board
      const newBoard = {
        _id: Date.now().toString(),
        ...values,
        code: values.code || values.name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900),
        createdByRole: "Super Admin", // default for demo
      };
      setBoards(prev => [...prev, newBoard]);
      message.success("Board created successfully!");
    }
    setModalVisible(false);
  };

  const columns = [
    { title: "Board Name", dataIndex: "name", key: "name" },
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Description", dataIndex: "description", key: "description" },
    { 
      title: "Status", 
      dataIndex: "isActive", 
      key: "isActive",
      render: val => val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>
    },
    { title: "Created By", dataIndex: "createdByRole", key: "createdByRole" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} type="primary" size="small" onClick={() => handleEditBoard(record)}>
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} type="danger" size="small" onClick={() => handleDeleteBoard(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="School Boards Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBoard}>
            Add Board
          </Button>
        }
      >
        <Table dataSource={boards} columns={columns} rowKey="_id" />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingBoard ? "Edit Board" : "Add Board"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Board Name"
            name="name"
            rules={[{ required: true, message: "Please input board name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Code"
            name="code"
          >
            <Input placeholder="Auto-generated if left blank" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolBoards;
