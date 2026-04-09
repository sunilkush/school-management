import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  Layout,
  Modal,
  Row,
  Space,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckOutlined, LockOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";

const { Content } = Layout;
const { Text } = Typography;

const money = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const EmployeeSalaries = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [filters, setFilters] = useState({ month: dayjs().month() + 1, year: dayjs().year() });

  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadEmployees = async () => {
    const response = await httpClient.get("/employee");
    const rows = response?.data?.data || [];
    setEmployees(rows);
  };

  const fetchCycle = async (month = filters.month, year = filters.year) => {
    setLoading(true);
    try {
      const response = await httpClient.get(`/payroll/cycle/${month}/${year}`);
      const payload = response?.data?.data || {};
      setCycle(payload.cycle || null);
      setEntries(payload.entries || []);
    } catch (error) {
      if (error?.response?.status === 404) {
        setCycle(null);
        setEntries([]);
        return;
      }
      message.error(error?.response?.data?.message || "Payroll cycle fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees().catch(() => message.error("Employees load failed"));
  }, []);

  useEffect(() => {
    fetchCycle().catch(() => {});
  }, [filters.month, filters.year]);

  const summary = useMemo(() => {
    return entries.reduce(
      (acc, row) => {
        acc.totalEmployees += 1;
        acc.totalGross += row.grossEarnings || 0;
        acc.totalDeductions += row.totalDeductions || 0;
        acc.totalNet += row.netPay || 0;
        if (row.paymentStatus === "pending") acc.unpaid += 1;
        return acc;
      },
      { totalEmployees: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, unpaid: 0 }
    );
  }, [entries]);

  const selectedMonth = dayjs(`${filters.year}-${String(filters.month).padStart(2, "0")}-01`);

  const handleMonthChange = (value) => {
    if (!value) return;
    setFilters({ month: value.month() + 1, year: value.year() });
  };

  const handleCreateStructure = async (values) => {
    try {
      await httpClient.post("/payroll/structure", {
        ...values,
        effectiveFrom: values.effectiveFrom.toISOString(),
        effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : null,
      });
      message.success("Salary structure saved");
      setStructureModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.response?.data?.message || "Salary structure save failed");
    }
  };

  const handleGenerateCycle = async () => {
    try {
      await httpClient.post("/payroll/cycle/generate", {
        month: filters.month,
        year: filters.year,
      });
      message.success("Payroll cycle generated");
      await fetchCycle(filters.month, filters.year);
    } catch (error) {
      message.error(error?.response?.data?.message || "Cycle generation failed");
    }
  };

  const handleLockCycle = async () => {
    if (!cycle?._id) return;
    try {
      await httpClient.post(`/payroll/cycle/${cycle._id}/lock`, {});
      message.success("Payroll cycle locked");
      await fetchCycle(filters.month, filters.year);
    } catch (error) {
      message.error(error?.response?.data?.message || "Unable to lock cycle");
    }
  };

  const handlePayCycle = async () => {
    if (!cycle?._id) return;
    try {
      await httpClient.post(`/payroll/cycle/${cycle._id}/pay`, {
        transactionRefPrefix: `SAL-${filters.year}${String(filters.month).padStart(2, "0")}`,
      });
      message.success("Payroll marked as paid");
      await fetchCycle(filters.month, filters.year);
    } catch (error) {
      message.error(error?.response?.data?.message || "Unable to mark paid");
    }
  };

  const columns = [
    {
      title: "Employee",
      render: (_, record) => record.employeeId?.userId?.name || "-",
    },
    {
      title: "Department",
      render: (_, record) => record.employeeId?.department || "-",
    },
    {
      title: "Attendance",
      render: (_, record) => (
        <Text>
          {record.presentDays}/{record.workingDays} ({record.lopDays} LOP)
        </Text>
      ),
    },
    {
      title: "Gross",
      dataIndex: "grossEarnings",
      render: (value) => money(value),
    },
    {
      title: "Deductions",
      dataIndex: "totalDeductions",
      render: (value) => money(value),
    },
    {
      title: "Net Pay",
      dataIndex: "netPay",
      render: (value) => <Text strong>{money(value)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (value) => <Tag color={value === "paid" ? "green" : "orange"}>{value?.toUpperCase()}</Tag>,
    },
    {
      title: "Warnings",
      dataIndex: "warnings",
      render: (warnings = []) =>
        warnings.length ? (
          <Space direction="vertical" size={4}>
            {warnings.map((warning) => (
              <Tag key={warning} color="gold">
                {warning}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Monthly Run</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <DatePicker picker="month" value={selectedMonth} onChange={handleMonthChange} />
            <Button icon={<ReloadOutlined />} onClick={() => fetchCycle(filters.month, filters.year)} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setStructureModalOpen(true)}>
              Add Salary Structure
            </Button>
            <Button type="primary" onClick={handleGenerateCycle} disabled={Boolean(cycle)}>
              Generate Cycle
            </Button>
            <Button icon={<LockOutlined />} onClick={handleLockCycle} disabled={!cycle || cycle.status !== "draft"}>
              Lock Cycle
            </Button>
            <Button icon={<CheckOutlined />} onClick={handlePayCycle} disabled={!cycle || cycle.status !== "locked"}>
              Mark Paid
            </Button>
            {cycle && <Tag color="blue">Cycle Status: {cycle.status.toUpperCase()}</Tag>}
          </Space>
        </Card>

        {!cycle && (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="No payroll cycle found"
            description="Is month ke liye cycle generate karo, then review/lock/pay flow use karo."
          />
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card title="Employees">{summary.totalEmployees}</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Gross">{money(summary.totalGross)}</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Deductions">{money(summary.totalDeductions)}</Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title="Unpaid">{summary.unpaid}</Card>
          </Col>
        </Row>

        <Table
          loading={loading}
          columns={columns}
          dataSource={entries}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />

        <Modal
          title="Create Salary Structure"
          open={structureModalOpen}
          onCancel={() => {
            setStructureModalOpen(false);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleCreateStructure}>
            <Form.Item label="Employee" name="employeeId" rules={[{ required: true, message: "Employee select karo" }]}>
              <Select
                showSearch
                placeholder="Select employee"
                optionFilterProp="label"
                options={employees.map((emp) => ({
                  value: emp._id,
                  label: `${emp.userId?.name || "Employee"} (${emp.designation || "Staff"})`,
                }))}
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Basic" name="basic" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="HRA" name="hra" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="DA" name="da" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Special Allowance" name="specialAllowance" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Gross Monthly" name="grossMonthly" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Effective From" name="effectiveFrom" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Effective To" name="effectiveTo">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Status" name="status" initialValue="active" rules={[{ required: true }]}>
              <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
            </Form.Item>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setStructureModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  Save Structure
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default EmployeeSalaries;
