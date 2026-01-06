import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Space,
  InputNumber,
  Switch,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { fetchAllSubjects } from "../../../features/subjectSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { createQuestion } from "../../../features/questionSlice";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateQuestion = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { subjectList = [] } = useSelector((state) => state.subject);
  const { classList = [] } = useSelector((state) => state.class);

  const user = JSON.parse(localStorage.getItem("user"));
  const schoolId = user?.school?._id;

  const [options, setOptions] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [questionType, setQuestionType] = useState("mcq_single");

  useEffect(() => {
    dispatch(fetchAllSubjects());
    dispatch(fetchAllClasses());
  }, [dispatch]);

  /* -------------------- HANDLERS -------------------- */

  const addOption = () =>
    setOptions((prev) => [...prev, { key: "", text: "" }]);

  const addCorrectAnswer = () =>
    setCorrectAnswers((prev) => [...prev, ""]);

  const onFinish = (values) => {
    const payload = {
      ...values,
      schoolId,
      options,
      correctAnswers,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim().toLowerCase())
        : [],
    };

    dispatch(createQuestion(payload));
    message.success("Question created successfully");
    form.resetFields();
    setOptions([]);
    setCorrectAnswers([]);
  };

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Title level={4}>📝 Create Question</Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          questionType: "mcq_single",
          difficulty: "medium",
          marks: 1,
          negativeMarks: 0,
          isActive: true,
        }}
        onFinish={onFinish}
      >
        {/* 🔹 CLASS & SUBJECT */}
        <Divider orientation="left">Class & Subject</Divider>

        <Row gutter={16}>
          <Col md={12} xs={24}>
            <Form.Item
              name="classId"
              label="Class"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Class">
                {classList.map((cls) => (
                  <Option key={cls._id} value={cls._id}>
                    {cls.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={12} xs={24}>
            <Form.Item
              name="subjectId"
              label="Subject"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Subject">
                {subjectList.map((subj) => (
                  <Option key={subj._id} value={subj._id}>
                    {subj.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 CHAPTER / TOPIC */}
        <Row gutter={16}>
          <Col md={12} xs={24}>
            <Form.Item name="chapter" label="Chapter">
              <Input placeholder="Chapter name" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="topic" label="Topic">
              <Input placeholder="Topic name" />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 QUESTION TYPE */}
        <Form.Item name="questionType" label="Question Type">
          <Select
            onChange={(val) => {
              setQuestionType(val);
              setOptions([]);
              setCorrectAnswers([]);
            }}
          >
            <Option value="mcq_single">MCQ (Single)</Option>
            <Option value="mcq_multi">MCQ (Multiple)</Option>
            <Option value="true_false">True / False</Option>
            <Option value="fill_blank">Fill in the Blank</Option>
            <Option value="match">Match the Following</Option>
          </Select>
        </Form.Item>

        {/* 🔹 STATEMENT */}
        <Form.Item
          name="statement"
          label="Question Statement"
          rules={[{ required: true }]}
        >
          <TextArea rows={4} placeholder="Enter question statement" />
        </Form.Item>

        {/* 🔹 OPTIONS */}
        {(questionType === "mcq_single" ||
          questionType === "mcq_multi" ||
          questionType === "match") && (
          <>
            <Divider orientation="left">Options</Divider>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addOption}
              block
            >
              Add Option
            </Button>

            <Space direction="vertical" style={{ width: "100%", marginTop: 12 }}>
              {options.map((opt, index) => (
                <Row gutter={12} key={index}>
                  <Col span={6}>
                    <Input
                      placeholder="Key"
                      value={opt.key}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[index].key = e.target.value;
                        setOptions(updated);
                      }}
                    />
                  </Col>
                  <Col span={18}>
                    <Input
                      placeholder="Option Text"
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[index].text = e.target.value;
                        setOptions(updated);
                      }}
                    />
                  </Col>
                </Row>
              ))}
            </Space>
          </>
        )}

        {/* 🔹 CORRECT ANSWERS */}
        <Divider orientation="left">Correct Answers</Divider>

        <Button type="dashed" onClick={addCorrectAnswer} block>
          Add Correct Answer
        </Button>

        <Space direction="vertical" style={{ width: "100%", marginTop: 12 }}>
          {correctAnswers.map((ans, index) => (
            <Input
              key={index}
              placeholder="Correct Answer"
              value={ans}
              onChange={(e) => {
                const updated = [...correctAnswers];
                updated[index] = e.target.value;
                setCorrectAnswers(updated);
              }}
            />
          ))}
        </Space>

        {/* 🔹 MARKS & DIFFICULTY */}
        <Divider orientation="left">Evaluation</Divider>

        <Row gutter={16}>
          <Col md={8} xs={24}>
            <Form.Item name="difficulty" label="Difficulty">
              <Select>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="marks" label="Marks">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="negativeMarks" label="Negative Marks">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 TAGS */}
        <Form.Item name="tags" label="Tags (comma separated)">
          <Input placeholder="mcq, algebra, class-10" />
        </Form.Item>

        {/* 🔹 STATUS */}
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>

        {/* 🔹 SUBMIT */}
        <Button type="primary" htmlType="submit" block size="large">
          Save Question
        </Button>
      </Form>
    </Card>
  );
};

export default CreateQuestion;
