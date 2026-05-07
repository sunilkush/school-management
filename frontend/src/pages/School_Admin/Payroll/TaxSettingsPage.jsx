import { Alert, Button, Card, Col, Form, InputNumber, Row, Space, Typography, message } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaxSettings, updateTaxSettings } from "../../../features/payrollEnterpriseSlice";

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
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Tax & Statutory Settings</Typography.Title>
      {error && <Alert showIcon type="error" message={error} />}
      <Card title="Active Tax Configuration" extra={taxSettings?.updatedAt ? `Updated: ${new Date(taxSettings.updatedAt).toLocaleString()}` : "No active config"}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ pfEmployeePercent: 12, pfEmployerPercent: 12, esiEmployeePercent: 0.75, esiEmployerPercent: 3.25, tdsPercent: 0, professionalTax: 0 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}><Form.Item label="PF Employee %" name="pfEmployeePercent" rules={[{ required: true }]}><InputNumber min={0} max={100} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="PF Employer %" name="pfEmployerPercent" rules={[{ required: true }]}><InputNumber min={0} max={100} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="ESI Employee %" name="esiEmployeePercent" rules={[{ required: true }]}><InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="ESI Employer %" name="esiEmployerPercent" rules={[{ required: true }]}><InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="TDS %" name="tdsPercent" rules={[{ required: true }]}><InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="Professional Tax" name="professionalTax" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>Save Configuration</Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
