import React, { useEffect, useMemo, useState } from "react";
import {
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
  Popconfirm,
  Grid,
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
import { useDispatch, useSelector } from "react-redux";

import {
  createTimetableEntry,
  deleteTimetableEntry,
  fetchClassTimetable,
  fetchTimetableMasterData,
  updateTimetableEntry,
} from "../../../features/timetableSlice";

import { fetchAllUser } from "../../../features/authSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell,
  tableContainer, tableHeadCss, modalTitle,
} from "../../../styles/pageStyles";

const { Option } = Select;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || "";
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const ClassTimetable = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { user, users = [] } = useSelector((state) => state.auth || {});
 const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
   const academicYearId = selectedAcademicYear?._id;
  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;

  const {
    classTimetable: timetable = [],
    schoolClasses = [],
    sections = [],
    subjects = [],
    teachers = [],
    activeAcademicYearId,
    loading,
    saving,
  } = useSelector((state) => state.timetable || {});

  const [form] = Form.useForm();
  const selectedFormClassId = Form.useWatch("schoolClassId", form);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeDay, setActiveDay] = useState("Monday");
  const [filters, setFilters] = useState({
    schoolClassId: "All",
    sectionId: "All",
  });

  const roleName = "Teacher";

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ schoolId, roleName }))
      .unwrap?.()
      .catch?.((err) => message.error(err || "Failed to load users"));
  }, [schoolId, dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchTimetableMasterData({ schoolId,academicYearId }))
      .unwrap()
      .catch((err) => message.error(err || "Failed to load timetable data"));
  }, [dispatch, schoolId,academicYearId]);

  useEffect(() => {
    if (!activeAcademicYearId) return;
    dispatch(fetchClassTimetable({ academicYearId: activeAcademicYearId }))
      .unwrap()
      .catch((err) => message.error(err || "Failed to fetch timetable"));
  }, [activeAcademicYearId, dispatch]);

  const filteredSections = useMemo(() => {
    if (filters.schoolClassId === "All") return sections;

    return sections.filter((section) => {
      const sectionClassId =
        section?.schoolClassId?._id ||
        section?.schoolClassId ||
        section?.class?._id ||
        section?.classId;

      return String(sectionClassId) === String(filters.schoolClassId);
    });
  }, [sections, filters.schoolClassId]);

  const filteredData = useMemo(() => {
    return timetable
      .filter((item) => item.day === activeDay)
      .filter((item) =>
        filters.schoolClassId === "All"
          ? true
          : getId(item.schoolClassId) === filters.schoolClassId
      )
      .filter((item) =>
        filters.sectionId === "All" ? true : getId(item.sectionId) === filters.sectionId
      )
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [activeDay, filters, timetable]);

  const stats = useMemo(() => {
    const uniqueTeachers = new Set(timetable.map((entry) => getId(entry.teacherId)).filter(Boolean));
    const uniqueSubjects = new Set(timetable.map((entry) => getId(entry.subjectId)).filter(Boolean));

    return {
      totalSlots: timetable.length,
      totalTeachers: uniqueTeachers.size,
      totalSubjects: uniqueSubjects.size,
    };
  }, [timetable]);

  const formSections = useMemo(() => {
    if (!selectedFormClassId) return [];

    return sections.filter((section) => {
      const sectionClassId =
        section?.schoolClassId?._id ||
        section?.schoolClassId ||
        section?.class?._id ||
        section?.classId;

      return String(sectionClassId) === String(selectedFormClassId);
    });
  }, [sections, selectedFormClassId]);

  const teacherOptions = useMemo(() => {
    const timetableTeachers = teachers.map((item) => item?.userId || item).filter((item) => item?._id);

    const userTeachers = users.filter((item) => {
      const role =
        item?.role?.name || item?.roleId?.name || item?.role || item?.roleName || "";
      return String(role).toLowerCase().includes("teacher");
    });

    const map = new Map();
    [...timetableTeachers, ...userTeachers].forEach((item) => {
      if (item?._id && !map.has(item._id)) map.set(item._id, item);
    });

    return Array.from(map.values());
  }, [teachers, users]);

  const resetModalState = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async (values) => {
    if (!activeAcademicYearId) {
      message.error("Active academic year not found.");
      return;
    }

    if (!values?.startTime || !values?.endTime || !values.endTime.isAfter(values.startTime)) {
      message.error("End time should be greater than start time.");
      return;
    }

    const payload = {
      academicYearId: activeAcademicYearId,
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
      if (editingRecord?._id) {
        await dispatch(updateTimetableEntry({ id: editingRecord._id, payload })).unwrap();
        message.success("Class schedule updated successfully.");
      } else {
        await dispatch(createTimetableEntry(payload)).unwrap();
        message.success("Class schedule created successfully.");
      }

      setActiveDay(values.day);
      resetModalState();

      await dispatch(fetchClassTimetable({ academicYearId: activeAcademicYearId })).unwrap();
    } catch (error) {
      message.error(error || "Failed to save timetable entry");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);

    form.setFieldsValue({
      schoolClassId: getId(record.schoolClassId),
      sectionId: getId(record.sectionId),
      day: record.day,
      subjectId: getId(record.subjectId),
      teacherId: getId(record.teacherId),
      room: record.room || "",
      startTime: record.startTime ? dayjs(record.startTime, "HH:mm") : null,
      endTime: record.endTime ? dayjs(record.endTime, "HH:mm") : null,
    });

    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      await dispatch(deleteTimetableEntry(record._id)).unwrap();
      message.success("Class schedule removed.");

      if (activeAcademicYearId) {
        await dispatch(fetchClassTimetable({ academicYearId: activeAcademicYearId })).unwrap();
      }
    } catch (error) {
      message.error(error || "Failed to delete timetable entry");
    }
  };

  const columns = [
    {
      title: "Time",
      key: "time",
      render: (_, row) => `${row.startTime || "-"} - ${row.endTime || "-"}`,
    },
    {
      title: "Class",
      key: "className",
      render: (_, row) => row.schoolClassId?.name || row.schoolClassId?.className || "-",
    },
    {
      title: "Section",
      key: "section",
      render: (_, row) => row.sectionId?.name || "-",
    },
    {
      title: "Subject",
      key: "subject",
      render: (_, row) => <Tag color="blue">{row.subjectId?.name || "-"}</Tag>,
    },
    {
      title: "Teacher",
      key: "teacherName",
      render: (_, row) => row.teacherId?.name || "-",
    },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Delete schedule?"
            description="Are you sure you want to delete this timetable slot?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record)}
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const TimetableMobileCard = ({ item }) => (
    <Card
      size="small"
      style={{
        borderRadius: 14,
        marginBottom: 12,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <Text strong>
              {item.startTime || "-"} - {item.endTime || "-"}
            </Text>
            <br />
            <Text type="secondary">
              {item.schoolClassId?.name || item.schoolClassId?.className || "-"} /{" "}
              {item.sectionId?.name || "-"}
            </Text>
          </div>

          <Tag color="blue">{item.subjectId?.name || "-"}</Tag>
        </div>

        <div>
          <Text type="secondary">Teacher: </Text>
          <Text>{item.teacherId?.name || "-"}</Text>
        </div>

        <div>
          <Text type="secondary">Room: </Text>
          <Text>{item.room || "-"}</Text>
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)}>
            Edit
          </Button>

          <Popconfirm
            title="Delete schedule?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(item)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Class Timetable"
        subtitle="Create and manage class-wise weekly timetable from live data"
        icon={<CalendarOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block={isMobile}
            onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setModalVisible(true);
            }}
            disabled={!activeAcademicYearId}
          >
            Add Class Schedule
          </Button>
        }
      />
      <div style={pageWrapper}>
        <Spin spinning={!!loading}>
          <div style={statGrid(200)}>
            <StatCard icon={<CalendarOutlined />} label="Total Slots" value={stats.totalSlots} color="#2563EB" />
            <StatCard icon={<TeamOutlined />} label="Teachers Assigned" value={stats.totalTeachers} color="#22C55E" />
            <StatCard icon={<BookOutlined />} label="Subjects Planned" value={stats.totalSubjects} color="#722ED1" />
          </div>

          <style>{tableHeadCss("class-timetable-tbl")}</style>

          <div style={sectionPanel}>
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              size={12}
              style={{ width: "100%", marginBottom: 16 }}
            >
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                <Segmented
                  options={dayOrder}
                  value={activeDay}
                  onChange={(value) => setActiveDay(value)}
                />
              </div>

              <Select
                value={filters.schoolClassId}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(value) =>
                  setFilters({
                    schoolClassId: value,
                    sectionId: "All",
                  })
                }
              >
                <Option value="All">All Classes</Option>
                {schoolClasses.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name || item.className || item.boardClassId?.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={filters.sectionId}
                style={{ width: isMobile ? "100%" : 140 }}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    sectionId: value,
                  }))
                }
              >
                <Option value="All">All Sections</Option>
                {filteredSections.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </Space>

            {filteredData.length ? (
              isMobile ? (
                filteredData.map((item) => (
                  <TimetableMobileCard key={item._id} item={item} />
                ))
              ) : (
                <div className="class-timetable-tbl" style={tableContainer}>
                  <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{ pageSize: 6, responsive: true }}
                    rowKey={(record) => record._id}
                    scroll={{ x: 900 }}
                  />
                </div>
              )
            ) : (
              <Empty description="No classes scheduled for selected filters" />
            )}
          </div>

          <Modal
            title={modalTitle(<CalendarOutlined />, editingRecord ? "Edit Class Schedule" : "Add Class Schedule")}
            open={modalVisible}
            onCancel={resetModalState}
            footer={null}
            destroyOnHidden
            width={isMobile ? "96%" : 620}
            style={isMobile ? { top: 12 } : {}}
          >
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Class"
                    name="schoolClassId"
                    rules={[{ required: true, message: "Select class" }]}
                  >
                    <Select
                      placeholder="Select class"
                      onChange={() => form.setFieldsValue({ sectionId: undefined })}
                    >
                      {schoolClasses.map((item) => (
                        <Option key={item._id} value={item._id}>
                          {item.name || item.className || item.boardClassId?.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Section"
                    name="sectionId"
                    rules={[{ required: true, message: "Select section" }]}
                  >
                    <Select
                      placeholder={selectedFormClassId ? "Select section" : "Select class first"}
                      disabled={!selectedFormClassId}
                    >
                      {formSections.map((item) => (
                        <Option key={item._id} value={item._id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Day"
                name="day"
                rules={[{ required: true, message: "Select day" }]}
              >
                <Select placeholder="Select day">
                  {dayOrder.map((day) => (
                    <Option key={day} value={day}>
                      {day}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Subject"
                name="subjectId"
                rules={[{ required: true, message: "Select subject" }]}
              >
                <Select placeholder="Select subject" showSearch optionFilterProp="children">
                  {subjects.map((item) => (
                    <Option key={item._id} value={item._id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Teacher"
                name="teacherId"
                rules={[{ required: true, message: "Select teacher" }]}
              >
                <Select placeholder="Select teacher" showSearch optionFilterProp="children">
                  {teacherOptions.map((item) => (
                    <Option key={item._id} value={item._id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Room" name="room">
                <Input placeholder="e.g. Room 204" />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Start Time"
                    name="startTime"
                    rules={[{ required: true, message: "Select start time" }]}
                  >
                    <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={5} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="End Time"
                    name="endTime"
                    rules={[{ required: true, message: "Select end time" }]}
                  >
                    <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={5} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space
                  direction={isMobile ? "vertical" : "horizontal"}
                  style={{ width: "100%", justifyContent: "flex-end" }}
                >
                  <Button block={isMobile} onClick={resetModalState}>
                    Cancel
                  </Button>

                  <Button block={isMobile} type="primary" htmlType="submit" loading={!!saving}>
                    {editingRecord ? "Update" : "Save"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Spin>
      </div>
    </>
  );
};

export default ClassTimetable;
