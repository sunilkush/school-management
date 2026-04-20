import { Button, Card, Form, InputNumber, Select, Space, Switch, Typography, message } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamSettings, saveExamSettings } from "../../features/examManagementSlice";

const examTypeOptions = ["Unit Test", "Weekly Test", "Monthly Test", "Quarterly", "Half Yearly", "Annual", "Practice Test", "Online Mock Test"].map((label) => ({ label, value: label }));

export default function ExamSettingsPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { settings, loading } = useSelector((state) => state.examManagement);

  useEffect(() => { dispatch(fetchExamSettings({ params: {} })); }, [dispatch]);
  useEffect(() => { if (settings) form.setFieldsValue(settings); }, [settings, form]);

  const onFinish = async (values) => {
    const res = await dispatch(saveExamSettings({ body: values }));
    if (!res.error) message.success("Exam settings updated");
  };

  return (
    <Card title="Exam Master & Settings">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="examTypes" label="Exam Types"><Select mode="multiple" options={examTypeOptions} /></Form.Item>
        <Space wrap>
          <Form.Item name={["passingRule", "minimumPercentage"]} label="Minimum Passing %"><InputNumber min={0} max={100} /></Form.Item>
          <Form.Item name={["onlineRules", "defaultMaxAttempts"]} label="Default Max Attempts"><InputNumber min={1} /></Form.Item>
          <Form.Item name={["resultRules", "moderationWindowHours"]} label="Moderation Window (Hours)"><InputNumber min={0} /></Form.Item>
        </Space>
        <Space wrap>
          <Form.Item name={["resultRules", "autoPublish"]} label="Auto Publish" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name={["onlineRules", "autoSubmitOnTimeout"]} label="Auto Submit" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name={["reportCardConfig", "includeAttendance"]} label="Include Attendance" valuePropName="checked"><Switch /></Form.Item>
        </Space>
        <Typography.Text type="secondary">Grade ranges can be managed via API payload using gradeRanges array.</Typography.Text>
        <div style={{ marginTop: 16 }}><Button type="primary" htmlType="submit" loading={loading}>Save Settings</Button></div>
      </Form>
    </Card>
  );
}
