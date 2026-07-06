import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  PlusOutlined,
  SearchOutlined,
  WalletOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchRevenueSummary,
  generateSchoolInvoice,
} from "../../../features/superAdminBillingSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, toolbarRow, modalTitle,
} from "../../../styles/pageStyles";

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusMap = {
  draft: { color: "#64748B", bg: "rgba(241,245,249,0.6)", label: "Draft" },
  unpaid: { color: "#B45309", bg: "rgba(254,243,199,0.5)", label: "Unpaid" },
  paid: { color: "#15803D", bg: "rgba(220,252,231,0.5)", label: "Paid" },
  overdue: { color: "#DC2626", bg: "rgba(254,226,226,0.5)", label: "Overdue" },
  cancelled: { color: "#64748B", bg: "rgba(241,245,249,0.6)", label: "Cancelled" },
};

const paymentModes = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Cheque", value: "cheque" },
];

const invoiceStatuses = ["draft", "unpaid", "paid", "overdue", "cancelled"].map(
  (value) => ({
    label: statusMap[value]?.label || value,
    value,
  })
);

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

export default function RevenuePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    invoices = [],
    revenueSummary = {},
    loading = false,
  } = useSelector((state) => state?.superAdminBilling || {});

  const { schools = [] } = useSelector((state) => state?.school || {});

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchRevenueSummary());
    dispatch(fetchBillingInvoices());
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchRevenueSummary());
    dispatch(fetchBillingInvoices());
    message.success("Revenue data refreshed");
  };

  const rows = useMemo(
    () =>
      invoices.map((invoice) => ({
        key: invoice._id,
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber || "-",
        schoolName: invoice.schoolId?.name || "-",
        amount: Number(invoice.totalAmount || 0),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
        status: invoice.status || "draft",
      })),
    [invoices]
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        !keyword ||
        row.schoolName.toLowerCase().includes(keyword) ||
        row.invoiceNumber.toLowerCase().includes(keyword);

      const matchStatus = !status || row.status === status;

      return matchSearch && matchStatus;
    });
  }, [rows, search, status]);

  const handleCreateInvoice = async () => {
    try {
      const values = await invoiceForm.validateFields();

      await dispatch(
        generateSchoolInvoice({
          schoolId: values.schoolId,
          payload: {
            discount: Number(values.discount || 0),
            taxGst: Number(values.taxGst || 0),
            dueDate: values.dueDate
              ? values.dueDate.toDate().toISOString()
              : undefined,
            status: values.status || "unpaid",
          },
        })
      ).unwrap();

      message.success("Invoice generated successfully");
      setInvoiceOpen(false);
      invoiceForm.resetFields();
      handleRefresh();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error || "Invoice generation failed");
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice?._id) return;

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
            status: values.status || "success",
          },
        })
      ).unwrap();

      message.success("Payment recorded successfully");
      setPaymentOpen(false);
      setSelectedInvoice(null);
      paymentForm.resetFields();
      handleRefresh();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error || "Payment save failed");
    }
  };

  const columns = [
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      render: (value) => (
        <Space>
          <div style={iconWell("#2563EB", 34)}><FileTextOutlined /></div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{value}</span>
        </Space>
      ),
    },
    {
      title: "School",
      dataIndex: "schoolName",
      render: (value) => <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount) => <span style={{ fontWeight: 700, color: "#15803D" }}>{formatCurrency(amount)}</span>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (value) => <span style={{ color: "var(--text-muted)" }}>{value}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => {
        const cfg = statusMap[value] || statusMap.draft;
        return <span style={pill(cfg.color, cfg.bg)}>{cfg.label}</span>;
      },
    },
    {
      title: "Action",
      align: "right",
      render: (_, row) => (
        <Tooltip title={row.status === "paid" ? "Already paid" : "Record payment"}>
          <Button
            size="small"
            type="primary"
            icon={<WalletOutlined />}
            disabled={row.status === "paid"}
            onClick={() => {
              setSelectedInvoice(row);
              paymentForm.setFieldsValue({
                amount: row.amount,
                status: "success",
              });
              setPaymentOpen(true);
            }}
          >
            Add Payment
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Revenue Dashboard"
        subtitle="Super Admin billing, invoices, payments aur revenue tracking"
        icon={<RupeeIcon />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Refresh</Button>
            <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
            <Button icon={<WalletOutlined />} onClick={() => navigate("/dashboard/superadmin/payments")}>Payments</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvoiceOpen(true)}>Create Invoice</Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(200), marginTop: 20 }}>
        <MetricCard title="Total Invoiced" value={formatCurrency(revenueSummary.totalInvoiced)} icon={<FileTextOutlined />} color="#2563EB" sub="All generated invoices" />
        <MetricCard title="Total Paid" value={formatCurrency(revenueSummary.totalPaid)} icon={<CheckCircleOutlined />} color="#22C55E" sub="Received payments" />
        <MetricCard title="Outstanding" value={formatCurrency(revenueSummary.totalOutstanding)} icon={<ClockCircleOutlined />} color="#F59E0B" sub="Pending collection" />
        <MetricCard title="Overdue" value={formatCurrency(revenueSummary.overdue)} icon={<WarningOutlined />} color="#EF4444" sub="Needs follow-up" />
      </div>

      <style>{tableHeadCss("revenue-page-tbl")}</style>

      <div style={sectionPanel}>
        <div style={toolbarRow}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by school or invoice no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Filter status"
            value={status || undefined}
            onChange={(value) => setStatus(value || "")}
            style={{ width: 170 }}
            options={invoiceStatuses}
          />
          <span style={{ ...pill("var(--primary)"), marginLeft: "auto" }}>{filtered.length} invoices</span>
        </div>

        <div className="revenue-page-tbl" style={tableContainer}>
          <Table
            loading={loading}
            columns={columns}
            dataSource={filtered}
            rowKey="key"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
            scroll={{ x: 850 }}
          />
        </div>
      </div>

      <Modal
        title={modalTitle(<FileTextOutlined />, "Create Invoice")}
        open={invoiceOpen}
        onCancel={() => {
          setInvoiceOpen(false);
          invoiceForm.resetFields();
        }}
        onOk={handleCreateInvoice}
        okText="Create Invoice"
        width={620}
        destroyOnClose
      >
        <Form form={invoiceForm} layout="vertical" style={{ marginTop: 18 }}>
          <Form.Item
            label="School"
            name="schoolId"
            rules={[{ required: true, message: "Please select a school" }]}
          >
            <Select
              showSearch
              placeholder="Select school"
              optionFilterProp="label"
              options={schools.map((school) => ({
                label: school?.name || "Unnamed School",
                value: school?._id,
              }))}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Discount" name="discount">
                <InputNumber min={0} prefix="₹" style={{ width: "100%" }} placeholder="0" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Tax / GST" name="taxGst">
                <InputNumber min={0} prefix="₹" style={{ width: "100%" }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Due Date" name="dueDate">
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Status" name="status" initialValue="unpaid">
                <Select options={invoiceStatuses} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={modalTitle(<WalletOutlined />, `Add Payment${selectedInvoice?.invoiceNumber ? ` - ${selectedInvoice.invoiceNumber}` : ""}`)}
        open={paymentOpen}
        onCancel={() => {
          setPaymentOpen(false);
          setSelectedInvoice(null);
          paymentForm.resetFields();
        }}
        onOk={handleAddPayment}
        okText="Save Payment"
        width={620}
        destroyOnClose
      >
        {selectedInvoice && (
          <div style={{ ...sectionPanel, padding: 12, background: "var(--surface-soft)" }}>
            <span style={{ color: "var(--text-muted)" }}>Selected Invoice</span>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedInvoice.schoolName}</span>{" "}
              <Tag color="blue">{selectedInvoice.invoiceNumber}</Tag>
              <span style={pill(statusMap[selectedInvoice.status]?.color, statusMap[selectedInvoice.status]?.bg)}>
                {statusMap[selectedInvoice.status]?.label}
              </span>
            </div>
          </div>
        )}

        <Form form={paymentForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please enter amount" }]}>
            <InputNumber min={1} prefix="₹" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true, message: "Please select payment mode" }]}>
            <Select placeholder="Select payment mode" options={paymentModes} />
          </Form.Item>

          <Form.Item label="Transaction ID" name="transactionId">
            <Input placeholder="Optional transaction/reference ID" />
          </Form.Item>

          <Form.Item label="Payment Proof URL" name="paymentProofUrl">
            <Input placeholder="Optional proof link" />
          </Form.Item>

          <Form.Item label="Status" name="status" initialValue="success">
            <Select
              options={[
                { label: "Success", value: "success" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
