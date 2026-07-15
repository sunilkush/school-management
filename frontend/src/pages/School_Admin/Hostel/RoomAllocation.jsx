import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell,
  tableContainer, tableHeadCss, modalTitle,
} from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

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
        <Space wrap>
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
    <div>
      <PageHeader
        title="Room Allocation"
        subtitle="Assign and manage hostel room occupancy"
        icon={<HomeOutlined />}
      />
      <div style={pageWrapper}>

        <div style={statGrid(160)}>
          <StatCard icon={<HomeOutlined />} label="Total Rooms" value={totalRooms} color="#2563EB" />
          <StatCard icon={<UserAddOutlined />} label="Total Occupied" value={totalOccupied} color="#F59E0B" />
          <StatCard icon={<UserDeleteOutlined />} label="Total Available" value={totalAvailable} color="#22C55E" />
        </div>

        <style>{tableHeadCss("room-allocation-tbl")}</style>
        <div style={{ ...sectionPanel, padding: 0 }}>
          <div className="room-allocation-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
            <Table columns={columns} dataSource={rooms} pagination={{ pageSize: 5 }} rowKey="key" />
          </div>
        </div>

        {/* Assign Student Modal */}
        <Modal
          title={modalTitle(<UserAddOutlined />, `Assign Student to Room ${selectedRoom?.roomNumber || ""}`)}
          open={assignModalVisible}
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
          title={modalTitle(<UserDeleteOutlined />, `Unassign Student ${selectedStudent || ""} from Room ${selectedRoom?.roomNumber || ""}`)}
          open={unassignModalVisible}
          onCancel={() => { setUnassignModalVisible(false); setSelectedRoom(null); setSelectedStudent(null); }}
          okText="Unassign"
          okButtonProps={{ danger: true }}
          onOk={handleUnassignStudent}
        >
          <p>Are you sure you want to unassign {selectedStudent} from Room {selectedRoom?.roomNumber}?</p>
        </Modal>
      </div>
    </div>
  );
};

export default RoomAllocation;
