import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Descriptions, Empty, Row, Spin, Table, Tabs, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import httpClient from "../../api/httpClient";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text } = Typography;

const breakdownColumns = [
  { title: "Head", dataIndex: "label" },
  { title: "Amount", dataIndex: "value", align: "right", render: (value) => formatCurrencyINR(value) },
];

const toRows = (breakdown = {}) =>
  Object.entries(breakdown || {}).map(([key, value]) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
    value,
  }));

export default function PayrollSelfServicePage() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const payslips = useMemo(() => (Array.isArray(summary?.payslips) ? summary.payslips : []), [summary]);
  const latestPayslip = payslips[0];

  useEffect(() => {
    setLoading(true);
    httpClient
      .get("/payroll/self/summary")
      .then((response) => setSummary(response?.data?.data || null))
      .catch((error) => {
        setSummary(null);
        message.error(error?.response?.data?.message || "Payroll self-service data load failed");
      })
      .finally(() => setLoading(false));
  }, []);

  const payslipColumns = [
    {
      title: "Month",
      render: (_, record) => dayjs(`${record.year}-${String(record.month).padStart(2, "0")}-01`).format("MMMM YYYY"),
    },
    { title: "Gross", dataIndex: "grossEarnings", align: "right", render: (value) => formatCurrencyINR(value) },
    { title: "Deductions", dataIndex: "totalDeductions", align: "right", render: (value) => formatCurrencyINR(value) },
    { title: "Net Pay", dataIndex: "netPay", align: "right", render: (value) => <Text strong>{formatCurrencyINR(value)}</Text> },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (status) => <Tag color={status === "paid" ? "green" : "gold"}>{String(status || "pending").toUpperCase()}</Tag>,
    },
    { title: "Transaction", dataIndex: "transactionRef", render: (value) => value || "-" },
  ];

  return (
    <Spin spinning={loading}>
      <Tabs
        items={[
          {
            key: "payslips",
            label: "My Payslips",
            children: (
              <Card title="Payroll History">
                {!payslips.length ? (
                  <Empty description="No payslips generated yet" />
                ) : (
                  <Table rowKey="_id" dataSource={payslips} columns={payslipColumns} pagination={{ pageSize: 8 }} />
                )}
              </Card>
            ),
          },
          {
            key: "breakdown",
            label: "Salary Breakdown",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card title="Active Structure">
                    {summary?.structure ? (
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Basic">{formatCurrencyINR(summary.structure.basic)}</Descriptions.Item>
                        <Descriptions.Item label="HRA">{formatCurrencyINR(summary.structure.hra)}</Descriptions.Item>
                        <Descriptions.Item label="DA">{formatCurrencyINR(summary.structure.da)}</Descriptions.Item>
                        <Descriptions.Item label="Special Allowance">
                          {formatCurrencyINR(summary.structure.specialAllowance)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Gross Monthly">
                          <Text strong>{formatCurrencyINR(summary.structure.grossMonthly)}</Text>
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Alert type="info" showIcon message="Salary structure is not assigned yet." />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="Latest Earnings">
                    <Table
                      rowKey="key"
                      size="small"
                      columns={breakdownColumns}
                      dataSource={toRows(latestPayslip?.earningsBreakdown)}
                      pagination={false}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="Latest Deductions">
                    <Table
                      rowKey="key"
                      size="small"
                      columns={breakdownColumns}
                      dataSource={toRows(latestPayslip?.deductionsBreakdown)}
                      pagination={false}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "attendance",
            label: "Payroll Attendance",
            children: latestPayslip ? (
              <Card title="Latest Payroll Attendance">
                <Descriptions column={{ xs: 1, md: 4 }} bordered>
                  <Descriptions.Item label="Working Days">{latestPayslip.workingDays}</Descriptions.Item>
                  <Descriptions.Item label="Present Days">{latestPayslip.presentDays}</Descriptions.Item>
                  <Descriptions.Item label="Paid Leaves">{latestPayslip.paidLeaves}</Descriptions.Item>
                  <Descriptions.Item label="LOP Days">{latestPayslip.lopDays}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : (
              <Card>
                <Empty description="Payroll attendance appears after monthly run is generated" />
              </Card>
            ),
          },
        ]}
      />
    </Spin>
  );
}