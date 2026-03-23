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
  InputNumber,
  message,
  Card,
  Row,
  Col,
  DatePicker,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
const { Content } = Layout;

const EmployeeSalaries = () => {
  const [salaries, setSalaries] = useState([
    { key: 1, name: "John Doe", role: "Teacher", salary: 30000, paid: 15000, pending: 15000, paymentDate: null },
    { key: 2, name: "Jane Smith", role: "Admin", salary: 25000, paid: 25000, pending: 0, paymentDate: "2026-01-01" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Add/Edit salary
  const handleSaveSalary = (values) => {
    const newRecord = {
      key: editingRecord ? editingRecord.key : salaries.length + 1,
      name: values.name,
      role: values.role,
      salary: values.salary,
      paid: values.paid,
      pending: values.salary - values.paid,
      paymentDate: values.paymentDate ? values.paymentDate.format("YYYY-MM-DD") : null,
    };

    if (editingRecord) {
      setSalaries(salaries.map((r) => (r.key === editingRecord.key ? newRecord : r)));
      message.success("Salary record updated successfully!");
    } else {
      setSalaries([...salaries, newRecord]);
      message.success("Salary record added successfully!");
    }

    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleEditSalary = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
    });
    setModalVisible(true);
  };

  const handleDeleteSalary = (record) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete salary record for ${record.name}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setSalaries(salaries.filter((r) => r.key !== record.key));
        message.success("Salary record deleted successfully!");
      },
    });
  };

  const handleMarkPaid = (record) => {
    const updatedRecord = { ...record, paid: record.salary, pending: 0, paymentDate: new Date().toISOString().split("T")[0] };
    setSalaries(salaries.map((r) => (r.key === record.key ? updatedRecord : r)));
    message.success(`Salary for ${record.name} marked as paid!`);
  };

  // Summary
  const totalEmployees = salaries.length;
  const totalPaid = salaries.reduce((acc, r) => acc + r.paid, 0);
  const totalPending = salaries.reduce((acc, r) => acc + r.pending, 0);

  const columns = [
    { title: "Employee Name", dataIndex: "name", key: "name" },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Salary", dataIndex: "salary", key: "salary" },
    { title: "Paid", dataIndex: "paid", key: "paid" },
    { title: "Pending", dataIndex: "pending", key: "pending" },
    { title: "Payment Date", dataIndex: "paymentDate", key: "paymentDate" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<CheckOutlined />} type="primary" disabled={record.pending === 0} onClick={() => handleMarkPaid(record)}>
            Mark Paid
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleEditSalary(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteSalary(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>HR</Breadcrumb.Item>
        <Breadcrumb.Item>Employee Salaries</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card title="Total Employees">{totalEmployees}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Paid">{totalPaid}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Pending">{totalPending}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Employee Salaries</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add Salary</Button>
        </div>

        <Table columns={columns} dataSource={salaries} pagination={{ pageSize: 5 }} rowKey="key" />

        {/* Add/Edit Modal */}
        <Modal
          title={editingRecord ? "Edit Salary" : "Add Salary"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingRecord(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveSalary}>
            <Form.Item label="Employee Name" name="name" rules={[{ required: true, message: "Enter employee name" }]}>
              <Input placeholder="Enter employee name" />
            </Form.Item>
            <Form.Item label="Role" name="role" rules={[{ required: true, message: "Enter role" }]}>
              <Input placeholder="Enter role" />
            </Form.Item>
            <Form.Item label="Salary" name="salary" rules={[{ required: true, message: "Enter salary" }]}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Enter salary" />
            </Form.Item>
            <Form.Item label="Paid" name="paid" rules={[{ required: true, message: "Enter paid amount" }]}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Enter paid amount" />
            </Form.Item>
            <Form.Item label="Payment Date" name="paymentDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); setEditingRecord(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default EmployeeSalaries;
