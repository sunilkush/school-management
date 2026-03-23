import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tag,
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

const { Content } = Layout;

const HostelManagement = () => {
  const [rooms, setRooms] = useState([
    { key: 1, roomNumber: "101", capacity: 2, occupied: 1, students: ["John Doe"] },
    { key: 2, roomNumber: "102", capacity: 3, occupied: 0, students: [] },
    { key: 3, roomNumber: "103", capacity: 2, occupied: 2, students: ["Jane Smith", "Michael Brown"] },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  // Add/Edit Room
  const handleSaveRoom = (values) => {
    const newRoom = {
      key: editingRoom ? editingRoom.key : rooms.length + 1,
      roomNumber: values.roomNumber,
      capacity: values.capacity,
      occupied: editingRoom ? editingRoom.occupied : 0,
      students: editingRoom ? editingRoom.students : [],
    };

    if (editingRoom) {
      setRooms(rooms.map((r) => (r.key === editingRoom.key ? newRoom : r)));
      message.success("Room updated successfully!");
    } else {
      setRooms([...rooms, newRoom]);
      message.success("Room added successfully!");
    }

    setModalVisible(false);
    setEditingRoom(null);
    form.resetFields();
  };

  // Assign Student
  const handleAssignStudent = (values) => {
    const room = rooms.find((r) => r.key === selectedRoom.key);
    if (room.students.length >= room.capacity) {
      message.error("Room is full!");
      return;
    }
    room.students.push(values.studentName);
    room.occupied = room.students.length;
    setRooms([...rooms]);
    message.success(`${values.studentName} assigned to Room ${room.roomNumber}`);
    setAssignModalVisible(false);
    assignForm.resetFields();
    setSelectedRoom(null);
  };

  // Edit Room
  const handleEditRoom = (room) => {
    setEditingRoom(room);
    form.setFieldsValue({ roomNumber: room.roomNumber, capacity: room.capacity });
    setModalVisible(true);
  };

  // Delete Room
  const handleDeleteRoom = (room) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete Room ${room.roomNumber}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setRooms(rooms.filter((r) => r.key !== room.key));
        message.success("Room deleted successfully!");
      },
    });
  };

  // Open Assign Modal
  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  // Summary
  const totalRooms = rooms.length;
  const totalOccupied = rooms.reduce((acc, r) => acc + r.occupied, 0);
  const totalAvailable = rooms.reduce((acc, r) => acc + (r.capacity - r.occupied), 0);

  // Table Columns
  const columns = [
    { title: "Room Number", dataIndex: "roomNumber", key: "roomNumber" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    {
      title: "Occupied",
      dataIndex: "occupied",
      key: "occupied",
      render: (occupied, record) => (
        <Tag color={occupied === record.capacity ? "red" : "green"}>
          {occupied}/{record.capacity}
        </Tag>
      ),
    },
    {
      title: "Students",
      dataIndex: "students",
      key: "students",
      render: (students) => (students.length > 0 ? students.join(", ") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => handleOpenAssignModal(record)}>
            Assign Student
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleEditRoom(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoom(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Hostel</Breadcrumb.Item>
        <Breadcrumb.Item>Hostel Management</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Rooms" bordered={false}>{totalRooms}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Occupied" bordered={false}>{totalOccupied}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Available" bordered={false}>{totalAvailable}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Hostel Rooms</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Add Room
          </Button>
        </div>

        <Table columns={columns} dataSource={rooms} pagination={{ pageSize: 5 }} rowKey="key" />

        {/* Add/Edit Room Modal */}
        <Modal
          title={editingRoom ? "Edit Room" : "Add Room"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingRoom(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveRoom}>
            <Form.Item label="Room Number" name="roomNumber" rules={[{ required: true, message: "Enter room number" }]}>
              <Input placeholder="Enter room number" />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Enter capacity" }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="Enter room capacity" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingRoom ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Assign Student Modal */}
        <Modal
          title={`Assign Student to Room ${selectedRoom?.roomNumber}`}
          visible={assignModalVisible}
          onCancel={() => { setAssignModalVisible(false); assignForm.resetFields(); setSelectedRoom(null); }}
          footer={null}
        >
          <Form form={assignForm} layout="vertical" onFinish={handleAssignStudent}>
            <Form.Item label="Student Name" name="studentName" rules={[{ required: true, message: "Enter student name" }]}>
              <Input placeholder="Enter student name" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setAssignModalVisible(false); assignForm.resetFields(); setSelectedRoom(null); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">Assign</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default HostelManagement;
