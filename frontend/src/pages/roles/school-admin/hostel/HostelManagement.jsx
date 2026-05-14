import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from "@ant-design/icons";
import {
  assignHostelStudent,
  createHostelRoom,
  deleteHostelRoom,
  fetchHostelRooms,
  updateHostelRoom,
} from "../../../../features/hostelSlice";

const { Content } = Layout;
const { Title, Text } = Typography;

const HostelManagement = () => {
  const dispatch = useDispatch();
  const { rooms, loading, actionLoading } = useSelector((state) => state.hostel);

  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchHostelRooms());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((acc, room) => acc + Number(room.capacity || 0), 0);
    const totalOccupied = rooms.reduce((acc, room) => acc + (room.students?.length || 0), 0);
    const totalAvailable = Math.max(totalCapacity - totalOccupied, 0);

    return { totalRooms, totalOccupied, totalAvailable };
  }, [rooms]);

  const closeRoomModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    form.resetFields();
  };

  const handleSaveRoom = async (values) => {
    try {
      if (editingRoom?._id) {
        await dispatch(updateHostelRoom({ id: editingRoom._id, payload: values })).unwrap();
        message.success("Room updated successfully");
      } else {
        await dispatch(createHostelRoom(values)).unwrap();
        message.success("Room added successfully");
      }
      closeRoomModal();
    } catch (error) {
      message.error(error || "Unable to save room");
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    form.setFieldsValue({ roomNumber: room.roomNumber, capacity: room.capacity });
    setModalOpen(true);
  };

  const handleDeleteRoom = (room) => {
    Modal.confirm({
      title: `Delete room ${room.roomNumber}?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteHostelRoom(room._id)).unwrap();
          message.success("Room deleted successfully");
        } catch (error) {
          message.error(error || "Unable to delete room");
        }
      },
    });
  };

  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleAssignStudent = async (values) => {
    if (!selectedRoom?._id) return;

    try {
      await dispatch(assignHostelStudent({ id: selectedRoom._id, studentName: values.studentName })).unwrap();
      message.success(`${values.studentName} assigned to Room ${selectedRoom.roomNumber}`);
      setAssignModalOpen(false);
      setSelectedRoom(null);
      assignForm.resetFields();
    } catch (error) {
      message.error(error || "Unable to assign student");
    }
  };

  const columns = [
    { title: "Room Number", dataIndex: "roomNumber", key: "roomNumber" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    {
      title: "Occupied",
      key: "occupied",
      render: (_, record) => {
        const occupied = record.students?.length || 0;
        return <Tag color={occupied === Number(record.capacity) ? "red" : "green"}>{occupied}/{record.capacity}</Tag>;
      },
    },
    {
      title: "Students",
      key: "students",
      render: (_, record) => (record.students?.length ? record.students.map((student) => student.name).join(", ") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small" wrap>
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
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Hostel</Breadcrumb.Item>
        <Breadcrumb.Item>Hostel Management</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Title level={4} style={{ marginBottom: 4 }}>Hostel Room Management</Title>
        <Text type="secondary">Add rooms, monitor occupancy, and assign students quickly.</Text>

        <Row gutter={16} style={{ marginTop: 20, marginBottom: 20 }}>
          <Col xs={24} sm={8}><Card title="Total Rooms">{stats.totalRooms}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Occupied">{stats.totalOccupied}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Available">{stats.totalAvailable}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={5} style={{ margin: 0 }}>Hostel Rooms</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Room
          </Button>
        </div>

        <Table columns={columns} dataSource={rooms} loading={loading} pagination={{ pageSize: 8 }} rowKey="_id" />

        <Modal title={editingRoom ? "Edit Room" : "Add Room"} open={modalOpen} onCancel={closeRoomModal} footer={null} destroyOnClose>
          <Form form={form} layout="vertical" onFinish={handleSaveRoom}>
            <Form.Item label="Room Number" name="roomNumber" rules={[{ required: true, message: "Enter room number" }]}>
              <Input placeholder="e.g., H-101" />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Enter room capacity" }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button onClick={closeRoomModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  {editingRoom ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`Assign Student${selectedRoom ? ` • Room ${selectedRoom.roomNumber}` : ""}`}
          open={assignModalOpen}
          onCancel={() => {
            setAssignModalOpen(false);
            setSelectedRoom(null);
            assignForm.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form form={assignForm} layout="vertical" onFinish={handleAssignStudent}>
            <Form.Item label="Student Name" name="studentName" rules={[{ required: true, message: "Enter student name" }]}>
              <Input placeholder="Enter student full name" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>Assign</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default HostelManagement;