import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Select,
  Progress,
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

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import {
  assignHostelStudent,
  createHostelRoom,
  deleteHostelRoom,
  fetchHostelRooms,
  unassignHostelStudent,
  updateHostelRoom,
} from "../../../features/hostelSlice";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const HostelManagement = () => {
  const dispatch = useDispatch();

  const {
    rooms = [],
    loading,
    actionLoading,
  } = useSelector((state) => state.hostel);

  // ✅ FIXED
  const { schoolStudents = [] } = useSelector(
    (state) => state.students
  );

  const { user } = useSelector((state) => state.auth);

  const { selectedAcademicYear, activeYear } = useSelector(
    (state) => state.academicYear
  );

  const schoolId = user?.school?._id;

  const academicYearId =
    selectedAcademicYear?._id || activeYear?._id;

  // ✅ FIXED ROLE
  const userRole = user?.role?.name;

  const canManageHostel = [
    "Super Admin",
    "School Admin",
    "Admin",
    "Principal",
    "Vice Principal",
    "Hostel Warden",
  ].includes(userRole);

  const [modalOpen, setModalOpen] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);

  const [selectedRoom, setSelectedRoom] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [occupancyFilter, setOccupancyFilter] =
    useState("all");

  const [form] = Form.useForm();

  const [assignForm] = Form.useForm();

  // ✅ FETCH ROOMS
  useEffect(() => {
    dispatch(fetchHostelRooms());
  }, [dispatch]);

  // ✅ FETCH STUDENTS
  useEffect(() => {
    if (!schoolId) return;

    dispatch(
      fetchStudentsBySchoolId({
        schoolId,
        academicYearId,
      })
    );
  }, [dispatch, schoolId, academicYearId]);

  // ✅ STATS
  const stats = useMemo(() => {
    const totalRooms = rooms?.length || 0;

    const totalCapacity = (rooms || []).reduce(
      (acc, room) => acc + Number(room.capacity || 0),
      0
    );

    const totalOccupied = (rooms || []).reduce(
      (acc, room) => acc + (room.students?.length || 0),
      0
    );

    const totalAvailable = Math.max(
      totalCapacity - totalOccupied,
      0
    );

    return {
      totalRooms,
      totalOccupied,
      totalAvailable,
    };
  }, [rooms]);

  // ✅ CLOSE MODAL
  const closeRoomModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    form.resetFields();
  };

  // ✅ SAVE ROOM
  const handleSaveRoom = async (values) => {
    try {
      if (editingRoom?._id) {
        await dispatch(
          updateHostelRoom({
            id: editingRoom._id,
            payload: values,
          })
        ).unwrap();

        message.success("Room updated successfully");
      } else {
        await dispatch(
          createHostelRoom(values)
        ).unwrap();

        message.success("Room added successfully");
      }

      closeRoomModal();
    } catch (error) {
      message.error(error || "Unable to save room");
    }
  };

  // ✅ EDIT ROOM
  const handleEditRoom = (room) => {
    setEditingRoom(room);

    form.setFieldsValue({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
    });

    setModalOpen(true);
  };

  // ✅ DELETE ROOM
  const handleDeleteRoom = (room) => {
    Modal.confirm({
      title: `Delete room ${room.roomNumber}?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: {
        danger: true,
      },

      onOk: async () => {
        try {
          await dispatch(
            deleteHostelRoom(room._id)
          ).unwrap();

          message.success("Room deleted successfully");
        } catch (error) {
          message.error(error || "Unable to delete room");
        }
      },
    });
  };

  // ✅ OPEN ASSIGN MODAL
  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  // ✅ ASSIGN STUDENT
 const handleAssignStudent = async (values) => {
  if (!selectedRoom?._id) return;

  // ✅ find selected student
  const selectedStudent = schoolStudents.find(
    (student) => student._id === values.studentId
  );

  try {
    await dispatch(
      assignHostelStudent({
        id: selectedRoom._id,

        // ✅ send both fields
        studentId: values.studentId,

        studentName:
          selectedStudent?.name ||
          selectedStudent?.fullName ||
          selectedStudent?.user?.name ||
          "Unnamed Student",
      })
    ).unwrap();

    message.success("Student assigned successfully");

    setAssignModalOpen(false);
    setSelectedRoom(null);
    assignForm.resetFields();

    dispatch(fetchHostelRooms());
  } catch (error) {
    message.error(error || "Unable to assign student");
  }
};

  // ✅ UNASSIGN STUDENT
  const handleUnassignStudent = (room, student) => {
    Modal.confirm({
      title: `Unassign ${
        student.name || student.fullName
      } from Room ${room.roomNumber}?`,

      content:
        "Student will be removed from this room allocation.",

      okText: "Unassign",

      okButtonProps: {
        danger: true,
      },

      onOk: async () => {
        try {
          await dispatch(
            unassignHostelStudent({
              roomId: room._id,
              studentId: student._id,
            })
          ).unwrap();

          message.success(
            `${
              student.name || student.fullName
            } unassigned successfully`
          );

          dispatch(fetchHostelRooms());
        } catch (error) {
          message.error(
            error || "Unable to unassign student"
          );
        }
      },
    });
  };

  // ✅ FILTERED ROOMS
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];

    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return rooms.filter((room) => {
      const occupied = room.students?.length || 0;

      const capacity =
        Number(room.capacity) || 0;

      const isFull =
        capacity > 0 && occupied >= capacity;

      const isAvailable = occupied < capacity;

      const roomMatchesSearch =
        !normalizedSearch ||
        String(room.roomNumber || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const studentMatchesSearch =
        !normalizedSearch ||
        (room.students || []).some((student) =>
          String(
            student.name ||
              student.fullName ||
              ""
          )
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesSearch =
        roomMatchesSearch ||
        studentMatchesSearch;

      const matchesOccupancy =
        occupancyFilter === "all" ||
        (occupancyFilter === "full" &&
          isFull) ||
        (occupancyFilter === "available" &&
          isAvailable);

      return (
        matchesSearch && matchesOccupancy
      );
    });
  }, [rooms, searchTerm, occupancyFilter]);

  // ✅ TABLE COLUMNS
  const columns = [
    {
      title: "Room Number",
      dataIndex: "roomNumber",
      key: "roomNumber",
    },

    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
    },

    {
      title: "Occupied",
      key: "occupied",

      render: (_, record) => {
        const occupied =
          record.students?.length || 0;

        const capacity =
          Number(record.capacity) || 0;

        const occupancyPercent = capacity
          ? Math.round(
              (occupied / capacity) * 100
            )
          : 0;

        return (
          <Space
            direction="vertical"
            size={2}
            style={{ width: 130 }}
          >
            <Tag
              color={
                occupied === capacity
                  ? "red"
                  : "green"
              }
            >
              {occupied}/{capacity}
            </Tag>

            <Progress
              percent={occupancyPercent}
              size="small"
              status={
                occupied === capacity
                  ? "exception"
                  : "active"
              }
            />
          </Space>
        );
      },
    },

    {
      title: "Students",
      key: "students",

      render: (_, record) =>
        record.students?.length
          ? record.students
              .map(
                (student) =>
                  student.name ||
                  student.fullName
              )
              .join(", ")
          : "-",
    },

    {
      title: "Actions",
      key: "actions",

      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() =>
              handleOpenAssignModal(record)
            }
            disabled={!canManageHostel}
          >
            Assign Student
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() =>
              handleEditRoom(record)
            }
            disabled={!canManageHostel}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              handleDeleteRoom(record)
            }
            disabled={!canManageHostel}
          >
            Delete
          </Button>
        </Space>
      ),
    },

    {
      title: "Unassign",
      key: "unassign",

      render: (_, record) => (
        <Space size="small" wrap>
          {(record.students || []).map(
            (student) => (
              <Button
                key={student._id}
                danger
                icon={<UserDeleteOutlined />}
                onClick={() =>
                  handleUnassignStudent(
                    record,
                    student
                  )
                }
                disabled={!canManageHostel}
              >
                {student.name ||
                  student.fullName}
              </Button>
            )
          )}

          {!record.students?.length
            ? "-"
            : null}
        </Space>
      ),
    },
  ];

  return (
    <Layout
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <Breadcrumb
        style={{ marginBottom: 16 }}
      >
        <Breadcrumb.Item>
          Dashboard
        </Breadcrumb.Item>

        <Breadcrumb.Item>
          Hostel
        </Breadcrumb.Item>

        <Breadcrumb.Item>
          Hostel Management
        </Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Title
          level={4}
          style={{ marginBottom: 4 }}
        >
          Hostel Room Management
        </Title>

        <Text type="secondary">
          Add rooms, monitor occupancy,
          and assign students quickly.
        </Text>

        {/* STATS */}
        <Row
          gutter={16}
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <Col xs={24} sm={8}>
            <Card title="Total Rooms">
              {stats.totalRooms}
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card title="Total Occupied">
              {stats.totalOccupied}
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card title="Total Available">
              {stats.totalAvailable}
            </Card>
          </Col>
        </Row>

        {/* HEADER */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <Title
            level={5}
            style={{ margin: 0 }}
          >
            Hostel Rooms
          </Title>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                dispatch(fetchHostelRooms())
              }
              loading={loading}
            >
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setModalOpen(true)
              }
              disabled={!canManageHostel}
            >
              Add Room
            </Button>
          </Space>
        </div>

        {/* FILTERS */}
        <Row
          gutter={12}
          style={{ marginBottom: 12 }}
        >
          <Col xs={24} md={14}>
            <Search
              placeholder="Search by room number or student name"
              allowClear
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </Col>

          <Col xs={24} md={10}>
            <Select
              value={occupancyFilter}
              onChange={
                setOccupancyFilter
              }
              options={[
                {
                  label: "All Rooms",
                  value: "all",
                },
                {
                  label:
                    "Available Rooms",
                  value: "available",
                },
                {
                  label: "Full Rooms",
                  value: "full",
                },
              ]}
              style={{
                width: "100%",
              }}
            />
          </Col>
        </Row>

        {/* TABLE */}
        <Table
          columns={columns}
          dataSource={filteredRooms || []}
          loading={loading}
          pagination={{
            pageSize: 8,
          }}
          rowKey="_id"
        />

        {/* ROOM MODAL */}
        <Modal
          title={
            editingRoom
              ? "Edit Room"
              : "Add Room"
          }
          open={modalOpen}
          onCancel={closeRoomModal}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveRoom}
          >
            <Form.Item
              label="Room Number"
              name="roomNumber"
              rules={[
                {
                  required: true,
                  message:
                    "Enter room number",
                },
              ]}
            >
              <Input placeholder="e.g., H-101" />
            </Form.Item>

            <Form.Item
              label="Capacity"
              name="capacity"
              rules={[
                {
                  required: true,
                  message:
                    "Enter room capacity",
                },
              ]}
            >
              <InputNumber
                min={1}
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>

            <Form.Item
              style={{
                textAlign: "right",
                marginBottom: 0,
              }}
            >
              <Space>
                <Button
                  onClick={
                    closeRoomModal
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    actionLoading
                  }
                >
                  {editingRoom
                    ? "Update"
                    : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* ASSIGN STUDENT MODAL */}
        <Modal
          title={`Assign Student${
            selectedRoom
              ? ` • Room ${selectedRoom.roomNumber}`
              : ""
          }`}
          open={assignModalOpen}
          onCancel={() => {
            setAssignModalOpen(false);
            setSelectedRoom(null);
            assignForm.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={assignForm}
            layout="vertical"
            onFinish={
              handleAssignStudent
            }
          >
            <Form.Item
              label="Student"
              name="studentId"
              rules={[
                {
                  required: true,
                  message:
                    "Select student",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Select student"
                optionFilterProp="children"
                filterOption={(
                  input,
                  option
                ) =>
                  (
                    option?.children || ""
                  )
                    .toLowerCase()
                    .includes(
                      input.toLowerCase()
                    )
                }
              >
                {(schoolStudents || []).map(
                  (student) => (
                    <Select.Option
                      key={student._id}
                      value={student._id}
                    >
                      {student?.name ||
                        student?.fullName ||
                        student?.user
                          ?.name ||
                        "Unnamed Student"}
                    </Select.Option>
                  )
                )}
              </Select>
            </Form.Item>

            <Form.Item
              style={{
                textAlign: "right",
                marginBottom: 0,
              }}
            >
              <Space>
                <Button
                  onClick={() =>
                    setAssignModalOpen(
                      false
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={
                    actionLoading
                  }
                >
                  Assign
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default HostelManagement;