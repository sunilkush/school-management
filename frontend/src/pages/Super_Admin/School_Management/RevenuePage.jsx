import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Card,
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
  Typography,
  message,
  Statistic,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  DollarOutlined,
  PlusOutlined,
  SearchOutlined,
  WalletOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchRevenueSummary,
  generateSchoolInvoice,
} from "../../../features/superAdminBillingSlice";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusMap = {
  draft: { color: "default", bg: "#f8fafc", label: "Draft" },
  unpaid: { color: "warning", bg: "#fff7ed", label: "Unpaid" },
  paid: { color: "success", bg: "#f0fdf4", label: "Paid" },
  overdue: { color: "error", bg: "#fef2f2", label: "Overdue" },
  cancelled: { color: "default", bg: "#f1f5f9", label: "Cancelled" },
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

const MetricCard = ({ title, value, icon, color, bg, sub }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 22,
      background: "#fff",
      boxShadow: "0 10px 30px rgba(91,158,201,0.08)",
      height: "100%",
      overflow: "hidden",
      position: "relative",
    }}
    bodyStyle={{ padding: 20 }}
  >
    <div
      style={{
        position: "absolute",
        right: -28,
        top: -28,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: bg,
      }}
    />

    <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
      <div>
        <Text style={{ color: "#6B7890", fontWeight: 600 }}>{title}</Text>
        <Statistic
          value={value}
          valueStyle={{
            marginTop: 6,
            fontSize: 26,
            fontWeight: 800,
            color: "#1E2A3A",
          }}
        />
        {sub && (
          <Text style={{ color: "#A8B8CC", fontSize: 12 }}>
            {sub}
          </Text>
        )}
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
          fontSize: 21,
        }}
      >
        {icon}
      </div>
    </Space>
  </Card>
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
        <Text style={{ color: "#334155", fontWeight: 600 }}>{value}</Text>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount) => (
        <Text strong style={{ color: "#166534" }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (value) => <Text style={{ color: "#6B7890" }}>{value}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => {
        const cfg = statusMap[value] || statusMap.draft;
        return (
          <Tag color={cfg.color} style={{ borderRadius: 999, padding: "2px 10px" }}>
            {cfg.label}
          </Tag>
        );
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
    <div
      style={{
        minHeight: "100vh",
        background:
          "#F7F8FC",
        padding: 24,
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
        <Row gutter={[16, 16]} align="middle" justify="space-between">
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
                <DollarOutlined />
              </div>

              <div>
                <Title level={3} style={{ margin: 0, color: "#1E2A3A" }}>
                  Revenue Dashboard
                </Title>
                <Text style={{ color: "#6B7890" }}>
                  Super Admin billing, invoices, payments aur revenue tracking.
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={12}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() => navigate("/dashboard/superadmin/subscriptions")}
              >
                Subscriptions
              </Button>
              <Button
                icon={<WalletOutlined />}
                onClick={() => navigate("/dashboard/superadmin/payments")}
              >
                Payments
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setInvoiceOpen(true)}
              >
                Create Invoice
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Invoiced"
            value={formatCurrency(revenueSummary.totalInvoiced)}
            icon={<FileTextOutlined />}
            color="#5B9EC9"
            bg="rgba(167,199,231,0.2)"
            sub="All generated invoices"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Paid"
            value={formatCurrency(revenueSummary.totalPaid)}
            icon={<CheckCircleOutlined />}
            color="#5BA89A"
            bg="rgba(184,224,210,0.2)"
            sub="Received payments"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Outstanding"
            value={formatCurrency(revenueSummary.totalOutstanding)}
            icon={<ClockCircleOutlined />}
            color="#D4922A"
            bg="rgba(253,226,167,0.25)"
            sub="Pending collection"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Overdue"
            value={formatCurrency(revenueSummary.overdue)}
            icon={<WarningOutlined />}
            color="#D96B7A"
            bg="rgba(255,202,212,0.2)"
            sub="Needs follow-up"
          />
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          boxShadow: "0 12px 36px rgba(91,158,201,0.08)",
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={14}>
            <Space wrap>
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: "#A8B8CC" }} />}
                placeholder="Search by school or invoice no."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 280, borderRadius: 12 }}
              />

              <Select
                allowClear
                placeholder="Filter status"
                value={status || undefined}
                onChange={(value) => setStatus(value || "")}
                style={{ width: 170 }}
                options={invoiceStatuses}
              />
            </Space>
          </Col>

          <Col xs={24} md={10}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Tag color="blue" style={{ borderRadius: 999, padding: "4px 10px" }}>
                {filtered.length} invoices
              </Tag>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Table
            loading={loading}
            columns={columns}
            dataSource={filtered}
            rowKey="key"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
            }}
            scroll={{ x: 850 }}
          />
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: "#5B9EC9" }} />
            <span>Create Invoice</span>
          </Space>
        }
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
                <InputNumber
                  min={0}
                  prefix="₹"
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Tax / GST" name="taxGst">
                <InputNumber
                  min={0}
                  prefix="₹"
                  style={{ width: "100%" }}
                  placeholder="0"
                />
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
        title={
          <Space>
            <WalletOutlined style={{ color: "#5BA89A" }} />
            <span>
              Add Payment
              {selectedInvoice?.invoiceNumber
                ? ` - ${selectedInvoice.invoiceNumber}`
                : ""}
            </span>
          </Space>
        }
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
              <Tag color={statusMap[selectedInvoice.status]?.color}>
                {statusMap[selectedInvoice.status]?.label}
              </Tag>
            </div>
          </div>
        )}

        <Form form={paymentForm} layout="vertical">
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber min={1} prefix="₹" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Payment Mode"
            name="paymentMode"
            rules={[{ required: true, message: "Please select payment mode" }]}
          >
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