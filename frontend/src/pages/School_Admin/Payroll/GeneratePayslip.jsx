import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Layout,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, FileSearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";

const { Content } = Layout;
const { Text, Title } = Typography;

const money = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([]);
  const [cycleEntries, setCycleEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPayslip, setFetchingPayslip] = useState(false);

  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const loadEmployees = async () => {
    const response = await httpClient.get("/employee");
    setEmployees(response?.data?.data || []);
  };

  const loadCycle = async () => {
    setLoading(true);
    try {
      const response = await httpClient.get(`/payroll/cycle/${month}/${year}`);
      setCycleEntries(response?.data?.data?.entries || []);
    } catch (error) {
      if (error?.response?.status === 404) {
        setCycleEntries([]);
        return;
      }
      message.error(error?.response?.data?.message || "Cycle load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees().catch(() => message.error("Employees load failed"));
  }, []);

  useEffect(() => {
    loadCycle().catch(() => {});
    setPayslip(null);
  }, [month, year]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: `${employee.userId?.name || "Employee"} (${employee.designation || "Staff"})`,
      })),
    [employees]
  );

  const handleFetchPayslip = async (employeeIdOverride) => {
    const employeeId = employeeIdOverride || selectedEmployeeId;
    if (!employeeId) {
      message.warning("Employee select karo");
      return;
    }

    setFetchingPayslip(true);
    try {
      const response = await httpClient.get(`/payroll/payslip/${employeeId}/${month}/${year}`);
      setPayslip(response?.data?.data || null);
      message.success("Payslip loaded");
    } catch (error) {
      setPayslip(null);
      message.error(error?.response?.data?.message || "Payslip fetch failed");
    } finally {
      setFetchingPayslip(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const entriesColumns = [
    {
      title: "Employee",
      render: (_, record) => record.employeeId?.userId?.name || "-",
    },
    {
      title: "Net Pay",
      dataIndex: "netPay",
      render: (value) => <Text strong>{money(value)}</Text>,
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      render: (status) => <Tag color={status === "paid" ? "green" : "orange"}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          icon={<FileSearchOutlined />}
          onClick={() => {
            const employeeId = record.employeeId?._id;
            setSelectedEmployeeId(employeeId);
            handleFetchPayslip(employeeId);
          }}
        >
          View Payslip
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Payslip Center</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Card style={{ marginBottom: 16 }}>
          <Form layout="inline">
            <Form.Item label="Month">
              <DatePicker picker="month" value={selectedMonth} onChange={(value) => value && setSelectedMonth(value)} />
            </Form.Item>
            <Form.Item label="Employee">
              <Select
                style={{ minWidth: 320 }}
                showSearch
                optionFilterProp="label"
                placeholder="Employee select karo"
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                options={employeeOptions}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadCycle} loading={loading}>
                  Refresh
                </Button>
                <Button type="primary" icon={<FileSearchOutlined />} onClick={handleFetchPayslip} loading={fetchingPayslip}>
                  Fetch Payslip
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handlePrint} disabled={!payslip}>
                  Print / Download PDF
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title={`Payroll Entries - ${selectedMonth.format("MMMM YYYY")}`}>
              {cycleEntries.length === 0 ? (
                <Alert type="info" showIcon message="No cycle entries" description="Pehle payroll cycle generate karo." />
              ) : (
                <Table rowKey="_id" columns={entriesColumns} dataSource={cycleEntries} pagination={{ pageSize: 6 }} loading={loading} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Payslip Preview">
              <Spin spinning={fetchingPayslip}>
                {!payslip?.entry ? (
                  <Empty description="Employee and month select karke payslip fetch karo" />
                ) : (
                  <>
                    <Title level={5} style={{ marginTop: 0 }}>
                      {payslip.entry.employeeId?.userId?.name}
                    </Title>
                    <Text type="secondary">
                      {selectedMonth.format("MMMM YYYY")} • {payslip.entry.employeeId?.designation || "Staff"}
                    </Text>

                    <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
                      <Descriptions.Item label="Working Days">{payslip.entry.workingDays}</Descriptions.Item>
                      <Descriptions.Item label="Present Days">{payslip.entry.presentDays}</Descriptions.Item>
                      <Descriptions.Item label="Paid Leaves">{payslip.entry.paidLeaves}</Descriptions.Item>
                      <Descriptions.Item label="LOP Days">{payslip.entry.lopDays}</Descriptions.Item>
                      <Descriptions.Item label="Gross Earnings">{money(payslip.entry.grossEarnings)}</Descriptions.Item>
                      <Descriptions.Item label="Total Deductions">{money(payslip.entry.totalDeductions)}</Descriptions.Item>
                      <Descriptions.Item label="Net Pay">
                        <Text strong>{money(payslip.entry.netPay)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Status">
                        <Tag color={payslip.entry.paymentStatus === "paid" ? "green" : "orange"}>
                          {payslip.entry.paymentStatus?.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </>
                )}
              </Spin>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default GeneratePayslip;
