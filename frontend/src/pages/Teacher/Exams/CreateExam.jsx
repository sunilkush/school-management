import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Divider,
  Space,
  message,
  Typography,
} from "antd";

const { Title } = Typography;
const { Option } = Select;

const CreateExam = () => {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionId: "", marks: 0 }]);
  };

  const handleSubmit = (values) => {
    if (values.passingMarks > values.totalMarks) {
      message.error("Passing marks cannot be greater than total marks");
      return;
    }

    const payload = {
      ...values,
      startTime: values.time?.[0]?.toISOString(),
      endTime: values.time?.[1]?.toISOString(),
      questions,
    };

    console.log("✅ Exam Data:", payload);
    message.success("Exam created successfully");
  };

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Title level={4}>📝 Create Exam</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          examType: "objective",
          questionOrder: "random",
          shuffleOptions: true,
          status: "draft",
          negativeMarking: 0,
          allowPartialScoring: false,
          maxAttempts: 1,
          time: [dayjs(), dayjs().add(1, "hour")],
        }}
      >
        {/* 🔹 BASIC INFO */}
        <Divider orientation="left">Basic Information</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="Exam Title"
              rules={[{ required: true, message: "Enter exam title" }]}
            >
              <Input placeholder="Mid Term Examination" />
            </Form.Item>
          </Col>

          {["classId", "sectionId", "subjectId"].map((field) => (
            <Col md={8} xs={24} key={field}>
              <Form.Item
                name={field}
                label={field.replace("Id", "")}
                rules={[{ required: true }]}
              >
                <Select placeholder={`Select ${field.replace("Id", "")}`}>
                  <Option value="1">Option 1</Option>
                  <Option value="2">Option 2</Option>
                </Select>
              </Form.Item>
            </Col>
          ))}
        </Row>

        {/* 🔹 EXAM TYPE */}
        <Form.Item name="examType" label="Exam Type">
          <Select>
            <Option value="objective">Objective</Option>
            <Option value="subjective">Subjective</Option>
            <Option value="mixed">Mixed</Option>
          </Select>
        </Form.Item>

        {/* 🔹 SCHEDULE */}
        <Divider orientation="left">Schedule</Divider>

        <Row gutter={16}>
          <Col md={16} xs={24}>
            <Form.Item
              name="time"
              label="Exam Time"
              rules={[{ required: true }]}
            >
              <DatePicker.RangePicker
                showTime
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item
              name="durationMinutes"
              label="Duration (Minutes)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 MARKS */}
        <Divider orientation="left">Marks</Divider>

        <Row gutter={16}>
          <Col md={12} xs={24}>
            <Form.Item
              name="totalMarks"
              label="Total Marks"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col md={12} xs={24}>
            <Form.Item
              name="passingMarks"
              label="Passing Marks"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 QUESTION SETTINGS */}
        <Divider orientation="left">Question Settings</Divider>

        <Row gutter={16}>
          <Col md={8} xs={24}>
            <Form.Item name="questionOrder" label="Question Order">
              <Select>
                <Option value="fixed">Fixed</Option>
                <Option value="random">Random</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item
              name="shuffleOptions"
              label="Shuffle Options"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 ADVANCED SETTINGS */}
        <Divider orientation="left">Advanced Settings</Divider>

        <Row gutter={16}>
          <Col md={8} xs={24}>
            <Form.Item name="negativeMarking" label="Negative Marking">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item
              name="allowPartialScoring"
              label="Partial Scoring"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="maxAttempts" label="Max Attempts">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 QUESTIONS */}
        <Divider orientation="left">Questions</Divider>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="dashed" onClick={addQuestion} block>
            + Add Question
          </Button>

          {questions.map((q, index) => (
            <Row gutter={12} key={index}>
              <Col span={16}>
                <Input
                  placeholder="Question ID"
                  value={q.questionId}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[index].questionId = e.target.value;
                    setQuestions(updated);
                  }}
                />
              </Col>

              <Col span={8}>
                <InputNumber
                  placeholder="Marks"
                  min={0}
                  style={{ width: "100%" }}
                  value={q.marks}
                  onChange={(val) => {
                    const updated = [...questions];
                    updated[index].marks = val;
                    setQuestions(updated);
                  }}
                />
              </Col>
            </Row>
          ))}
        </Space>

        {/* 🔹 STATUS */}
        <Divider />

        <Form.Item name="status" label="Status">
          <Select>
            <Option value="draft">Draft</Option>
            <Option value="published">Published</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </Form.Item>

        {/* 🔹 ACTION */}
        <Button type="primary" htmlType="submit" block size="large">
          Save Exam
        </Button>
      </Form>
    </Card>
  );
};

export default CreateExam;
