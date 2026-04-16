import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Form,
  Select,
  TimePicker,
  Input,
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
  Spin,
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
import apiClient from "../../../api/httpClient";

const { Content } = Layout;
const { Option } = Select;
const { Text, Title } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ClassTimetable = () => {
  const [form] = Form.useForm();
  const [timetable, setTimetable] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeDay, setActiveDay] = useState("Monday");
  const [filters, setFilters] = useState({ schoolClassId: "All", sectionId: "All" });
  const [loading, setLoading] = useState(false);

  const [schoolClasses, setSchoolClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [classRes, sectionRes, subjectRes, employeeRes, academicYearRes] = await Promise.all([
        apiClient.get("/school-class"),
        apiClient.get("/sections"),
        apiClient.get("/subject/all", { params: { limit: 100 } }),
        apiClient.get("/employee", { params: { employeeType: "Teacher", isActive: true } }),
        apiClient.get("/academicYear"),
      ]);

      const activeYear = (academicYearRes.data?.data || []).find((year) => year.isActive) || academicYearRes.data?.data?.[0];
      const activeYearId = activeYear?._id || "";

      setAcademicYearId(activeYearId);
      setSchoolClasses(classRes.data?.data || []);
      setSections(sectionRes.data?.data || []);
      setSubjects(subjectRes.data?.data || []);
      setTeachers(employeeRes.data?.data || []);

      await fetchTimetable(activeYearId);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async (yearId = academicYearId) => {
    try {
      const params = {};
      if (yearId) params.academicYearId = yearId;
      const response = await apiClient.get("/timetables/class", { params });
      setTimetable(response.data?.data || []);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to fetch timetable");
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const filteredData = useMemo(() => {
    return timetable
      .filter((item) => item.day === activeDay)
      .filter((item) => (filters.schoolClassId === "All" ? true : item.schoolClassId?._id === filters.schoolClassId))
      .filter((item) => (filters.sectionId === "All" ? true : item.sectionId?._id === filters.sectionId))
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [activeDay, filters.schoolClassId, filters.sectionId, timetable]);

  const stats = useMemo(() => {
    const uniqueTeachers = new Set(timetable.map((entry) => entry.teacherId?._id).filter(Boolean));
    const uniqueSubjects = new Set(timetable.map((entry) => entry.subjectId?._id).filter(Boolean));

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

  const handleSave = async (values) => {
    if (values.endTime.isSameOrBefore(values.startTime)) {
      message.error("End time should be greater than start time.");
      return;
    }

    const payload = {
      academicYearId,
      schoolClassId: values.schoolClassId,
      sectionId: values.sectionId,
      day: values.day,
      subjectId: values.subjectId,
      teacherId: values.teacherId,
      room: values.room || "",
      startTime: values.startTime.format("HH:mm"),
      endTime: values.endTime.format("HH:mm"),
    };

    try {
      setLoading(true);
      if (editingRecord?._id) {
        await apiClient.put(`/timetables/${editingRecord._id}`, payload);
        message.success("Class schedule updated successfully.");
      } else {
        await apiClient.post("/timetables", payload);
        message.success("Class schedule created successfully.");
      }

      setActiveDay(values.day);
      resetModalState();
      await fetchTimetable();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to save timetable entry");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      schoolClassId: record.schoolClassId?._id,
      sectionId: record.sectionId?._id,
      day: record.day,
      subjectId: record.subjectId?._id,
      teacherId: record.teacherId?._id,
      room: record.room,
      startTime: dayjs(record.startTime, "HH:mm"),
      endTime: dayjs(record.endTime, "HH:mm"),
    });
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      await apiClient.delete(`/timetables/${record._id}`);
      message.success("Class schedule removed.");
      await fetchTimetable();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete timetable entry");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Time", key: "time", render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { title: "Class", key: "className", render: (_, row) => row.schoolClassId?.name || "-" },
    { title: "Section", key: "section", render: (_, row) => row.sectionId?.name || "-" },
    {
      title: "Subject",
      key: "subject",
      render: (_, row) => <Tag color="blue">{row.subjectId?.name || "-"}</Tag>,
    },
    { title: "Teacher", key: "teacherName", render: (_, row) => row.teacherId?.name || "-" },
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
        <Spin spinning={loading}>
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
                <Text type="secondary">Create and manage class-wise weekly timetable from live data.</Text>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                Add Class Schedule
              </Button>
            </div>

            <Space wrap style={{ marginBottom: 16 }}>
              <Segmented options={dayOrder} value={activeDay} onChange={setActiveDay} />
              <Select value={filters.schoolClassId} style={{ width: 180 }} onChange={(value) => setFilters((prev) => ({ ...prev, schoolClassId: value }))}>
                <Option value="All">All Classes</Option>
                {schoolClasses.map((item) => (
                  <Option key={item._id} value={item._id}>{item.name || `Class ${item.className}`}</Option>
                ))}
              </Select>
              <Select value={filters.sectionId} style={{ width: 140 }} onChange={(value) => setFilters((prev) => ({ ...prev, sectionId: value }))}>
                <Option value="All">All Sections</Option>
                {sections.map((item) => (
                  <Option key={item._id} value={item._id}>{item.name}</Option>
                ))}
              </Select>
            </Space>

            {filteredData.length ? (
              <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 6 }} rowKey="_id" />
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
                  <Form.Item label="Class" name="schoolClassId" rules={[{ required: true, message: "Select class" }]}>
                    <Select placeholder="Select class">
                      {schoolClasses.map((item) => (
                        <Option key={item._id} value={item._id}>{item.name || item.className}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Section" name="sectionId" rules={[{ required: true, message: "Select section" }]}>
                    <Select placeholder="Section">
                      {sections.map((item) => (
                        <Option key={item._id} value={item._id}>{item.name}</Option>
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

              <Form.Item label="Subject" name="subjectId" rules={[{ required: true, message: "Select subject" }]}>
                <Select placeholder="Select subject">
                  {subjects.map((item) => (
                    <Option key={item._id} value={item._id}>{item.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Teacher" name="teacherId" rules={[{ required: true, message: "Select teacher" }]}>
                <Select placeholder="Select teacher">
                  {teachers.map((item) => (
                    <Option key={item.userId?._id} value={item.userId?._id}>{item.userId?.name}</Option>
                  ))}
                </Select>
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
        </Spin>
      </Content>
    </Layout>
  );
};

export default ClassTimetable;
