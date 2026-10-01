import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Button, Checkbox, Empty, Form, Input, InputNumber, Modal, Progress, Radio, Segmented, Space, Spin, Table, Tooltip, message,
} from "antd";
import {
  CalendarOutlined, CheckCircleFilled, CheckCircleOutlined, ClockCircleOutlined, CreditCardOutlined, ExclamationCircleOutlined,
  LockOutlined, PrinterOutlined, ReloadOutlined, WalletOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../icons/RupeeIcon";
import { choosePayPlan, fetchFeeSchedule, generateMissingSchedules, quoteInstallments } from "../../features/feeInstallmentSlice";
import { createPayment, fetchPayments, verifyPayment } from "../../features/paymentSlice";
import { statCard, statLabel, statValue, statGrid, iconWell } from "../../styles/pageStyles";
import FeeReceipt, { printFeeReceipt } from "./FeeReceipt.jsx";
import {
  COUNTER_MODES, FREQUENCIES, FREQUENCY_ORDER, FeeStatusTag, FrequencyTag, paymentModeLabel, recallCheckoutRows,
  fmtDate, getErrorMessage, lateFineText, money, receiptLines, useOnlineFeeCheckout,
} from "./feeUi.jsx";

const TABLE_CLS = "fee-ledger-tbl";
// The family view is compact: tighter panels than the office's collect screen.
const TIGHT = { padding: "12px 16px", marginBottom: 12 };

// A family sees one figure per period, not one per fee head: "Tuition Fee · Oct 2026" and
// "Transport Fee · Oct 2026" become a single "Oct 2026" line.
const byPeriod = (lines) => {
  const out = new Map();
  lines.forEach((l) => {
    const label = l.label.includes(" · ") ? l.label.split(" · ").slice(1).join(" · ") : "Fee";
    out.set(label, { label, amount: (out.get(label)?.amount || 0) + Number(l.amount || 0) });
  });
  return [...out.values()];
};

const panelTitle = (icon, title, sub, tight = false) => (
  <div style={{ display: "flex", alignItems: "center", gap: tight ? 8 : 10, marginBottom: tight ? 8 : 14 }}>
    <div style={iconWell("var(--primary)", tight ? 26 : 32)}>{icon}</div>
    <div>
      <div className="u-title">{title}</div>
      {sub && <div className="u-meta">{sub}</div>}
    </div>
  </div>
);

/**
 * A student's fees for one academic year, the same on every screen that shows them:
 *
 *   1. Summary — year fee, paid, due, overdue, late fine
 *   2. Fee structure — Fee Head | Amount | Frequency | Yearly, and "Total monthly ₹3,000"
 *   3. Pay plan — monthly, quarterly or yearly: the year's fee split the way the family pays it
 *   4. Installments — every period with its due date and status; pick the ones being paid
 *   5. Payment history — receipts
 *
 * Every figure shown comes from the backend — the schedule endpoint for totals and balances, the
 * quote endpoint for what a selection owes. This component does no arithmetic on money.
 *
 * mode "collect" (Accountant / School Admin): records a counter payment — Cash, UPI, Card, Bank
 * Transfer or Cheque — for any amount up to what the chosen installments owe (Partial Paid allowed).
 * mode "online" (Parent / Student): pays the chosen installments in full through the school's
 * Razorpay account. Here the schedule is one line per period ("Oct 2026 — ₹7,000") rather than
 * one per fee head, and whatever is due by today is selected already and cannot be left out.
 * Fee heads are not shown at all in this mode — the family sees the year's total and what each
 * period comes to, never Tuition / Transport / … separately.
 */
const StudentFeeLedger = ({ studentId, academicYearId, mode = "online", student, onPaid }) => {
  const dispatch = useDispatch();
  const receiptRef = useRef(null);
  const [collectForm] = Form.useForm();

  const { user } = useSelector((s) => s.auth || {});
  const schedule = useSelector((s) => s.feeInstallment || {});
  const scheduleReady = schedule.studentId === studentId;
  const {
    installments = [], periods = [], heads = [], perFrequency = {}, totals, settings, loading,
    payPlan = null, planOptions = [], canChoosePlan = false,
  } = scheduleReady ? schedule : {};

  const [view, setView] = useState("due");
  const [selectedIds, setSelectedIds] = useState([]);
  const [collectOpen, setCollectOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState({ loading: false, rows: [] });
  const [quote, setQuote] = useState({ total: 0, loading: false, error: null });
  const [planPick, setPlanPick] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
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

  // Online: what is due by today is always part of the payment. Anything else already picked is
  // kept if it is still unpaid.
  useEffect(() => {
    if (isCollect) return;
    const payable = new Set(installments.filter((r) => r.balance > 0).map((r) => String(r._id)));
    setSelectedIds((prev) => {
      const next = [...new Set([...dueNowIds, ...prev.filter((id) => payable.has(id))])];
      // Same selection: hand back the same array, or this effect would run for ever.
      return next.length === prev.length && next.every((id) => prev.includes(id)) ? prev : next;
    });
  }, [isCollect, installments, dueNowIds]);

  const selectedPeriodKeys = useMemo(
    () => periods.filter((p) => p.installmentIds.length && p.installmentIds.every((id) => selectedIds.includes(String(id)))).map((p) => p.key),
    [periods, selectedIds]
  );
  const selectedPeriods = useMemo(() => periods.filter((p) => selectedPeriodKeys.includes(p.key)), [periods, selectedPeriodKeys]);
  const nextPeriod = useMemo(() => periods.find((p) => p.balance > 0 && !p.dueNow && !selectedPeriodKeys.includes(p.key)) || null, [periods, selectedPeriodKeys]);

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

  const linesFor = (payment, rowsPaid) => {
    const lines = receiptLines(payment, rowsPaid);
    return isCollect ? lines : byPeriod(lines);
  };

  const afterPayment = (payment, rowsPaid) => {
    setSelectedIds([]);
    setReceipt({ payment, lines: linesFor(payment, rowsPaid) });
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

  // Tick or untick a period for paying in advance. Due-now and paid periods do not move.
  const togglePeriod = (period) => {
    if (period.dueNow || !(period.balance > 0)) return;
    const ids = period.installmentIds.map(String);
    setSelectedIds((prev) => (ids.every((id) => prev.includes(id)) ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const confirmPlan = async () => {
    try {
      setPlanSaving(true);
      const res = await dispatch(choosePayPlan({ studentId, academicYearId, plan: planPick.plan })).unwrap();
      message.success(res?.message || "Pay plan updated");
      setPlanPick(null);
      setPlanOpen(false);
      load();
    } catch (err) {
      message.error(getErrorMessage(err, "Could not change the pay plan"));
    } finally {
      setPlanSaving(false);
    }
  };

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
          <div className="u-strong">{r.feeHeadName}</div>
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
          <div className="u-strong">{r.installmentName}</div>
          <div className="u-meta">{r.feeHeadName}</div>
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
      render: (_, r) => (r.fineAmount > 0 ? <span style={{ color: "var(--danger-hover)" }}>{money(r.fineAmount)}</span> : <span className="u-muted">—</span>),
    },
    { title: "Paid", align: "right", render: (_, r) => (r.paidAmount > 0 ? money(r.paidAmount) : <span className="u-muted">—</span>) },
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
        const lines = linesFor(p);
        if (!lines.length) return <span className="u-muted">—</span>;
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
        <Button size="small" icon={<PrinterOutlined />} onClick={() => setReceipt({ payment: p, lines: linesFor(p) })}>
          Receipt
        </Button>
      ),
    },
  ];

  const frequencySummary = FREQUENCY_ORDER.filter((f) => perFrequency[f] > 0);

  return (
    <div>

      {/* 1 ── Summary */}
      {isCollect ? (
        <>
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
        </>
      ) : (
        <>
          {/* What to pay, and one button to pay it */}
          <div
            className="section-panel"
            style={{
              ...TIGHT, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
              background: selectedPeriods.length ? (totals?.overdueAmount > 0 ? "var(--danger-light)" : "var(--primary-light)") : "var(--success-light)",
            }}
          >
            <div style={{ minWidth: 200 }}>
              {selectedPeriods.length > 0 ? (
                <>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>To pay now</div>
                  <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: "var(--text-primary)" }}>
                    {quote.loading ? <Spin /> : quote.error ? <span style={{ fontSize: 15, color: "var(--danger)" }}>{quote.error}</span> : money(selectedTotal)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    For {selectedPeriods.length > 3
                      ? `${selectedPeriods.slice(0, 2).map((x) => x.label).join(", ")} +${selectedPeriods.length - 2} more`
                      : selectedPeriods.map((x) => x.label).join(", ")}
                  </div>
                  {totals?.overdueAmount > 0 && (
                    <div style={{ fontSize: 12, color: "var(--danger-hover)", fontWeight: 600, marginTop: 2 }}>
                      <ExclamationCircleOutlined /> {money(totals.overdueAmount)} of this is overdue{fineRule ? ` · ${fineRule}` : ""}
                    </div>
                  )}
                </>
              ) : totals?.dueAmount > 0 ? (
                <>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}><CheckCircleFilled style={{ color: "var(--success)" }} /> Nothing to pay right now</div>
                  {nextPeriod && (
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                      Next: <b>{money(nextPeriod.balance)}</b> for {nextPeriod.label}, by {fmtDate(nextPeriod.dueDate)}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}><CheckCircleFilled style={{ color: "var(--success)" }} /> This year's fee is fully paid</div>
              )}
            </div>
            {selectedPeriods.length > 0 ? (
              <Button type="primary" icon={<CreditCardOutlined />} disabled={!quoteReady} loading={paying} onClick={startOnline} style={{ height: 38, padding: "0 22px", fontWeight: 700 }}>
                Pay {quoteReady ? money(selectedTotal) : ""}
              </Button>
            ) : nextPeriod ? (
              <Button onClick={() => togglePeriod(nextPeriod)}>Pay {nextPeriod.label} in advance</Button>
            ) : null}
          </div>

          {/* The year at a glance */}
          <div className="section-panel" style={TIGHT}>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "baseline", fontSize: 13 }}>
              <span><span className="u-meta">This year's fee </span><b style={{ fontSize: 15 }}>{money(totals?.yearlyAmount)}</b></span>
              <span><span className="u-meta">Paid </span><b style={{ fontSize: 15, color: "var(--success)" }}>{money(totals?.paidAmount)}</b></span>
              <span><span className="u-meta">Left to pay </span><b style={{ fontSize: 15 }}>{money(totals?.dueAmount)}</b></span>
              {Number(totals?.fineAmount) > 0 && (
                <span><span className="u-meta">Late fine </span><b style={{ fontSize: 15, color: "var(--danger)" }}>{money(totals.fineAmount)}</b></span>
              )}
            </div>
            <Progress
              percent={totals?.yearlyAmount > 0 ? Math.min(Math.round((Number(totals?.paidAmount || 0) / totals.yearlyAmount) * 100), 100) : 0}
              strokeColor="var(--success)"
              size="small"
              style={{ marginTop: 4, marginBottom: 0 }}
            />
          </div>
        </>
      )}

      {/* 2 ── Fee structure (school office only) */}
      {isCollect && (
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
      )}

      {/* 3 ── Pay plan */}
      {planOptions.some((o) => o.count > 0) && payPlan && !planOpen && (
        <div className="section-panel" style={{ ...TIGHT, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13 }}>
            <CalendarOutlined style={{ color: "var(--primary)", marginRight: 8 }} />
            <b>You pay {FREQUENCIES[payPlan]?.label.toLowerCase()}</b>
            <span className="u-meta"> · the fee left is split evenly over each {FREQUENCIES[payPlan]?.per}</span>
          </div>
          {canChoosePlan && <Button size="small" onClick={() => setPlanOpen(true)}>Change</Button>}
        </div>
      )}

      {planOptions.some((o) => o.count > 0) && (!payPlan || planOpen) && (
        <div className="section-panel" style={isCollect ? undefined : TIGHT}>
          {panelTitle(
            <CalendarOutlined />,
            "How would you like to pay?",
            canChoosePlan ? "The year's fee is split evenly over the option you pick. You can change it later." : "Chosen by your parent or the school office",
            !isCollect
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {planOptions.map((o) => {
              const current = payPlan === o.plan;
              const f = FREQUENCIES[o.plan];
              return (
                <button
                  key={o.plan}
                  type="button"
                  disabled={!canChoosePlan || current || !(o.count > 0)}
                  onClick={() => setPlanPick(o)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 12, cursor: !canChoosePlan || current ? "default" : "pointer",
                    background: current ? f.bg : "var(--surface)",
                    border: `2px solid ${current ? f.color : "var(--border-muted)"}`,
                    color: "var(--text-primary)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: f.color }}>{o.label}</span>
                    {current && <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}><CheckCircleFilled /> Your plan</span>}
                  </div>
                  {o.count > 0 ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{money(o.amountEach)}</div>
                      <div className="u-meta">
                        {o.count === 1 ? "one payment" : `per ${f.per} · ${o.count} payments`} · first on {fmtDate(o.firstDue)}
                      </div>
                    </>
                  ) : (
                    <div className="u-meta" style={{ marginTop: 8 }}>Nothing left to split</div>
                  )}
                </button>
              );
            })}
          </div>
          {planOptions[0]?.staysDue > 0 && (
            <div className="u-meta" style={{ marginTop: 10 }}>
              {money(planOptions[0].staysDue)} that is already due or part paid stays as it is, whichever option you pick.
            </div>
          )}
        </div>
      )}

      {/* 4 ── Installments */}
      <div className="section-panel" style={isCollect ? undefined : TIGHT}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          {panelTitle(<ClockCircleOutlined />, isCollect ? "Installments" : "Payment schedule", isCollect ? (fineRule || `Due on the ${settings?.dueDay ?? 10}th of each period`) : "The whole year, in order. Tick a later one to pay it in advance.", !isCollect)}
          {isCollect && <Segmented
            value={view}
            onChange={setView}
            options={[
              { label: "Due", value: "due" },
              { label: `Overdue${totals?.overdueCount ? ` (${totals.overdueCount})` : ""}`, value: "overdue" },
              { label: "Paid", value: "paid" },
              { label: "All", value: "all" },
            ]}
          />}
        </div>

        {headsWithoutSchedule.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 14, borderRadius: 12 }}
            message={isCollect
              ? `${headsWithoutSchedule.map((h) => h.feeHeadName).join(", ")} ${headsWithoutSchedule.length > 1 ? "have" : "has"} no installments yet`
              : "Part of this year's fee has no installments yet"}
            description={isCollect ? undefined : "Please contact the school office."}
            action={isCollect ? <Button size="small" onClick={backfill}>Generate</Button> : undefined}
          />
        )}

        {isCollect ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Button size="small" disabled={!dueNowIds.length} onClick={() => setSelectedIds(dueNowIds)}>
              Select all due till today ({dueNowIds.length})
            </Button>
            {selectedIds.length > 0 && <Button size="small" type="text" onClick={() => setSelectedIds([])}>Clear selection</Button>}
          </div>
        ) : null}

        {!isCollect && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
            {periods.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No installments yet" />}
            {periods.map((period) => {
              const paid = !(period.balance > 0);
              const picked = selectedPeriodKeys.includes(period.key);
              const overdue = period.status === "overdue";
              return (
                <div
                  key={period.key}
                  onClick={() => togglePeriod(period)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10,
                    border: `1px solid ${picked ? "var(--primary)" : "var(--border-muted)"}`,
                    background: paid ? "var(--surface-soft)" : picked ? "var(--primary-light)" : "var(--surface)",
                    cursor: paid || period.dueNow ? "default" : "pointer",
                    opacity: paid ? 0.75 : 1,
                  }}
                >
                  <div style={{ width: 18, textAlign: "center" }}>
                    {paid
                      ? <CheckCircleFilled style={{ color: "var(--success)", fontSize: 16 }} />
                      : <Checkbox checked={picked} disabled={period.dueNow} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{period.label}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.3, color: overdue ? "var(--danger-hover)" : "var(--text-secondary)", fontWeight: overdue ? 600 : 400 }}>
                      {paid ? "Paid" : overdue ? `Was due ${fmtDate(period.dueDate)}` : period.dueNow ? `Due today (${fmtDate(period.dueDate)})` : `Due ${fmtDate(period.dueDate)}`}
                      {!paid && period.paidAmount > 0 ? ` · ${money(period.paidAmount)} already paid` : ""}
                      {period.fineAmount > 0 ? ` · incl. late fine ${money(period.fineAmount)}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{money(paid ? period.amount : period.balance)}</div>
                </div>
              );
            })}
          </div>
        )}

        {isCollect && (
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
        )}

        {/* Action bar */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            marginTop: isCollect ? 14 : 10,
            padding: isCollect ? "12px 16px" : "8px 12px",
            borderRadius: isCollect ? 14 : 10,
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
                <b>{isCollect ? selectedIds.length : selectedPeriodKeys.length}</b> {isCollect ? "selected" : `period${selectedPeriodKeys.length === 1 ? "" : "s"}`} ·{" "}
                {quote.loading ? <Spin size="small" /> : quote.error ? <span style={{ color: "var(--danger)" }}>{quote.error}</span> : <b style={{ fontSize: 16 }}>{money(selectedTotal)}</b>}
              </>
            ) : (
              <span className="u-muted">{isCollect ? "Select installments to pay" : "Nothing selected"}</span>
            )}
          </div>
          {isCollect ? (
            <Button type="primary" icon={<WalletOutlined />} disabled={!quoteReady} onClick={openCollect}>
              Collect Payment
            </Button>
          ) : (
            <Button type="primary" icon={<CreditCardOutlined />} disabled={!quoteReady} loading={paying} onClick={startOnline}>
              Pay {quoteReady ? money(selectedTotal) : ""}
            </Button>
          )}
        </div>
      </div>

      {/* 5 ── Payment history */}
      <div className="section-panel" style={isCollect ? undefined : TIGHT}>
        {panelTitle(<PrinterOutlined />, "Payment History", "Receipts for this student", !isCollect)}
        <div className={`${TABLE_CLS} data-table`} style={{ overflowX: "auto" }}>
          <Table
            rowKey="_id"
            columns={historyColumns}
            dataSource={history.rows}
            loading={history.loading}
            size={isCollect ? "middle" : "small"}
            scroll={{ x: 720 }}
            pagination={{ pageSize: 8, size: "small", hideOnSinglePage: true }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payments yet" /> }}
          />
        </div>
      </div>

      {/* Pay plan change */}
      <Modal
        title={planPick ? `Pay ${planPick.label.toLowerCase()}?` : "Pay plan"}
        open={!!planPick}
        onCancel={() => setPlanPick(null)}
        onOk={confirmPlan}
        okText="Yes, use this plan"
        confirmLoading={planSaving}
        centered
      >
        {planPick && (
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            <div>
              {planPick.count === 1
                ? <>One payment of <b>{money(planPick.amountEach)}</b>, due on <b>{fmtDate(planPick.firstDue)}</b>.</>
                : <><b>{planPick.count}</b> payments of <b>{money(planPick.amountEach)}</b>, from <b>{fmtDate(planPick.firstDue)}</b> to <b>{fmtDate(planPick.lastDue)}</b>.</>}
            </div>
            {planPick.staysDue > 0 && <div>{money(planPick.staysDue)} already due or part paid stays as it is.</div>}
            <div className="u-meta" style={{ marginTop: 8 }}>Payments already made are not affected.</div>
          </div>
        )}
      </Modal>

      {/* Counter collection */}
      {isCollect && (
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
            <InputNumber className="u-full" prefix="₹" min={0} max={selectedTotal} precision={2} />
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
      )}

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
