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
} from "antd";
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

const examTypeColor = {
  objective: "blue",
  subjective: "purple",
  mixed: "cyan",
};

const ExamSchedule = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form] = Form.useForm();

  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});



  const academicYearId = selectedAcademicYear?._id  || null;
  const schoolId = user?.school?._id  || null;
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
        message.error("School/Academic year context missing.");
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

      if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
        message.error("End time must be after start time");
        return;
      }

      const payload = {
        academicYearId,
        schoolId,
        userId,
        title: values.title,
        schoolClassId:
          values.schoolClassId || editingExam?.schoolClassId?._id || editingExam?.schoolClassId,
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
    } catch (error) {
      message.error(error || "Failed to delete exam");
    }
  };

  const dateCellRender = (value) => {
    const dayExams = exams.filter((exam) => dayjs(exam.examDate).isSame(value, "day"));

    if (!dayExams.length) return null;

    return (
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {dayExams.map((exam) => (
          <Card key={exam._id} size="small" style={{ cursor: "pointer" }} onClick={() => openEditModal(exam)}>
            <Space direction="vertical" size={2}>
              <Text strong>{exam.title}</Text>
              <Text type="secondary">{exam.subjectId?.name || "-"}</Text>
              <Tag color={examTypeColor[exam.examType] || "geekblue"}>{exam.examType?.toUpperCase()}</Tag>
              <Text type="secondary">
                {exam.startTime ? dayjs(exam.startTime).format("hh:mm A") : "-"} -{" "}
                {exam.endTime ? dayjs(exam.endTime).format("hh:mm A") : "-"}
              </Text>

              <Space>
                <Button
                  size="small"
                  type="link"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/dashboard/schooladmin/exams/edit/${exam._id}`);
                  }}
                >
                  Full Edit
                </Button>

                <Popconfirm
                  title="Delete this exam?"
                  onConfirm={(event) => {
                    event?.stopPropagation();
                    handleDelete(exam._id);
                  }}
                >
                  <Button size="small" danger type="link" onClick={(event) => event.stopPropagation()}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>📅 Exam Schedule</Title>
          <Text type="secondary">Exam calendar connected with Redux + API</Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate("/dashboard/schooladmin/exams/exams-create")}>Open Full Create Form</Button>
            <Button
              type="primary"
              onClick={() => {
                setEditingExam(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              + Quick Add
            </Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Spin spinning={loading}>
          {exams.length ? (
            <Calendar dateCellRender={dateCellRender} />
          ) : (
            <Empty description="No exams found for selected academic year" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingExam ? "Edit Exam" : "Add Exam"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="Save"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Enter exam title" }]}>
            <Input placeholder="Enter exam title" />
          </Form.Item>

          <Form.Item label="Subject" name="subjectId" rules={[{ required: true, message: "Select subject" }]}>
            <Select placeholder="Select subject">
              {subjectOptions.map((subject) => (
                <Option key={subject._id} value={subject._id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Class" name="schoolClassId" rules={[{ required: true, message: "Select class" }]}>
            <Select placeholder="Select class">
              {schoolClasses.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Exam Type" name="examType" rules={[{ required: true, message: "Select exam type" }]}>
            <Select placeholder="Select exam type">
              <Option value="objective">Objective</Option>
              <Option value="subjective">Subjective</Option>
              <Option value="mixed">Mixed</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Exam Date" name="examDate" rules={[{ required: true, message: "Select exam date" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Start Time" name="startTime" rules={[{ required: true, message: "Select start time" }]}>
                <DatePicker picker="time" style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="End Time" name="endTime" rules={[{ required: true, message: "Select end time" }]}>
                <DatePicker picker="time" style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Total Marks" name="totalMarks" rules={[{ required: true, message: "Enter total marks" }]}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Passing Marks" name="passingMarks" rules={[{ required: true, message: "Enter passing marks" }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExamSchedule;