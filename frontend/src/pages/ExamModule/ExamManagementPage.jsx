import React, { useEffect } from "react";
import { Button, Card, Form, Input, Select, Space, Table, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createExamV2, fetchExamsV2 } from "../../features/exam/examSliceV2";

const statusColors = { draft: "default", scheduled: "processing", ongoing: "warning", completed: "success", published: "blue", archived: "red" };

const ExamManagementPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.examModuleExam || {});
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchExamsV2()); }, [dispatch]);

  const onFinish = async (values) => {
    await dispatch(createExamV2({ ...values, applicableClasses: [] }));
    form.resetFields();
    dispatch(fetchExamsV2());
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card title="Exam Setup">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Space wrap>
            <Form.Item name="name" label="Exam Name" rules={[{ required: true }]}><Input placeholder="Half Yearly" /></Form.Item>
            <Form.Item name="examType" label="Exam Type" initialValue="Custom"><Select style={{ width: 200 }} options={["Unit Test", "Weekly Test", "Monthly Test", "Quarterly", "Half Yearly", "Annual", "Pre Board", "Custom"].map((x) => ({ label: x, value: x }))} /></Form.Item>
            <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
            <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
            <Form.Item><Button type="primary" htmlType="submit">Create Exam</Button></Form.Item>
          </Space>
        </Form>
      </Card>
      <Card title="Exams List">
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Type", dataIndex: "examType" },
          { title: "Date Range", render: (_, r) => `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}` },
          { title: "Status", dataIndex: "status", render: (s) => <Tag color={statusColors[s] || "default"}>{s}</Tag> },
          { title: "Result", dataIndex: "resultStatus" },
        ]} />
      </Card>
    </Space>
  );
};

export default ExamManagementPage;
