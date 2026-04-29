import { Button, Card, Form, InputNumber, message } from "antd";
import { useDispatch } from "react-redux";
import { updateTaxSettings } from "../../../features/payrollEnterpriseSlice";

export default function TaxSettingsPage() {
  const [form] = Form.useForm(); const dispatch = useDispatch();
  const onFinish = async (values) => { try { await dispatch(updateTaxSettings(values)).unwrap(); message.success("Tax config saved"); } catch (e) { message.error(e); } };
  return <Card title="Tax Settings (Admin)"><Form form={form} layout="vertical" onFinish={onFinish}><Form.Item label="PF Employee %" name="pfEmployeePercent"><InputNumber min={0} max={100} /></Form.Item><Form.Item label="PF Employer %" name="pfEmployerPercent"><InputNumber min={0} max={100} /></Form.Item><Form.Item label="ESI Employee %" name="esiEmployeePercent"><InputNumber min={0} max={100} /></Form.Item><Form.Item label="ESI Employer %" name="esiEmployerPercent"><InputNumber min={0} max={100} /></Form.Item><Form.Item label="TDS %" name="tdsPercent"><InputNumber min={0} max={100} /></Form.Item><Form.Item label="Professional Tax" name="professionalTax"><InputNumber min={0} /></Form.Item><Button type="primary" htmlType="submit">Save</Button></Form></Card>;
}
