import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, Input, Row, Select, Space, Table, Tag, Typography } from "antd";
import { AppstoreOutlined, DollarOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { fetchBillingInvoices, fetchRevenueSummary } from "../../../features/superAdminBillingSlice";

const { Title, Text } = Typography;

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function RevenuePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, revenueSummary, loading } = useSelector((state) => state.superAdminBilling);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    dispatch(fetchRevenueSummary());
    dispatch(fetchBillingInvoices());
  }, [dispatch]);

  const rows = useMemo(
    () =>
      invoices.map((invoice) => ({
        key: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        schoolName: invoice.schoolId?.name || "-",
        amount: invoice.totalAmount,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        status: invoice.status,
      })),
    [invoices]
  );

  const filtered = rows.filter((row) => {
    const matchSearch = !search || row.schoolName.toLowerCase().includes(search.toLowerCase()) || row.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !status || row.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <Space align="center"><DollarOutlined style={{ fontSize: 18 }} /><Title level={3} style={{ margin: 0 }}>Revenue Dashboard</Title></Space>
          <Text type="secondary">Invoice-based revenue analytics for Super Admin billing module.</Text>
        </div>
        <Space wrap>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
          <Button type="primary" icon={<WalletOutlined />} onClick={() => navigate("/dashboard/superadmin/payments")}>Payments</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}><Card><Text>Total Invoiced</Text><Title level={4}>{formatCurrency(revenueSummary.totalInvoiced)}</Title></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Text>Total Paid</Text><Title level={4}>{formatCurrency(revenueSummary.totalPaid)}</Title></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Text>Outstanding</Text><Title level={4}>{formatCurrency(revenueSummary.totalOutstanding)}</Title></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Text>Overdue</Text><Title level={4}>{formatCurrency(revenueSummary.overdue)}</Title></Card></Col>
      </Row>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <Space wrap>
            <Input prefix={<SearchOutlined />} placeholder="Search school/invoice" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
            <Select
              allowClear
              placeholder="Status"
              value={status || undefined}
              onChange={(value) => setStatus(value || "")}
              style={{ width: 160 }}
              options={["draft", "unpaid", "paid", "overdue", "cancelled"].map((value) => ({ label: value, value }))}
            />
          </Space>
        </div>

        <Table
          loading={loading}
          columns={[
            { title: "Invoice", dataIndex: "invoiceNumber" },
            { title: "School", dataIndex: "schoolName" },
            { title: "Amount", dataIndex: "amount", render: (amount) => <Text strong>{formatCurrency(amount)}</Text> },
            { title: "Due Date", dataIndex: "dueDate" },
            { title: "Status", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
          ]}
          dataSource={filtered}
          rowKey="key"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
