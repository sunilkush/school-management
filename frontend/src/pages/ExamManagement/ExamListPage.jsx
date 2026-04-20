import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, message } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changeExamStatus, createManagedExam, fetchManagedExams } from "../../features/examManagementSlice";

export default function ExamListPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { exams, loading } = useSelector((state) => state.examManagement);

  useEffect(() => { dispatch(fetchManagedExams({ params: {} })); }, [dispatch]);

  const onCreate = async (values) => {
    const payload = { ...values, schedule: values.schedule || {}, examMode: values.examMode || "offline" };
    const res = await dispatch(createManagedExam({ body: payload }));
    if (!res.error) {
      message.success("Exam created");
      form.resetFields();
    }
  };

  const updateStatus = async (examId, status) => {
    const res = await dispatch(changeExamStatus({ examId, body: { status } }));
    if (!res.error) message.success("Status updated");
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Create Exam">
        <Form form={form} layout="inline" onFinish={onCreate}>
          <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="Exam title" /></Form.Item>
          <Form.Item name="academicYearId" rules={[{ required: true }]}><Input placeholder="Academic Year ID" /></Form.Item>
          <Form.Item name="schoolClassId" rules={[{ required: true }]}><Input placeholder="Class ID" /></Form.Item>
          <Form.Item name="subjectId" rules={[{ required: true }]}><Input placeholder="Subject ID" /></Form.Item>
          <Form.Item name="examDate" rules={[{ required: true }]}><Input placeholder="Exam Date (ISO)" /></Form.Item>
          <Form.Item name="startTime" rules={[{ required: true }]}><Input placeholder="Start Time (ISO)" /></Form.Item>
          <Form.Item name="endTime" rules={[{ required: true }]}><Input placeholder="End Time (ISO)" /></Form.Item>
          <Form.Item name="durationMinutes" rules={[{ required: true }]}><InputNumber min={1} placeholder="Duration" /></Form.Item>
          <Form.Item name="totalMarks" rules={[{ required: true }]}><InputNumber min={1} placeholder="Total" /></Form.Item>
          <Form.Item name="passingMarks" rules={[{ required: true }]}><InputNumber min={0} placeholder="Pass" /></Form.Item>
          <Form.Item name="examMode"><Select placeholder="Mode" style={{ width: 130 }} options={[{ value: "offline" }, { value: "online" }, { value: "hybrid" }]} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Create</Button>
        </Form>
      </Card>
      <Card title="Exam List">
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={exams}
          columns={[
            { title: "Title", dataIndex: "title" },
            { title: "Mode", render: (_, row) => row.settings?.mode || "offline" },
            { title: "Date", dataIndex: "examDate" },
            { title: "Status", render: (_, row) => <Tag>{row.status}</Tag> },
            { title: "Actions", render: (_, row) => <Space><Button size="small" onClick={() => updateStatus(row._id, "published")}>Publish</Button><Button size="small" onClick={() => updateStatus(row._id, "draft")}>Unpublish</Button></Space> },
          ]}
        />
      </Card>
    </Space>
  );
}
