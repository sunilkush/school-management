import { Button, Card, Form, Input, InputNumber, Select, Space, Table, message } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createQuestionBankItem, fetchQuestionBank } from "../../features/examManagementSlice";

export default function QuestionBankPage() {
  const dispatch = useDispatch();
  const { questions, loading } = useSelector((state) => state.examManagement);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchQuestionBank({ params: {} })); }, [dispatch]);

  const onFinish = async (values) => {
    const payload = { ...values, correctAnswers: values.correctAnswers?.split(",")?.map((item) => item.trim()) || [] };
    const res = await dispatch(createQuestionBankItem({ body: payload }));
    if (!res.error) {
      message.success("Question added");
      form.resetFields();
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Add Question">
        <Form form={form} layout="inline" onFinish={onFinish}>
          <Form.Item name="schoolClassId" rules={[{ required: true }]}><Input placeholder="Class ID" /></Form.Item>
          <Form.Item name="subjectId" rules={[{ required: true }]}><Input placeholder="Subject ID" /></Form.Item>
          <Form.Item name="statement" rules={[{ required: true }]}><Input placeholder="Question" /></Form.Item>
          <Form.Item name="questionType" rules={[{ required: true }]}><Select style={{ width: 170 }} options={["mcq_single", "mcq_multi", "true_false", "fill_blank", "short_answer", "long_answer", "numerical", "file_upload"].map((q) => ({ value: q }))} /></Form.Item>
          <Form.Item name="marks"><InputNumber min={1} placeholder="Marks" /></Form.Item>
          <Form.Item name="correctAnswers"><Input placeholder="Correct answers csv" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
        </Form>
      </Card>
      <Card title="Question Bank">
        <Table rowKey="_id" loading={loading} dataSource={questions} columns={[{ title: "Statement", dataIndex: "statement" }, { title: "Type", dataIndex: "questionType" }, { title: "Marks", dataIndex: "marks" }]} />
      </Card>
    </Space>
  );
}
