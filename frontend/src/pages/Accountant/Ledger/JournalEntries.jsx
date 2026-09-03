import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, DatePicker, Empty, Form, Input, InputNumber, Modal, Select,
  Spin, Table, Tooltip, message,
} from "antd";
import {
  CheckCircleOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined, UndoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createEntry, fetchAccounts, fetchEntries, postEntry, reverseEntry,
} from "../../../features/ledgerSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const STATUS_COLOR = { posted: "var(--success)", draft: "var(--warning)", void: "var(--text-muted)" };

const JournalEntries = () => {
  const dispatch = useDispatch();
  const { entries, entriesLoading, accounts, actionLoading } = useSelector((s) => s.ledger || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState();
  const [range, setRange] = useState([]);
  const [reversing, setReversing] = useState(null);
  const [reverseDate, setReverseDate] = useState(dayjs());

  // Watched so the running debit/credit totals update as the lines are typed — the point of the
  // form is that you see it fail to balance before you try to save it.
  const lines = Form.useWatch("lines", form);

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (range?.length === 2) {
      params.from = range[0].startOf("day").toISOString();
      params.to = range[1].endOf("day").toISOString();
    }
    dispatch(fetchEntries(params));
  };

  useEffect(() => {
    load();
    dispatch(fetchAccounts());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter, range]);

  const accountOptions = useMemo(
    () => (accounts || [])
      .filter((a) => a.isActive !== false)
      .map((a) => ({ value: a._id, label: `${a.code} — ${a.name}` })),
    [accounts]
  );

  const totals = useMemo(() => {
    const debit = round2((lines || []).reduce((s, l) => s + (Number(l?.debit) || 0), 0));
    const credit = round2((lines || []).reduce((s, l) => s + (Number(l?.credit) || 0), 0));
    return { debit, credit, difference: round2(debit - credit) };
  }, [lines]);

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      lines: [{ accountId: undefined, debit: null, credit: null }, { accountId: undefined, debit: null, credit: null }],
    });
    setModalOpen(true);
  };

  const submit = async (post) => {
    const values = await form.validateFields();
    if (totals.difference !== 0) {
      message.error(`Entry does not balance — debits ${money(totals.debit)} vs credits ${money(totals.credit)}`);
      return;
    }

    const res = await dispatch(createEntry({
      date: values.date.toISOString(),
      narration: values.narration || "",
      post,
      lines: values.lines.map((l) => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description || "",
      })),
    }));

    if (createEntry.fulfilled.match(res)) {
      message.success(post ? "Entry posted" : "Saved as draft");
      setModalOpen(false);
      load();
    } else {
      message.error(res.payload || "Could not save the entry");
    }
  };

  const post = async (record) => {
    const res = await dispatch(postEntry(record._id));
    if (postEntry.fulfilled.match(res)) { message.success("Entry posted"); load(); }
    else message.error(res.payload || "Could not post the entry");
  };

  const submitReversal = async () => {
    const res = await dispatch(reverseEntry({ id: reversing._id, date: reverseDate.toISOString() }));
    if (reverseEntry.fulfilled.match(res)) {
      message.success(`Reversed with ${res.payload?.entryNumber}`);
      setReversing(null);
      load();
    } else {
      message.error(res.payload || "Could not reverse the entry");
    }
  };

  const columns = [
    {
      title: "Entry", dataIndex: "entryNumber", width: 140,
      render: (n, r) => (
        <div>
          <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{n}</div>
          {r.source?.model && (
            <Tooltip title={`Posted automatically from a ${r.source.model} record`}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>auto · {r.source.model}</span>
            </Tooltip>
          )}
        </div>
      ),
    },
    { title: "Date", dataIndex: "date", width: 110, render: (d) => new Date(d).toLocaleDateString("en-IN") },
    {
      title: "Narration", dataIndex: "narration",
      render: (n, r) => (
        <div>
          <div style={{ color: "var(--text-primary)" }}>{n || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.lines?.map((l, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {l.debit > 0 ? "Dr" : "Cr"} {l.accountId?.code || ""} {money(l.debit || l.credit)}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Amount", width: 130, align: "right",
      render: (_, r) => <b>{money((r.lines || []).reduce((s, l) => s + (l.debit || 0), 0))}</b>,
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (s, r) => (
        <div>
          <span style={pill(STATUS_COLOR[s] || "var(--text-muted)")}>{s}</span>
          {r.reversedByEntryId && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>reversed</div>}
        </div>
      ),
    },
    {
      title: "", width: 110, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {r.status === "draft" && (
            <Tooltip title="Post — after this the entry can only be reversed, not edited">
              <Button size="small" type="text" icon={<CheckCircleOutlined />} onClick={() => post(r)} />
            </Tooltip>
          )}
          {r.status === "posted" && !r.reversedByEntryId && (
            <Tooltip title="Reverse with a mirror entry">
              <Button size="small" type="text" icon={<UndoOutlined />} onClick={() => { setReversing(r); setReverseDate(dayjs()); }} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("je-table")}</style>

      <PageHeader
        title="Journal"
        subtitle="Every entry in the books, hand-written or posted automatically"
        icon={<FileTextOutlined />}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>New entry</Button>}
      />

      <div style={sectionPanel}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="All statuses"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "draft", label: "Draft" }, { value: "posted", label: "Posted" }, { value: "void", label: "Void" }]}
          />
          <RangePicker value={range} onChange={(v) => setRange(v || [])} />
        </div>

        {entriesLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : !entries?.length ? (
          <div style={emptyState}>
            <Empty description="No entries in this range" />
          </div>
        ) : (
          <div style={tableContainer}>
            <Table
              className="je-table"
              rowKey="_id"
              size="middle"
              columns={columns}
              dataSource={entries}
              pagination={{ pageSize: 20, showSizeChanger: false }}
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        width={820}
        title="New journal entry"
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>Cancel</Button>,
          <Button key="draft" loading={actionLoading} onClick={() => submit(false)}>Save as draft</Button>,
          <Button
            key="post" type="primary" loading={actionLoading}
            disabled={totals.difference !== 0 || totals.debit === 0}
            onClick={() => submit(true)}
          >
            Post
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="date" label="Date" rules={[{ required: true }]} style={{ width: 180 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="narration" label="Narration" style={{ flex: 1 }}>
              <Input placeholder="What this entry is for" />
            </Form.Item>
          </div>

          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Form.Item
                      {...rest} name={[name, "accountId"]} style={{ flex: 1 }}
                      rules={[{ required: true, message: "Pick an account" }]}
                    >
                      <Select showSearch optionFilterProp="label" placeholder="Account" options={accountOptions} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "debit"]} style={{ width: 140 }}>
                      <InputNumber min={0} placeholder="Debit" style={{ width: "100%" }}
                        onChange={(v) => { if (v) form.setFields([{ name: ["lines", name, "credit"], value: null }]); }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "credit"]} style={{ width: 140 }}>
                      <InputNumber min={0} placeholder="Credit" style={{ width: "100%" }}
                        onChange={(v) => { if (v) form.setFields([{ name: ["lines", name, "debit"], value: null }]); }} />
                    </Form.Item>
                    <Button
                      type="text" danger icon={<DeleteOutlined />}
                      disabled={fields.length <= 2}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ debit: null, credit: null })}>
                  Add line
                </Button>
              </>
            )}
          </Form.List>

          {/* The running totals are the whole point of this form — an unbalanced entry is refused
              by the server anyway, so it is shown failing here rather than after a round trip. */}
          <div
            style={{
              ...sectionPanel, marginTop: 18, marginBottom: 0, padding: "14px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderColor: totals.difference === 0 ? "var(--border-muted)" : "var(--danger)",
            }}
          >
            <div style={{ display: "flex", gap: 24 }}>
              <span><span style={{ color: "var(--text-muted)" }}>Debits </span><b>{money(totals.debit)}</b></span>
              <span><span style={{ color: "var(--text-muted)" }}>Credits </span><b>{money(totals.credit)}</b></span>
            </div>
            <span style={pill(totals.difference === 0 ? "var(--success)" : "var(--danger)")}>
              {totals.difference === 0 ? "Balanced" : `Out by ${money(Math.abs(totals.difference))}`}
            </span>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!reversing}
        title={`Reverse ${reversing?.entryNumber || ""}`}
        onCancel={() => setReversing(null)}
        onOk={submitReversal}
        confirmLoading={actionLoading}
        okText="Reverse"
      >
        <p style={{ color: "var(--text-muted)" }}>
          A posted entry is never edited or deleted — somebody may already have reported the figure.
          This writes a mirror-image entry instead, so both the original and the correction stay visible.
        </p>
        <DatePicker value={reverseDate} onChange={(d) => setReverseDate(d || dayjs())} style={{ width: "100%" }} />
      </Modal>
    </div>
  );
};

export default JournalEntries;
