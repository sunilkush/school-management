import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Form, Input, InputNumber,
  Modal, Popconfirm, Row, Select, Spin, Table, Tag, Tooltip, message,
} from "antd";
import {
  DeleteOutlined, DownloadOutlined, EditOutlined, FileTextOutlined,
  FilterOutlined, MinusCircleOutlined, PlusOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createExpense, deleteExpense, fetchExpenses, fetchExpenseSummary, updateExpense,
} from "../../../features/financeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StatCardsRow from "../../../components/layout/StatCardsRow";
import {
  pageWrapper, pill, sectionPanel, tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const EXPENSE_CATEGORIES = [
  "Staff Salary", "Teacher Salary", "Contract Salary", "Utility Bills",
  "Rent", "Internet", "Software Subscription", "Stationery",
  "Maintenance", "Library Purchase", "Laboratory Equipment",
  "Transportation Cost", "Event Expense", "Marketing",
  "Insurance", "Legal & Professional", "Printing",
  "Cleaning", "Canteen Expense", "Miscellaneous",
];
const PAYMENT_MODES = ["cash", "cheque", "bank_transfer", "upi", "online", "dd"];
const EXPENSE_STATUSES = ["paid", "pending", "approved", "rejected"];

const CAT_COLORS = {
  "Staff Salary": "#14B8A6", "Teacher Salary": "#14B8A6",
  "Utility Bills": "#F59E0B", "Rent": "#0891b2",
  "Maintenance": "#F59E0B", "Stationery": "#64748B", "Miscellaneous": "#94A3B8",
};
const catColor = (cat) => CAT_COLORS[cat] || "#EF4444";

const statusColor = { paid: "#22C55E", pending: "#F59E0B", approved: "#0891b2", rejected: "#EF4444" };

const ExpenseManagement = () => {
  const dispatch = useDispatch();
  const {
    expenseRecords, expenseTotal, expenseTotalAmount, expenseSummary,
    expenseLoading, actionLoading,
  } = useSelector((s) => s.finance || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);

  const loadData = (extra = {}) => {
    const params = { page, limit: 25, ...extra };
    if (search) params.search = search;
    if (catFilter) params.category = catFilter;
    if (modeFilter) params.paymentMode = modeFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateRange?.length === 2) {
      params.startDate = dateRange[0].toISOString();
      params.endDate   = dateRange[1].toISOString();
    }
    dispatch(fetchExpenses(params));
    dispatch(fetchExpenseSummary(params));
  };

  useEffect(() => { loadData(); }, [dispatch, page]);

  const handleSearch = () => { setPage(1); loadData({ page: 1 }); };

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), paymentMode: "cash", status: "paid" });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue({
      title:       record.title,
      category:    record.category,
      amount:      record.amount,
      date:        dayjs(record.date),
      paymentMode: record.paymentMode,
      referenceNo: record.referenceNo,
      invoiceNo:   record.invoiceNo,
      paidTo:      record.paidTo,
      status:      record.status,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = { ...values, date: values.date?.toISOString() };
    try {
      if (editRecord) {
        await dispatch(updateExpense({ id: editRecord._id, payload })).unwrap();
        message.success("Expense record updated");
      } else {
        await dispatch(createExpense(payload)).unwrap();
        message.success("Expense record created");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      message.error(e || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteExpense(id)).unwrap();
      message.success("Expense deleted");
      loadData();
    } catch (e) {
      message.error(e || "Delete failed");
    }
  };

  const handleExport = () => {
    const headers = ["Title", "Category", "Amount", "Date", "Mode", "Paid To", "Invoice No", "Status"];
    const rows = expenseRecords.map((r) => [
      r.title, r.category, r.amount, dayjs(r.date).format("DD-MM-YYYY"),
      r.paymentMode, r.paidTo, r.invoiceNo, r.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `expenses-${dayjs().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const byCategory = useMemo(() => expenseSummary?.byCategory || [], [expenseSummary]);

  const columns = [
    {
      title: "Title",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
          {r.paidTo && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Paid to: {r.paidTo}</div>}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (c) => <span style={pill(catColor(c), `${catColor(c)}15`)}>{c}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => <span style={{ fontWeight: 700, fontSize: 14, color: "#EF4444" }}>{money(v)}</span>,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "Mode",
      dataIndex: "paymentMode",
      render: (m) => <Tag style={{ textTransform: "capitalize" }}>{m}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <span style={pill(statusColor[s] || "#64748B", `${statusColor[s] || "#64748B"}15`)}>
          {s}
        </span>
      ),
    },
    {
      title: "Invoice",
      dataIndex: "invoiceNo",
      render: (v) => v || "—",
    },
    {
      title: "Actions",
      width: 100,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />} aria-label="Edit expense" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Delete this expense?" onConfirm={() => handleDelete(r._id)} okText="Delete" okType="danger">
            <Tooltip title="Delete">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Delete expense" />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("exp-tbl")}</style>
      <PageHeader
        title="Expense Management"
        subtitle="Track all school expenses: salaries, utilities, maintenance, and more"
        icon={<MinusCircleOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Expense</Button>
          </div>
        }
      />

      {/* ── Summary KPIs ─────────────────────────────────────────── */}
      <StatCardsRow
        style={{ marginTop: 0 }}
        items={[
          { label: "Total Expenses", value: money(expenseTotalAmount) ?? "—", color: "#EF4444", icon: <FileTextOutlined /> },
          { label: "Total Records",  value: expenseTotal ?? "—",              color: "#0891b2", icon: <FilterOutlined /> },
          {
            label: "Pending",
            value: money(expenseSummary?.byStatus?.find((s) => s._id === "pending")?.total) ?? "—",
            color: "#F59E0B", icon: <FileTextOutlined />,
          },
        ]}
      />

      {/* ── Category breakdown ────────────────────────────────────── */}
      {byCategory.length > 0 && (
        <div style={{ ...sectionPanel, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>By Category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {byCategory.map((c) => (
              <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 8, background: `${catColor(c._id)}12`, borderRadius: 8, padding: "6px 12px", border: `1px solid ${catColor(c._id)}25` }}>
                <span style={{ fontWeight: 700, color: catColor(c._id), fontSize: 13 }}>{money(c.total)}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c._id} ({c.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters + Table ──────────────────────────────────────── */}
      <div style={sectionPanel}>
        <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
          <Col xs={24} sm={7}>
            <Input prefix={<SearchOutlined />} placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={handleSearch} allowClear />
          </Col>
          <Col xs={12} sm={4}>
            <Select value={catFilter} onChange={setCatFilter} placeholder="Category" style={{ width: "100%" }} allowClear>
              {EXPENSE_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={3}>
            <Select value={statusFilter} onChange={setStatusFilter} placeholder="Status" style={{ width: "100%" }} allowClear>
              {EXPENSE_STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select value={modeFilter} onChange={setModeFilter} placeholder="Mode" style={{ width: "100%" }} allowClear>
              {PAYMENT_MODES.map((m) => <Option key={m} value={m}>{m}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <RangePicker style={{ width: "100%" }} onChange={(r) => setDateRange(r ? [r[0].toDate(), r[1].toDate()] : [])} />
          </Col>
          <Col xs={24} sm={2}>
            <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />} style={{ width: "100%" }}>Go</Button>
          </Col>
        </Row>

        {expenseLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="exp-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={expenseRecords}
            loading={actionLoading}
            pagination={{
              total: expenseTotal, current: page, pageSize: 25,
              onChange: setPage, showSizeChanger: false,
              showTotal: (t) => `${t} records`,
            }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="No expense records yet" /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      <Modal
        title={editRecord ? "Edit Expense" : "Add Expense"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? "Update" : "Save"}
        confirmLoading={actionLoading}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="e.g., Electricity Bill October" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }, { type: "number", min: 0 }]}>
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" formatter={(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {EXPENSE_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="paymentMode" label="Payment Mode">
                <Select>
                  {PAYMENT_MODES.map((m) => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  {EXPENSE_STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="invoiceNo" label="Invoice / Bill No.">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="paidTo" label="Paid To / Vendor">
                <Input placeholder="Vendor or payee name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="referenceNo" label="Reference / Cheque No.">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseManagement;
