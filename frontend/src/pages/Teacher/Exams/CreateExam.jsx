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
  Space,
  message,
  Typography,
} from "antd";
import { Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../../features/classSlice.js";
import { getQuestions } from "../../../features/questionSlice.js";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const CreateExam = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  /* ================= LOCAL STATE ================= */
  const [examQuestions, setExamQuestions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sectionList, setSectionList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);

  /* ================= REDUX ================= */
  const { classList = [], loading } = useSelector(
    (state) => state.class || {}
  );

  const { questions: questionBank = [] } = useSelector(
    (state) => state.questions || {}
  );

  /* ================= USER ================= */
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const schoolId = user?.school?._id || null;

  /* ================= FETCH ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllClasses({ schoolId }));
      dispatch(getQuestions({ schoolId }));
    }
  }, [schoolId, dispatch]);

  /* ================= CLASS CHANGE ================= */
  const handleClassChange = (classId) => {
    setSelectedClass(classId);

    const selected = classList.find((c) => c._id === classId);

    const sections =
      selected?.sections?.map((s) => ({
        _id: s.sectionId?._id,
        name: s.sectionId?.name,
      })) || [];

    const subjects =
      selected?.subjects?.map((s) => ({
        _id: s.subjectId?._id,
        name: s.subjectId?.name,
      })) || [];

    setSectionList(sections);
    setSubjectList(subjects);

    form.setFieldsValue({
      sectionId: undefined,
      subjectId: undefined,
    });
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
    const selected = questionBank.find((q) => q._id === questionId);

    setExamQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? {
            questionId,
            marks: selected?.marks || 0,
          }
          : q
      )
    );
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (values) => {
    if (values.passingMarks > values.totalMarks) {
      message.error("Passing marks cannot be greater than total marks");
      return;
    }

    if (!examQuestions.length) {
      message.error("Add at least one question");
      return;
    }

    const invalid = examQuestions.some((q) => !q.questionId);
    if (invalid) {
      message.error("All questions must be selected");
      return;
    }

    const payload = {
      ...values,
      startTime: values.time?.[0]?.toISOString(),
      endTime: values.time?.[1]?.toISOString(),
      questions: examQuestions,
    };

    console.log("Exam Payload:", payload);
    message.success("Exam Created Successfully");
  };

  /* ================= UI ================= */

  return (
    <Spin spinning={loading}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        {loading}
        <Title level={4}>Create Exam</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            time: [dayjs(), dayjs().add(1, "hour")],
          }}
        >
          {/* BASIC INFO */}
          <Divider orientation="left">Basic Info</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="title" label="Exam Title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>

            <Col md={8}>
              <Form.Item name="classId" label="Class" rules={[{ required: true }]}>
                <Select onChange={handleClassChange}>
                  {classList.map((cls) => (
                    <Option key={cls._id} value={cls._id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col md={8}>
              <Form.Item name="sectionId" label="Section" rules={[{ required: true }]}>
                <Select disabled={!selectedClass}>
                  {sectionList.map((sec) => (
                    <Option key={sec._id} value={sec._id}>
                      {sec.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col md={8}>
              <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
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
            <Col md={16}>
              <Form.Item name="time" label="Exam Time" rules={[{ required: true }]}>
                <DatePicker.RangePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col md={8}> <Form.Item name="durationMinutes" label="Duration" rules={[{ required: true }]} >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item> </Col>
          </Row>
          {/* MARKS */}
          <Divider orientation="left">Marks</Divider>
          <Row gutter={16}>
            <Col md={12}>
              <Form.Item name="totalMarks" label="Total Marks" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item> </Col> <Col md={12}> <Form.Item name="passingMarks" label="Passing Marks" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          {/* QUESTIONS */}
          <Divider orientation="left">Questions</Divider>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addQuestion}
              block
            >
              Add Question
            </Button>

            {examQuestions.map((q, index) => (
              <Row gutter={12} key={index}>
                <Col span={16}>
                  <Select
                    placeholder="Select Question"
                    value={q.questionId}
                    onChange={(val) => handleQuestionSelect(index, val)}
                    showSearch
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                  >
                    {questionBank.map((ques) => (
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
          </Space>


          {/* STATUS */} <Divider />
          <Form.Item name="status" label="Status">
            <Select> <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Save Exam
          </Button>
        </Form>
      </Card></Spin>
  );
};

export default CreateExam;
