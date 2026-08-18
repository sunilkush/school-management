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
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  message,
  Divider,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
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
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  toolbarRow,
  statCard,
  statLabel,
  statValue,
  statGrid,
  avatarStyle,
} from "../../../styles/pageStyles";

const { Text } = Typography;
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
      upcoming: filteredExams.filter((exam) => dayjs(exam.examDate).isAfter(today, "day")).length,
      today: filteredExams.filter((exam) => dayjs(exam.examDate).isSame(today, "day")).length,
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
        schoolClassId: values.schoolClassId || editingExam?.schoolClassId?._id || editingExam?.schoolClassId,
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
    const typeInfo = examTypeMeta[exam.examType] || { color: "geekblue", label: exam.examType || "Exam" };
    const currentStatus = statusMeta[exam.status] || { color: "default", label: exam.status || "Draft" };
    const initials = exam.title?.charAt(0)?.toUpperCase() || "E";

    return (
      <div
        key={exam._id}
        onClick={() => openEditModal(exam)}
        style={{
          cursor: "pointer",
          padding: 10,
          borderRadius: 14,
          border: "1px solid var(--border-muted)",
          background: "var(--surface)",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.04)",
          marginBottom: 8,
        }}
      >
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
            <Space align="center">
              <div style={avatarStyle(exam.title, 34)}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <Text strong ellipsis style={{ display: "block", maxWidth: 150 }}>
                  {exam.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {exam.subjectId?.name || "No Subject"}
                </Text>
              </div>
            </Space>
            <Tag color={typeInfo.color} style={{ borderRadius: 999 }}>{typeInfo.label}</Tag>
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
            <ClockCircleOutlined style={{ color: "var(--text-muted)" }} />
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
    const dayExams = filteredExams.filter((exam) => dayjs(exam.examDate).isSame(value, "day"));
    if (!dayExams.length) return null;
    return (
      <div style={{ maxHeight: 220, overflowY: "auto", paddingRight: 2 }}>
        {dayExams.map((exam) => renderEventCard(exam))}
      </div>
    );
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Exam Schedule"
        subtitle="Plan, manage, and monitor all school exams from one modern calendar view."
        icon={<CalendarOutlined />}
        extra={[
          <Button
            key="full-create"
            icon={<FileTextOutlined />}
            onClick={() => navigate("/dashboard/schooladmin/exams/exams-create")}
          >
            Full Create Form
          </Button>,
          <Button
            key="quick-add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Quick Add
          </Button>,
        ]}
      />

      <div style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <Tag color="blue" style={{ borderRadius: 999 }}>
            Academic Year: {selectedAcademicYear?.name || "Not Selected"}
          </Tag>
          <Tag color="purple" style={{ borderRadius: 999 }}>
            School: {user?.school?.name || "School"}
          </Tag>
        </div>

        <div className="stat-grid" style={statGrid(160)}>
          {[
            { key: "total", title: "Total Exams", value: stats.total, color: "var(--primary)", icon: <AppstoreOutlined /> },
            { key: "upcoming", title: "Upcoming", value: stats.upcoming, color: "var(--primary)", icon: <CalendarOutlined /> },
            { key: "today", title: "Today", value: stats.today, color: "var(--warning)", icon: <ClockCircleOutlined /> },
            { key: "completed", title: "Completed", value: stats.completed, color: "var(--success)", icon: <CheckCircleOutlined /> },
          ].map((item) => (
            <div key={item.key} style={statCard({ color: item.color })}>
              <div>
                <div style={statLabel(item.color)}>{item.title}</div>
                <div style={statValue(item.color)}>{item.value}</div>
              </div>
              <span style={{ fontSize: 28, color: item.color, opacity: 0.6 }}>{item.icon}</span>
            </div>
          ))}
        </div>

        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <div className="page-toolbar" style={toolbarRow}>
            <Select
              value={selectedClassFilter}
              onChange={setSelectedClassFilter}
              style={{ minWidth: 220 }}
              placeholder="Filter by class"
            >
              <Option value="all">All Classes</Option>
              {schoolClasses.map((cls) => (
                <Option key={cls._id} value={cls._id}>{cls.name}</Option>
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
            <Text type="secondary" style={{ marginLeft: "auto" }}>
              Click any exam card to quick edit
            </Text>
          </div>
        </div>

        <div style={pageCard}>
          <Spin spinning={loading}>
            {filteredExams.length ? (
              <Calendar dateCellRender={dateCellRender} />
            ) : (
              <Empty description="No exams found for selected filters / academic year" />
            )}
          </Spin>
        </div>
      </div>

      <Modal
        title={editingExam ? "Update Exam" : "Quick Add Exam"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        okText={editingExam ? "Update Exam" : "Create Exam"}
        width={760}
        destroyOnClose
        centered
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Exam Title"
            name="title"
            rules={[{ required: true, message: "Enter exam title" }]}
          >
            <Input placeholder="e.g. Mid Term Mathematics" />
          </Form.Item>

          <Space wrap style={{ width: "100%" }}>
            <Form.Item
              label="Exam Type"
              name="examType"
              rules={[{ required: true, message: "Select exam type" }]}
              style={{ minWidth: 200 }}
            >
              <Select placeholder="Select exam type">
                <Option value="objective">Objective</Option>
                <Option value="subjective">Subjective</Option>
                <Option value="mixed">Mixed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Class"
              name="schoolClassId"
              rules={[{ required: true, message: "Select class" }]}
              style={{ minWidth: 200 }}
            >
              <Select placeholder="Select class">
                {schoolClasses.map((cls) => (
                  <Option key={cls._id} value={cls._id}>{cls.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Subject"
              name="subjectId"
              rules={[{ required: true, message: "Select subject" }]}
              style={{ minWidth: 200 }}
            >
              <Select placeholder="Select subject" showSearch optionFilterProp="children">
                {subjectOptions.map((subject) => (
                  <Option key={subject._id} value={subject._id}>{subject.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Exam Date"
              name="examDate"
              rules={[{ required: true, message: "Select exam date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: true, message: "Select start time" }]}
            >
              <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ required: true, message: "Select end time" }]}
            >
              <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Total Marks"
              name="totalMarks"
              rules={[{ required: true, message: "Enter total marks" }]}
            >
              <Input type="number" min={1} placeholder="Enter total marks" />
            </Form.Item>

            <Form.Item
              label="Passing Marks"
              name="passingMarks"
              rules={[{ required: true, message: "Enter passing marks" }]}
            >
              <Input type="number" min={0} placeholder="Enter passing marks" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamSchedule;
