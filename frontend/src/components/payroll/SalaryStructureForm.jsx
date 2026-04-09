import React, { useMemo } from "react";
import { Button, Card, Col, DatePicker, Form, InputNumber, Row, Select, Space, Switch, Typography } from "antd";
import dayjs from "dayjs";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text } = Typography;

const SalaryStructureForm = ({ form, employees, onSubmit, submitting, editingId }) => {
  const basic = Form.useWatch("basic", form) || 0;
  const hra = Form.useWatch("hra", form) || 0;
  const da = Form.useWatch("da", form) || 0;
  const specialAllowance = Form.useWatch("specialAllowance", form) || 0;
  const pfEnabled = Form.useWatch("pfEnabled", form);
  const esiEnabled = Form.useWatch("esiEnabled", form);
  const professionalTaxEnabled = Form.useWatch("professionalTaxEnabled", form);
  const effectiveFrom = Form.useWatch("effectiveFrom", form);

  const grossPreview = useMemo(
    () => Number(basic) + Number(hra) + Number(da) + Number(specialAllowance),
    [basic, hra, da, specialAllowance]
  );

  const deductionPreview = useMemo(() => {
    const base = grossPreview;
    let deduction = 0;
    if (pfEnabled) deduction += base * 0.12;
    if (esiEnabled) deduction += base * 0.0075;
    if (professionalTaxEnabled) deduction += 200;
    return deduction;
  }, [grossPreview, pfEnabled, esiEnabled, professionalTaxEnabled]);

  return (
    <Card title={editingId ? "Edit Salary Structure" : "Create Salary Structure"}>
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ status: "active", pfEnabled: true }}>
        <Form.Item label="Employee" name="employeeId" rules={[{ required: true, message: "Employee required" }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select employee"
            options={employees.map((employee) => ({
              value: employee._id,
              label: `${employee.userId?.name || "Employee"} (${employee.designation || "Staff"})`,
            }))}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}><Form.Item label="Basic" name="basic" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="HRA" name="hra" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="DA" name="da" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Special Allowance" name="specialAllowance" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
        </Row>

        <Form.Item label="Gross Monthly" name="grossMonthly" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}><Form.Item label="Effective From" name="effectiveFrom" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Effective To" name="effectiveTo"><DatePicker style={{ width: "100%" }} disabledDate={(d) => effectiveFrom && d.isBefore(dayjs(effectiveFrom), "day")} /></Form.Item></Col>
        </Row>

        <Row gutter={12}>
          <Col span={8}><Form.Item label="PF Enabled" name="pfEnabled" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col span={8}><Form.Item label="ESI Enabled" name="esiEnabled" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col span={8}><Form.Item label="Prof. Tax Enabled" name="professionalTaxEnabled" valuePropName="checked"><Switch /></Form.Item></Col>
        </Row>

        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
          <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        </Form.Item>

        <Space direction="vertical" style={{ marginBottom: 12 }}>
          <Text>Estimated Gross: <Text strong>{formatCurrencyINR(grossPreview)}</Text></Text>
          <Text>Estimated Deductions: <Text strong>{formatCurrencyINR(deductionPreview)}</Text></Text>
          <Text>Estimated Net: <Text strong>{formatCurrencyINR(grossPreview - deductionPreview)}</Text></Text>
        </Space>

        <Space>
          <Button htmlType="reset">Reset</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>{editingId ? "Update" : "Save"}</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default SalaryStructureForm;
