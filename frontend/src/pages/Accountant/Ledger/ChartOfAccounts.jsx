import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Drawer, Empty, Form, Input, Modal, Popconfirm, Segmented,
  Select, Spin, Switch, Table, Tag, Tooltip, message,
} from "antd";
import {
  BookOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  PlusOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import {
  createAccount, deleteAccount, fetchAccountLedger, fetchAccounts,
  seedAccounts, updateAccount, clearAccountLedger,
} from "../../../features/ledgerSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StatCardsRow from "../../../components/layout/StatCardsRow";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const { TextArea } = Input;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The five account types, with the colour and the plain-English meaning each carries. */
const TYPES = [
  { value: "asset", label: "Asset", color: "var(--accent)", hint: "What the school owns — cash, bank, receivables" },
  { value: "liability", label: "Liability", color: "var(--warning)", hint: "What the school owes — dues payable, deposits" },
  { value: "equity", label: "Equity", color: "var(--cyan)", hint: "Corpus and accumulated surplus" },
  { value: "income", label: "Income", color: "var(--success)", hint: "Fees and other money earned" },
  { value: "expense", label: "Expense", color: "var(--danger)", hint: "Salaries, rent, utilities and other costs" },
];
const typeMeta = (t) => TYPES.find((x) => x.value === t) || TYPES[0];

const ChartOfAccounts = () => {
  const dispatch = useDispatch();
  const { accounts, accountsLoading, accountLedger, accountLedgerLoading, actionLoading } =
    useSelector((s) => s.ledger || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchAccounts()); }, [dispatch]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (accounts || []).filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (!term) return true;
      return `${a.code} ${a.name}`.toLowerCase().includes(term);
    });
  }, [accounts, typeFilter, search]);

  const counts = useMemo(() => {
    const by = {};
    (accounts || []).forEach((a) => { by[a.type] = (by[a.type] || 0) + 1; });
    return by;
  }, [accounts]);

  const runSeed = async () => {
    const res = await dispatch(seedAccounts());
    if (seedAccounts.fulfilled.match(res)) {
      message.success(res.payload?.created ? `${res.payload.created} account(s) added` : "Chart of accounts is already complete");
      dispatch(fetchAccounts());
    } else {
      message.error(res.payload || "Could not set up the chart of accounts");
    }
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: "expense", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code, name: record.name, type: record.type,
      description: record.description, isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const action = editing
      ? updateAccount({ id: editing._id, payload: { name: values.name, description: values.description, isActive: values.isActive } })
      : createAccount(values);

    const res = await dispatch(action);
    if (res.type.endsWith("/fulfilled")) {
      message.success(editing ? "Account updated" : "Account created");
      setModalOpen(false);
      dispatch(fetchAccounts());
    } else {
      message.error(res.payload || "Could not save the account");
    }
  };

  const remove = async (record) => {
    const res = await dispatch(deleteAccount(record._id));
    if (deleteAccount.fulfilled.match(res)) message.success("Account deleted");
    else message.error(res.payload || "Could not delete the account");
  };

  const columns = [
    {
      title: "Code", dataIndex: "code", width: 90,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code) => <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{code}</span>,
    },
    {
      title: "Account", dataIndex: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {name}{" "}
            {r.isSystem && (
              <Tooltip title="Part of the default chart. It can be renamed or deactivated, but not deleted.">
                <Tag style={{ marginLeft: 4 }}>system</Tag>
              </Tooltip>
            )}
          </div>
          {r.description ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.description}</div> : null}
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 130,
      filters: TYPES.map((t) => ({ text: t.label, value: t.value })),
      onFilter: (v, r) => r.type === v,
      render: (type) => <span style={pill(typeMeta(type).color)}>{typeMeta(type).label}</span>,
    },
    {
      title: "Status", dataIndex: "isActive", width: 100,
      render: (active) => (
        <span style={pill(active ? "var(--success)" : "var(--text-muted)")}>{active ? "Active" : "Inactive"}</span>
      ),
    },
    {
      title: "", width: 130, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          <Tooltip title="View ledger">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => dispatch(fetchAccountLedger({ id: r._id }))} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm
            title="Delete this account?"
            description={r.isSystem ? "System accounts cannot be deleted — deactivate it instead." : "Only possible while no entry uses it."}
            okButtonProps={{ danger: true, disabled: r.isSystem }}
            onConfirm={() => remove(r)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={r.isSystem} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const ledgerColumns = [
    { title: "Date", dataIndex: "date", width: 110, render: (d) => new Date(d).toLocaleDateString("en-IN") },
    { title: "Entry", dataIndex: "entryNumber", width: 130, render: (n) => <span style={{ fontFamily: "monospace" }}>{n}</span> },
    { title: "Narration", dataIndex: "narration", render: (n, r) => r.description || n || "—" },
    { title: "Debit", dataIndex: "debit", align: "right", width: 120, render: (v) => (v ? money(v) : "—") },
    { title: "Credit", dataIndex: "credit", align: "right", width: 120, render: (v) => (v ? money(v) : "—") },
    { title: "Balance", dataIndex: "balance", align: "right", width: 130, render: (v) => <b>{money(v)}</b> },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("coa-table")}</style>

      <PageHeader
        title="Chart of Accounts"
        subtitle="Every account the books can be posted to"
        icon={<BookOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ThunderboltOutlined />} loading={actionLoading} onClick={runSeed}>
              Set up defaults
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>New account</Button>
          </div>
        }
      />

      <StatCardsRow
        items={TYPES.map((t) => ({
          key: t.value, icon: <BookOutlined />, label: t.label, value: counts[t.value] || 0, color: t.color,
        }))}
      />

      <div style={sectionPanel}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <Segmented
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ label: "All", value: "all" }, ...TYPES.map((t) => ({ label: t.label, value: t.value }))]}
          />
          <Input.Search
            allowClear
            placeholder="Search by code or name"
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {accountsLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : !accounts?.length ? (
          <div style={emptyState}>
            <Empty description="No accounts yet" />
            <p style={{ color: "var(--text-muted)", maxWidth: 460, margin: "12px auto" }}>
              Start from the standard school chart — cash, bank, fee income, salaries and the rest —
              then rename or add to it. Running this again later only fills in what is missing.
            </p>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={actionLoading} onClick={runSeed}>
              Set up the default chart
            </Button>
          </div>
        ) : (
          <div style={tableContainer}>
            <Table
              className="coa-table"
              rowKey="_id"
              size="middle"
              columns={columns}
              dataSource={rows}
              pagination={{ pageSize: 25, showSizeChanger: false }}
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${editing.code} — ${editing.name}` : "New account"}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={actionLoading}
        okText={editing ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code" label="Code"
            rules={[{ required: true, message: "A code is required" }]}
            extra="Codes group the books: 1xxx assets, 2xxx liabilities, 3xxx equity, 4xxx income, 5xxx expenses."
          >
            <Input placeholder="5100" disabled={!!editing} />
          </Form.Item>

          <Form.Item name="name" label="Name" rules={[{ required: true, message: "A name is required" }]}>
            <Input placeholder="Sports Equipment" />
          </Form.Item>

          <Form.Item
            name="type" label="Type"
            rules={[{ required: true }]}
            extra={
              editing
                ? "Type cannot be changed — it decides the normal balance and which statement this account appears on, so changing it would restate every past report."
                : typeMeta(form.getFieldValue("type")).hint
            }
          >
            <Select disabled={!!editing} options={TYPES.map((t) => ({ value: t.value, label: `${t.label} — ${t.hint}` }))} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Optional" />
          </Form.Item>

          {editing && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        width={860}
        open={!!accountLedger || accountLedgerLoading}
        onClose={() => dispatch(clearAccountLedger())}
        title={accountLedger ? `${accountLedger.account?.code} — ${accountLedger.account?.name}` : "Account ledger"}
      >
        {accountLedgerLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : (
          <>
            <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Closing balance</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{money(accountLedger?.closingBalance)}</span>
            </div>
            <Table
              rowKey={(r, i) => `${r.entryId}-${i}`}
              size="small"
              columns={ledgerColumns}
              dataSource={accountLedger?.rows || []}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              locale={{ emptyText: "Nothing posted to this account yet" }}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ChartOfAccounts;
