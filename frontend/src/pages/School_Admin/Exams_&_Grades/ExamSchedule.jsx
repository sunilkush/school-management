import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Tag,
  Spin,
  Empty,
  message,
  Statistic,
  Divider,
  Avatar,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  createExam,
  deleteExam,
  getExams,
  updateExam,
} from "../../../features/examSlice";
import { getClassData } from "../../../features/schoolClassSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const examTypeMeta = {
  objective: { color: "blue", label: "Objective" },
  subjective: { color: "purple", label: "Subjective" },
  mixed: { color: "cyan", label: "Mixed" },
};

const statusMeta = {
  draft: { color: "default", label: "Draft" },
  scheduled: { color: "processing", label: "Scheduled" },
  completed: { color: "success", label: "Completed" },
  cancelled: { color: "error", label: "Cancelled" },
};

const cardStyles = {
  page: {
    background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)",
    minHeight: "100%",
  },
  softCard: {
    borderRadius: 20,
    border: "1px solid #eef2ff",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  },
  metricCard: {
    borderRadius: 18,
    border: "1px solid #eef2ff",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },
};

const ExamSchedule = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [form] = Form.useForm();

  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});

  const academicYearId = selectedAcademicYear?._id || null;
  const schoolId = user?.school?._id || null;
  const userId = user?._id || null;

  useEffect(() => {
    if (!schoolId) return;
    dispatch(getExams({ schoolId, academicYearId }));
    dispatch(getClassData({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const subjectOptions = useMemo(() => {
    const subjects = [];
    schoolClasses.forEach((schoolClass) => {
      schoolClass?.sections?.forEach((section) => {
        section?.subjects?.forEach((subject) => {
          subjects.push({ _id: subject._id, name: subject.name });
        });
      });
    });

    return Array.from(new Map(subjects.map((item) => [item._id, item])).values());
  }, [schoolClasses]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const classMatch =
        selectedClassFilter === "all"
          ? true
          : (exam.schoolClassId?._id || exam.schoolClassId) === selectedClassFilter;

      const typeMatch =
        selectedTypeFilter === "all" ? true : exam.examType === selectedTypeFilter;

      return classMatch && typeMatch;
    });
  }, [exams, selectedClassFilter, selectedTypeFilter]);

  const stats = useMemo(() => {
    const today = dayjs();
    return {
      total: filteredExams.length,
      upcoming: filteredExams.filter((exam) =>
        dayjs(exam.examDate).isAfter(today, "day")
      ).length,
      today: filteredExams.filter((exam) =>
        dayjs(exam.examDate).isSame(today, "day")
      ).length,
      completed: filteredExams.filter((exam) => exam.status === "completed").length,
    };
  }, [filteredExams]);

  const openCreateModal = () => {
    setEditingExam(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    form.setFieldsValue({
      title: exam.title,
      examType: exam.examType,
      schoolClassId: exam.schoolClassId?._id || exam.schoolClassId,
      subjectId: exam.subjectId?._id || exam.subjectId,
      examDate: exam.examDate ? dayjs(exam.examDate) : null,
      startTime: exam.startTime ? dayjs(exam.startTime) : null,
      endTime: exam.endTime ? dayjs(exam.endTime) : null,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!schoolId || !academicYearId || !userId) {
        message.error("School / Academic year context missing");
        return;
      }

      const startDateTime = dayjs(values.examDate)
        .hour(dayjs(values.startTime).hour())
        .minute(dayjs(values.startTime).minute())
        .second(0);

      const endDateTime = dayjs(values.examDate)
        .hour(dayjs(values.endTime).hour())
        .minute(dayjs(values.endTime).minute())
        .second(0);

      if (!endDateTime.isAfter(startDateTime)) {
        message.error("End time must be after start time");
        return;
      }

      if (Number(values.passingMarks) > Number(values.totalMarks)) {
        message.error("Passing marks cannot be greater than total marks");
        return;
      }

      const payload = {
        academicYearId,
        schoolId,
        userId,
        title: values.title,
        schoolClassId:
          values.schoolClassId ||
          editingExam?.schoolClassId?._id ||
          editingExam?.schoolClassId,
        subjectId: values.subjectId,
        examType: values.examType,
        examDate: values.examDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes: endDateTime.diff(startDateTime, "minute"),
        totalMarks: Number(values.totalMarks),
        passingMarks: Number(values.passingMarks),
        status: editingExam?.status || "draft",
      };

      if (editingExam?._id) {
        await dispatch(updateExam({ Id: editingExam._id, payload })).unwrap();
        message.success("Exam updated successfully");
      } else {
        await dispatch(createExam(payload)).unwrap();
        message.success("Exam created successfully");
      }

      handleCloseModal();
      dispatch(getExams({ schoolId, academicYearId }));
    } catch (error) {
      message.error(error || "Failed to save exam");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteExam(id)).unwrap();
      message.success("Exam deleted successfully");
      dispatch(getExams({ schoolId, academicYearId }));
    } catch (error) {
      message.error(error || "Failed to delete exam");
    }
  };

  const renderEventCard = (exam) => {
    const typeInfo = examTypeMeta[exam.examType] || {
      color: "geekblue",
      label: exam.examType || "Exam",
    };
    const currentStatus = statusMeta[exam.status] || {
      color: "default",
      label: exam.status || "Draft",
    };

    return (
      <div
        key={exam._id}
        onClick={() => openEditModal(exam)}
        style={{
          cursor: "pointer",
          padding: 10,
          borderRadius: 14,
          border: "1px solid #eef2ff",
          background: "#ffffff",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
          marginBottom: 8,
        }}
      >
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
            <Space align="center">
              <Avatar
                size={34}
                style={{
                  background: "#e0ecff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              >
                {exam.title?.charAt(0)?.toUpperCase() || "E"}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Text strong ellipsis style={{ display: "block", maxWidth: 150 }}>
                  {exam.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {exam.subjectId?.name || "No Subject"}
                </Text>
              </div>
            </Space>

            <Tag color={typeInfo.color} style={{ borderRadius: 999 }}>
              {typeInfo.label}
            </Tag>
          </Space>

          <Space size={[6, 6]} wrap>
            <Tag bordered={false} color="default" style={{ borderRadius: 999 }}>
              {exam.schoolClassId?.name || "Class"}
            </Tag>
            <Tag color={currentStatus.color} style={{ borderRadius: 999 }}>
              {currentStatus.label}
            </Tag>
          </Space>

          <Space size={6}>
            <ClockCircleOutlined style={{ color: "#64748b" }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {exam.startTime ? dayjs(exam.startTime).format("hh:mm A") : "-"} -{" "}
              {exam.endTime ? dayjs(exam.endTime).format("hh:mm A") : "-"}
            </Text>
          </Space>

          <Space size={6} wrap>
            <Tag color="blue">Total: {exam.totalMarks}</Tag>
            <Tag color="green">Pass: {exam.passingMarks}</Tag>
          </Space>

          <Divider style={{ margin: "4px 0 0" }} />

          <Space size={4} wrap>
            <Tooltip title="Full Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/dashboard/schooladmin/exams/edit/${exam._id}`);
                }}
              >
                Edit
              </Button>
            </Tooltip>

            <Popconfirm
              title="Delete this exam?"
              okText="Delete"
              cancelText="Cancel"
              onConfirm={(event) => {
                event?.stopPropagation();
                handleDelete(exam._id);
              }}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(event) => event.stopPropagation()}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </Space>
      </div>
    );
  };

  const dateCellRender = (value) => {
    const dayExams = filteredExams.filter((exam) =>
      dayjs(exam.examDate).isSame(value, "day")
    );

    if (!dayExams.length) return null;

    return (
      <div style={{ maxHeight: 220, overflowY: "auto", paddingRight: 2 }}>
        {dayExams.map((exam) => renderEventCard(exam))}
      </div>
    );
  };

  return (
    <div style={cardStyles.page}>
      <Card
        bordered={false}
        style={{
          ...cardStyles.softCard,
          background:
            "linear-gradient(135deg, #ffffff 0%, #f8fbff 42%, #eef4ff 100%)",
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={15}>
            <Space align="start" size={14}>
              <Avatar
                size={56}
                icon={<CalendarOutlined />}
                style={{
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                }}
              />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Exam Schedule
                </Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  Plan, manage, and monitor all school exams from one modern calendar view
                </Text>
                <div style={{ marginTop: 10 }}>
                  <Tag color="blue" style={{ borderRadius: 999 }}>
                    Academic Year: {selectedAcademicYear?.name || "Not Selected"}
                  </Tag>
                  <Tag color="purple" style={{ borderRadius: 999 }}>
                    School: {user?.school?.name || "School"}
                  </Tag>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={9}>
            <Row justify="end" gutter={[10, 10]}>
              <Col>
                <Button
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate("/dashboard/schooladmin/exams/exams-create")}
                >
                  Full Create Form
                </Button>
              </Col>
              <Col>
                <Button
                  size="large"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateModal}
                  style={{ borderRadius: 12 }}
                >
                  Quick Add
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyles.metricCard} bordered={false}>
            <Statistic
              title="Total Exams"
              value={stats.total}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyles.metricCard} bordered={false}>
            <Statistic
              title="Upcoming"
              value={stats.upcoming}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyles.metricCard} bordered={false}>
            <Statistic
              title="Today"
              value={stats.today}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyles.metricCard} bordered={false}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ ...cardStyles.softCard, marginTop: 16 }}
        bodyStyle={{ paddingBottom: 10 }}
      >
        <Row gutter={[14, 14]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Space wrap size={10}>
              <Select
                value={selectedClassFilter}
                onChange={setSelectedClassFilter}
                style={{ minWidth: 220 }}
                placeholder="Filter by class"
              >
                <Option value="all">All Classes</Option>
                {schoolClasses.map((cls) => (
                  <Option key={cls._id} value={cls._id}>
                    {cls.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                style={{ minWidth: 180 }}
                placeholder="Filter by exam type"
              >
                <Option value="all">All Types</Option>
                <Option value="objective">Objective</Option>
                <Option value="subjective">Subjective</Option>
                <Option value="mixed">Mixed</Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Row justify="end">
              <Text type="secondary">
                View exams by date, click any exam card to quick edit
              </Text>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        bordered={false}
        style={{ ...cardStyles.softCard, marginTop: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Spin spinning={loading}>
          {filteredExams.length ? (
            <Calendar dateCellRender={dateCellRender} />
          ) : (
            <Empty description="No exams found for selected filters / academic year" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingExam ? "Update Exam" : "Quick Add Exam"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        okText={editingExam ? "Update Exam" : "Create Exam"}
        width={760}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Exam Title"
                name="title"
                rules={[{ required: true, message: "Enter exam title" }]}
              >
                <Input placeholder="e.g. Mid Term Mathematics" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Exam Type"
                name="examType"
                rules={[{ required: true, message: "Select exam type" }]}
              >
                <Select placeholder="Select exam type">
                  <Option value="objective">Objective</Option>
                  <Option value="subjective">Subjective</Option>
                  <Option value="mixed">Mixed</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Class"
                name="schoolClassId"
                rules={[{ required: true, message: "Select class" }]}
              >
                <Select placeholder="Select class">
                  {schoolClasses.map((cls) => (
                    <Option key={cls._id} value={cls._id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Subject"
                name="subjectId"
                rules={[{ required: true, message: "Select subject" }]}
              >
                <Select placeholder="Select subject" showSearch optionFilterProp="children">
                  {subjectOptions.map((subject) => (
                    <Option key={subject._id} value={subject._id}>
                      {subject.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Exam Date"
                name="examDate"
                rules={[{ required: true, message: "Select exam date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Start Time"
                name="startTime"
                rules={[{ required: true, message: "Select start time" }]}
              >
                <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="End Time"
                name="endTime"
                rules={[{ required: true, message: "Select end time" }]}
              >
                <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Total Marks"
                name="totalMarks"
                rules={[{ required: true, message: "Enter total marks" }]}
              >
                <Input type="number" min={1} placeholder="Enter total marks" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Passing Marks"
                name="passingMarks"
                rules={[{ required: true, message: "Enter passing marks" }]}
              >
                <Input type="number" min={0} placeholder="Enter passing marks" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamSchedule;