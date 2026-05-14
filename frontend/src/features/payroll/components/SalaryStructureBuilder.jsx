import React, { useMemo } from "react";
import { Button, Card, Divider, Form, Input, InputNumber, Select, Space, Switch, DatePicker, Statistic, Skeleton } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const defaultEarnings = [
  { name: "Basic Salary", code: "BASIC", type: "earning", value: 0 },
  { name: "HRA", code: "HRA", type: "earning", value: 0 },
  { name: "DA", code: "DA", type: "earning", value: 0 },
  { name: "Transport Allowance", code: "TRANSPORT", type: "earning", value: 0 },
  { name: "Special Allowance", code: "SPECIAL", type: "earning", value: 0 },
  { name: "Bonus", code: "BONUS", type: "earning", value: 0 },
];

const getEmployeeName = (employee) => employee?.userId?.name || employee?.name || employee?.fullName || employee?.email || employee?.userId?.email || "Employee";
const getEmployeeCode = (employee) => employee?.employeeCode || employee?.userId?.regId || employee?.regId || "No code";

const Lines = ({ name, title }) => (
  <Form.List name={name}>
    {(fields, { add, remove }) => (
      <Card title={title} size="small" extra={<Button icon={<PlusOutlined />} onClick={() => add({ type: name === "deductions" ? "deduction" : "earning", value: 0 })}>Add</Button>}>
        {fields.map(({ key, name: row }) => (
          <Space key={key} className="mb-2 flex flex-wrap" align="baseline">
            <Form.Item name={[row, "name"]} rules={[{ required: true }]}><Input placeholder="Name" /></Form.Item>
            <Form.Item name={[row, "code"]}><Input placeholder="Code" /></Form.Item>
            <Form.Item name={[row, "value"]}><InputNumber min={0} placeholder="Amount" /></Form.Item>
            <Button danger icon={<DeleteOutlined />} onClick={() => remove(row)} />
          </Space>
        ))}
      </Card>
    )}
  </Form.List>
);

const SalaryStructureBuilder = ({ form, onFinish, employees = [], employeesLoading = false }) => {
  const values = Form.useWatch([], form) || {};
  const selectedEmployeeId = Form.useWatch("employeeId", form);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: `${getEmployeeName(employee)} (${getEmployeeCode(employee)})`,
      })),
    [employees]
  );

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee._id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const preview = useMemo(() => {
    const sum = (rows = []) => rows.reduce((total, item) => total + Number(item?.value || item?.amount || 0), 0);
    const gross = sum(values.earnings);
    const deductions = sum(values.deductions);
    const employer = sum(values.employerContributions);
    const net = gross - deductions;
    const ctc = gross + employer;
    return { gross, deductions, employer, net, ctc, yearly: ctc * 12 };
  }, [values.earnings, values.deductions, values.employerContributions]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        earnings: defaultEarnings,
        deductions: [],
        employerContributions: [],
        statutoryFlags: { pfEnabled: true, esiEnabled: false, tdsEnabled: false, professionalTaxEnabled: false },
      }}
    >
      <Card title="Employee Salary Structure" className="shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Item label="Employee" name="employeeId" rules={[{ required: true, message: "Employee required" }]}>
            <Select
              showSearch
              loading={employeesLoading}
              optionFilterProp="label"
              placeholder="Select employee"
              notFoundContent={employeesLoading ? <Skeleton active paragraph={false} /> : "No employees found"}
              options={employeeOptions}
            />
          </Form.Item>
          <Form.Item label="Department">
            <Input readOnly placeholder="Auto fetched" value={selectedEmployee?.department || ""} />
          </Form.Item>
          <Form.Item label="Designation">
            <Input readOnly placeholder="Auto fetched" value={selectedEmployee?.designation || ""} />
          </Form.Item>
          <Form.Item label="Effective From" name="effectiveFrom" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item label="Status" name="status"><Select options={["draft", "review", "approved", "inactive"].map((value) => ({ label: value, value }))} /></Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Form.Item label="PF Enabled" name={["statutoryFlags", "pfEnabled"]} valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="ESI Enabled" name={["statutoryFlags", "esiEnabled"]} valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="TDS Enabled" name={["statutoryFlags", "tdsEnabled"]} valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="Professional Tax" name={["statutoryFlags", "professionalTaxEnabled"]} valuePropName="checked"><Switch /></Form.Item>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Lines name="earnings" title="Custom Earnings" />
          <Lines name="deductions" title="Custom Deductions" />
          <Lines name="employerContributions" title="Employer Contributions" />
        </div>
        <Form.Item label="Remarks" name="remarks"><Input.TextArea rows={3} /></Form.Item>
        <Divider />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <Statistic title="Gross" value={preview.gross} prefix="₹" />
          <Statistic title="Deductions" value={preview.deductions} prefix="₹" />
          <Statistic title="Employer" value={preview.employer} prefix="₹" />
          <Statistic title="Net" value={preview.net} prefix="₹" />
          <Statistic title="Monthly CTC" value={preview.ctc} prefix="₹" />
          <Statistic title="Yearly CTC" value={preview.yearly} prefix="₹" />
        </div>
      </Card>
    </Form>
  );
};

export default SalaryStructureBuilder;
