import React, { useEffect } from "react";
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createQuestionV2, fetchQuestionBank } from "../../features/exam/questionBankSlice";

const QuestionBankPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.questionBank || {});
  const [form] = Form.useForm();
  useEffect(() => { dispatch(fetchQuestionBank()); }, [dispatch]);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Question Bank">
        <Form layout="vertical" form={form} onFinish={async (values) => { await dispatch(createQuestionV2(values)); form.resetFields(); dispatch(fetchQuestionBank()); }}>
          <Space wrap>
            <Form.Item name="schoolClassId" label="Class" rules={[{ required: true }]}><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="questionType" label="Type" rules={[{ required: true }]}><Select style={{ width: 180 }} options={["MCQ", "True/False", "Fill in the blanks", "Short Answer", "Long Answer", "Subjective", "Case Study"].map((x) => ({ value: x, label: x }))} /></Form.Item>
            <Form.Item name="difficulty" label="Difficulty" initialValue="medium"><Select style={{ width: 120 }} options={["easy", "medium", "hard"].map((x) => ({ value: x, label: x }))} /></Form.Item>
            <Form.Item name="marks" label="Marks" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
            <Form.Item name="questionText" label="Question" rules={[{ required: true }]}><Input.TextArea rows={2} style={{ width: 400 }} /></Form.Item>
            <Form.Item><Button type="primary" htmlType="submit">Create Question</Button></Form.Item>
          </Space>
        </Form>
      </Card>
      <Card>
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Type", dataIndex: "questionType" },
          { title: "Question", dataIndex: "questionText", ellipsis: true },
          { title: "Difficulty", dataIndex: "difficulty", render: (v) => <Tag>{v}</Tag> },
          { title: "Marks", dataIndex: "marks" },
          { title: "Status", dataIndex: "status" },
        ]} />
      </Card>
    </Space>
  );
};

export default QuestionBankPage;
