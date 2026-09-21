import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Button, Empty, Form, Input, InputNumber, Modal, Radio, Segmented, Space, Spin, Table, Tooltip, message,
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, CreditCardOutlined, ExclamationCircleOutlined,
  PrinterOutlined, ReloadOutlined, WalletOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../icons/RupeeIcon";
import { fetchFeeSchedule, generateMissingSchedules, quoteInstallments } from "../../features/feeInstallmentSlice";
import { createPayment, fetchPayments, verifyPayment } from "../../features/paymentSlice";
import { statCard, statLabel, statValue, statGrid, iconWell } from "../../styles/pageStyles";
import FeeReceipt, { printFeeReceipt } from "./FeeReceipt.jsx";
import {
  COUNTER_MODES, FREQUENCIES, FREQUENCY_ORDER, FeeStatusTag, FrequencyTag, paymentModeLabel, recallCheckoutRows,
  fmtDate, getErrorMessage, lateFineText, money, receiptLines, useOnlineFeeCheckout,
} from "./feeUi.jsx";

const TABLE_CLS = "fee-ledger-tbl";

const panelTitle = (icon, title, sub) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={iconWell("var(--primary)", 32)}>{icon}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  </div>
);

/**
 * A student's fees for one academic year, the same on every screen that shows them:
 *
 *   1. Summary — year fee, paid, due, overdue, late fine
 *   2. Fee structure — Fee Head | Amount | Frequency | Yearly, and "Total monthly ₹3,000"
 *   3. Installments — every period with its due date and status; pick the ones being paid
 *   4. Payment history — receipts
 *
 * Every figure shown comes from the backend — the schedule endpoint for totals and balances, the
 * quote endpoint for what a selection owes. This component does no arithmetic on money.
 *
 * mode "collect" (Accountant / School Admin): records a counter payment — Cash, UPI, Card, Bank
 * Transfer or Cheque — for any amount up to what the chosen installments owe (Partial Paid allowed).
 * mode "online" (Parent / Student): pays the chosen installments in full through the school's
 * Razorpay account.
 */
const StudentFeeLedger = ({ studentId, academicYearId, mode = "online", student, onPaid }) => {
  const dispatch = useDispatch();
  const receiptRef = useRef(null);
  const [collectForm] = Form.useForm();

  const { user } = useSelector((s) => s.auth || {});
  const schedule = useSelector((s) => s.feeInstallment || {});
  const scheduleReady = schedule.studentId === studentId;
  const { installments = [], heads = [], perFrequency = {}, totals, settings, loading } = scheduleReady ? schedule : {};

  const [view, setView] = useState("due");
  const [selectedIds, setSelectedIds] = useState([]);
  const [collectOpen, setCollectOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState({ loading: false, rows: [] });
  const [quote, setQuote] = useState({ total: 0, loading: false, error: null });
  const { payOnline, paying } = useOnlineFeeCheckout();

  const isCollect = mode === "collect";

  const load = useCallback(() => {
    if (!studentId || !academicYearId) return;
    dispatch(fetchFeeSchedule({ studentId, academicYearId }));
    setHistory((h) => ({ ...h, loading: true }));
    dispatch(fetchPayments({ studentId, limit: 50 }))
      .unwrap()
      .then((res) => setHistory({ loading: false, rows: res?.data || [] }))
      .catch(() => setHistory({ loading: false, rows: [] }));
  }, [dispatch, studentId, academicYearId]);

  useEffect(() => {
    setSelectedIds([]);
    load();
  }, [load]);

  /* ── Derived ───────────────────────────────────────────────────── */

  const dueNowIds = useMemo(() => installments.filter((r) => r.dueNow).map((r) => String(r._id)), [installments]);

  const visibleRows = useMemo(() => {
    if (view === "due") return installments.filter((r) => r.balance > 0);
    if (view === "overdue") return installments.filter((r) => r.status === "overdue");
    if (view === "paid") return installments.filter((r) => r.status === "paid");
    return installments;
  }, [installments, view]);

  const selectedRows = useMemo(
    () => installments.filter((r) => selectedIds.includes(String(r._id))),
    [installments, selectedIds]
  );

  // What the selection owes is asked of the server each time it changes (fines move with the date,
  // and the server is the only place fee figures are worked out).
  useEffect(() => {
    if (!selectedIds.length) {
      setQuote({ total: 0, loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setQuote((q) => ({ ...q, loading: true, error: null }));
    const timer = setTimeout(() => {
      dispatch(quoteInstallments({ studentId, installmentIds: selectedIds }))
        .unwrap()
        .then((data) => { if (!cancelled) setQuote({ total: data?.total || 0, loading: false, error: null }); })
        .catch((err) => { if (!cancelled) setQuote({ total: 0, loading: false, error: getErrorMessage(err) }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [dispatch, studentId, selectedIds]);

  const selectedTotal = quote.total;
  const quoteReady = selectedIds.length > 0 && !quote.loading && !quote.error;

  const fineRule = lateFineText(settings);
  const headsWithoutSchedule = heads.filter((h) => !h.hasSchedule);

  /* ── Actions ───────────────────────────────────────────────────── */

  const afterPayment = (payment, rowsPaid) => {
    setSelectedIds([]);
    setReceipt({ payment, lines: receiptLines(payment, rowsPaid) });
    load();
    onPaid?.(payment);
  };

  const openCollect = () => {
    collectForm.setFieldsValue({ amount: selectedTotal, paymentMode: "cash", referenceNo: "", remarks: "" });
    setCollectOpen(true);
  };

  const submitCollect = async () => {
    try {
      const values = await collectForm.validateFields();
      setSaving(true);
      const res = await dispatch(
        createPayment({
          studentId,
          installmentIds: selectedIds,
          amount: values.amount,
          paymentMode: values.paymentMode,
          referenceNo: values.referenceNo || undefined,
          remarks: values.remarks || undefined,
        })
      ).unwrap();
      message.success(res?.message || "Payment recorded");
      setCollectOpen(false);
      afterPayment(res?.data?.payment, selectedRows);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(getErrorMessage(err, "Payment failed"));
    } finally {
      setSaving(false);
    }
  };

  const reportOnlineResult = (result, rowsPaid) => {
    if (!result) return;
    if (result.state === "paid") {
      message.success("Payment successful");
      afterPayment(result.payment, rowsPaid);
    } else if (result.state === "failed") {
      message.error("The payment did not go through. No money was taken for these installments.");
      load();
    } else if (result.state === "pending") {
      message.info("The gateway is still processing this payment. It will show here once confirmed.");
      load();
    }
  };

  const startOnline = async () => {
    const rowsPaid = selectedRows;
    const result = await payOnline({
      studentId,
      installmentIds: selectedIds,
      rows: rowsPaid,
      description: `${rowsPaid.length} installment${rowsPaid.length > 1 ? "s" : ""}`,
      prefill: { name: user?.name, email: user?.email },
    });
    if (!result?.redirecting) reportOnlineResult(result, rowsPaid);
  };

  // Back from a gateway's own page (?paymentId=…&payment=…): the query string is only a hint —
  // confirm with the server, then clear it so a refresh doesn't repeat this.
  const [searchParams, setSearchParams] = useSearchParams();
  const returnedPaymentId = searchParams.get("paymentId");
  useEffect(() => {
    if (!returnedPaymentId || !studentId) return;
    const rows = recallCheckoutRows(returnedPaymentId);
    dispatch(verifyPayment({ paymentId: returnedPaymentId }))
      .unwrap()
      .then((res) => reportOnlineResult(res?.data, rows))
      .catch((err) => message.error(getErrorMessage(err, "Could not confirm the payment")))
      .finally(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("paymentId");
        next.delete("payment");
        setSearchParams(next, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedPaymentId, studentId]);

  const backfill = async () => {
    try {
      await dispatch(generateMissingSchedules({ studentId, academicYearId })).unwrap();
      message.success("Installments generated");
      load();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to generate installments"));
    }
  };

  /* ── Render ────────────────────────────────────────────────────── */

  if (!studentId || !academicYearId) return null;

  if (!scheduleReady) {
    if (schedule.error && !schedule.loading) {
      return (
        <Alert
          type="error"
          showIcon
          style={{ borderRadius: 12 }}
          message={schedule.error}
          action={<Button size="small" onClick={load}>Retry</Button>}
        />
      );
    }
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  if (!heads.length) {
    return (
      <div className="section-panel">
        <Empty description="No fees have been assigned for this academic year" />
      </div>
    );
  }

  const stats = [
    { label: "Year Fee", value: money(totals?.yearlyAmount), color: "var(--primary)", icon: <RupeeIcon /> },
    { label: "Paid", value: money(totals?.paidAmount), color: "var(--success)", icon: <CheckCircleOutlined /> },
    { label: "Due", value: money(totals?.dueAmount), color: "var(--warning)", icon: <ClockCircleOutlined /> },
    {
      label: `Overdue${totals?.overdueCount ? ` (${totals.overdueCount})` : ""}`,
      value: money(totals?.overdueAmount),
      color: "var(--danger)",
      icon: <ExclamationCircleOutlined />,
    },
    ...(Number(totals?.fineAmount) > 0
      ? [{ label: "Late Fine", value: money(totals.fineAmount), color: "var(--danger-hover)", icon: <ExclamationCircleOutlined /> }]
      : []),
  ];

  const headColumns = [
    {
      title: "Fee Head",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.feeHeadName}</div>
          {r.discountApplied?.percent ? (
            <div style={{ fontSize: 11, color: "var(--success-hover)" }}>{r.discountApplied.percent}% concession applied</div>
          ) : null}
        </div>
      ),
    },
    { title: "Amount", render: (_, r) => <span style={{ fontWeight: 700 }}>{money(r.perPeriodAmount)}</span> },
    { title: "Frequency", render: (_, r) => <FrequencyTag frequency={r.frequency} /> },
    { title: "Yearly", align: "right", render: (_, r) => money(r.yearlyAmount) },
    { title: "Paid", align: "right", render: (_, r) => <span style={{ color: "var(--success)", fontWeight: 600 }}>{money(r.paidAmount)}</span> },
    {
      title: "Due",
      align: "right",
      render: (_, r) => (
        <div>
          <span style={{ color: r.dueAmount > 0 ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>{money(r.dueAmount)}</span>
          {r.fineAmount > 0 && <div style={{ fontSize: 11, color: "var(--danger-hover)" }}>incl. fine {money(r.fineAmount)}</div>}
        </div>
      ),
    },
    {
      title: "Status",
      render: (_, r) => <FeeStatusTag status={r.overdueAmount > 0 ? "overdue" : r.status} paidAmount={r.paidAmount} />,
    },
  ];

  const instColumns = [
    {
      title: "Period",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.installmentName}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.feeHeadName}</div>
        </div>
      ),
    },
    {
      title: "Due Date",
      render: (_, r) => (
        <span style={{ color: r.status === "overdue" ? "var(--danger-hover)" : "var(--text-secondary)", fontWeight: r.status === "overdue" ? 600 : 400 }}>
          {fmtDate(r.dueDate)}
        </span>
      ),
    },
    { title: "Amount", align: "right", render: (_, r) => money(r.amount) },
    {
      title: "Fine",
      align: "right",
      render: (_, r) => (r.fineAmount > 0 ? <span style={{ color: "var(--danger-hover)" }}>{money(r.fineAmount)}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>),
    },
    { title: "Paid", align: "right", render: (_, r) => (r.paidAmount > 0 ? money(r.paidAmount) : <span style={{ color: "var(--text-muted)" }}>—</span>) },
    { title: "Balance", align: "right", render: (_, r) => <span style={{ fontWeight: 700 }}>{money(r.balance)}</span> },
    { title: "Status", render: (_, r) => <FeeStatusTag status={r.status} paidAmount={r.paidAmount} /> },
  ];

  const historyColumns = [
    { title: "Receipt", dataIndex: "receiptNo", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
    { title: "Date", render: (_, p) => fmtDate(p.paymentDate || p.createdAt) },
    { title: "Mode", render: (_, p) => paymentModeLabel(p) },
    {
      title: "For",
      render: (_, p) => {
        const lines = receiptLines(p);
        if (!lines.length) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const text = lines.map((l) => l.label).join(", ");
        return (
          <Tooltip title={text}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {lines.length > 2 ? `${lines[0].label} +${lines.length - 1} more` : text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Amount",
      align: "right",
      render: (_, p) => (
        <div>
          <span style={{ fontWeight: 700, color: "var(--success)" }}>{money(p.amountPaid)}</span>
          {p.refundedAmount > 0 && <div style={{ fontSize: 11, color: "var(--danger)" }}>refunded {money(p.refundedAmount)}</div>}
        </div>
      ),
    },
    {
      title: "",
      align: "right",
      render: (_, p) => (
        <Button size="small" icon={<PrinterOutlined />} onClick={() => setReceipt({ payment: p, lines: receiptLines(p) })}>
          Receipt
        </Button>
      ),
    },
  ];

  const frequencySummary = FREQUENCY_ORDER.filter((f) => perFrequency[f] > 0);

  return (
    <div>

      {/* 1 ── Summary */}
      <div className="stat-grid" style={statGrid(170)}>
        {stats.map((s) => (
          <div key={s.label} style={statCard({ color: s.color })}>
            <div>
              <div style={statLabel()}>{s.label}</div>
              <div style={{ ...statValue(), fontSize: 22 }}>{s.value}</div>
            </div>
            <div style={iconWell(s.color, 38)}>{s.icon}</div>
          </div>
        ))}
      </div>

      {totals?.overdueAmount > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          message={`${money(totals.overdueAmount)} is overdue`}
          description={fineRule || undefined}
        />
      )}

      {/* 2 ── Fee structure */}
      <div className="section-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          {panelTitle(<RupeeIcon />, "Fee Structure", student?.className || "Assigned fee heads for this year")}
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={load} />
          </Tooltip>
        </div>

        <div className={`${TABLE_CLS} data-table`} style={{ overflowX: "auto" }}>
          <Table rowKey="studentFeeId" columns={headColumns} dataSource={heads} pagination={false} size="middle" scroll={{ x: 760 }} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {frequencySummary.map((f) => (
            <div key={f} style={{ padding: "8px 14px", borderRadius: 12, background: FREQUENCIES[f].bg, color: FREQUENCIES[f].color, fontWeight: 600, fontSize: 13 }}>
              Total {FREQUENCIES[f].label.toLowerCase()}: {money(perFrequency[f])}
            </div>
          ))}
          <div style={{ padding: "8px 14px", borderRadius: 12, background: "var(--surface-soft)", color: "var(--text-primary)", fontWeight: 700, fontSize: 13, border: "1px solid var(--border-muted)" }}>
            Year total: {money(totals?.yearlyAmount)}
          </div>
        </div>
      </div>

      {/* 3 ── Installments */}
      <div className="section-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          {panelTitle(<ClockCircleOutlined />, "Installments", fineRule || `Due on the ${settings?.dueDay ?? 10}th of each period`)}
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { label: "Due", value: "due" },
              { label: `Overdue${totals?.overdueCount ? ` (${totals.overdueCount})` : ""}`, value: "overdue" },
              { label: "Paid", value: "paid" },
              { label: "All", value: "all" },
            ]}
          />
        </div>

        {headsWithoutSchedule.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 14, borderRadius: 12 }}
            message={`${headsWithoutSchedule.map((h) => h.feeHeadName).join(", ")} ${headsWithoutSchedule.length > 1 ? "have" : "has"} no installments yet`}
            description={isCollect ? undefined : "Please contact the school office."}
            action={isCollect ? <Button size="small" onClick={backfill}>Generate</Button> : undefined}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <Button size="small" disabled={!dueNowIds.length} onClick={() => setSelectedIds(dueNowIds)}>
            Select all due till today ({dueNowIds.length})
          </Button>
          {selectedIds.length > 0 && <Button size="small" type="text" onClick={() => setSelectedIds([])}>Clear selection</Button>}
        </div>

        <div className={`${TABLE_CLS} data-table`} style={{ overflowX: "auto" }}>
          <Table
            rowKey={(r) => String(r._id)}
            columns={instColumns}
            dataSource={visibleRows}
            loading={loading}
            size="middle"
            scroll={{ x: 820 }}
            pagination={{ pageSize: 12, size: "small", hideOnSinglePage: true }}
            rowSelection={{
              selectedRowKeys: selectedIds,
              preserveSelectedRowKeys: true,
              onChange: (keys) => setSelectedIds(keys.map(String)),
              getCheckboxProps: (r) => ({ disabled: !(r.balance > 0) }),
            }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={view === "due" ? "Nothing due — all paid" : "No installments"} /> }}
          />
        </div>

        {/* Action bar */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            marginTop: 14,
            padding: "12px 16px",
            borderRadius: 14,
            background: selectedIds.length ? "var(--primary-light)" : "var(--surface-soft)",
            border: "1px solid var(--border-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "var(--text-primary)" }}>
            {selectedIds.length ? (
              <>
                <b>{selectedIds.length}</b> selected ·{" "}
                {quote.loading ? <Spin size="small" /> : quote.error ? <span style={{ color: "var(--danger)" }}>{quote.error}</span> : <b style={{ fontSize: 16 }}>{money(selectedTotal)}</b>}
              </>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Select installments to pay</span>
            )}
          </div>
          {isCollect ? (
            <Button type="primary" icon={<WalletOutlined />} disabled={!quoteReady} onClick={openCollect}>
              Collect Payment
            </Button>
          ) : (
            <Button type="primary" icon={<CreditCardOutlined />} disabled={!quoteReady} loading={paying} onClick={startOnline}>
              Pay {quoteReady ? money(selectedTotal) : ""} Online
            </Button>
          )}
        </div>
      </div>

      {/* 4 ── Payment history */}
      <div className="section-panel">
        {panelTitle(<PrinterOutlined />, "Payment History", "Receipts for this student")}
        <div className={`${TABLE_CLS} data-table`} style={{ overflowX: "auto" }}>
          <Table
            rowKey="_id"
            columns={historyColumns}
            dataSource={history.rows}
            loading={history.loading}
            size="middle"
            scroll={{ x: 720 }}
            pagination={{ pageSize: 8, size: "small", hideOnSinglePage: true }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payments yet" /> }}
          />
        </div>
      </div>

      {/* Counter collection */}
      <Modal
        title="Collect Payment"
        open={collectOpen}
        onCancel={() => setCollectOpen(false)}
        onOk={submitCollect}
        okText="Record Payment"
        confirmLoading={saving}
        centered
        // Keep the form mounted while closed, so openCollect can fill it before the modal shows.
        forceRender
      >
        <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          {selectedRows.map((r) => (
            <div key={r._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
              <span>{r.feeHeadName} · {r.installmentName}{r.fineAmount > 0 ? " (incl. fine)" : ""}</span>
              <span style={{ fontWeight: 600 }}>{money(r.balance)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-muted)", marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
            <span>Total due</span>
            <span>{money(selectedTotal)}</span>
          </div>
        </div>

        <Form layout="vertical" form={collectForm}>
          <Form.Item
            name="amount"
            label="Amount received"
            extra="Less than the total is saved as Partial Paid — the oldest installment is settled first."
            rules={[
              { required: true, message: "Enter the amount received" },
              { type: "number", min: 1, message: "Amount must be at least ₹1" },
              { validator: (_, v) => (v > selectedTotal ? Promise.reject(new Error(`Cannot exceed ${money(selectedTotal)}`)) : Promise.resolve()) },
            ]}
          >
            <InputNumber style={{ width: "100%" }} prefix="₹" min={0} max={selectedTotal} precision={2} />
          </Form.Item>
          <Form.Item name="paymentMode" label="Payment mode" rules={[{ required: true }]}>
            <Radio.Group optionType="button" buttonStyle="solid" options={COUNTER_MODES} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.paymentMode !== b.paymentMode}>
            {({ getFieldValue }) =>
              getFieldValue("paymentMode") !== "cash" && (
                <Form.Item
                  name="referenceNo"
                  label={getFieldValue("paymentMode") === "cheque" ? "Cheque number" : "Transaction / reference no."}
                  rules={[{ required: true, message: "Enter the reference so this payment can be traced" }]}
                >
                  <Input maxLength={100} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Receipt */}
      <Modal
        title="Fee Receipt"
        open={!!receipt}
        onCancel={() => setReceipt(null)}
        centered
        width={560}
        footer={
          <Space>
            <Button onClick={() => setReceipt(null)}>Close</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => printFeeReceipt(receiptRef.current)}>
              Print
            </Button>
          </Space>
        }
      >
        {receipt && (
          <FeeReceipt
            ref={receiptRef}
            payment={receipt.payment}
            lines={receipt.lines}
            description="Fee payment"
            student={student}
            school={{ name: user?.school?.name }}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentFeeLedger;
