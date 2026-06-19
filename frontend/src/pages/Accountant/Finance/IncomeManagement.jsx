import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Form, Input, InputNumber,
  Modal, Popconfirm, Row, Select, Spin, Table, Tag, message,
} from "antd";
import {
  DeleteOutlined, DollarOutlined, DownloadOutlined,
  EditOutlined, FilterOutlined, PlusOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createIncome, deleteIncome, fetchIncome, fetchIncomeSummary, updateIncome,
} from "../../../features/financeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const INCOME_CATEGORIES = [
  "Tuition Fee", "Admission Fee", "Registration Fee", "Transport Income",
  "Hostel Income", "Exam Income", "Library Income", "Sports Income",
  "Canteen Income", "Donation", "Grant", "Sponsorship",
  "Rental Income", "Interest Income", "Miscellaneous",
];

const PAYMENT_MODES = ["cash", "cheque", "bank_transfer", "upi", "online", "dd"];

const CAT_COLORS = {
  "Tuition Fee": "#9B87B8", "Admission Fee": "#0891b2", "Donation": "#5BA89A",
  "Grant": "#5BA89A", "Transport Income": "#D4922A", "Hostel Income": "#9B87B8",
  "Miscellaneous": "#6B7890",
};
const catColor = (cat) => CAT_COLORS[cat] || "#0891b2";

const IncomeManagement = () => {
  const dispatch = useDispatch();
  const {
    incomeRecords, incomeTotal, incomeTotalAmount, incomeSummary,
    incomeLoading, actionLoading,
  } = useSelector((s) => s.finance || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);

  const loadData = (extra = {}) => {
    const params = { page, limit: 25, ...extra };
    if (search) params.search = search;
    if (catFilter) params.category = catFilter;
    if (modeFilter) params.paymentMode = modeFilter;
    if (dateRange?.length === 2) {
      params.startDate = dateRange[0].toISOString();
      params.endDate   = dateRange[1].toISOString();
    }
    dispatch(fetchIncome(params));
    dispatch(fetchIncomeSummary(params));
  };

  useEffect(() => { loadData(); }, [dispatch, page]);

  const handleSearch = () => { setPage(1); loadData({ page: 1 }); };

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), paymentMode: "cash" });
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
      receivedFrom: record.receivedFrom,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = {
      ...values,
      date: values.date?.toISOString(),
    };
    try {
      if (editRecord) {
        await dispatch(updateIncome({ id: editRecord._id, payload })).unwrap();
        message.success("Income record updated");
      } else {
        await dispatch(createIncome(payload)).unwrap();
        message.success("Income record created");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      message.error(e || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteIncome(id)).unwrap();
      message.success("Income record deleted");
      loadData();
    } catch (e) {
      message.error(e || "Delete failed");
    }
  };

  // CSV export
  const handleExport = () => {
    const headers = ["Title", "Category", "Amount", "Date", "Payment Mode", "Received From", "Reference No"];
    const rows = incomeRecords.map((r) => [
      r.title, r.category, r.amount,
      dayjs(r.date).format("DD-MM-YYYY"),
      r.paymentMode, r.receivedFrom, r.referenceNo,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `income-${dayjs().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const byCategory = useMemo(() => incomeSummary?.byCategory || [], [incomeSummary]);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
          {r.receivedFrom && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.receivedFrom}</div>}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (c) => (
        <span style={pill(catColor(c), `${catColor(c)}15`)}>{c}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => <span style={{ fontWeight: 700, fontSize: 14, color: "#5BA89A" }}>{money(v)}</span>,
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
      title: "Ref No.",
      dataIndex: "referenceNo",
      render: (r) => r || "—",
    },
    {
      title: "Actions",
      width: 100,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="small" type="text" icon={<EditOutlined />}   onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this income record?" onConfirm={() => handleDelete(r._id)} okText="Delete" okType="danger">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("inc-tbl")}</style>
      <PageHeader
        title="Income Management"
        subtitle="Track all non-fee income: donations, grants, rentals, and misc"
        icon={<DollarOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Income</Button>
          </div>
        }
      />

      {/* ── Summary KPIs ─────────────────────────────────────────── */}
      <div style={statGrid(150)}>
        {[
          { label: "Total Income",   value: money(incomeTotalAmount), color: "#5BA89A", icon: <DollarOutlined /> },
          { label: "Total Records",  value: incomeTotal,              color: "#0891b2", icon: <FilterOutlined /> },
          { label: "This Month",     value: money(incomeSummary?.total), color: "#9B87B8", icon: <DollarOutlined /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value ?? "—"}</div>
            </div>
          </div>
        ))}
      </div>

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
          <Col xs={24} sm={8}>
            <Input prefix={<SearchOutlined />} placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={handleSearch} allowClear />
          </Col>
          <Col xs={12} sm={4}>
            <Select value={catFilter} onChange={setCatFilter} placeholder="Category" style={{ width: "100%" }} allowClear>
              {INCOME_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select value={modeFilter} onChange={setModeFilter} placeholder="Mode" style={{ width: "100%" }} allowClear>
              {PAYMENT_MODES.map((m) => <Option key={m} value={m}>{m}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <RangePicker style={{ width: "100%" }} onChange={(r) => setDateRange(r ? [r[0].toDate(), r[1].toDate()] : [])} />
          </Col>
          <Col xs={24} sm={2}>
            <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />} style={{ width: "100%" }}>Go</Button>
          </Col>
        </Row>

        {incomeLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="inc-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={incomeRecords}
            loading={actionLoading}
            pagination={{
              total: incomeTotal, current: page, pageSize: 25,
              onChange: setPage, showSizeChanger: false,
              showTotal: (t) => `${t} records`,
            }}
            scroll={{ x: 800 }}
            locale={{ emptyText: <Empty description="No income records yet" /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      <Modal
        title={editRecord ? "Edit Income Record" : "Add Income Record"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? "Update" : "Save"}
        confirmLoading={actionLoading}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
                <Input placeholder="e.g., Annual Day Donation" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: "Amount is required" }, { type: "number", min: 0 }]}>
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" formatter={(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {INCOME_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
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
            <Col xs={24} sm={12}>
              <Form.Item name="paymentMode" label="Payment Mode">
                <Select>
                  {PAYMENT_MODES.map((m) => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="referenceNo" label="Reference / Cheque No.">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="receivedFrom" label="Received From">
            <Input placeholder="Donor / Source name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IncomeManagement;
