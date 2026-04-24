import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import { AppstoreOutlined, DollarOutlined, PlusOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  addManualSubscriptionPayment,
  fetchBillingInvoices,
  fetchRevenueSummary,
  generateSchoolInvoice,
} from "../../../features/superAdminBillingSlice";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function RevenuePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices = [], revenueSummary = {}, loading = false } = useSelector((state) => state?.superAdminBilling || {});
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

  const rows = useMemo(
    () =>
      invoices.map((invoice) => ({
        key: invoice._id,
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        schoolName: invoice.schoolId?.name || "-",
        amount: invoice.totalAmount,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        status: invoice.status,
      })),
    [invoices]
  );

  const filtered = rows.filter((row) => {
    const matchSearch =
      !search ||
      String(row.schoolName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(row.invoiceNumber || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = !status || row.status === status;
    return matchSearch && matchStatus;
  });

  const handleCreateInvoice = async () => {
    try {
      const values = await invoiceForm.validateFields();
      await dispatch(
        generateSchoolInvoice({
          schoolId: values.schoolId,
          payload: {
            discount: Number(values.discount || 0),
            taxGst: Number(values.taxGst || 0),
            dueDate: values.dueDate,
            status: values.status || "unpaid",
          },
        })
      ).unwrap();

      message.success("Invoice generated successfully");
      setInvoiceOpen(false);
      invoiceForm.resetFields();
      dispatch(fetchBillingInvoices());
      dispatch(fetchRevenueSummary());
    } catch (error) {
      if (error) message.error(error);
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
      dispatch(fetchBillingInvoices());
      dispatch(fetchRevenueSummary());
    } catch (error) {
      if (error) message.error(error);
    }
  };

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <Space align="center"><DollarOutlined style={{ fontSize: 18 }} /><Title level={3} style={{ margin: 0 }}>Revenue Dashboard</Title></Space>
          <Text type="secondary">Invoice-based revenue analytics for Super Admin billing module.</Text>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvoiceOpen(true)}>
            Create Invoice
          </Button>
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
            {
              title: "Action",
              render: (_, row) => (
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
              ),
            },
          ]}
          dataSource={filtered}
          rowKey="key"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Create Invoice"
        open={invoiceOpen}
        onCancel={() => {
          setInvoiceOpen(false);
          invoiceForm.resetFields();
        }}
        onOk={handleCreateInvoice}
        okText="Create Invoice"
      >
        <Form form={invoiceForm} layout="vertical">
          <Form.Item label="School" name="schoolId" rules={[{ required: true, message: "Please select a school" }]}>
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
          <Form.Item label="Discount" name="discount">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Tax / GST" name="taxGst">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Due Date" name="dueDate">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="unpaid">
            <Select options={["draft", "unpaid", "paid", "overdue", "cancelled"].map((value) => ({ label: value, value }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Add Payment${selectedInvoice?.invoiceNumber ? ` - ${selectedInvoice.invoiceNumber}` : ""}`}
        open={paymentOpen}
        onCancel={() => {
          setPaymentOpen(false);
          setSelectedInvoice(null);
          paymentForm.resetFields();
        }}
        onOk={handleAddPayment}
        okText="Save Payment"
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please enter amount" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Payment Mode" name="paymentMode" rules={[{ required: true, message: "Please select payment mode" }]}>
            <Select options={["cash", "upi", "card", "bank_transfer", "cheque"].map((value) => ({ label: value, value }))} />
          </Form.Item>
          <Form.Item label="Transaction ID" name="transactionId">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item label="Payment Proof URL" name="paymentProofUrl">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="success">
            <Select options={["success", "pending", "failed"].map((value) => ({ label: value, value }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
