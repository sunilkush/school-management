import { Alert, Button, Card, Col, Form, InputNumber, Row, Space, Typography, message, Tag } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaxSettings, updateTaxSettings } from "../../../../features/payrollEnterpriseSlice";

const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #ecfdf5 0%, #f8fafc 55%, #eff6ff 100%)", border: "1px solid #bbf7d0" };

export default function TaxSettingsPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { taxSettings, saving, error } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => { dispatch(fetchTaxSettings()); }, [dispatch]);
  useEffect(() => {
    if (taxSettings) form.setFieldsValue(taxSettings);
  }, [form, taxSettings]);

  const onFinish = async (values) => {
    try {
      await dispatch(updateTaxSettings(values)).unwrap();
      message.success("Tax config saved");
    } catch (e) { message.error(e); }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="green">Statutory setup</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Tax & deduction settings</Typography.Title>
          <Typography.Text type="secondary">
            PF, ESI, TDS aur professional tax ke labels ab clear hain. Ye settings payroll generation me employee deductions calculate karne ke liye use hoti hain.
          </Typography.Text>
        </Space>
      </Card>

      {error && <Alert showIcon type="error" message={error} />}

      <Card
        title="Active tax configuration"
        extra={taxSettings?.updatedAt ? `Updated: ${new Date(taxSettings.updatedAt).toLocaleString()}` : "No active config"}
        style={cardStyle}
      >
        <Alert showIcon type="info" style={{ marginBottom: 16 }} message="Percentage fields me 0 se 100 ke beech value enter karein. Professional tax fixed monthly amount hai." />
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ pfEmployeePercent: 12, pfEmployerPercent: 12, esiEmployeePercent: 0.75, esiEmployerPercent: 3.25, tdsPercent: 0, professionalTax: 0 }}>
          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Employee PF deduction (%)" name="pfEmployeePercent" extra="Employee salary se deduct hone wala PF percentage." rules={[{ required: true, message: "Employee PF percentage is required" }]}>
                <InputNumber min={0} max={100} placeholder="e.g. 12" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Employer PF contribution (%)" name="pfEmployerPercent" extra="School/employer contribution percentage." rules={[{ required: true, message: "Employer PF percentage is required" }]}>
                <InputNumber min={0} max={100} placeholder="e.g. 12" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Employee ESI deduction (%)" name="esiEmployeePercent" extra="Employee salary se ESI deduction percentage." rules={[{ required: true, message: "Employee ESI percentage is required" }]}>
                <InputNumber min={0} max={100} step={0.01} placeholder="e.g. 0.75" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Employer ESI contribution (%)" name="esiEmployerPercent" extra="Employer side ESI contribution percentage." rules={[{ required: true, message: "Employer ESI percentage is required" }]}>
                <InputNumber min={0} max={100} step={0.01} placeholder="e.g. 3.25" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="TDS deduction (%)" name="tdsPercent" extra="Income tax/TDS deduction percentage." rules={[{ required: true, message: "TDS percentage is required" }]}>
                <InputNumber min={0} max={100} step={0.01} placeholder="e.g. 10" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Professional tax amount" name="professionalTax" extra="Fixed amount jo salary se deduct hoga." rules={[{ required: true, message: "Professional tax amount is required" }]}>
                <InputNumber min={0} placeholder="e.g. 200" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={saving}>Save tax configuration</Button>
            <Button onClick={() => form.resetFields()}>Reset form</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
