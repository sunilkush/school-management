import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Divider,
  message,
  Typography,
  TimePicker,
  Spin,
} from "antd";

import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../../features/classSlice.js";
import {
  createExam,
  updateExam,
 
} from "../../../features/examSlice.js";

import { useNavigate, useParams } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

const CreateExam = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); // ⭐ EDIT MODE KEY

  const isEditMode = Boolean(id);

  /* ================= LOCAL STATE ================= */
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjectList, setSubjectList] = useState([]);

  /* ================= REDUX ================= */
  const { classList = [], loading } = useSelector(
    (state) => state.class || {}
  );

  /* ================= USER ================= */
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const selectedAcademicYear = JSON.parse(
    localStorage.getItem("selectedAcademicYear") || "{}"
  );

  const academicYearId = selectedAcademicYear?._id;
  const schoolId = selectedAcademicYear?.schoolId;

  /* ================= FETCH CLASSES ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllClasses({ schoolId }));
    }
  }, [schoolId, dispatch]);

  /* ================= EDIT MODE DATA LOAD ================= */
  useEffect(() => {
    if (isEditMode) {
      loadExam();
    }
  }, [id]);

  const loadExam = async () => {
    try {
      const res = await dispatch(updateExam(id)).unwrap();
      const exam = res;

      handleClassChange(exam.classId?._id || exam.classId);

      form.setFieldsValue({
        title: exam.title,
        classId: exam.classId?._id || exam.classId,
        subjectId: exam.subjectId?._id || exam.subjectId,
        examType: exam.examType,
        examDate: dayjs(exam.examDate),
        startTime: dayjs(exam.startTime),
        endTime: dayjs(exam.endTime),
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status,
      });
    } catch (error) {
      message.error("Failed to load exam");
    }
  };

  /* ================= CLASS CHANGE ================= */
  const handleClassChange = (classId) => {
    setSelectedClass(classId);

    const selected = classList.find((c) => c._id === classId);

    const subjects =
      selected?.subjects?.map((s) => ({
        _id: s.subjectId?._id,
        name: s.subjectId?.name,
      })) || [];

    setSubjectList(subjects);

    form.setFieldsValue({ subjectId: undefined });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    try {
      const startDateTime = dayjs(values.examDate)
        .hour(dayjs(values.startTime).hour())
        .minute(dayjs(values.startTime).minute());

      const endDateTime = dayjs(values.examDate)
        .hour(dayjs(values.endTime).hour())
        .minute(dayjs(values.endTime).minute());

      const payload = {
        academicYearId,
        schoolId,
        userId,
        title: values.title,
        classId: values.classId,
        subjectId: values.subjectId,
        examType: values.examType,
        examDate: values.examDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes: values.durationMinutes,
        totalMarks: values.totalMarks,
        passingMarks: values.passingMarks,
        status: values.status || "draft",
      };

      if (isEditMode) {
        await dispatch(updateExam({ id, data: payload })).unwrap();
        message.success("Exam Updated Successfully");
      } else {
        await dispatch(createExam(payload)).unwrap();
        message.success("Exam Created Successfully");
      }

      navigate("/dashboard/schooladmin/exams");
    } catch (err) {
      console.error(err);
      message.error("Failed to save exam");
    }
  };

  /* ================= UI ================= */
  return (
    <Spin spinning={loading}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Title level={4}>
          {isEditMode ? "Edit Exam" : "Create Exam"}
        </Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
           
          {/* BASIC INFO */}
          <Divider orientation="left">Basic Info</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Exam Title"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col md={12}>
              <Form.Item
                name="classId"
                label="Class"
                rules={[{ required: true }]}
              >
                <Select onChange={handleClassChange}>
                  {classList.map((cls) => (
                    <Option key={cls._id} value={cls._id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col md={12}>
              <Form.Item
                name="subjectId"
                label="Subject"
                rules={[{ required: true }]}
              >
                <Select disabled={!selectedClass}>
                  {subjectList.map((sub) => (
                    <Option key={sub._id} value={sub._id}>
                      {sub.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* SCHEDULE */}
          <Divider orientation="left">Schedule</Divider>

          <Row gutter={16}>
            <Col md={6}>
              <Form.Item
                name="examType"
                label="Exam Type"
                rules={[{ required: true }]}
                initialValue="objective"
              >
                <Select>
                  <Option value="objective">Objective</Option>
                  <Option value="subjective">Subjective</Option>
                  <Option value="mixed">Mixed</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col md={6}>
              <Form.Item
                name="examDate"
                label="Exam Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col md={6}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true }]}
              >
                <TimePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col md={6}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true }]}
              >
                <TimePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col md={8}>
              <Form.Item
                name="durationMinutes"
                label="Duration (Minutes)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {/* MARKS */}
          <Divider orientation="left">Marks</Divider>

          <Row gutter={16}>
            <Col md={12}>
              <Form.Item
                name="totalMarks"
                label="Total Marks"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col md={12}>
              <Form.Item
                name="passingMarks"
                label="Passing Marks"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {/* STATUS */}
          <Divider />
          <Form.Item name="status" label="Status">
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block >
            Save Exam
          </Button>
        </Form>
      </Card>
    </Spin>
  );
};

export default CreateExam;
