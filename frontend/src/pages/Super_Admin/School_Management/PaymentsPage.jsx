import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  EyeOutlined,
  WalletOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchBillingPayments,
} from "../../../features/superAdminBillingSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, modalTitle,
} from "../../../styles/pageStyles";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const statusConfig = {
  paid: { label: "Paid", color: "var(--success-hover)", bg: "var(--success-light)" },
  success: { label: "Success", color: "var(--success-hover)", bg: "var(--success-light)" },
  unpaid: { label: "Unpaid", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  overdue: { label: "Overdue", color: "var(--danger-hover)", bg: "var(--danger-light)" },
  pending: { label: "Pending", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  failed: { label: "Failed", color: "var(--danger-hover)", bg: "var(--danger-light)" },
  refunded: { label: "Refunded", color: "var(--purple-hover)", bg: "rgba(var(--purple-rgb), 0.12)" },
  cancelled: { label: "Cancelled", color: "var(--text-secondary)", bg: "var(--surface-soft)" },
  draft: { label: "Draft", color: "var(--text-secondary)", bg: "var(--surface-soft)" },
};

const paymentModeOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank transfer" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "card" },
  { label: "Cheque", value: "cheque" },
  { label: "Gateway", value: "gateway" },
];

const MetricCard = ({ title, value, icon, color, sub }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 0 }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
    <div style={iconWell(color, 44)}>{icon}</div>
  </div>
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
    <div style={pageWrapper}>
      <PageHeader
        title="Subscription Payments"
        subtitle="Super Admin billing, invoices aur manual payment tracking"
        icon={<WalletOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
            <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
            <Button type="primary" icon={<RupeeIcon />} onClick={() => navigate("/dashboard/superadmin/revenue")}>Revenue</Button>
          </Space>
        }
      />

      <div style={{ marginTop: 20 }}>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 14 }} /> : null}

        <div style={{ ...statGrid(200), marginBottom: 20 }}>
          <MetricCard title="Total Invoiced" value={formatCurrency(stats.totalInvoiced)} icon={<FileTextOutlined />} color="var(--primary)" sub="All generated invoices" />
          <MetricCard title="Total Collected" value={formatCurrency(stats.totalCollected)} icon={<CheckCircleOutlined />} color="var(--success)" sub="Successful payments" />
          <MetricCard title="Pending Invoices" value={stats.pendingInvoices} icon={<ClockCircleOutlined />} color="var(--warning)" sub="Unpaid + overdue" />
          <MetricCard title="Payment Records" value={stats.totalPayments} icon={<CreditCardOutlined />} color="var(--accent)" sub="Total payment entries" />
        </div>

        <style>{tableHeadCss("payments-invoices-tbl")}</style>
        <style>{tableHeadCss("payments-history-tbl")}</style>

        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <FileTextOutlined style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Invoices</span>
            <span style={pill("var(--primary)")}>{filteredInvoices.length}</span>

            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search invoice or school"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              style={{ width: 260, marginLeft: "auto" }}
            />
            <Select
              allowClear
              placeholder="Filter status"
              value={invoiceStatus || undefined}
              onChange={(value) => setInvoiceStatus(value || "")}
              style={{ width: 170 }}
              options={["draft", "unpaid", "paid", "overdue", "cancelled"].map((value) => ({
                label: statusConfig[value]?.label || value,
                value,
              }))}
            />
          </div>

          <div className="payments-invoices-tbl" style={tableContainer}>
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
                      <div style={iconWell("var(--primary)", 34)}><FileTextOutlined /></div>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{value}</span>
                    </Space>
                  ),
                },
                {
                  title: "School",
                  dataIndex: "schoolName",
                  render: (value) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>,
                },
                {
                  title: "Amount",
                  dataIndex: "totalAmount",
                  render: (amount) => <span style={{ fontWeight: 700, color: "var(--success-hover)" }}>{formatCurrency(amount)}</span>,
                },
                {
                  title: "Due Date",
                  dataIndex: "dueDate",
                  render: (date) =>
                    date ? (
                      <span style={{ color: "var(--text-muted)" }}>
                        {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    ) : (
                      "-"
                    ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  render: (status) => (
                    <span style={pill(statusConfig[status]?.color || "var(--text-secondary)", statusConfig[status]?.bg)}>
                      {statusConfig[status]?.label || status}
                    </span>
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
                              paymentMode: "bank transfer",
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
              pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }}
            />
          </div>
        </div>

        <div style={{ ...sectionPanel, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <CreditCardOutlined style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Payment History</span>
            <span style={pill("var(--accent)")}>{filteredPayments.length}</span>

            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search invoice, school or transaction ID"
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              style={{ width: 320, marginLeft: "auto" }}
            />
          </div>

          <div className="payments-history-tbl" style={tableContainer}>
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
                  render: (value) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>,
                },
                {
                  title: "Mode",
                  dataIndex: "paymentMode",
                  render: (value) => <Tag color="blue">{value || "-"}</Tag>,
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  render: (amount) => <span style={{ fontWeight: 700, color: "var(--success-hover)" }}>{formatCurrency(amount)}</span>,
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
                    <span style={pill(statusConfig[status]?.color || "var(--text-secondary)", statusConfig[status]?.bg)}>
                      {statusConfig[status]?.label || status}
                    </span>
                  ),
                },
              ]}
              pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }}
            />
          </div>
        </div>
      </div>

      <Modal
        title={modalTitle(<EyeOutlined />, "Invoice Details")}
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedInvoice ? (
          <div style={{ ...sectionPanel, marginBottom: 0, background: "var(--surface-soft)" }}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Invoice</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedInvoice.invoiceNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>School</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedInvoice.schoolName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Plan Price</span>
                <span style={{ color: "var(--text-primary)" }}>{formatCurrency(selectedInvoice.planPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Discount</span>
                <span style={{ color: "var(--text-primary)" }}>{formatCurrency(selectedInvoice.discount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Tax/GST</span>
                <span style={{ color: "var(--text-primary)" }}>{formatCurrency(selectedInvoice.taxGst)}</span>
              </div>

              <div style={{ borderTop: "1px dashed var(--border-muted)", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Total Amount</span>
                  <span style={{ fontWeight: 700, color: "var(--success-hover)", fontSize: 18 }}>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </Space>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={modalTitle(<WalletOutlined />, "Manual Payment Entry")}
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
          <div style={{ ...sectionPanel, padding: 12, background: "var(--surface-soft)" }}>
            <span style={{ color: "var(--text-muted)" }}>Selected Invoice</span>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedInvoice.schoolName}</span>{" "}
              <Tag color="blue">{selectedInvoice.invoiceNumber}</Tag>
              <span style={pill(statusConfig[selectedInvoice.status]?.color || "var(--text-secondary)", statusConfig[selectedInvoice.status]?.bg)}>
                {statusConfig[selectedInvoice.status]?.label || selectedInvoice.status}
              </span>
            </div>
          </div>
        ) : null}

        <Form
          form={paymentForm}
          layout="vertical"
          initialValues={{ status: "success", paymentMode: "bank transfer" }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Please enter amount" }]}>
            <InputNumber min={1} prefix="₹" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true, message: "Please select payment mode" }]}>
            <Select options={paymentModeOptions} />
          </Form.Item>

          <Form.Item name="transactionId" label="Transaction ID">
            <Input placeholder="Optional reference/transaction ID" />
          </Form.Item>

          <Form.Item name="paymentProofUrl" label="Payment Proof URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
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
