import React, { useMemo, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Form,
  Select,
  Input,
  TimePicker,
  Button,
  Modal,
  Space,
  message,
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Empty,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;
const { Text, Title } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const classes = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D"];

const initialTimetable = [
  {
    key: 1,
    className: "8",
    section: "A",
    day: "Monday",
    subject: "Mathematics",
    startTime: "09:00",
    endTime: "09:45",
    teacherName: "Riya Sharma",
    room: "Room 204",
  },
  {
    key: 2,
    className: "8",
    section: "A",
    day: "Monday",
    subject: "Science",
    startTime: "10:00",
    endTime: "10:45",
    teacherName: "Arun Mehta",
    room: "Lab 2",
  },
  {
    key: 3,
    className: "8",
    section: "A",
    day: "Tuesday",
    subject: "English",
    startTime: "09:00",
    endTime: "09:45",
    teacherName: "Priya Singh",
    room: "Room 204",
  },
];

const ClassTimetable = () => {
  const [form] = Form.useForm();
  const [timetable, setTimetable] = useState(initialTimetable);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeDay, setActiveDay] = useState("Monday");
  const [filters, setFilters] = useState({ className: "All", section: "All" });

  const filteredData = useMemo(() => {
    return timetable
      .filter((item) => item.day === activeDay)
      .filter((item) => (filters.className === "All" ? true : item.className === filters.className))
      .filter((item) => (filters.section === "All" ? true : item.section === filters.section))
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [activeDay, filters.className, filters.section, timetable]);

  const stats = useMemo(() => {
    const uniqueTeachers = new Set(timetable.map((entry) => entry.teacherName).filter(Boolean));
    const uniqueSubjects = new Set(timetable.map((entry) => entry.subject).filter(Boolean));

    return {
      totalSlots: timetable.length,
      totalTeachers: uniqueTeachers.size,
      totalSubjects: uniqueSubjects.size,
    };
  }, [timetable]);

  const resetModalState = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const hasConflict = (values) => {
    const start = values.startTime.format("HH:mm");
    const end = values.endTime.format("HH:mm");

    return timetable.some((item) => {
      if (editingRecord && item.key === editingRecord.key) return false;
      const sameScope =
        item.day === values.day &&
        item.className === values.className &&
        item.section === values.section;

      if (!sameScope) return false;

      const isOverlapping = !(end <= item.startTime || start >= item.endTime);
      return isOverlapping;
    });
  };

  const handleSave = (values) => {
    if (values.endTime.isSameOrBefore(values.startTime)) {
      message.error("End time should be greater than start time.");
      return;
    }

    if (hasConflict(values)) {
      message.error("This time slot overlaps with an existing class for selected class/section/day.");
      return;
    }

    const newEntry = {
      key: editingRecord ? editingRecord.key : Date.now(),
      className: values.className,
      section: values.section,
      day: values.day,
      subject: values.subject,
      teacherName: values.teacherName,
      room: values.room,
      startTime: values.startTime.format("HH:mm"),
      endTime: values.endTime.format("HH:mm"),
    };

    if (editingRecord) {
      setTimetable((prev) => prev.map((item) => (item.key === editingRecord.key ? newEntry : item)));
      message.success("Class schedule updated successfully.");
    } else {
      setTimetable((prev) => [...prev, newEntry]);
      message.success("Class schedule created successfully.");
    }

    setActiveDay(values.day);
    resetModalState();
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      startTime: dayjs(record.startTime, "HH:mm"),
      endTime: dayjs(record.endTime, "HH:mm"),
    });
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    setTimetable((prev) => prev.filter((item) => item.key !== record.key));
    message.success("Class schedule removed.");
  };

  const columns = [
    { title: "Time", key: "time", render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { title: "Class", dataIndex: "className", key: "className", render: (value) => `Class ${value}` },
    { title: "Section", dataIndex: "section", key: "section" },
    { title: "Subject", dataIndex: "subject", key: "subject", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Teacher", dataIndex: "teacherName", key: "teacherName" },
    { title: "Room", dataIndex: "room", key: "room", render: (value) => value || "-" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "transparent" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Academics</Breadcrumb.Item>
        <Breadcrumb.Item>Class Timetable</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <CalendarOutlined style={{ color: "#1677ff" }} />
                <div>
                  <Text type="secondary">Total Slots</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.totalSlots}</Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <TeamOutlined style={{ color: "#52c41a" }} />
                <div>
                  <Text type="secondary">Teachers Assigned</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.totalTeachers}</Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <BookOutlined style={{ color: "#722ed1" }} />
                <div>
                  <Text type="secondary">Subjects Planned</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.totalSubjects}</Title>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>Class Timetable Planner</Title>
              <Text type="secondary">School admin can create, edit and optimize weekly schedules class-wise.</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Add Class Schedule
            </Button>
          </div>

          <Space wrap style={{ marginBottom: 16 }}>
            <Segmented options={dayOrder} value={activeDay} onChange={setActiveDay} />
            <Select value={filters.className} style={{ width: 140 }} onChange={(value) => setFilters((prev) => ({ ...prev, className: value }))}>
              <Option value="All">All Classes</Option>
              {classes.map((item) => (
                <Option key={item} value={item}>Class {item}</Option>
              ))}
            </Select>
            <Select value={filters.section} style={{ width: 140 }} onChange={(value) => setFilters((prev) => ({ ...prev, section: value }))}>
              <Option value="All">All Sections</Option>
              {sections.map((item) => (
                <Option key={item} value={item}>{item}</Option>
              ))}
            </Select>
          </Space>

          {filteredData.length ? (
            <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 6 }} rowKey="key" />
          ) : (
            <Empty description="No classes scheduled for selected filters" />
          )}
        </Card>

        <Modal
          title={editingRecord ? "Edit Class Schedule" : "Add Class Schedule"}
          open={modalVisible}
          onCancel={resetModalState}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Class" name="className" rules={[{ required: true, message: "Select class" }]}>
                  <Select placeholder="Select class">
                    {classes.map((item) => (
                      <Option key={item} value={item}>Class {item}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Section" name="section" rules={[{ required: true, message: "Select section" }]}>
                  <Select placeholder="Section">
                    {sections.map((item) => (
                      <Option key={item} value={item}>{item}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Day" name="day" rules={[{ required: true, message: "Select day" }]}>
              <Select placeholder="Select day">
                {dayOrder.map((day) => (
                  <Option key={day} value={day}>{day}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Subject" name="subject" rules={[{ required: true, message: "Enter subject" }]}>
              <Input placeholder="e.g. Mathematics" />
            </Form.Item>

            <Form.Item label="Teacher" name="teacherName" rules={[{ required: true, message: "Enter teacher name" }]}>
              <Input placeholder="e.g. Riya Sharma" />
            </Form.Item>

            <Form.Item label="Room" name="room">
              <Input placeholder="e.g. Room 204" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Start Time" name="startTime" rules={[{ required: true, message: "Select start time" }]}>
                  <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={5} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="End Time" name="endTime" rules={[{ required: true, message: "Select end time" }]}>
                  <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={5} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Button style={{ marginRight: 8 }} onClick={resetModalState}>Cancel</Button>
              <Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Save"}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ClassTimetable;
