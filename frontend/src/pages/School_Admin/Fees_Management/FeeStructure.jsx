import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, Table, Button, Modal, Form, InputNumber, message, Space, Tooltip, Popconfirm, Switch, Radio, Alert, Empty,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, SettingOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchFeeHeads } from "../../../features/headSlice.js";
import { currentUser } from "../../../features/authSlice.js";
import {
  fetchFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, fetchFeeSettings, saveFeeSettings,
  fetchFeeStructureSummary,
} from "../../../features/feeStructureSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, sectionPanel, toolbarRow, tableHeadCss, pill, iconWell,
} from "../../../styles/pageStyles";
import {
  FREQUENCIES, FREQUENCY_OPTIONS, FREQUENCY_ORDER, FrequencyTag, lateFineText, money, perPeriodLabel,
} from "../../../components/fees/feeUi.jsx";

const { Option } = Select;

// Every fee figure on this page — yearly totals, "Total monthly", year total — comes from the
// backend (GET /fee-structures and /fee-structures/summary). Nothing is calculated here.

const FeeStructure = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { feeHeads = [] } = useSelector((s) => s.feeHead);
  const { feeStructures = [], loading, settings, settingsSaving } = useSelector((s) => s.feeStructure);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const academicYearId = selectedAcademicYear?._id;
  const schoolId = user?.school?._id;

  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [classFilter, setClassFilter] = useState(undefined);

  const watchFrequency = Form.useWatch("frequency", form);
  const watchFine = Form.useWatch("lateFine", settingsForm);

  const feeStructureQuery = useMemo(
    () => ({ schoolId, ...(academicYearId ? { academicYearId } : {}), ...(classFilter ? { schoolClassId: classFilter } : {}) }),
    [schoolId, academicYearId, classFilter]
  );

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchFeeHeads({ schoolId }));
    dispatch(fetchFeeSettings());
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchFeeStructures(feeStructureQuery));
  }, [dispatch, schoolId, feeStructureQuery]);

  /* ── Class summary (Rahul's example), computed by the backend ───────── */

  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(() => {
    if (!classFilter) { setSummary(null); return; }
    dispatch(fetchFeeStructureSummary({ schoolClassId: classFilter, academicYearId }))
      .unwrap()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [dispatch, classFilter, academicYearId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const summaryClassName = schoolClasses.find((c) => c._id === classFilter)?.name;

  /* ── Handlers ───────────────────────────────────────────────────── */

  const closeForm = () => { setOpen(false); setEditingRecord(null); form.resetFields(); };

  const handleSubmit = async (values) => {
    try {
      if (editingRecord?._id) {
        await dispatch(updateFeeStructure({ id: editingRecord._id, data: { ...values, academicYearId } })).unwrap();
        message.success("Fee structure updated");
      } else {
        await dispatch(createFeeStructure({ ...values, academicYearId })).unwrap();
        message.success("Fee structure created");
      }
      closeForm();
      dispatch(fetchFeeStructures(feeStructureQuery));
      loadSummary();
    } catch (err) {
      message.error(err || "Duplicate fee structure already exists");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      schoolClassId: record.schoolClassId?._id,
      feeHeadId: record.feeHeadId?._id,
      amount: record.amount,
      frequency: record.frequency,
    });
    setOpen(true);
  };

  const handleDelete = async (record) => {
    try {
      await dispatch(deleteFeeStructure(record._id)).unwrap();
      message.success("Fee structure deleted");
      dispatch(fetchFeeStructures(feeStructureQuery));
      loadSummary();
    } catch (err) {
      message.error(err || "Failed to delete fee structure");
    }
  };

  // A one-time head (Admission Fee) is almost always charged once — pre-fill that.
  const onHeadChange = (headId) => {
    const head = feeHeads.find((h) => h._id === headId);
    if (head?.type === "one-time" && !form.getFieldValue("frequency")) form.setFieldValue("frequency", "one_time");
  };

  const openSettings = () => {
    settingsForm.setFieldsValue({
      dueDay: settings?.dueDay ?? 10,
      lateFine: {
        enabled: settings?.lateFine?.enabled ?? false,
        type: settings?.lateFine?.type ?? "fixed",
        amount: settings?.lateFine?.amount ?? 0,
        graceDays: settings?.lateFine?.graceDays ?? 0,
        maxAmount: settings?.lateFine?.maxAmount ?? 0,
      },
    });
    setSettingsOpen(true);
  };

  const submitSettings = async () => {
    try {
      const values = await settingsForm.validateFields();
      await dispatch(saveFeeSettings(values)).unwrap();
      message.success("Fee settings saved");
      setSettingsOpen(false);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err || "Failed to save fee settings");
    }
  };

  /* ── Table ──────────────────────────────────────────────────────── */

  const columns = [
    {
      title: "Class",
      render: (r) => r.schoolClassId?.name
        ? <span style={pill("var(--accent)", "rgba(var(--accent-rgb), 0.2)")}>{r.schoolClassId.name}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Fee Head",
      render: (r) => <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.feeHeadId?.name || "—"}</span>,
    },
    {
      title: "Amount",
      render: (r) => <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{perPeriodLabel(r.amount, r.frequency)}</span>,
    },
    { title: "Frequency", render: (r) => <FrequencyTag frequency={r.frequency} /> },
    {
      title: "Yearly Total",
      align: "right",
      render: (r) => <span style={{ fontWeight: 700, color: "var(--success)" }}>{money(r.yearlyAmount)}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: "var(--warning)" }} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this fee structure?"
            description="Students it was already assigned to keep their fee."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fineText = lateFineText(settings);

  return (
    <>
      <style>{tableHeadCss("fee-table")}</style>

      <PageHeader
        title="Fee Structure"
        subtitle={`${selectedAcademicYear?.name ?? "Current Year"} · ${user?.school?.name ?? "School"}`}
        icon={<RupeeIcon />}
        extra={
          <Space size={8} wrap>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchFeeStructures(feeStructureQuery))} />
            </Tooltip>
            <Button icon={<SettingOutlined />} onClick={openSettings}>Fee Settings</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); if (classFilter) form.setFieldValue("schoolClassId", classFilter); setOpen(true); }}>
              Add Fee Structure
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* School fee rules at a glance */}
        <div style={{ ...sectionPanel, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={iconWell("var(--primary)", 34)}><SettingOutlined /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              Installments fall due on the {settings?.dueDay ?? 10}th of each period
            </div>
            <div style={{ fontSize: 12, color: fineText ? "var(--danger-hover)" : "var(--text-muted)" }}>
              {fineText || "Late fine is off"}
            </div>
          </div>
          <Button size="small" onClick={openSettings}>Change</Button>
        </div>

        {/* Class summary */}
        {classFilter && summary && (
          <div style={sectionPanel}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
              {summaryClassName} — fee per student
            </div>
            {summary.rows.length ? (
              <>
                <div className="fee-table" style={{ overflowX: "auto" }}>
                  <Table
                    rowKey="_id"
                    size="small"
                    pagination={false}
                    dataSource={summary.rows}
                    columns={[
                      { title: "Fee Head", render: (r) => <b>{r.feeHeadName}</b> },
                      { title: "Amount", render: (r) => money(r.perPeriodAmount) },
                      { title: "Due", render: (r) => <FrequencyTag frequency={r.frequency} /> },
                      { title: "Per Year", align: "right", render: (r) => money(r.yearlyAmount) },
                    ]}
                  />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                  {FREQUENCY_ORDER.filter((f) => summary.perFrequency?.[f] > 0).map((f) => (
                    <div key={f} style={{ padding: "8px 14px", borderRadius: 12, background: FREQUENCIES[f].bg, color: FREQUENCIES[f].color, fontWeight: 600, fontSize: 13 }}>
                      Total {FREQUENCIES[f].label.toLowerCase()}: {money(summary.perFrequency[f])}
                    </div>
                  ))}
                  <div style={{ padding: "8px 14px", borderRadius: 12, background: "var(--surface-soft)", border: "1px solid var(--border-muted)", fontWeight: 700, fontSize: 13 }}>
                    Year total: {money(summary.yearlyTotal)}
                  </div>
                </div>
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No fee heads set for this class yet" />
            )}
          </div>
        )}

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Fee Structures
              </span>
              <div style={{ flex: 1 }} />
              <Select allowClear style={{ minWidth: 200 }} placeholder="Filter by class" value={classFilter} onChange={setClassFilter}>
                {schoolClasses?.map((c) => <Option key={c._id} value={c._id}>{c.name}</Option>)}
              </Select>
            </div>
          </div>

          <div className="fee-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={feeStructures}
              loading={loading}
              pagination={{
                pageSize: 10,
                size: "small",
                showTotal: (total) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} records</span>,
              }}
              scroll={{ x: 760 }}
            />
          </div>
        </div>

        {/* Create / edit */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconWell("var(--primary)", 34)}><RupeeIcon /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                  {editingRecord ? "Update Fee Structure" : "Create Fee Structure"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>What one student of this class pays for this fee head</div>
              </div>
            </div>
          }
          open={open}
          onCancel={closeForm}
          onOk={() => form.submit()}
          okText={editingRecord ? "Update" : "Save"}
          centered
          forceRender
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ marginTop: 8 }}>
            <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Select a class" }]}>
              <Select placeholder="Select class" disabled={!!editingRecord}>
                {schoolClasses?.map((c) => <Option key={c._id} value={c._id}>{c.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="feeHeadId" label="Fee Head" rules={[{ required: true, message: "Select a fee head" }]}>
              <Select placeholder="Tuition, Transport, Exam…" onChange={onHeadChange} disabled={!!editingRecord}>
                {feeHeads?.map((f) => <Option key={f._id} value={f._id}>{f.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: "Select how often it is charged" }]}>
              <Select placeholder="Monthly, Quarterly…" options={FREQUENCY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="amount"
              label={watchFrequency && watchFrequency !== "one_time" ? `Amount per ${FREQUENCIES[watchFrequency]?.per}` : "Amount"}
              rules={[{ required: true, message: "Enter the amount" }]}
              extra={watchFrequency && watchFrequency !== "one_time" ? `Charged every ${FREQUENCIES[watchFrequency]?.per}; the yearly total is shown in the list after saving.` : undefined}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="e.g. 2000" prefix="₹" />
            </Form.Item>
            {editingRecord && (
              <Alert
                type="info"
                showIcon
                message="Changes apply to students assigned from now on. Students already assigned keep their current fee."
              />
            )}
          </Form>
        </Modal>

        {/* School fee settings */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconWell("var(--primary)", 34)}><SettingOutlined /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Fee Settings</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Applies to {user?.school?.name || "this school"} only</div>
              </div>
            </div>
          }
          open={settingsOpen}
          onCancel={() => setSettingsOpen(false)}
          onOk={submitSettings}
          okText="Save"
          confirmLoading={settingsSaving}
          centered
          forceRender
        >
          <Form layout="vertical" form={settingsForm} style={{ marginTop: 8 }}>
            <Form.Item
              name="dueDay"
              label="Due day of the month"
              extra="Monthly fees fall due on this day every month; quarterly on this day in the quarter's first month. Applies to fees assigned from now on."
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={28} style={{ width: 140 }} addonAfter="th" />
            </Form.Item>

            <Form.Item name={["lateFine", "enabled"]} label="Late fine" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>

            {watchFine?.enabled && (
              <>
                <Form.Item name={["lateFine", "type"]} label="How it is charged">
                  <Radio.Group>
                    <Radio value="fixed">Once per late installment</Radio>
                    <Radio value="per_day">Per day late</Radio>
                  </Radio.Group>
                </Form.Item>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Form.Item
                    name={["lateFine", "amount"]}
                    label={watchFine?.type === "per_day" ? "Fine per day" : "Fine amount"}
                    rules={[{ required: true }, { type: "number", min: 1, message: "Must be at least ₹1" }]}
                  >
                    <InputNumber min={0} prefix="₹" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name={["lateFine", "graceDays"]} label="Grace days" extra="Days after the due date before the fine starts">
                    <InputNumber min={0} max={90} style={{ width: "100%" }} />
                  </Form.Item>
                </div>
                {watchFine?.type === "per_day" && (
                  <Form.Item name={["lateFine", "maxAmount"]} label="Maximum fine per installment" extra="0 = no limit">
                    <InputNumber min={0} prefix="₹" style={{ width: "100%" }} />
                  </Form.Item>
                )}
                {lateFineText({ lateFine: watchFine }) && (
                  <Alert type="warning" showIcon message={lateFineText({ lateFine: watchFine })} />
                )}
              </>
            )}
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default FeeStructure;
