import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm,
  Progress, Select, Spin, Switch, Table, Tabs, Tag, Tooltip, message,
} from "antd";
import {
  CheckOutlined, CloseOutlined, GiftOutlined, PlusOutlined,
  ReloadOutlined, SyncOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createScheme, decideAward, deleteScheme, fetchAwards, fetchMismatches, fetchReport,
  fetchSchemes, recordAmounts, requestAward, revokeAward, syncConcessions, updateScheme,
} from "../../features/scholarshipSlice";
import { fetchAllStudent } from "../../features/studentSlice";
import PageHeader from "../../components/layout/PageHeader";
import StatCardsRow from "../../components/layout/StatCardsRow";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { TextArea } = Input;

const CATEGORIES = ["Merit", "Means", "Staff Ward", "Sibling", "RTE", "Sports", "Single Parent", "Other"];

const STATUS_COLOR = {
  pending: "var(--warning)", approved: "var(--success)",
  rejected: "var(--danger)", revoked: "var(--text-muted)",
};

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const ScholarshipsPage = () => {
  const dispatch = useDispatch();
  const { schemes, schemesLoading, awards, awardsLoading, report, reportLoading, mismatches, actionLoading } =
    useSelector((s) => s.scholarship || {});
  const { studentList = [] } = useSelector((s) => s.student || {});

  const [schemeForm] = Form.useForm();
  const [awardForm] = Form.useForm();
  const [tab, setTab] = useState("awards");
  const [schemeModal, setSchemeModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [awardModal, setAwardModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState();

  const load = () => {
    dispatch(fetchSchemes());
    dispatch(fetchAwards(statusFilter ? { status: statusFilter } : {}));
    dispatch(fetchReport());
    dispatch(fetchMismatches());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter]);

  const openSchemeModal = (scheme = null) => {
    setEditingScheme(scheme);
    schemeForm.resetFields();
    if (scheme) {
      schemeForm.setFieldsValue({
        ...scheme,
        validFrom: scheme.validFrom ? dayjs(scheme.validFrom) : null,
        validUntil: scheme.validUntil ? dayjs(scheme.validUntil) : null,
      });
    } else {
      schemeForm.setFieldsValue({ discountType: "percent", category: "Other", requiresApproval: true, value: 25 });
    }
    setSchemeModal(true);
  };

  const saveScheme = async () => {
    const values = await schemeForm.validateFields();
    const payload = {
      ...values,
      validFrom: values.validFrom ? values.validFrom.toISOString() : null,
      validUntil: values.validUntil ? values.validUntil.toISOString() : null,
    };
    const res = await dispatch(editingScheme ? updateScheme({ id: editingScheme._id, ...payload }) : createScheme(payload));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editingScheme ? "Scheme updated" : "Scheme created");
      setSchemeModal(false);
      load();
    } else {
      message.error(res.payload || "Could not save the scheme");
    }
  };

  const removeScheme = async (scheme) => {
    const res = await dispatch(deleteScheme(scheme._id));
    if (deleteScheme.fulfilled.match(res)) { message.success("Scheme deleted"); load(); }
    else message.error(res.payload || "Could not delete");
  };

  const openAwardModal = () => {
    awardForm.resetFields();
    dispatch(fetchAllStudent());
    setAwardModal(true);
  };

  const saveAward = async () => {
    const values = await awardForm.validateFields();
    const res = await dispatch(requestAward(values));
    if (requestAward.fulfilled.match(res)) {
      message.success(res.payload?.status === "approved" ? "Concession granted" : "Sent for approval");
      setAwardModal(false);
      load();
    } else {
      message.error(res.payload || "Could not record the concession");
    }
  };

  const decide = async (award, decision) => {
    const res = await dispatch(decideAward({ id: award._id, decision, note: "" }));
    if (decideAward.fulfilled.match(res)) { message.success(`Concession ${decision}`); load(); }
    else message.error(res.payload || "Could not record the decision");
  };

  const revoke = async (award, note) => {
    const res = await dispatch(revokeAward({ id: award._id, note }));
    if (revokeAward.fulfilled.match(res)) { message.success("Concession revoked"); load(); }
    else message.error(res.payload || "Could not revoke");
  };

  const applyToFees = async () => {
    const res = await dispatch(syncConcessions({}));
    if (syncConcessions.fulfilled.match(res)) {
      message.success(res.payload?.updated
        ? `${res.payload.updated} student(s) updated`
        : "Every student already matches");
      load();
    } else {
      message.error(res.payload || "Could not apply the concessions");
    }
  };

  const costThem = async () => {
    const res = await dispatch(recordAmounts({}));
    if (recordAmounts.fulfilled.match(res)) { message.success(`${res.payload?.recorded ?? 0} concession(s) costed`); load(); }
    else message.error(res.payload || "Could not cost the concessions");
  };

  const schemeOptions = useMemo(
    () => (schemes || []).filter((s) => s.isActive !== false).map((s) => ({
      value: s._id,
      label: `${s.name} (${s.discountType === "percent" ? `${s.value}%` : money(s.value)})`,
    })),
    [schemes]
  );

  const studentOptions = useMemo(
    () => (studentList || []).map((s) => ({
      // The list endpoint projects a real Student._id as studentId; falling back to _id keeps it
      // working whichever shape comes back.
      value: s.studentId || s._id,
      label: s.name || s.userId?.name || "Unnamed",
    })),
    [studentList]
  );

  const pendingCount = (awards || []).filter((a) => a.status === "pending").length;

  const schemeColumns = [
    {
      title: "Scheme", dataIndex: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name} <Tag>{r.code}</Tag></div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.category} · {r.discountType === "percent" ? `${r.value}% off` : `${money(r.value)} off`}
            {r.requiresApproval ? " · needs approval" : " · granted outright"}
          </div>
        </div>
      ),
    },
    {
      title: "Places", width: 190,
      render: (_, r) => {
        if (r.usage?.maxAwards == null) {
          return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.usage?.approved ?? 0} given · no cap</span>;
        }
        const taken = (r.usage.approved || 0) + (r.usage.pending || 0);
        return (
          <div>
            <Progress
              percent={Math.round((taken / r.usage.maxAwards) * 100)}
              size="small"
              status={r.usage.isFull ? "exception" : "normal"}
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {taken} of {r.usage.maxAwards} taken{r.usage.pending ? ` (${r.usage.pending} pending)` : ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status", dataIndex: "isActive", width: 100,
      render: (active) => <span style={pill(active ? "var(--success)" : "var(--text-muted)")}>{active ? "Active" : "Off"}</span>,
    },
    {
      title: "", width: 160, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Button size="small" onClick={() => openSchemeModal(r)}>Edit</Button>
          <Popconfirm
            title="Delete this scheme?"
            description="Only possible while nobody holds it."
            onConfirm={() => removeScheme(r)}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const awardColumns = [
    {
      title: "Student",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.studentId?.userId?.name || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.schemeId?.name} · {r.schemeId?.discountType === "percent" ? `${r.schemeId?.value}%` : money(r.schemeId?.value)}
          </div>
        </div>
      ),
    },
    {
      title: "Reason", dataIndex: "reason",
      render: (reason, r) => (
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {reason || <span style={{ color: "var(--text-muted)" }}>—</span>}
          {r.decisionNote && <div style={{ fontStyle: "italic" }}>Decision: {r.decisionNote}</div>}
        </div>
      ),
    },
    {
      title: "Approved by", width: 150,
      render: (_, r) => (r.approvedBy?.name
        ? <div style={{ fontSize: 12 }}>{r.approvedBy.name}<div style={{ color: "var(--text-muted)" }}>{dayjs(r.approvedAt).format("D MMM YYYY")}</div></div>
        : <span style={{ color: "var(--text-muted)" }}>—</span>),
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (s) => <span style={pill(STATUS_COLOR[s])}>{s}</span>,
    },
    {
      title: "", width: 190, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {r.status === "pending" && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => decide(r, "approved")}>Approve</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => decide(r, "rejected")} />
            </>
          )}
          {r.status === "approved" && (
            <Popconfirm
              title="Revoke this concession?"
              description={
                <Input.TextArea
                  rows={2}
                  placeholder="Reason (required)"
                  onChange={(e) => { r.__revokeNote = e.target.value; }}
                />
              }
              onConfirm={() => revoke(r, r.__revokeNote || "")}
            >
              <Button size="small" danger>Revoke</Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("sch-table")}</style>

      <PageHeader
        title="Scholarships & Concessions"
        subtitle="Named schemes, who holds them, and what the school is giving away"
        icon={<GiftOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Tooltip title="Writes each student's combined concession onto their enrolment, which is what fee assignment reads.">
              <Button icon={<SyncOutlined />} loading={actionLoading} onClick={applyToFees}>Apply to fees</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAwardModal}>Give a concession</Button>
          </div>
        }
      />

      <StatCardsRow
        items={[
          { key: "approved", icon: <GiftOutlined />, label: "Concessions given", value: report?.totalApproved ?? 0, color: "var(--success)" },
          { key: "pending", icon: <WarningOutlined />, label: "Awaiting approval", value: report?.totalPending ?? 0, color: "var(--warning)" },
          { key: "waived", icon: <GiftOutlined />, label: "Waived so far", value: money(report?.totalWaived), color: "var(--accent)" },
          { key: "mismatch", icon: <WarningOutlined />, label: "Bills out of date", value: mismatches?.length ?? 0, color: "var(--danger)" },
        ]}
      />

      {mismatches?.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message={`${mismatches.length} student(s) have a bill that no longer matches their concession`}
          description="Fees already assigned are not rewritten automatically — a parent may have seen or paid against them. Decide each one, or reassign the fee."
        />
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "awards",
            label: pendingCount ? `Concessions (${pendingCount} awaiting)` : "Concessions",
            children: (
              <>
                <div style={{ ...sectionPanel, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Select
                    allowClear placeholder="All statuses" style={{ width: 190 }}
                    value={statusFilter} onChange={setStatusFilter}
                    options={["pending", "approved", "rejected", "revoked"].map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div style={sectionPanel}>
                  <div style={tableContainer}>
                    <Table
                      className="sch-table" rowKey="_id" size="middle" loading={awardsLoading}
                      columns={awardColumns} dataSource={awards}
                      pagination={{ pageSize: 20, showSizeChanger: false }}
                      locale={{ emptyText: "No concessions recorded yet" }}
                    />
                  </div>
                </div>
              </>
            ),
          },
          {
            key: "schemes",
            label: "Schemes",
            children: (
              <div style={sectionPanel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>What the school offers</div>
                  <Button icon={<PlusOutlined />} onClick={() => openSchemeModal()}>New scheme</Button>
                </div>
                {schemesLoading && !schemes?.length ? (
                  <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
                ) : !schemes?.length ? (
                  <div style={emptyState}>
                    <Empty description="No schemes yet" />
                    <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "12px auto" }}>
                      A scheme is the reusable definition — &ldquo;Staff Ward 50%&rdquo;, &ldquo;Sibling 10%&rdquo;.
                      Giving it to a child records who approved it and why.
                    </p>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openSchemeModal()}>Create one</Button>
                  </div>
                ) : (
                  <div style={tableContainer}>
                    <Table className="sch-table" rowKey="_id" size="middle" pagination={false}
                           columns={schemeColumns} dataSource={schemes} />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "report",
            label: "What it costs",
            children: reportLoading && !report ? (
              <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
            ) : (
              <>
                <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{money(report?.totalWaived)}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{report?.note}</div>
                  </div>
                  <Button loading={actionLoading} onClick={costThem}>Recalculate from the bills</Button>
                </div>

                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>By scheme</div>
                  <div style={tableContainer}>
                    <Table
                      className="sch-table" rowKey="schemeId" size="middle" pagination={false}
                      dataSource={report?.schemes || []}
                      locale={{ emptyText: "Nothing awarded yet" }}
                      columns={[
                        { title: "Scheme", render: (_, r) => <>{r.name} <Tag>{r.code}</Tag></> },
                        { title: "Category", dataIndex: "category", width: 140 },
                        { title: "Given", dataIndex: "approved", align: "right", width: 90 },
                        { title: "Pending", dataIndex: "pending", align: "right", width: 90 },
                        { title: "Waived", dataIndex: "amountWaived", align: "right", width: 140, render: money },
                      ]}
                    />
                  </div>
                </div>

                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>By category</div>
                  <div style={tableContainer}>
                    <Table
                      className="sch-table" rowKey="category" size="middle" pagination={false}
                      dataSource={report?.byCategory || []}
                      locale={{ emptyText: "Nothing awarded yet" }}
                      columns={[
                        { title: "Category", dataIndex: "category" },
                        { title: "Given", dataIndex: "approved", align: "right", width: 100 },
                        { title: "Waived", dataIndex: "amountWaived", align: "right", width: 160, render: money },
                      ]}
                    />
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />

      {/* ── Scheme ── */}
      <Modal
        open={schemeModal} width={620}
        title={editingScheme ? `Edit — ${editingScheme.name}` : "New scheme"}
        onCancel={() => setSchemeModal(false)} onOk={saveScheme}
        confirmLoading={actionLoading} okText={editingScheme ? "Save" : "Create"}
      >
        <Form form={schemeForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="Staff Ward" />
            </Form.Item>
            <Form.Item name="code" label="Code" rules={[{ required: true }]} style={{ width: 140 }}>
              <Input placeholder="STAFF" disabled={!!editingScheme} />
            </Form.Item>
          </div>
          <Form.Item name="category" label="Category">
            <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="discountType" label="Type" style={{ width: 170 }}>
              <Select options={[{ value: "percent", label: "Percentage" }, { value: "amount", label: "Flat amount" }]} />
            </Form.Item>
            <Form.Item name="value" label="Value" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="maxAwards" label="Funded places"
              extra="Leave blank for no limit."
              style={{ width: 160 }}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="eligibility" label="Who qualifies">
            <TextArea rows={2} placeholder="Children of full-time staff, one per family" />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="validFrom" label="Valid from" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="validUntil" label="Valid until" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item
            name="requiresApproval" label="Needs approval before it applies" valuePropName="checked"
            extra="Turn off for concessions that are automatic, like a sibling discount — otherwise each one queues up waiting for a decision already made."
          >
            <Switch />
          </Form.Item>
          {editingScheme && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ── Give a concession ── */}
      <Modal
        open={awardModal} width={560} title="Give a concession"
        onCancel={() => setAwardModal(false)} onOk={saveAward}
        confirmLoading={actionLoading} okText="Record"
      >
        <Form form={awardForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="schemeId" label="Scheme" rules={[{ required: true, message: "Pick a scheme" }]}>
            <Select showSearch optionFilterProp="label" options={schemeOptions} />
          </Form.Item>
          <Form.Item name="studentId" label="Student" rules={[{ required: true, message: "Pick the student" }]}>
            <Select showSearch optionFilterProp="label" options={studentOptions} placeholder="Search by name" />
          </Form.Item>
          <Form.Item
            name="reason" label="Why"
            extra="Asked for months later — at an audit, or when another parent asks why their neighbour pays less."
          >
            <TextArea rows={3} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="validFrom" label="From" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="validUntil" label="Until" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ScholarshipsPage;
