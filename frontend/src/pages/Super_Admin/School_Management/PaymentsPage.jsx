import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  DollarOutlined,
  EyeOutlined,
  WalletOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchBillingPayments,
} from "../../../features/superAdminBillingSlice";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const statusConfig = {
  paid: { label: "Paid", color: "success" },
  success: { label: "Success", color: "success" },
  unpaid: { label: "Unpaid", color: "warning" },
  overdue: { label: "Overdue", color: "error" },
  pending: { label: "Pending", color: "warning" },
  failed: { label: "Failed", color: "error" },
  refunded: { label: "Refunded", color: "purple" },
  cancelled: { label: "Cancelled", color: "default" },
  draft: { label: "Draft", color: "default" },
};

const paymentModeOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Cheque", value: "cheque" },
  { label: "Gateway", value: "gateway" },
];

const MetricCard = ({ title, value, icon, bg, color, sub }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 22,
      height: "100%",
      boxShadow: "0 10px 30px rgba(91,158,201,0.08)",
      overflow: "hidden",
      position: "relative",
    }}
    bodyStyle={{ padding: 20 }}
  >
    <div
      style={{
        position: "absolute",
        right: -30,
        top: -30,
        width: 110,
        height: 110,
        borderRadius: "50%",
        background: bg,
      }}
    />

    <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
      <div>
        <Text style={{ color: "#6B7890", fontWeight: 600 }}>{title}</Text>
        <Statistic
          value={value}
          valueStyle={{
            marginTop: 4,
            color: "#1E2A3A",
            fontWeight: 800,
            fontSize: 26,
          }}
        />
        {sub ? <Text style={{ color: "#A8B8CC", fontSize: 12 }}>{sub}</Text> : null}
      </div>

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
    </Space>
  </Card>
);

export default function PaymentsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    invoices = [],
    payments = [],
    loading = false,
    error,
  } = useSelector((state) => state.superAdminBilling || {});

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");

  const [paymentForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchBillingInvoices());
    dispatch(fetchBillingPayments());
  }, [dispatch]);

  const refreshData = () => {
    dispatch(fetchBillingInvoices());
    dispatch(fetchBillingPayments());
    message.success("Payments data refreshed");
  };

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount || 0),
      0
    );

    const totalCollected = payments
      .filter((payment) => payment.status === "success")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const pendingInvoices = invoices.filter((invoice) =>
      ["unpaid", "overdue"].includes(invoice.status)
    ).length;

    return {
      totalInvoiced,
      totalCollected,
      pendingInvoices,
      totalPayments: payments.length,
    };
  }, [invoices, payments]);

  const invoiceRows = useMemo(
    () =>
      invoices.map((invoice) => ({
        key: invoice._id,
        ...invoice,
        schoolName: invoice.schoolId?.name || "-",
      })),
    [invoices]
  );

  const paymentRows = useMemo(
    () =>
      payments.map((payment) => ({
        key: payment._id,
        ...payment,
        schoolName: payment.schoolId?.name || "-",
        invoiceNumber: payment.invoiceId?.invoiceNumber || "-",
      })),
    [payments]
  );

  const filteredInvoices = useMemo(() => {
    const keyword = invoiceSearch.toLowerCase();

    return invoiceRows.filter((row) => {
      const matchSearch =
        !keyword ||
        String(row.invoiceNumber || "").toLowerCase().includes(keyword) ||
        String(row.schoolName || "").toLowerCase().includes(keyword);

      const matchStatus = !invoiceStatus || row.status === invoiceStatus;

      return matchSearch && matchStatus;
    });
  }, [invoiceRows, invoiceSearch, invoiceStatus]);

  const filteredPayments = useMemo(() => {
    const keyword = paymentSearch.toLowerCase();

    return paymentRows.filter((row) => {
      return (
        !keyword ||
        String(row.invoiceNumber || "").toLowerCase().includes(keyword) ||
        String(row.schoolName || "").toLowerCase().includes(keyword) ||
        String(row.transactionId || "").toLowerCase().includes(keyword)
      );
    });
  }, [paymentRows, paymentSearch]);

  const submitManualPayment = async () => {
    if (!selectedInvoice) return;

    try {
      const values = await paymentForm.validateFields();

      await dispatch(
        addManualSubscriptionPayment({
          invoiceId: selectedInvoice._id,
          payload: {
            amount: Number(values.amount),
            paymentMode: values.paymentMode,
            transactionId: values.transactionId,
            paymentProofUrl: values.paymentProofUrl,
            status: values.status,
          },
        })
      ).unwrap();

      message.success("Payment recorded successfully");
      setPaymentOpen(false);
      setSelectedInvoice(null);
      paymentForm.resetFields();
      dispatch(fetchBillingInvoices());
      dispatch(fetchBillingPayments());
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err || "Failed to record payment");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "#F7F8FC",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(167,199,231,0.3)",
          borderRadius: 20,
          padding: 22,
          marginBottom: 18,
          boxShadow: "0 12px 36px rgba(91,158,201,0.08)",
        }}
      >
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} lg={12}>
            <Space align="center">
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  background: "rgba(184,224,210,0.25)",
                  color: "#5BA89A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                <WalletOutlined />
              </div>

              <div>
                <Title level={3} style={{ margin: 0, color: "#1E2A3A" }}>
                  Subscription Payments
                </Title>
                <Text style={{ color: "#6B7890" }}>
                  Super Admin billing, invoices aur manual payment tracking.
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={12}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshData}>
                Refresh
              </Button>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() => navigate("/dashboard/superadmin/subscriptions")}
              >
                Subscriptions
              </Button>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => navigate("/dashboard/superadmin/revenue")}
              >
                Revenue
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16, borderRadius: 14 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Invoiced"
            value={formatCurrency(stats.totalInvoiced)}
            icon={<FileTextOutlined />}
            bg="rgba(167,199,231,0.2)"
            color="#5B9EC9"
            sub="All generated invoices"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon={<CheckCircleOutlined />}
            bg="rgba(184,224,210,0.2)"
            color="#5BA89A"
            sub="Successful payments"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            icon={<ClockCircleOutlined />}
            bg="rgba(253,226,167,0.25)"
            color="#D4922A"
            sub="Unpaid + overdue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Payment Records"
            value={stats.totalPayments}
            icon={<CreditCardOutlined />}
            bg="rgba(205,180,219,0.2)"
            color="#9B87B8"
            sub="Total payment entries"
          />
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          marginBottom: 18,
          boxShadow: "0 12px 36px rgba(91,158,201,0.08)",
        }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <FileTextOutlined style={{ color: "#5B9EC9" }} />
            <span>Invoices</span>
            <Tag color="blue">{filteredInvoices.length}</Tag>
          </Space>
        }
      >
        <Row gutter={[12, 12]} justify="space-between" style={{ marginBottom: 14 }}>
          <Col xs={24} md={14}>
            <Space wrap>
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: "#A8B8CC" }} />}
                placeholder="Search invoice or school"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                style={{ width: 280, borderRadius: 12 }}
              />

              <Select
                allowClear
                placeholder="Filter status"
                value={invoiceStatus || undefined}
                onChange={(value) => setInvoiceStatus(value || "")}
                style={{ width: 170 }}
                options={["draft", "unpaid", "paid", "overdue", "cancelled"].map(
                  (value) => ({
                    label: statusConfig[value]?.label || value,
                    value,
                  })
                )}
              />
            </Space>
          </Col>
        </Row>

        <Table
          loading={loading}
          dataSource={filteredInvoices}
          rowKey="key"
          scroll={{ x: 850 }}
          locale={{ emptyText: <Empty description="No invoices found" /> }}
          columns={[
            {
              title: "Invoice",
              dataIndex: "invoiceNumber",
              render: (value) => (
                <Space>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: "#e0f2fe",
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileTextOutlined />
                  </div>
                  <Text strong>{value}</Text>
                </Space>
              ),
            },
            {
              title: "School",
              dataIndex: "schoolName",
              render: (value) => (
                <Text style={{ fontWeight: 600, color: "#334155" }}>{value}</Text>
              ),
            },
            {
              title: "Amount",
              dataIndex: "totalAmount",
              render: (amount) => (
                <Text strong style={{ color: "#166534" }}>
                  {formatCurrency(amount)}
                </Text>
              ),
            },
            {
              title: "Due Date",
              dataIndex: "dueDate",
              render: (date) =>
                date ? (
                  <Text style={{ color: "#6B7890" }}>
                    {new Date(date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                ) : (
                  "-"
                ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (status) => (
                <Tag
                  color={statusConfig[status]?.color || "default"}
                  style={{ borderRadius: 999, padding: "2px 10px" }}
                >
                  {statusConfig[status]?.label || status}
                </Tag>
              ),
            },
            {
              title: "Action",
              align: "right",
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

                  <Tooltip title={row.status === "paid" ? "Already paid" : "Record payment"}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<WalletOutlined />}
                      disabled={row.status === "paid"}
                      onClick={() => {
                        setSelectedInvoice(row);
                        paymentForm.setFieldsValue({
                          amount: row.totalAmount,
                          status: "success",
                          paymentMode: "bank_transfer",
                        });
                        setPaymentOpen(true);
                      }}
                    >
                      Add Payment
                    </Button>
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: [8, 16, 32],
          }}
        />
      </Card>

      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          boxShadow: "0 12px 36px rgba(91,158,201,0.08)",
        }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#9B87B8" }} />
            <span>Payment History</span>
            <Tag color="purple">{filteredPayments.length}</Tag>
          </Space>
        }
      >
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: "#A8B8CC" }} />}
          placeholder="Search invoice, school or transaction ID"
          value={paymentSearch}
          onChange={(e) => setPaymentSearch(e.target.value)}
          style={{ width: 320, borderRadius: 12, marginBottom: 14 }}
        />

        <Table
          loading={loading}
          dataSource={filteredPayments}
          rowKey="key"
          scroll={{ x: 850 }}
          locale={{ emptyText: <Empty description="No payments found" /> }}
          columns={[
            { title: "Invoice", dataIndex: "invoiceNumber" },
            {
              title: "School",
              dataIndex: "schoolName",
              render: (value) => (
                <Text style={{ fontWeight: 600, color: "#334155" }}>{value}</Text>
              ),
            },
            {
              title: "Mode",
              dataIndex: "paymentMode",
              render: (value) => <Tag color="blue">{value || "-"}</Tag>,
            },
            {
              title: "Amount",
              dataIndex: "amount",
              render: (amount) => (
                <Text strong style={{ color: "#166534" }}>
                  {formatCurrency(amount)}
                </Text>
              ),
            },
            {
              title: "Transaction ID",
              dataIndex: "transactionId",
              render: (value) => value || "-",
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (status) => (
                <Tag
                  color={statusConfig[status]?.color || "default"}
                  style={{ borderRadius: 999, padding: "2px 10px" }}
                >
                  {statusConfig[status]?.label || status}
                </Tag>
              ),
            },
          ]}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: [8, 16, 32],
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: "#5B9EC9" }} />
            <span>Invoice Details</span>
          </Space>
        }
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedInvoice ? (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Row justify="space-between">
                <Text type="secondary">Invoice</Text>
                <Text strong>{selectedInvoice.invoiceNumber}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">School</Text>
                <Text strong>{selectedInvoice.schoolName}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Plan Price</Text>
                <Text>{formatCurrency(selectedInvoice.planPrice)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Discount</Text>
                <Text>{formatCurrency(selectedInvoice.discount)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Tax/GST</Text>
                <Text>{formatCurrency(selectedInvoice.taxGst)}</Text>
              </Row>

              <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
                <Row justify="space-between">
                  <Text strong>Total Amount</Text>
                  <Text strong style={{ color: "#166534", fontSize: 18 }}>
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </Text>
                </Row>
              </div>
            </Space>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={
          <Space>
            <WalletOutlined style={{ color: "#5BA89A" }} />
            <span>Manual Payment Entry</span>
          </Space>
        }
        open={paymentOpen}
        onCancel={() => {
          setPaymentOpen(false);
          setSelectedInvoice(null);
          paymentForm.resetFields();
        }}
        onOk={submitManualPayment}
        okText="Save Payment"
        width={620}
        destroyOnClose
      >
        {selectedInvoice ? (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text type="secondary">Selected Invoice</Text>
            <div style={{ marginTop: 4 }}>
              <Text strong>{selectedInvoice.schoolName}</Text>{" "}
              <Tag color="blue">{selectedInvoice.invoiceNumber}</Tag>
              <Tag color={statusConfig[selectedInvoice.status]?.color || "default"}>
                {statusConfig[selectedInvoice.status]?.label || selectedInvoice.status}
              </Tag>
            </div>
          </div>
        ) : null}

        <Form
          form={paymentForm}
          layout="vertical"
          initialValues={{ status: "success", paymentMode: "bank_transfer" }}
        >
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber min={1} prefix="₹" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="paymentMode"
            label="Payment Mode"
            rules={[{ required: true, message: "Please select payment mode" }]}
          >
            <Select options={paymentModeOptions} />
          </Form.Item>

          <Form.Item name="transactionId" label="Transaction ID">
            <Input placeholder="Optional reference/transaction ID" />
          </Form.Item>

          <Form.Item name="paymentProofUrl" label="Payment Proof URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              options={["pending", "success", "failed", "refunded"].map((value) => ({
                label: statusConfig[value]?.label || value,
                value,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}