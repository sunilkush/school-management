import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, Button, Table, Modal, Form, Input, InputNumber,
  DatePicker, Spin, Empty, message, Grid, Avatar,
} from "antd";
import {
  SearchOutlined, PrinterOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  WalletOutlined, BankOutlined, MobileOutlined, FileTextOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../icons/RupeeIcon";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../features/studentSlice";
import { fetchMyFees, payStudentFee } from "../../features/studentFeeSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import PageHeader from "../layout/PageHeader";
import { pageWrapper, tableHeadCss, avatarColor } from "../../styles/pageStyles";
import FeeReceipt, { printFeeReceipt } from "./FeeReceipt.jsx";

const { useBreakpoint } = Grid;
const TABLE_CLS = "fee-collect-tbl";

const METHOD_OPTIONS = [
  { label: "Cash", value: "cash", icon: <WalletOutlined /> },
  { label: "Cheque", value: "cheque", icon: <FileTextOutlined /> },
  { label: "Transfer", value: "bank_transfer", icon: <BankOutlined /> },
  { label: "UPI", value: "upi", icon: <MobileOutlined /> },
  { label: "Online", value: "online", icon: <MobileOutlined /> },
];

const STATUS_META = {
  paid: { color: "var(--success)", bg: "var(--success-light)", border: "rgba(var(--success-rgb), 0.35)", label: "Paid", icon: <CheckCircleOutlined /> },
  unpaid: { color: "var(--danger)", bg: "var(--danger-light)", border: "rgba(var(--danger-rgb), 0.35)", label: "Unpaid", icon: <ExclamationCircleOutlined /> },
  partial: { color: "var(--warning)", bg: "var(--warning-light)", border: "rgba(var(--warning-rgb), 0.35)", label: "Partial", icon: <ClockCircleOutlined /> },
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const FL = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.unpaid;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {m.icon} {m.label}
    </span>
  );
};

const FeeMobileCard = ({ fee, onPay }) => {
  const balance = (fee.totalAmount || 0) - (fee.paidAmount || 0);
  const pct = fee.totalAmount ? Math.round(((fee.paidAmount || 0) / fee.totalAmount) * 100) : 0;
  const isPaid = fee.status === "paid";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", borderLeft: `4px solid ${STATUS_META[fee.status]?.color || "var(--danger)"}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fee.feeHeadId?.name || fee.feeStructureId?.feeHeadId?.name || "—"}
          </div>
        </div>
        <StatusBadge status={fee.status} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        {[
          { label: "Total", value: fee.totalAmount, color: "var(--text-secondary)" },
          { label: "Paid", value: fee.paidAmount, color: "var(--success)" },
          { label: "Balance", value: balance, color: balance > 0 ? "var(--danger)" : "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, textAlign: "center", background: "var(--background)", borderRadius: 10, padding: "8px 4px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color, marginTop: 2 }}>{fmtCurrency(value)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: isPaid ? 0 : 12 }}>
        <div style={{ height: 6, background: "var(--border-muted)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: isPaid ? "var(--success)" : pct > 0 ? "var(--warning)" : "var(--danger)", borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {!isPaid && (
        <Button type="primary" block icon={<RupeeIcon />} onClick={() => onPay(fee)} style={{ height: 40, borderRadius: 10, fontWeight: 700, background: "var(--primary)", borderColor: "var(--primary)" }}>
          Collect ₹{balance.toLocaleString("en-IN")}
        </Button>
      )}
    </div>
  );
};

const getStudentName = (s) => s?.user?.name || s?.name || "—";
const getStudentId = (s) => s?.student?._id?.toString() || s?.studentId?.toString() || s?._id?.toString();

/**
 * Shared "search student → view fee ledger → collect payment" workspace, used by both School
 * Admin (FeeCollection.jsx) and Accountant (CollectFees.jsx) — previously two independent
 * implementations of the same action against the same payStudentFee endpoint.
 */
const CollectFeeWorkspace = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const receiptRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { user } = useSelector((s) => s.auth || {});
  const { schoolStudents = [], loading: studentsLoading } = useSelector((s) => s.students || {});
  const { myFees = [], loading: feesLoading } = useSelector((s) => s.studentFee || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [payModal, setPayModal] = useState({ open: false, fee: null });
  const [receiptModal, setReceiptModal] = useState({ open: false, fee: null, payment: null });
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("cash");

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && selectedClassId) {
      setSelectedStudentId(null);
      dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, schoolClassId: selectedClassId, limit: 500 }));
    }
  }, [schoolId, academicYearId, selectedClassId, dispatch]);

  useEffect(() => {
    if (selectedStudentId && academicYearId) dispatch(fetchMyFees({ studentId: selectedStudentId, academicYearId }));
  }, [selectedStudentId, academicYearId, dispatch]);

  const studentList = useMemo(() => (Array.isArray(schoolStudents) ? schoolStudents : []), [schoolStudents]);

  const studentOptions = useMemo(
    () =>
      studentList
        .filter((s) => {
          const name = getStudentName(s);
          return !searchText || name.toLowerCase().includes(searchText.toLowerCase());
        })
        .map((s) => ({
          value: getStudentId(s),
          label: `${getStudentName(s)} (Roll: ${s.rollNumber ?? "—"} | Reg: ${s.registrationNumber || "—"})`,
        })),
    [studentList, searchText]
  );

  const classOptions = useMemo(() => (schoolClasses || []).map((c) => ({ value: c._id, label: c.name })), [schoolClasses]);

  const selectedEnrollment = useMemo(() => studentList.find((s) => getStudentId(s) === selectedStudentId), [studentList, selectedStudentId]);

  const summary = useMemo(() => {
    const total = myFees.reduce((a, f) => a + (f.totalAmount || 0), 0);
    const paid = myFees.reduce((a, f) => a + (f.paidAmount || 0), 0);
    const pending = total - paid;
    const pct = total ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pending, pct };
  }, [myFees]);

  const openPay = (fee) => {
    const balance = (fee.totalAmount || 0) - (fee.paidAmount || 0);
    form.setFieldsValue({ amount: balance, date: dayjs(), method: "cash" });
    setSelectedMethod("cash");
    setPayModal({ open: true, fee });
  };

  const handlePay = async () => {
    try {
      const vals = await form.validateFields();
      setPaying(true);
      const result = await dispatch(
        payStudentFee({
          id: payModal.fee._id,
          payload: {
            paidAmount: vals.amount,
            paymentMode: vals.method || selectedMethod,
            remarks: vals.note,
            referenceNo: vals.reference,
          },
        })
      ).unwrap();

      message.success("Payment recorded successfully");
      setPayModal({ open: false, fee: null });
      setReceiptModal({ open: true, fee: payModal.fee, payment: result?.payment || null });
      form.resetFields();
      dispatch(fetchMyFees({ studentId: selectedStudentId, academicYearId }));
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const cardBg = "var(--surface)";
  const border = "var(--border)";
  const txtPri = "var(--text)";
  const txtMut = "var(--text-muted)";

  const columns = [
    {
      title: "Fee Head",
      render: (_, r) => <span style={{ fontWeight: 600, color: txtPri }}>{r?.feeHeadId?.name || r?.feeStructureId?.feeHeadId?.name || "—"}</span>,
    },
    { title: "Total", dataIndex: "totalAmount", align: "right", render: (v) => <span style={{ fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { title: "Paid", dataIndex: "paidAmount", align: "right", render: (v) => <span style={{ color: "var(--success)", fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    {
      title: "Balance", align: "right",
      render: (_, r) => {
        const bal = (r.totalAmount || 0) - (r.paidAmount || 0);
        return <span style={{ color: bal > 0 ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>{fmtCurrency(bal)}</span>;
      },
    },
    {
      title: "Progress", width: 120,
      render: (_, r) => {
        const pct = r.totalAmount ? Math.round(((r.paidAmount || 0) / r.totalAmount) * 100) : 0;
        return (
          <div>
            <div style={{ height: 5, background: "var(--border-muted)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: r.status === "paid" ? "var(--success)" : pct > 0 ? "var(--warning)" : "var(--danger)", borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 10, color: txtMut, marginTop: 2 }}>{pct}%</div>
          </div>
        );
      },
    },
    { title: "Status", dataIndex: "status", render: (v) => <StatusBadge status={v} /> },
    {
      title: "Action", align: "center",
      render: (_, r) => {
        const isPaid = r.status === "paid";
        return (
          <Button size="small" type={isPaid ? "default" : "primary"} icon={<RupeeIcon />} disabled={isPaid} onClick={() => openPay(r)} style={isPaid ? {} : { background: "var(--primary)", borderColor: "var(--primary)" }}>
            {isPaid ? "Paid" : "Collect"}
          </Button>
        );
      },
    },
  ];

  const showContent = !!selectedStudentId;

  if (!academicYearId) {
    return (
      <div style={pageWrapper}>
        <PageHeader title="Fee Collection" subtitle="Search student, view assigned fees and record payments" icon={<RupeeIcon />} />
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 600, color: txtPri }}>No active academic year selected</div>
          <div style={{ color: txtMut, fontSize: 13, marginTop: 4 }}>Please select an academic year from the top navigation to continue.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageWrapper, padding: isMobile ? "12px" : "clamp(12px,3vw,24px)" }}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader title="Fee Collection" subtitle="Search student, view assigned fees and record payments" icon={<RupeeIcon />} />

      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: isMobile ? "14px" : "20px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 14, alignItems: "end" }}>
          <div>
            <FL>Class</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class"
              options={classOptions}
              value={selectedClassId || undefined}
              onChange={(v) => { setSelectedClassId(v); setSelectedStudentId(null); setSearchText(""); }}
              showSearch
              optionFilterProp="label"
              size={isMobile ? "large" : "middle"}
              allowClear
              onClear={() => { setSelectedClassId(null); setSelectedStudentId(null); }}
            />
          </div>

          <div>
            <FL>Student</FL>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder={selectedClassId ? "Search by student name" : "Select class first"}
              value={selectedStudentId || undefined}
              options={studentOptions}
              loading={studentsLoading}
              filterOption={false}
              onSearch={setSearchText}
              onChange={(v) => { setSelectedStudentId(v); setSearchText(""); }}
              suffixIcon={<SearchOutlined />}
              notFoundContent={!selectedClassId ? <div style={{ padding: "8px 12px", color: txtMut }}>Select a class first</div> : studentsLoading ? <Spin size="small" /> : "No students found"}
              disabled={!selectedClassId}
              size={isMobile ? "large" : "middle"}
            />
          </div>

          {(selectedClassId || selectedStudentId) && (
            <Button onClick={() => { setSelectedClassId(null); setSelectedStudentId(null); setSearchText(""); }} style={{ borderRadius: 8 }} size={isMobile ? "large" : "middle"}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {selectedEnrollment && (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar size={isMobile ? 44 : 52} style={{ background: avatarColor(getStudentName(selectedEnrollment)).bg, color: avatarColor(getStudentName(selectedEnrollment)).color, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {getStudentName(selectedEnrollment)[0]?.toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: txtPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getStudentName(selectedEnrollment)}
            </div>
            <div style={{ fontSize: 12, color: txtMut, marginTop: 2 }}>
              {[
                selectedEnrollment?.schoolClass?.name,
                selectedEnrollment?.section?.name ? `Section ${selectedEnrollment.section.name}` : null,
                selectedEnrollment?.rollNumber ? `Roll: ${selectedEnrollment.rollNumber}` : null,
                selectedEnrollment?.registrationNumber ? `Reg: ${selectedEnrollment.registrationNumber}` : null,
              ].filter(Boolean).join(" · ")}
            </div>
          </div>
          {myFees.length > 0 && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: txtMut, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paid</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--success)" }}>{summary.pct}%</div>
            </div>
          )}
        </div>
      )}

      {showContent && myFees.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 16 }}>
          {[
            { label: "Total Fees", value: summary.total, color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.12)", borderColor: "rgba(var(--purple-rgb), 0.3)" },
            { label: "Amount Paid", value: summary.paid, color: "var(--success)", bg: "var(--success-light)", borderColor: "rgba(var(--success-rgb), 0.3)" },
            { label: "Balance Due", value: summary.pending, color: "var(--danger)", bg: "var(--danger-light)", borderColor: "rgba(var(--danger-rgb), 0.3)" },
          ].map(({ label, value, color, bg, borderColor }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: isMobile ? "12px 10px" : "16px 18px", textAlign: isMobile ? "center" : "left" }}>
              <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 14 : 22, fontWeight: 800, color, letterSpacing: "-0.02em" }}>
                {isMobile ? `₹${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value.toLocaleString("en-IN")}` : fmtCurrency(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: showContent ? (isMobile ? 14 : 20) : 20, overflow: "hidden" }}>
        {!showContent ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: txtMut }}>{!selectedClassId ? "Select a class to get started" : "Select a student to view fee details"}</span>} style={{ padding: "40px 0" }} />
        ) : (
          <Spin spinning={feesLoading}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
              <span style={{ fontWeight: 700, color: txtPri, fontSize: 14 }}>Fee Ledger</span>
              <span style={{ fontSize: 12, color: txtMut, background: "var(--background)", border: `1px solid ${border}`, borderRadius: 8, padding: "3px 10px" }}>
                {myFees.length} item{myFees.length !== 1 ? "s" : ""}
              </span>
            </div>

            {isMobile ? (
              myFees.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: txtMut }}>No fees assigned for this academic year</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {myFees.map((fee) => <FeeMobileCard key={fee._id} fee={fee} onPay={openPay} />)}
                </div>
              )
            ) : (
              <Table
                className={TABLE_CLS}
                rowKey="_id"
                columns={columns}
                dataSource={myFees}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{ emptyText: <div style={{ padding: "32px 0", color: txtMut }}>No fees assigned for this academic year</div> }}
              />
            )}
          </Spin>
        )}
      </div>

      {/* ── Payment collection modal ── */}
      <Modal
        open={payModal.open}
        title={null}
        onCancel={() => { setPayModal({ open: false, fee: null }); form.resetFields(); }}
        footer={null}
        width={isMobile ? "calc(100vw - 16px)" : 460}
        style={isMobile ? { margin: "8px auto" } : {}}
        styles={{ body: { padding: 0 } }}
        centered={!isMobile}
      >
        <div style={{ padding: isMobile ? "20px 16px" : "24px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: txtPri, marginBottom: 2 }}>Collect Fee</div>
            <div style={{ fontSize: 13, color: txtMut }}>{payModal.fee?.feeHeadId?.name || payModal.fee?.feeStructureId?.feeHeadId?.name}</div>
          </div>

          <div style={{ background: "var(--danger-light)", border: "1px solid rgba(var(--danger-rgb), 0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Balance Due</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--danger)", letterSpacing: "-0.02em" }}>
                {fmtCurrency((payModal.fee?.totalAmount || 0) - (payModal.fee?.paidAmount || 0))}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(var(--danger-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RupeeIcon size={22} />
            </div>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item label={<span style={{ color: txtMut, fontSize: 12, fontWeight: 700 }}>PAYMENT METHOD</span>} name="method">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {METHOD_OPTIONS.map((m) => {
                  const active = selectedMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => { setSelectedMethod(m.value); form.setFieldValue("method", m.value); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 6, padding: "12px 8px", borderRadius: 10,
                        border: `2px solid ${active ? "var(--primary)" : border}`,
                        background: active ? "rgba(var(--purple-rgb), 0.12)" : "var(--surface-soft)",
                        cursor: "pointer", transition: "all 0.15s",
                        color: active ? "var(--primary)" : txtMut,
                        fontSize: 18,
                      }}
                    >
                      {m.icon}
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item label={<span style={{ color: txtMut, fontSize: 12, fontWeight: 700 }}>AMOUNT</span>} name="amount" rules={[{ required: true, type: "number", min: 1 }]}>
                <InputNumber style={{ width: "100%" }} prefix="₹" min={1} max={(payModal.fee?.totalAmount || 0) - (payModal.fee?.paidAmount || 0)} size={isMobile ? "large" : "middle"} />
              </Form.Item>
              <Form.Item label={<span style={{ color: txtMut, fontSize: 12, fontWeight: 700 }}>DATE</span>} name="date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} size={isMobile ? "large" : "middle"} />
              </Form.Item>
            </div>

            {selectedMethod !== "cash" && (
              <Form.Item label={<span style={{ color: txtMut, fontSize: 12, fontWeight: 700 }}>{selectedMethod === "cheque" ? "CHEQUE NO" : "TRANSACTION / REF NO"}</span>} name="reference">
                <Input placeholder={selectedMethod === "cheque" ? "Cheque number" : "Transaction ID"} size={isMobile ? "large" : "middle"} />
              </Form.Item>
            )}

            <Form.Item label={<span style={{ color: txtMut, fontSize: 12, fontWeight: 700 }}>NOTE (OPTIONAL)</span>} name="note">
              <Input.TextArea rows={2} placeholder="Any remarks…" />
            </Form.Item>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button block onClick={() => { setPayModal({ open: false, fee: null }); form.resetFields(); }} style={{ height: 44, borderRadius: 10 }}>
                Cancel
              </Button>
              <Button type="primary" block loading={paying} onClick={handlePay} style={{ height: 44, borderRadius: 10, fontWeight: 700, background: "var(--primary)", borderColor: "var(--primary)" }}>
                Record Payment
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* ── Receipt modal ── */}
      <Modal
        open={receiptModal.open}
        title={<span style={{ fontWeight: 700, color: txtPri }}>Payment Receipt</span>}
        onCancel={() => setReceiptModal({ open: false, fee: null, payment: null })}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printFeeReceipt(receiptRef.current)} style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
            Print
          </Button>,
          <Button key="close" onClick={() => setReceiptModal({ open: false, fee: null, payment: null })}>Close</Button>,
        ]}
        width={isMobile ? "calc(100vw - 16px)" : 500}
        style={isMobile ? { margin: "8px auto" } : {}}
        centered={!isMobile}
      >
        <FeeReceipt
          ref={receiptRef}
          payment={receiptModal.payment}
          description={receiptModal.fee?.feeHeadId?.name || receiptModal.fee?.feeStructureId?.feeHeadId?.name || "Fee Payment"}
          student={{
            name: getStudentName(selectedEnrollment),
            className: selectedEnrollment?.schoolClass?.name,
            section: selectedEnrollment?.section?.name,
          }}
          school={user?.school}
        />
      </Modal>
    </div>
  );
};

export default CollectFeeWorkspace;
