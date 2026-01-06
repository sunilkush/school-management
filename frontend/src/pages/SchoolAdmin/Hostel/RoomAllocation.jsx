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
  Select,
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
  UserDeleteOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const RoomAllocation = () => {
  const [rooms, setRooms] = useState([
    { key: 1, roomNumber: "101", capacity: 2, students: ["John Doe"] },
    { key: 2, roomNumber: "102", capacity: 3, students: [] },
    { key: 3, roomNumber: "103", capacity: 2, students: ["Jane Smith", "Michael Brown"] },
  ]);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [unassignModalVisible, setUnassignModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [assignForm] = Form.useForm();

  // Assign student
  const handleAssignStudent = (values) => {
    const room = rooms.find((r) => r.key === selectedRoom.key);
    if (room.students.length >= room.capacity) {
      message.error("Room is full!");
      return;
    }
    room.students.push(values.studentName);
    setRooms([...rooms]);
    message.success(`${values.studentName} assigned to Room ${room.roomNumber}`);
    setAssignModalVisible(false);
    assignForm.resetFields();
    setSelectedRoom(null);
  };

  // Unassign student
  const handleUnassignStudent = () => {
    const room = rooms.find((r) => r.key === selectedRoom.key);
    room.students = room.students.filter((s) => s !== selectedStudent);
    setRooms([...rooms]);
    message.success(`${selectedStudent} unassigned from Room ${room.roomNumber}`);
    setUnassignModalVisible(false);
    setSelectedRoom(null);
    setSelectedStudent(null);
  };

  // Summary cards
  const totalRooms = rooms.length;
  const totalOccupied = rooms.reduce((acc, r) => acc + r.students.length, 0);
  const totalAvailable = rooms.reduce((acc, r) => acc + (r.capacity - r.students.length), 0);

  const columns = [
    { title: "Room Number", dataIndex: "roomNumber", key: "roomNumber" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    {
      title: "Occupied",
      key: "occupied",
      render: (_, record) => (
        <Tag color={record.students.length === record.capacity ? "red" : "green"}>
          {record.students.length}/{record.capacity}
        </Tag>
      ),
    },
    {
      title: "Students",
      dataIndex: "students",
      key: "students",
      render: (students) => students.join(", ") || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<UserAddOutlined />} onClick={() => { setSelectedRoom(record); setAssignModalVisible(true); }}>
            Assign Student
          </Button>
          {record.students.map((student) => (
            <Button
              key={student}
              icon={<UserDeleteOutlined />}
              danger
              onClick={() => { setSelectedRoom(record); setSelectedStudent(student); setUnassignModalVisible(true); }}
            >
              {student}
            </Button>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Hostel</Breadcrumb.Item>
        <Breadcrumb.Item>Room Allocation</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Rooms">{totalRooms}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Occupied">{totalOccupied}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Available">{totalAvailable}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <h2>Room Allocation</h2>
        </div>

        <Table columns={columns} dataSource={rooms} pagination={{ pageSize: 5 }} rowKey="key" />

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

        {/* Unassign Student Modal */}
        <Modal
          title={`Unassign Student ${selectedStudent} from Room ${selectedRoom?.roomNumber}`}
          visible={unassignModalVisible}
          onCancel={() => { setUnassignModalVisible(false); setSelectedRoom(null); setSelectedStudent(null); }}
          okText="Unassign"
          onOk={handleUnassignStudent}
        >
          <p>Are you sure you want to unassign {selectedStudent} from Room {selectedRoom?.roomNumber}?</p>
        </Modal>
      </Content>
    </Layout>
  );
};

export default RoomAllocation;
