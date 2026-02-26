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

/* ⭐ Safe Mongo Id Extract */
const getId = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  return val._id;
};

const EditExamForm = ({ examId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const isLoadedRef = useRef(false);

  const [examQuestions, setExamQuestions] = useState([]);
  const [subjectList, setSubjectList] = useState([]);

  /* ================= REDUX ================= */

  const classList = useSelector(
    (state) => state.class?.classList || [],
    shallowEqual
  );

  const questionBank = useSelector(
    (state) => state.questions?.questions || [],
    shallowEqual
  );

  const { currentExam, loading } = useSelector(
    (state) => state.exams || {},
    shallowEqual
  );
  /* ================= SAFE QUESTION ARRAY ================= */

  const questionBankArray = useMemo(() => {
    if (Array.isArray(questionBank)) return questionBank;
    if (Array.isArray(questionBank?.data)) return questionBank.data;
    if (Array.isArray(questionBank?.questions)) return questionBank.questions;
    return [];
  }, [questionBank]);
 
  /* ================= WATCH FORM VALUES ================= */

  const watchClassId = Form.useWatch("classId", form);
  const watchSubjectId = Form.useWatch("subjectId", form);

  /* ================= USER CONTEXT ================= */

  const selectedAcademicYear = useMemo(
    () => JSON.parse(localStorage.getItem("selectedAcademicYear") || "{}"),
    []
  );

  
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

  /* Reset Loader */
  useEffect(() => {
    isLoadedRef.current = false;
  }, [examId]);

  /* ================= LOAD EXAM ================= */

  useEffect(() => {
    if (!currentExam?._id) return;
    if (!classList.length) return;
    if (isLoadedRef.current) return;

    isLoadedRef.current = true;

    const classId = getId(currentExam.classId);
    const subjectId = getId(currentExam.subjectId);


    const selectedClassObj = classList.find(
      (c) => String(c._id) === String(classId)
    );

    const subjects =
      selectedClassObj?.subjects?.map((s) => ({
        _id: getId(s.subjectId),
        name: s.subjectId?.name,
      })) || [];

    setSubjectList(subjects);

    setExamQuestions(
      currentExam.questions?.map((q) => ({
        questionId: getId(q.questionId),
        marks: q.marks || 0,
      })) || []
    );

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

  /* ================= FILTER QUESTIONS ================= */

  const filteredQuestions = useMemo(() => {
    const classId = watchClassId || getId(currentExam?.classId);
    const subjectId = watchSubjectId || getId(currentExam?.subjectId);

    if (!classId || !subjectId) return [];

    return questionBankArray.filter((q) => {
      return (
        String(getId(q.classId)) === String(classId) &&
        String(getId(q.subjectId)) === String(subjectId)
      );
    });
  }, [
    questionBankArray,
    watchClassId,
    watchSubjectId,
    currentExam,
  ]);
  /* ================= CLASS CHANGE ================= */

  const handleClassChange = (classId) => {

    const selected = classList.find(
      (c) => String(c._id) === String(classId)
    );

    const subjects =
      selected?.subjects?.map((s) => ({
        _id: getId(s.subjectId),
        name: s.subjectId?.name,
      })) || [];

    setSubjectList(subjects);

    form.setFieldsValue({ subjectId: undefined });
  };

  /* ================= QUESTIONS ================= */

  const addQuestion = () => {
    setExamQuestions((prev) => [
      ...prev,
      { questionId: "", marks: 0 },
    ]);
  };

  const removeQuestion = (index) => {
    setExamQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionSelect = (index, questionId) => {
    const selected = questionBankArray.find(
      (q) => String(q._id) === String(questionId)
    );

    setExamQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { questionId, marks: selected?.marks || 0 }
          : q
      )
    );
  };

  /* ================= SUBMIT ================= */

const handleSubmit = async () => {
  try {
    /* ✅ Questions Safe Format */
    const formattedQuestions = examQuestions.map((q) => ({
      questionId: q.questionId,
      marks: Number(q.marks || 0),
    }));

    /* ✅ Only Questions Payload */
    const payload = {
      questions: formattedQuestions,
    };

    await dispatch(updateExam({ examId, payload })).unwrap();

    message.success("Questions Updated Successfully");

  } catch (err) {
    console.error("UPDATE ERROR 👉", err);
    message.error(err?.message || "Failed to update questions");
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
                disabled
              >
                <Input disabled value={currentExam?.title} />
              </Form.Item>
            </Col>

            <Col md={12}>
              <Form.Item
                name="classId"
                label="Class"
                rules={[{ required: true }]}
                disabled
              >
                <Select onChange={handleClassChange} disabled>
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
                <Select disabled >
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
                  showSearch
                  optionFilterProp="children"
                >
                  {filteredQuestions.map((ques) => (
                    <Option key={ques._id} value={ques._id}>
                      {ques.statement}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col span={4}>
                <InputNumber
                  value={q.marks}
                  disabled
                  style={{ width: "100%" }}
                />
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
