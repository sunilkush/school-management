import React, { useEffect } from "react";
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createQuestionPaper, fetchQuestionPapers } from "../../features/exam/questionPaperSlice";
import { fetchExamsV2 } from "../../features/exam/examSliceV2";
import { getAllSubjects } from "../../features/subjectSlice";

const QuestionPaperPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.questionPaper || {});
  const { list: exams } = useSelector((s) => s.examModuleExam || {});
  const { subjects } = useSelector((s) => s.subject || {});
  const [form] = Form.useForm();
  useEffect(() => {
    dispatch(fetchQuestionPapers());
    dispatch(fetchExamsV2());
    dispatch(getAllSubjects({ limit: 200 }));
  }, [dispatch]);

  const examOptions = (exams || []).map((item) => ({ label: item.name, value: item._id }));
  const subjectOptions = (subjects || []).map((item) => ({ label: item.name, value: item._id }));

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Question Paper Builder">
        <Form layout="inline" form={form} onFinish={async (values) => {
          const payload = { ...values, sections: [{ title: "Section A", sectionMarks: Number(values.totalMarks || 0), questions: [] }] };
          await dispatch(createQuestionPaper(payload));
          form.resetFields();
          dispatch(fetchQuestionPapers());
        }}>
          <Form.Item name="examId" rules={[{ required: true }]}><Select style={{ width: 220 }} placeholder="Exam" options={examOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="subjectId" rules={[{ required: true }]}><Select style={{ width: 180 }} placeholder="Subject" options={subjectOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="Paper Title" /></Form.Item>
          <Form.Item name="durationMinutes" rules={[{ required: true }]}><InputNumber min={1} placeholder="Duration" /></Form.Item>
          <Form.Item name="totalMarks" rules={[{ required: true }]}><InputNumber min={1} placeholder="Total" /></Form.Item>
          <Form.Item name="mode" initialValue="offline"><Select style={{ width: 120 }} options={["offline", "online", "hybrid"].map((m) => ({ value: m, label: m }))} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Create Paper</Button></Form.Item>
        </Form>
      </Card>
      <Card>
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Title", dataIndex: "title" },
          { title: "Subject", dataIndex: "subjectId" },
          { title: "Duration", dataIndex: "durationMinutes" },
          { title: "Total", dataIndex: "totalMarks" },
          { title: "Mode", dataIndex: "mode" },
          { title: "Status", dataIndex: "status", render: (v) => <Tag>{v}</Tag> },
        ]} />
      </Card>
    </Space>
  );
};

export default QuestionPaperPage;
