import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Divider,
  message,
  Typography,
  Spin,
} from "antd";

import { useDispatch, useSelector, shallowEqual } from "react-redux";

import { updateExam, getExamById } from "../../../features/examSlice.js";
import { fetchAllClasses } from "../../../features/classSlice.js";
import { getQuestions } from "../../../features/questionSlice.js";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const EditExamForm = ({ examId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const isLoadedRef = useRef(false);

  const [examQuestions, setExamQuestions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjectList, setSubjectList] = useState([]);

  /* ================= SAFE REDUX SELECTORS ================= */

  const classList = useSelector(
    (state) => state.class?.classList || [],
    shallowEqual
  );

  const questionBank = useSelector(
    (state) => state.questions?.questions || [],
    shallowEqual
  );

  const { currentExam, loading } = useSelector(
    (state) => state.exam || {},
    shallowEqual
  );

  /* ================= USER ================= */

  const selectedAcademicYear = useMemo(
    () =>
      JSON.parse(localStorage.getItem("selectedAcademicYear") || "{}"),
    []
  );

  const academicYearId = selectedAcademicYear?._id;
  const schoolId = selectedAcademicYear?.schoolId;

  /* ================= FETCH ================= */

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllClasses({ schoolId }));
      dispatch(getQuestions({ schoolId }));
    }

    if (examId) {
      dispatch(getExamById(examId));
    }
  }, [schoolId, examId, dispatch]);

  /* Reset loader */
  useEffect(() => {
    isLoadedRef.current = false;
  }, [examId]);

  /* ================= LOAD EXAM ================= */

  useEffect(() => {
    if (!currentExam?._id) return;
    if (!classList.length) return;
    if (isLoadedRef.current) return;

    isLoadedRef.current = true;

    const classId = currentExam.classId?._id || currentExam.classId;
    const subjectId = currentExam.subjectId?._id || currentExam.subjectId;

    setSelectedClass(classId);

    /* Subjects */
    const selectedClassObj = classList.find((c) => c._id === classId);

    const subjects =
      selectedClassObj?.subjects?.map((s) => ({
        _id: s.subjectId?._id,
        name: s.subjectId?.name,
      })) || [];

    setSubjectList(subjects);

    /* Questions */
    setExamQuestions(
      currentExam.questions?.map((q) => ({
        questionId: q.questionId?._id || q.questionId,
        marks: q.marks || 0,
      })) || []
    );

    /* Form */
    form.setFieldsValue({
      title: currentExam.title,
      classId,
      subjectId,
      examType: currentExam.examType,
      durationMinutes: currentExam.durationMinutes,
      totalMarks: currentExam.totalMarks,
      passingMarks: currentExam.passingMarks,
      status: currentExam.status,
    });
  }, [currentExam, classList, form]);

  /* ================= FILTER QUESTIONS (MEMO) ================= */

  const filteredQuestions = useMemo(() => {
    if (!questionBank.length) return [];

    const classId =
      form.getFieldValue("classId") ||
      currentExam?.classId?._id ||
      currentExam?.classId;

    const subjectId =
      form.getFieldValue("subjectId") ||
      currentExam?.subjectId?._id ||
      currentExam?.subjectId;

    return questionBank.filter((q) => {
      const qClass = q.classId?._id || q.classId;
      const qSub = q.subjectId?._id || q.subjectId;

      return qClass === classId && qSub === subjectId;
    });
  }, [questionBank, form, currentExam]);

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

  /* ================= QUESTIONS ================= */

  const addQuestion = () => {
    setExamQuestions((prev) => [...prev, { questionId: "", marks: 0 }]);
  };

  const removeQuestion = (index) => {
    setExamQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionSelect = (index, questionId) => {
    const selected = questionBank.find((q) => q._id === questionId);

    setExamQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { questionId, marks: selected?.marks || 0 }
          : q
      )
    );
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (values) => {
    try {
      const payload = {
        examId,
        academicYearId,
        schoolId,
        title: values.title,
        classId: values.classId,
        subjectId: values.subjectId,
        examType: values.examType,
        durationMinutes: values.durationMinutes,
        totalMarks: values.totalMarks,
        passingMarks: values.passingMarks,
        status: values.status,
        questions: examQuestions,
      };

      await dispatch(updateExam(payload)).unwrap();

      message.success("Exam Updated Successfully");
    } catch (err) {
      message.error(err?.message || "Failed to update exam");
    }
  };

  /* ================= UI ================= */

  return (
    <Spin spinning={loading}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Title level={4}>Edit Exam</Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

          <Divider orientation="left">Questions</Divider>

          <Button
            type="dashed"
            onClick={addQuestion}
            block
            icon={<PlusOutlined />}
          >
            Add Question
          </Button>

          {examQuestions.map((q, index) => (
            <Row gutter={12} key={index} style={{ marginTop: 10 }}>
              <Col span={16}>
                <Select
                  value={q.questionId}
                  onChange={(val) => handleQuestionSelect(index, val)}
                  style={{ width: "100%" }}
                >
                  {filteredQuestions.map((ques) => (
                    <Option key={ques._id} value={ques._id}>
                      {ques.statement}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col span={4}>
                <InputNumber value={q.marks} disabled style={{ width: "100%" }} />
              </Col>

              <Col span={4}>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeQuestion(index)}
                  block
                />
              </Col>
            </Row>
          ))}

          <Divider />

          <Button type="primary" htmlType="submit" block>
            Update Exam
          </Button>
        </Form>
      </Card>
    </Spin>
  );
};

export default EditExamForm;
