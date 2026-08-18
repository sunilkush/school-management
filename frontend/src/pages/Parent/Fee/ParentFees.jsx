import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Collapse, Descriptions, Empty, Input,
  InputNumber, Modal, Progress, Select, Space, Table, Tag, Tooltip, message,
} from "antd";
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CreditCardOutlined, ExclamationCircleOutlined,
  PrinterOutlined, ReloadOutlined, UserOutlined, WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyFees } from "../../../features/studentFeeSlice";
import { fetchFeeInstallments, generateInstallments } from "../../../features/feeInstallmentSlice";
import { createPayment } from "../../../features/paymentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel,
  statCard, statLabel, statValue,
} from "../../../styles/pageStyles";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const getErrorMessage = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err?.message || err?.payload?.message || err?.data?.message || fallback;
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const STAT_COLORS = ["var(--purple)", "var(--success)", "var(--danger)"];

const INST_STATUS = {
  paid:    { color: "var(--success)", bg: "var(--success-light)", border: "var(--success-light)", label: "Paid"    },
  partial: { color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning)",        label: "Partial" },
  pending: { color: "var(--text-secondary)", bg: "var(--surface-soft)", border: "var(--border)",   label: "Pending" },
  overdue: { color: "var(--danger-hover)", bg: "var(--danger-light)", border: "var(--danger-light)", label: "Overdue" },
};

/* ── Single installment card ── */
const InstCard = ({ inst, onPay, onPrint }) => {
  const due       = Number(inst.amount || 0) - Number(inst.paidAmount || 0);
  const paidPct   = inst.amount ? Math.round((Number(inst.paidAmount || 0) / Number(inst.amount)) * 100) : 0;
  const rawStatus = String(inst.status || "pending").toLowerCase();
  const isOverdue = inst.dueDate && dayjs(inst.dueDate).isBefore(dayjs(), "day") && rawStatus !== "paid";
  const statusKey = isOverdue ? "overdue" : rawStatus;
  const cfg       = INST_STATUS[statusKey] || INST_STATUS.pending;

  return (
    <div style={{
      padding: "14px 16px",
      border: `1.5px solid ${isOverdue ? "var(--danger-light)" : "var(--border-muted)"}`,
      borderRadius: 12,
      background: isOverdue ? "var(--danger-light)" : "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      transition: "box-shadow 0.15s",
    }}>
      {/* Status icon */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: cfg.bg, color: cfg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, border: `1.5px solid ${cfg.border}`,
      }}>
        {rawStatus === "paid"
          ? <CheckCircleOutlined />
          : isOverdue
            ? <ExclamationCircleOutlined />
            : <ClockCircleOutlined />}
      </div>

      {/* Name + Due date */}
      <div style={{ flex: "1 1 140px", minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>
          {inst.installmentName || "Installment"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <CalendarOutlined style={{ color: isOverdue ? "var(--danger)" : "var(--text-muted)", fontSize: 11 }} />
          <span style={{ color: isOverdue ? "var(--danger)" : "var(--text-muted)", fontWeight: 500 }}>
            {inst.dueDate ? dayjs(inst.dueDate).format("DD MMM YYYY") : "—"}
            {isOverdue && <span style={{ fontWeight: 700 }}> · Overdue</span>}
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: "flex", gap: 16, flex: "1 1 220px", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: money(inst.amount),     color: "var(--text-primary)" },
          { label: "Paid",  value: money(inst.paidAmount), color: "var(--success)"             },
          { label: "Due",   value: money(due),             color: due > 0 ? "var(--danger)" : "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress mini-bar (only if partial) */}
      {rawStatus === "partial" && (
        <div style={{ flex: "0 0 80px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
            {paidPct}% paid
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--border-muted)", overflow: "hidden" }}>
            <div style={{ width: `${paidPct}%`, height: "100%", background: "var(--warning)", borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Status badge */}
      <div style={{
        padding: "4px 12px", borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        fontWeight: 700, fontSize: 11,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}>
        {cfg.label}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {rawStatus !== "paid" && due > 0 ? (
          <Button
            type="primary"
            size="small"
            icon={<CreditCardOutlined />}
            onClick={() => onPay(inst)}
            danger={isOverdue}
            style={{ fontWeight: 600 }}
          >
            Pay Now
          </Button>
        ) : (
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => onPrint(inst)}
          >
            Receipt
          </Button>
        )}
      </div>
    </div>
  );
};

/* ── Page ── */
const ParentFees = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId");

  const { children = [], loading: childrenLoading }          = useSelector((s) => s.studentPortal || {});
  const { myFees = [], loading: feeLoading }                 = useSelector((s) => s.studentFee || {});
  const { installments = [] }                                = useSelector((s) => s.feeInstallment || {});
  const { selectedAcademicYear }                             = useSelector((s) => s.academicYear || {});

  const [selectedChildId,     setSelectedChildId]     = useState(null);
  const [paymentOpen,         setPaymentOpen]         = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid,          setAmountPaid]          = useState(0);
  const [paying,              setPaying]              = useState(false);
  const [paymentMethod,       setPaymentMethod]       = useState("online");
  const [chequeNo,            setChequeNo]            = useState("");

  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (selectedChildId || !children.length) return;
    const requested = requestedChildId && children.some((c) => c.userId === requestedChildId);
    setSelectedChildId(requested ? requestedChildId : children[0]?.userId);
  }, [children, selectedChildId, requestedChildId]);

  const selectedChild  = useMemo(() => children.find((c) => c.userId === selectedChildId) || null, [children, selectedChildId]);
  const enrollmentId   = selectedChild?._id;

  const refreshFeeData = () => {
    if (!enrollmentId || !academicYearId) return;
    dispatch(fetchMyFees({ studentId: enrollmentId, academicYearId }));
    dispatch(fetchFeeInstallments({ studentId: enrollmentId, academicYearId }));
  };

  useEffect(() => { refreshFeeData(); }, [dispatch, enrollmentId, academicYearId]);

  const totalFees   = useMemo(() => myFees.reduce((s, r) => s + Number(r.totalAmount || 0), 0), [myFees]);
  const paidFees    = useMemo(() => myFees.reduce((s, r) => s + Number(r.paidAmount  || 0), 0), [myFees]);
  const dueFees     = useMemo(() => myFees.reduce((s, r) => s + Number(r.dueAmount   || 0), 0), [myFees]);
  const paidPercent = totalFees ? Math.round((paidFees / totalFees) * 100) : 0;

  const groupedInstallments = useMemo(() => {
    if (!Array.isArray(installments)) return [];
    const map = {};
    installments.forEach((inst) => {
      const feeStructure = inst?.studentFeeId?.feeStructureId || inst?.feeStructureId || {};
      const feeId = feeStructure?._id || inst?.studentFeeId?._id || inst?._id;
      if (!map[feeId]) {
        map[feeId] = {
          key: feeId,
          feeHead: feeStructure?.feeHeadId?.name || inst?.feeHead?.name || "Fee",
          totalAmount: 0, paidAmount: 0, dueAmount: 0,
          installments: [],
        };
      }
      const amount = Number(inst.amount || 0);
      const paid   = Number(inst.paidAmount || 0);
      map[feeId].installments.push(inst);
      map[feeId].totalAmount += amount;
      map[feeId].paidAmount  += paid;
      map[feeId].dueAmount   += amount - paid;
    });
    return Object.values(map);
  }, [installments]);

  const openPayModal = (inst) => {
    const due = Number(inst.amount || 0) - Number(inst.paidAmount || 0);
    setSelectedInstallment(inst);
    setAmountPaid(due);
    setPaymentMethod("online");
    setChequeNo("");
    setPaymentOpen(true);
  };

  const closePayModal = () => {
    setPaymentOpen(false);
    setPaymentMethod("online");
    setChequeNo("");
  };

  const handlePrintReceipt = (inst) => {
    const child = children.find((c) => c.userId === selectedChildId);
    const w = window.open("", "_blank", "width=700,height=600");
    w.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>body{font-family:Arial,sans-serif;padding:30px}table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:8px 12px}th{background:#f4f4f4}h2{text-align:center}</style>
      </head><body>
      <h2>Fee Payment Receipt</h2>
      <p><strong>Student:</strong> ${child?.name || "—"} &nbsp;&nbsp;
         <strong>Class:</strong> ${child?.className || "—"} ${child?.sectionName || ""}</p>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Installment</td><td>${inst.installmentName || "—"}</td></tr>
        <tr><td>Amount</td><td>₹${Number(inst.amount || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td>Paid</td><td>₹${Number(inst.paidAmount || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td>Due Date</td><td>${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString("en-IN") : "—"}</td></tr>
        <tr><td>Status</td><td>${String(inst.status || "—").toUpperCase()}</td></tr>
        <tr><td>Printed On</td><td>${new Date().toLocaleString("en-IN")}</td></tr>
      </table>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const handleGenerateInstallments = async () => {
    if (!enrollmentId || !academicYearId) { message.error("Student and academic year are required"); return; }
    try {
      await dispatch(generateInstallments({ studentId: enrollmentId, academicYearId })).unwrap();
      message.success("Installments generated successfully");
      refreshFeeData();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to generate installments"));
    }
  };

  const handleOfflinePayment = async () => {
    if (!selectedInstallment?._id || !amountPaid) return;
    try {
      setPaying(true);
      await dispatch(createPayment({
        installmentId: selectedInstallment._id,
        amount: amountPaid,
        paymentMode: paymentMethod,
        ...(paymentMethod === "cheque" && chequeNo ? { transactionId: chequeNo } : {}),
      })).unwrap();
      message.success(`${paymentMethod === "cheque" ? "Cheque" : "Cash"} payment recorded`);
      closePayModal();
      refreshFeeData();
    } catch (err) {
      message.error(getErrorMessage(err, "Payment failed"));
    } finally { setPaying(false); }
  };

  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) { message.error("Razorpay SDK failed to load"); return; }
    try {
      setPaying(true);
      const paymentInit = await dispatch(createPayment({
        installmentId: selectedInstallment._id,
        amount: amountPaid,
        paymentMode: "razorpay",
      })).unwrap();
      const options = {
        key: paymentInit?.data?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentInit?.data?.amount,
        currency: "INR",
        order_id: paymentInit?.data?.orderId,
        name: "School Fee Payment",
        description: selectedInstallment?.installmentName || "Fee Payment",
        handler: async (response) => {
          await dispatch(createPayment({
            installmentId: selectedInstallment._id,
            amount: amountPaid,
            paymentMode: "razorpay",
            razorpay: response,
          })).unwrap();
          message.success("Online payment successful");
          closePayModal();
          refreshFeeData();
        },
        theme: { color: "#2563EB" }, // Razorpay checkout runs in its own iframe/window without our CSS vars — must stay a literal hex
      };
      new window.Razorpay(options).open();
    } catch (err) {
      message.error(getErrorMessage(err, "Online payment failed"));
    } finally { setPaying(false); }
  };

  const feeColumns = [
    {
      title: "Fee Head",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {r.feeStructureId?.feeHeadId?.name || "Fee"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.feeStructureId?.frequency || "—"}
          </div>
        </div>
      ),
    },
    { title: "Total", dataIndex: "totalAmount", render: money },
    { title: "Paid",  dataIndex: "paidAmount",  render: (v) => <span style={{ color: "var(--success)", fontWeight: 600 }}>{money(v)}</span> },
    { title: "Due",   dataIndex: "dueAmount",   render: (v) => <span style={{ color: "var(--danger)", fontWeight: 600 }}>{money(v)}</span> },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "paid" ? "success" : s === "partial" ? "warning" : "error"}>
          {String(s || "due").toUpperCase()}
        </Tag>
      ),
    },
  ];

  const noChild      = !selectedChildId;
  const noEnrollment = selectedChildId && !enrollmentId;

  return (
    <>
      <PageHeader
        title="Parent Fee Portal"
        subtitle="View child fee details, installments, and make secure payments."
        icon={<WalletOutlined />}
        extra={
          <Space wrap>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childrenLoading}
              style={{ minWidth: 240 }}
              options={children.map((c) => ({
                label: `${c.name || "Student"} (${c.registrationNumber || "—"})`,
                value: c.userId,
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshFeeData}
              disabled={!enrollmentId || !academicYearId}
            >
              Refresh
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {noEnrollment && (
          <Alert type="warning" showIcon message="Active enrollment not found for this child." style={{ marginBottom: 16, borderRadius: 10 }} />
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Fees", value: totalFees, color: "var(--purple)", icon: <WalletOutlined />        },
            { label: "Paid",       value: paidFees,  color: "var(--success)", icon: <CheckCircleOutlined />   },
            { label: "Pending",    value: dueFees,   color: "var(--danger)", icon: <ClockCircleOutlined />   },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={statCard({ color })}>
              <div>
                <div style={statLabel(color)}>{label}</div>
                <div style={{ ...statValue(color), fontSize: 20 }}>{money(value)}</div>
              </div>
              <div style={{ fontSize: 26, color, opacity: 0.5 }}>{icon}</div>
            </div>
          ))}

          {/* Progress card */}
          <div style={{
            ...sectionPanel, marginBottom: 0,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Payment Progress
            </div>
            <Progress
              percent={paidPercent}
              status={paidPercent === 100 ? "success" : "active"}
              strokeColor="var(--success)"
              trailColor="var(--border-muted)"
              format={(p) => <span style={{ fontWeight: 700 }}>{p}%</span>}
            />
          </div>
        </div>

        {/* ── Fee Summary ── */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <UserOutlined style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Student Fee Summary</span>
          </div>
          {noChild ? (
            <Empty description="Please select a child to view fees" />
          ) : noEnrollment ? (
            <Empty description="No active enrollment found" />
          ) : (
            <Table
              columns={feeColumns}
              dataSource={myFees}
              rowKey="_id"
              loading={feeLoading}
              pagination={false}
              scroll={{ x: 650 }}
              size="small"
            />
          )}
        </div>

        {/* ── Installments ── */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Installments</div>
              {installments.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {installments.filter((i) => i.status === "paid").length} of {installments.length} paid
                </div>
              )}
            </div>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!enrollmentId || !academicYearId || installments.length > 0}
              onClick={handleGenerateInstallments}
            >
              Generate Installments
            </Button>
          </div>

          {noChild ? (
            <Empty description="Please select a child to view installments" />
          ) : noEnrollment ? (
            <Empty description="No active enrollment found" />
          ) : !groupedInstallments.length ? (
            <Empty description="No installments generated yet" />
          ) : (
            <Collapse
              bordered={false}
              defaultActiveKey={groupedInstallments.map((g) => g.key)}
              style={{ background: "transparent" }}
              items={groupedInstallments.map((group) => {
                const groupPct = group.totalAmount
                  ? Math.round((group.paidAmount / group.totalAmount) * 100)
                  : 0;
                const overdueCount = group.installments.filter((i) => {
                  const isOverdue = i.dueDate && dayjs(i.dueDate).isBefore(dayjs(), "day") && String(i.status || "").toLowerCase() !== "paid";
                  return isOverdue;
                }).length;

                return {
                  key: group.key,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%" }}>
                      {/* Fee head */}
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", flex: "0 0 auto" }}>
                        {group.feeHead}
                      </div>

                      {/* Overdue badge */}
                      {overdueCount > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: "var(--danger-hover)", background: "var(--danger-light)",
                          border: "1px solid var(--danger-light)",
                          padding: "2px 8px", borderRadius: 20,
                        }}>
                          {overdueCount} Overdue
                        </span>
                      )}

                      {/* Amount pills */}
                      <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {[
                          { label: "Total", value: group.totalAmount, color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.12)" },
                          { label: "Paid",  value: group.paidAmount,  color: "var(--success)", bg: "var(--success-light)" },
                          { label: "Due",   value: group.dueAmount,   color: "var(--danger)", bg: "var(--danger-light)" },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 10px", borderRadius: 20,
                            background: bg, color, fontWeight: 700, fontSize: 12,
                          }}>
                            {label}: {money(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
                      {/* Progress bar for this group */}
                      <div style={{
                        marginBottom: 16, padding: "10px 14px",
                        background: "var(--surface-soft)",
                        border: "1px solid var(--border-muted)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Payment Progress</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: groupPct === 100 ? "var(--success)" : "var(--text-primary)" }}>
                              {groupPct}%
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "var(--border-muted)", overflow: "hidden" }}>
                            <div style={{
                              width: `${groupPct}%`,
                              height: "100%",
                              background: groupPct === 100 ? "var(--success)" : groupPct > 50 ? "var(--warning)" : "var(--danger)",
                              borderRadius: 3,
                              transition: "width 0.4s ease",
                            }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {money(group.paidAmount)} / {money(group.totalAmount)}
                        </div>
                      </div>

                      {/* Installment cards */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {group.installments
                          .slice()
                          .sort((a, b) => dayjs(a.dueDate || 0).valueOf() - dayjs(b.dueDate || 0).valueOf())
                          .map((inst) => (
                            <InstCard
                              key={inst._id}
                              inst={inst}
                              onPay={openPayModal}
                              onPrint={handlePrintReceipt}
                            />
                          ))}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>

        {/* ── Payment Modal ── */}
        <Modal
          title="Pay Installment"
          open={paymentOpen}
          onCancel={closePayModal}
          centered
          width={460}
          footer={[
            <Button key="cancel" onClick={closePayModal}>Cancel</Button>,
            paymentMethod === "online" ? (
              <Button key="pay" type="primary" icon={<CreditCardOutlined />} loading={paying} onClick={handleRazorpayPayment}>
                Pay Online (Razorpay)
              </Button>
            ) : (
              <Button key="pay" type="primary" icon={<WalletOutlined />} loading={paying} onClick={handleOfflinePayment}>
                Confirm {paymentMethod === "cheque" ? "Cheque" : "Cash"} Payment
              </Button>
            ),
          ]}
        >
          {selectedInstallment && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border-muted)" }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Installment">
                    <span style={{ fontWeight: 700 }}>{selectedInstallment.installmentName}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Due Amount">
                    <span style={{ color: "var(--danger)", fontSize: 16, fontWeight: 700 }}>
                      {money(Number(selectedInstallment.amount || 0) - Number(selectedInstallment.paidAmount || 0))}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Amount to Pay
                </div>
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                  max={Number(selectedInstallment.amount || 0) - Number(selectedInstallment.paidAmount || 0)}
                  value={amountPaid}
                  onChange={setAmountPaid}
                  formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                  parser={(v) => v?.replace(/[₹,\s]/g, "")}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Payment Method
                </div>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {[
                    { value: "online", label: "💳 Pay Online (Razorpay)", desc: "Secure card / UPI / netbanking via Razorpay" },
                    { value: "cash",   label: "💵 Cash",   desc: "Record an offline cash payment" },
                    { value: "cheque", label: "📋 Cheque", desc: "Record a cheque payment (enter cheque no. below)" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => { setPaymentMethod(opt.value); setChequeNo(""); }}
                      style={{
                        padding: "10px 14px", borderRadius: 12,
                        border: `2px solid ${paymentMethod === opt.value ? "var(--primary)" : "var(--border-muted)"}`,
                        background: paymentMethod === opt.value ? "var(--primary-light)" : "var(--surface)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: paymentMethod === opt.value ? "var(--primary)" : "var(--text-primary)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  ))}
                </Space>
              </div>

              {paymentMethod === "cheque" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Cheque Number
                  </div>
                  <Input size="large" placeholder="Enter cheque number" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} />
                </div>
              )}
            </Space>
          )}
        </Modal>
      </div>
    </>
  );
};

export default ParentFees;
