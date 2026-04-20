import { Button, Card, Form, Input, InputNumber, Space, message } from "antd";
import { useDispatch } from "react-redux";
import { saveExamPaper } from "../../features/examManagementSlice";

export default function PaperBuilderPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    const sections = [{ title: "Section A", questions: [{ questionId: values.questionId, marks: values.questionMarks, order: 1 }] }];
    const payload = { ...values, sections };
    const res = await dispatch(saveExamPaper({ body: payload }));
    if (!res.error) message.success("Paper saved");
  };

  return (
    <Card title="Question Paper Builder">
      <Form form={form} layout="inline" onFinish={onFinish}>
        <Form.Item name="examId" rules={[{ required: true }]}><Input placeholder="Exam ID" /></Form.Item>
        <Form.Item name="academicYearId" rules={[{ required: true }]}><Input placeholder="Academic Year ID" /></Form.Item>
        <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="Paper title" /></Form.Item>
        <Form.Item name="questionId" rules={[{ required: true }]}><Input placeholder="Question ID" /></Form.Item>
        <Form.Item name="questionMarks" rules={[{ required: true }]}><InputNumber min={1} placeholder="Question marks" /></Form.Item>
        <Form.Item name="passingMarks" rules={[{ required: true }]}><InputNumber min={0} placeholder="Passing marks" /></Form.Item>
        <Button type="primary" htmlType="submit">Save Draft</Button>
      </Form>
      <Space style={{ marginTop: 16 }}>
        <span>Supports manual + random sections via API payload composition.</span>
      </Space>
    </Card>
  );
}
