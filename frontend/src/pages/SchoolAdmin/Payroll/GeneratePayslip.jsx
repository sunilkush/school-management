import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([
    {
      key: 1,
      name: "John Doe",
      role: "Teacher",
      salary: 30000,
      deductions: 2000,
      netSalary: 28000,
    },
    {
      key: 2,
      name: "Jane Smith",
      role: "Admin",
      salary: 25000,
      deductions: 1000,
      netSalary: 24000,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form] = Form.useForm();

  const handleGeneratePayslip = (values) => {
    message.success(
      `Payslip generated for ${values.name} for ${values.month.format(
        "MMMM YYYY"
      )}`
    );
    setModalVisible(false);
    setSelectedEmployee(null);
    form.resetFields();
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue({
      name: employee.name,
      role: employee.role,
      month: dayjs(),
    });
    setModalVisible(true);
  };

  const columns = [
    { title: "Employee Name", dataIndex: "name", key: "name" },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Salary", dataIndex: "salary", key: "salary" },
    { title: "Deductions", dataIndex: "deductions", key: "deductions" },
    { title: "Net Salary", dataIndex: "netSalary", key: "netSalary" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => openModal(record)}
        >
          Generate Payslip
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Generate Payslip</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Employees">{employees.length}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <h2>Employee Salaries</h2>
        </div>

        <Table columns={columns} dataSource={employees} rowKey="key" />

        {/* Generate Payslip Modal */}
        <Modal
          title={`Generate Payslip for ${selectedEmployee?.name || ""}`}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedEmployee(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleGeneratePayslip}>
            <Form.Item label="Employee Name" name="name">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Role" name="role">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Select Month"
              name="month"
              rules={[{ required: true, message: "Please select month" }]}
            >
              <DatePicker picker="month" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedEmployee(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Generate
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default GeneratePayslip;
