import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { AppstoreOutlined, DollarOutlined, EyeOutlined, WalletOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchBillingPayments,
} from "../../../features/superAdminBillingSlice";

const { Title, Text } = Typography;

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function PaymentsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, payments, loading, error } = useSelector((state) => state.superAdminBilling);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchBillingInvoices());
    dispatch(fetchBillingPayments());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    const totalCollected = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

    return {
      totalInvoiced,
      totalCollected,
      unpaid: invoices.filter((invoice) => ["unpaid", "overdue"].includes(invoice.status)).length,
    };
  }, [invoices]);

  const invoiceRows = invoices.map((invoice) => ({
    key: invoice._id,
    ...invoice,
    schoolName: invoice.schoolId?.name || "-",
  }));

  const paymentRows = payments.map((payment) => ({
    key: payment._id,
    ...payment,
    schoolName: payment.schoolId?.name || "-",
    invoiceNumber: payment.invoiceId?.invoiceNumber || "-",
  }));

  const submitManualPayment = async () => {
    if (!selectedInvoice) return;

    try {
      const values = await paymentForm.validateFields();
      await dispatch(
        addManualSubscriptionPayment({
          invoiceId: selectedInvoice._id,
          payload: {
            amount: values.amount,
            paymentMode: values.paymentMode,
            transactionId: values.transactionId,
            paymentProofUrl: values.paymentProofUrl,
            status: values.status,
          },
        })
      ).unwrap();

      message.success("Payment recorded");
      setPaymentOpen(false);
      paymentForm.resetFields();
      dispatch(fetchBillingInvoices());
      dispatch(fetchBillingPayments());
    } catch (err) {
      message.error(err || "Failed to record payment");
    }
  };

  return (
    <div style={{ background: "#F4F6F5", minHeight: "100vh", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <Title level={3} style={{ marginBottom: 2 }}>Subscription Payments</Title>
          <Text type="secondary">Invoice-level billing and payment tracking for Super Admin.</Text>
        </div>
        <Space>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
          <Button icon={<DollarOutlined />} onClick={() => navigate("/dashboard/superadmin/revenue")}>Revenue</Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} /> : null}

      <Space style={{ width: "100%", marginBottom: 16 }} wrap>
        <Card><Text>Total Invoiced</Text><Title level={4}>{formatCurrency(stats.totalInvoiced)}</Title></Card>
        <Card><Text>Total Collected</Text><Title level={4}>{formatCurrency(stats.totalCollected)}</Title></Card>
        <Card><Text>Pending Invoices</Text><Title level={4}>{stats.unpaid}</Title></Card>
      </Space>

      <Card title="Invoices" style={{ marginBottom: 16 }}>
        <Table
          loading={loading}
          dataSource={invoiceRows}
          rowKey="key"
          locale={{ emptyText: <Empty description="No invoices found" /> }}
          columns={[
            { title: "Invoice", dataIndex: "invoiceNumber" },
            { title: "School", dataIndex: "schoolName" },
            { title: "Amount", dataIndex: "totalAmount", render: (amount) => formatCurrency(amount) },
            { title: "Due Date", dataIndex: "dueDate", render: (date) => new Date(date).toLocaleDateString() },
            {
              title: "Status",
              dataIndex: "status",
              render: (status) => <Tag color={status === "paid" ? "green" : status === "overdue" ? "red" : "blue"}>{status}</Tag>,
            },
            {
              title: "Action",
              render: (_, row) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedInvoice(row);
                      setDetailsOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<WalletOutlined />}
                    onClick={() => {
                      setSelectedInvoice(row);
                      setPaymentOpen(true);
                    }}
                  >
                    Add Payment
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Payment History">
        <Table
          loading={loading}
          dataSource={paymentRows}
          rowKey="key"
          locale={{ emptyText: <Empty description="No payments found" /> }}
          columns={[
            { title: "Invoice", dataIndex: "invoiceNumber" },
            { title: "School", dataIndex: "schoolName" },
            { title: "Mode", dataIndex: "paymentMode" },
            { title: "Amount", dataIndex: "amount", render: (amount) => formatCurrency(amount) },
            { title: "Transaction ID", dataIndex: "transactionId", render: (value) => value || "-" },
            { title: "Status", dataIndex: "status", render: (status) => <Tag>{status}</Tag> },
          ]}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal title="Invoice Details" open={detailsOpen} onCancel={() => setDetailsOpen(false)} footer={null}>
        {selectedInvoice ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text><b>Invoice:</b> {selectedInvoice.invoiceNumber}</Text>
            <Text><b>School:</b> {selectedInvoice.schoolName}</Text>
            <Text><b>Plan Price:</b> {formatCurrency(selectedInvoice.planPrice)}</Text>
            <Text><b>Discount:</b> {formatCurrency(selectedInvoice.discount)}</Text>
            <Text><b>Tax/GST:</b> {formatCurrency(selectedInvoice.taxGst)}</Text>
            <Text><b>Total:</b> {formatCurrency(selectedInvoice.totalAmount)}</Text>
          </Space>
        ) : null}
      </Modal>

      <Modal title="Manual Payment Entry" open={paymentOpen} onCancel={() => setPaymentOpen(false)} onOk={submitManualPayment}>
        <Form form={paymentForm} layout="vertical" initialValues={{ status: "success", paymentMode: "bank transfer" }}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
            <Select options={["cash", "bank transfer", "UPI", "card", "cheque", "gateway"].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="transactionId" label="Transaction ID">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item name="paymentProofUrl" label="Payment Proof URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={["pending", "success", "failed", "refunded"].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
