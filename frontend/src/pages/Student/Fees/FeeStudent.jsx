import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Modal,
  Descriptions,
  message,
  InputNumber,
  Radio,
  Space,
} from "antd";
import {
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useDispatch, useSelector } from "react-redux";

import { fetchMyFees } from "../../../features/studentFeeSlice";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";
import { createPayment } from "../../../features/paymentSlice";
import {
  generateInstallments,
  fetchFeeInstallments,
} from "../../../features/feeInstallmentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles";

/* ── Razorpay loader ── */
const loadRazorpay = () =>
  new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/* ── Quarter meta ── */
const Q_MONTHS = {
  1: { label: "Q1", months: "Jan · Feb · Mar", color: "var(--purple)", bg: "rgba(var(--purple-rgb),0.12)" },
  2: { label: "Q2", months: "Apr · May · Jun", color: "var(--cyan)", bg: "rgba(var(--cyan-rgb),0.12)" },
  3: { label: "Q3", months: "Jul · Aug · Sep", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  4: { label: "Q4", months: "Oct · Nov · Dec", color: "var(--success)", bg: "var(--success-light)" },
};

const STATUS_CFG = {
  paid:    { color: "var(--success)", bg: "var(--success-light)", icon: <CheckCircleOutlined />,      label: "Paid"    },
  pending: { color: "var(--warning)", bg: "var(--warning-light)", icon: <ClockCircleOutlined />,      label: "Pending" },
  partial: { color: "var(--cyan)", bg: "rgba(var(--cyan-rgb),0.15)", icon: <ExclamationCircleOutlined />, label: "Partial" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontWeight: 700,
      fontSize: 11, whiteSpace: "nowrap",
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.bg}`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

/* ── Stat chip ── */
const Chip = ({ label, value, color, bg }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "6px 14px", borderRadius: 10,
    background: bg || "var(--surface-soft)", border: `1px solid ${bg || "var(--border)"}`, minWidth: 80,
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
const FeeStudent = () => {
  const dispatch = useDispatch();

  const { myFees = [], loading: feeLoading } = useSelector((s) => s.studentFee || {});
  const { myEnrollment }                     = useSelector((s) => s.students || {});
  const { installments = [], loading: installmentLoading } = useSelector((s) => s.feeInstallment || {});

  const enrollmentId   = myEnrollment?.enrollmentId;
  const studentId      = myEnrollment?.studentId;
  const academicYearId = myEnrollment?.academicYear?._id;

  const [open,                setOpen]                = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid,          setAmountPaid]          = useState(0);
  const [paymentMethod,       setPaymentMethod]       = useState("online");
  const [chequeNo,            setChequeNo]            = useState("");
  const [frequencyModalOpen,  setFrequencyModalOpen]  = useState(false);
  const [selectedFrequency,   setSelectedFrequency]   = useState("monthly");
  const [receiptInstallment,  setReceiptInstallment]  = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => { dispatch(fetchMyStudentEnrollment()); }, [dispatch]);

  useEffect(() => {
    if (enrollmentId && studentId) {
      dispatch(fetchMyFees({ studentId, academicYearId }));
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    }
  }, [dispatch, enrollmentId, studentId, academicYearId]);

  /* ── Group installments by quarter ── */
  const groupedTableData = useMemo(() => {
    if (!installments.length) return [];

    const groups = {};
    installments.forEach((inst) => {
      let qNum = 0;
      let year = "";
      if (inst.dueDate) {
        const d = new Date(inst.dueDate);
        const m = d.getMonth() + 1;
        qNum = Math.ceil(m / 3);
        year = String(d.getFullYear());
      }
      const key = qNum ? `${qNum}-${year}` : "other";
      if (!groups[key]) groups[key] = { qNum, year, items: [] };
      groups[key].items.push(inst);
    });

    // Sort groups by quarter-year
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "other") return 1;
      if (b === "other") return -1;
      const [qa, ya] = a.split("-");
      const [qb, yb] = b.split("-");
      return ya !== yb ? Number(ya) - Number(yb) : Number(qa) - Number(qb);
    });

    const rows = [];
    sortedKeys.forEach((key) => {
      const { qNum, year, items } = groups[key];
      const meta  = Q_MONTHS[qNum] || { label: "Other", months: "", color: "var(--text-secondary)", bg: "var(--background)" };
      const total = items.reduce((s, i) => s + (i.amount || 0), 0);
      const paid  = items.reduce((s, i) => s + (i.paidAmount || 0), 0);
      const due   = total - paid;
      const paidCnt    = items.filter((i) => i.status === "paid").length;
      const pendingCnt = items.filter((i) => i.status !== "paid").length;

      rows.push({
        _id:           `__group__${key}`,
        isGroupHeader: true,
        groupLabel:    `${meta.label} ${year}`,
        groupMonths:   meta.months,
        groupColor:    meta.color,
        groupBg:       meta.bg,
        groupTotal:    total,
        groupPaid:     paid,
        groupDue:      due,
        groupCount:    items.length,
        paidCnt,
        pendingCnt,
      });
      items.forEach((i) => rows.push({ ...i, isGroupHeader: false }));
    });
    return rows;
  }, [installments]);

  /* ── Handlers ── */
  const openPayModal = (inst) => {
    setSelectedInstallment(inst);
    setAmountPaid(inst.amount - inst.paidAmount);
    setPaymentMethod("online");
    setChequeNo("");
    setOpen(true);
  };
  const closePayModal = () => { setOpen(false); setPaymentMethod("online"); setChequeNo(""); };

  const handleGenerateInstallments = async () => {
    try {
      await dispatch(generateInstallments({ studentId, academicYearId, frequency: selectedFrequency })).unwrap();
      message.success(`Installments generated (${selectedFrequency})`);
      setFrequencyModalOpen(false);
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    } catch (err) { message.error(err || "Failed to generate installments"); }
  };

  const handleOfflinePayment = async () => {
    try {
      await dispatch(createPayment({
        installmentId: selectedInstallment._id,
        amount: amountPaid,
        paymentMode: paymentMethod,
        ...(paymentMethod === "cheque" && chequeNo ? { transactionId: chequeNo } : {}),
      })).unwrap();
      message.success(`${paymentMethod === "cheque" ? "Cheque" : "Cash"} payment recorded`);
      closePayModal();
      dispatch(fetchMyFees({ studentId, academicYearId }));
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    } catch (err) { message.error(err || "Payment failed"); }
  };

  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) { message.error("Razorpay SDK failed to load"); return; }
    try {
      const paymentInit = await dispatch(createPayment({
        installmentId: selectedInstallment._id,
        paymentMode: "razorpay",
      })).unwrap();
      const options = {
        key:      paymentInit?.data?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:   paymentInit?.data?.amount,
        currency: "INR",
        order_id: paymentInit?.data?.orderId,
        name:     "School Fee Payment",
        description: selectedInstallment.installmentName,
        handler: async (response) => {
          await dispatch(createPayment({
            installmentId: selectedInstallment._id,
            paymentMode: "razorpay",
            razorpay: response,
          })).unwrap();
          message.success("Online payment successful");
          closePayModal();
          dispatch(fetchMyFees({ studentId, academicYearId }));
          dispatch(fetchFeeInstallments({ studentId, academicYearId }));
        },
        theme: { color: "var(--primary)" },
      };
      new window.Razorpay(options).open();
    } catch (err) { message.error(err || "Payment failed"); }
  };

  const handlePrintReceipt = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Fee Receipt</title>
      <style>body{font-family:sans-serif;padding:24px;max-width:480px;margin:auto;}
      h2{text-align:center;margin-bottom:4px;}
      .sub{text-align:center;color:#666;font-size:13px;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;}
      td,th{padding:8px 10px;border:1px solid #ddd;font-size:13px;}
      th{background:#f5f5f5;font-weight:600;}
      </style></head>
      <body onload="window.print();window.close()">${content}</body></html>`);
    win.document.close();
  };

  /* ── Fee totals ── */
  const feeTotals = useMemo(() => {
    const total = myFees.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const paid  = myFees.reduce((s, r) => s + (r.paidAmount  || 0), 0);
    const due   = myFees.reduce((s, r) => s + (r.dueAmount   || 0), 0);
    return { total, paid, due };
  }, [myFees]);

  /* ── Fee summary columns ── */
  const feeColumns = [
    { title: "Fee Head", render: (_, r) => r.feeStructureId?.feeHeadId?.name || "-" },
    { title: "Total",  dataIndex: "totalAmount",  render: (v) => `₹${(v || 0).toLocaleString("en-IN")}` },
    { title: "Paid",   dataIndex: "paidAmount",   render: (v) => <span style={{ color: "var(--success)", fontWeight: 600 }}>₹{(v || 0).toLocaleString("en-IN")}</span> },
    { title: "Due",    dataIndex: "dueAmount",    render: (v) => <span style={{ color: v > 0 ? "var(--danger)" : "var(--text-secondary)", fontWeight: 600 }}>₹{(v || 0).toLocaleString("en-IN")}</span> },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <StatusPill status={s} />,
    },
  ];

  /* ── Installment columns with group-header support ── */
  const NCOLS = 6; // total columns in installment table

  const installmentColumns = [
    {
      title: "Installment",
      dataIndex: "installmentName",
      onCell: (row) => row.isGroupHeader ? { colSpan: NCOLS } : {},
      render: (val, row) => {
        if (!row.isGroupHeader) return <span style={{ fontWeight: 500 }}>{val || "—"}</span>;
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          }}>
            {/* Quarter badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: row.groupBg,
              border: `1.5px solid ${row.groupBg}`,
              borderRadius: 10, padding: "6px 14px",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: row.groupColor, flexShrink: 0,
              }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: row.groupColor }}>
                {row.groupLabel}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                {row.groupMonths}
              </span>
            </div>

            {/* Summary chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 4 }}>
              <Chip label="Total"  value={`₹${row.groupTotal.toLocaleString("en-IN")}`}  color="var(--text-secondary)" bg="var(--surface-soft)" />
              <Chip label="Paid"   value={`₹${row.groupPaid.toLocaleString("en-IN")}`}   color="var(--success)" bg="var(--success-light)" />
              <Chip label="Due"    value={`₹${row.groupDue.toLocaleString("en-IN")}`}    color="var(--danger)" bg="var(--danger-light)" />
            </div>

            {/* Count badges */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {row.paidCnt > 0 && (
                <Tag color="success" style={{ borderRadius: 8, fontWeight: 600 }}>
                  ✓ {row.paidCnt} Paid
                </Tag>
              )}
              {row.pendingCnt > 0 && (
                <Tag color="warning" style={{ borderRadius: 8, fontWeight: 600 }}>
                  ⏳ {row.pendingCnt} Pending
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      onCell: (row) => row.isGroupHeader ? { colSpan: 0 } : {},
      render: (v, row) => row.isGroupHeader ? null : (
        <span style={{ fontWeight: 600 }}>₹{(v || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      onCell: (row) => row.isGroupHeader ? { colSpan: 0 } : {},
      render: (v, row) => row.isGroupHeader ? null : (
        <span style={{ color: "var(--success)", fontWeight: 600 }}>₹{(v || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      title: "Due",
      onCell: (row) => row.isGroupHeader ? { colSpan: 0 } : {},
      render: (_, row) => row.isGroupHeader ? null : (
        <span style={{ color: (row.amount - row.paidAmount) > 0 ? "var(--danger)" : "var(--text-secondary)", fontWeight: 600 }}>
          ₹{((row.amount || 0) - (row.paidAmount || 0)).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      onCell: (row) => row.isGroupHeader ? { colSpan: 0 } : {},
      render: (s, row) => row.isGroupHeader ? null : <StatusPill status={s} />,
    },
    {
      title: "Action",
      onCell: (row) => row.isGroupHeader ? { colSpan: 0 } : {},
      render: (_, row) => {
        if (row.isGroupHeader) return null;
        return (
          <Space>
            {row.status !== "paid" && (
              <Button type="primary" size="small" onClick={() => openPayModal(row)}>
                Pay
              </Button>
            )}
            {row.status === "paid" && (
              <Button size="small" icon={<PrinterOutlined />} onClick={() => setReceiptInstallment(row)}>
                Receipt
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>
        {tableHeadCss("fees-tbl")}
        {tableHeadCss("inst-tbl")}
        {`
          .inst-tbl .ant-table-row.group-header-row > td {
            background: var(--surface) !important;
            padding: 10px 16px !important;
            border-bottom: 2px solid var(--border-muted) !important;
          }
          .inst-tbl .ant-table-row.group-header-row:hover > td {
            background: var(--surface) !important;
          }
        `}
      </style>

      <PageHeader
        title="My Fees"
        subtitle="View your fee structure and manage payments"
        icon={<RupeeIcon />}
      />

      {/* ── Fee Summary ── */}
      <div style={{ ...sectionPanel, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "var(--text-primary)" }}>
          Fee Summary
        </div>

        {/* Total amount stat cards */}
        {myFees.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total Fees",  value: feeTotals.total, color: "var(--purple)", bg: "rgba(var(--purple-rgb),0.12)", icon: "📋" },
              { label: "Total Paid",  value: feeTotals.paid,  color: "var(--success)", bg: "var(--success-light)", icon: "✅" },
              { label: "Total Due",   value: feeTotals.due,   color: feeTotals.due > 0 ? "var(--danger)" : "var(--success)", bg: feeTotals.due > 0 ? "var(--danger-light)" : "var(--success-light)", icon: feeTotals.due > 0 ? "⚠️" : "✓"  },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} style={{
                flex: 1, minWidth: 140,
                background: bg,
                border: `1.5px solid ${bg}`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2, marginTop: 2 }}>
                    ₹{value.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Table
          className="fees-tbl"
          columns={feeColumns}
          dataSource={myFees}
          rowKey="_id"
          loading={feeLoading}
          pagination={false}
          scroll={{ x: "max-content" }}
          summary={() => myFees.length > 0 && (
            <Table.Summary.Row style={{ background: "var(--surface)" }}>
              <Table.Summary.Cell index={0}>
                <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>
                  Grand Total
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <span style={{ fontWeight: 800, fontSize: 13, color: "var(--purple)" }}>
                  ₹{feeTotals.total.toLocaleString("en-IN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <span style={{ fontWeight: 800, fontSize: 13, color: "var(--success)" }}>
                  ₹{feeTotals.paid.toLocaleString("en-IN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <span style={{ fontWeight: 800, fontSize: 13, color: feeTotals.due > 0 ? "var(--danger)" : "var(--success)" }}>
                  ₹{feeTotals.due.toLocaleString("en-IN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} />
            </Table.Summary.Row>
          )}
        />
      </div>

      {/* ── Installments (grouped) ── */}
      <div style={sectionPanel}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14, flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Installments
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Grouped by quarter · {installments.length} total
            </div>
          </div>
          <Button
            type="primary"
            disabled={installments.length > 0}
            onClick={() => setFrequencyModalOpen(true)}
          >
            Generate Installments
          </Button>
        </div>

        <Table
          className="inst-tbl"
          columns={installmentColumns}
          dataSource={groupedTableData}
          rowKey="_id"
          loading={installmentLoading}
          pagination={false}
          scroll={{ x: "max-content" }}
          onRow={(row) => ({
            className: row.isGroupHeader ? "group-header-row" : "",
          })}
        />
      </div>

      {/* ── Frequency Modal ── */}
      <Modal
        title="Select Installment Type"
        open={frequencyModalOpen}
        onCancel={() => setFrequencyModalOpen(false)}
        onOk={handleGenerateInstallments}
        centered
      >
        <Radio.Group value={selectedFrequency} onChange={(e) => setSelectedFrequency(e.target.value)}>
          <Space direction="vertical">
            <Radio value="monthly">Monthly</Radio>
            <Radio value="quarterly">Quarterly</Radio>
            <Radio value="yearly">Yearly</Radio>
          </Space>
        </Radio.Group>
      </Modal>

      {/* ── Pay Modal ── */}
      <Modal
        title="Pay Installment"
        open={open}
        onCancel={closePayModal}
        centered
        footer={[
          <Button key="cancel" onClick={closePayModal}>Cancel</Button>,
          paymentMethod === "online" ? (
            <Button key="pay" type="primary" icon={<RupeeIcon />} onClick={handleRazorpayPayment}>
              Pay Online (Razorpay)
            </Button>
          ) : (
            <Button key="pay" type="primary" icon={<RupeeIcon />} onClick={handleOfflinePayment}>
              Confirm {paymentMethod === "cheque" ? "Cheque" : "Cash"} Payment
            </Button>
          ),
        ]}
      >
        {selectedInstallment && (
          <Space direction="vertical" style={{ width: "100%" }} size={14}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Installment">
                {selectedInstallment.installmentName}
              </Descriptions.Item>
              <Descriptions.Item label="Due Amount">
                <span style={{ fontWeight: 700, color: "var(--danger)" }}>
                  ₹{(selectedInstallment.amount - selectedInstallment.paidAmount).toLocaleString("en-IN")}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Amount to Pay
              </div>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={selectedInstallment.amount - selectedInstallment.paidAmount}
                value={amountPaid}
                onChange={setAmountPaid}
                formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v?.replace(/[₹,\s]/g, "")}
                size="large"
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Payment Method
              </div>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value); setChequeNo(""); }}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio value="online" style={{ fontWeight: 500 }}>💳 Online (Razorpay)</Radio>
                  <Radio value="cash"   style={{ fontWeight: 500 }}>💵 Cash</Radio>
                  <Radio value="cheque" style={{ fontWeight: 500 }}>📋 Cheque</Radio>
                </Space>
              </Radio.Group>
            </div>

            {paymentMethod === "cheque" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Cheque Number
                </div>
                <Input
                  placeholder="Enter cheque number"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  size="large"
                />
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* ── Receipt Modal ── */}
      <Modal
        title="Fee Receipt"
        open={!!receiptInstallment}
        onCancel={() => setReceiptInstallment(null)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
            Print
          </Button>,
          <Button key="close" onClick={() => setReceiptInstallment(null)}>Close</Button>,
        ]}
        centered
      >
        {receiptInstallment && (
          <div ref={receiptRef}>
            <h2 style={{ textAlign: "center", marginBottom: 4 }}>Fee Receipt</h2>
            <div style={{ textAlign: "center", color: "#666", fontSize: 13, marginBottom: 16 }}>
              Official Payment Receipt
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Installment",  receiptInstallment.installmentName],
                  ["Total Amount", `₹${receiptInstallment.amount}`],
                  ["Amount Paid",  `₹${receiptInstallment.paidAmount}`],
                  ["Status",       receiptInstallment.status?.toUpperCase()],
                  ...(receiptInstallment.paidAt
                    ? [["Paid On", new Date(receiptInstallment.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })]]
                    : []),
                ].map(([th, td]) => (
                  <tr key={th}>
                    <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>{th}</th>
                    <td style={{ padding: "8px 10px", border: "1px solid #ddd" }}>{td}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: "center", color: "#888", fontSize: 11, marginTop: 24 }}>
              This is a computer-generated receipt. No signature required.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeStudent;
