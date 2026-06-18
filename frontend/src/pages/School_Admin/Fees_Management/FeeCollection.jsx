import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, Button, Table, Tag, Modal, Form, Input, InputNumber,
  DatePicker, Spin, Empty, message, Divider, Radio,
} from "antd";
import {
  SearchOutlined, DollarOutlined, PrinterOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId }   from "../../../features/studentSlice";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";
import { fetchAllAcademicYears }      from "../../../features/academicYearSlice";
import PageHeader                     from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss, pill,
} from "../../../styles/pageStyles";

const TABLE_CLS = "fee-collect-tbl";

const METHOD_OPTIONS = [
  { label: "Cash",          value: "cash"          },
  { label: "Cheque",        value: "cheque"         },
  { label: "Bank Transfer", value: "bank_transfer"  },
  { label: "UPI / Online",  value: "online"         },
];

const STATUS_META = {
  paid:    { color: "#5BA89A", bg: "#f0fdf4", label: "Paid",    icon: <CheckCircleOutlined /> },
  unpaid:  { color: "#D96B7A", bg: "#fff1f2", label: "Unpaid",  icon: <ExclamationCircleOutlined /> },
  partial: { color: "#D4922A", bg: "#fffbeb", label: "Partial", icon: <ClockCircleOutlined /> },
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const FL = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  }}>
    {children}
  </div>
);

/* ─── Receipt print component ──────────────────────────────────── */
const Receipt = React.forwardRef(({ fee, student, payment, school }, ref) => (
  <div ref={ref} style={{ padding: 32, fontFamily: "serif", maxWidth: 480, margin: "0 auto" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{school?.name || "School Name"}</div>
      <div style={{ fontSize: 12, color: "#555" }}>{school?.address || ""}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>FEE RECEIPT</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13 }}>
      <div><b>Receipt No:</b></div>      <div>{payment?.receiptNo || fee?._id?.slice(-8).toUpperCase()}</div>
      <div><b>Date:</b></div>            <div>{dayjs(payment?.date || new Date()).format("DD MMM YYYY")}</div>
      <div><b>Student Name:</b></div>    <div>{student?.name || "—"}</div>
      <div><b>Class:</b></div>           <div>{fee?.schoolClassId?.name || "—"}</div>
      <div><b>Fee Head:</b></div>        <div>{fee?.feeHeadId?.name || fee?.headName || "—"}</div>
      <div><b>Total Amount:</b></div>    <div>{fmtCurrency(fee?.amount)}</div>
      <div><b>Amount Paid:</b></div>     <div style={{ fontWeight: 700, color: "#5BA89A" }}>{fmtCurrency(payment?.amount)}</div>
      <div><b>Payment Method:</b></div>  <div style={{ textTransform: "capitalize" }}>{(payment?.method || "").replace("_", " ")}</div>
      {payment?.reference && <><div><b>Reference:</b></div><div>{payment.reference}</div></>}
    </div>
    <div style={{ borderTop: "1px dashed #999", marginTop: 20, paddingTop: 12, textAlign: "center", fontSize: 11, color: "#666" }}>
      This is a computer-generated receipt. Thank you.
    </div>
  </div>
));

/* ─── Main component ────────────────────────────────────────────── */
const FeeCollection = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const receiptRef = useRef(null);

  const { user }                  = useSelector((s) => s.auth || {});
  const { students = [], loading: studentsLoading } = useSelector((s) => s.student || {});
  const { myFees = [], loading: feesLoading }       = useSelector((s) => s.studentFee || {});
  const { academicYears = [] }    = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id;

  const [selectedStudentId, setSelectedStudentId]   = useState(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [searchText,  setSearchText]   = useState("");
  const [payModal,    setPayModal]     = useState({ open: false, fee: null });
  const [receiptModal, setReceiptModal] = useState({ open: false, fee: null, payment: null });
  const [paying, setPaying] = useState(false);

  /* ── Init ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(fetchStudentsBySchoolId({ schoolId }));
  }, [schoolId, dispatch]);

  /* ── Load fees when student + year selected ── */
  useEffect(() => {
    if (selectedStudentId && selectedAcademicYearId) {
      dispatch(fetchMyFees({ studentId: selectedStudentId, academicYearId: selectedAcademicYearId }));
    }
  }, [selectedStudentId, selectedAcademicYearId, dispatch]);

  /* ── Computed ── */
  const studentOptions = useMemo(() => {
    const list = Array.isArray(students?.students) ? students.students : (Array.isArray(students) ? students : []);
    return list
      .filter((s) => {
        const name = s.name || s.studentId?.name || "";
        return !searchText || name.toLowerCase().includes(searchText.toLowerCase());
      })
      .map((s) => ({
        value: s.studentId?._id || s._id,
        label: `${s.name || s.studentId?.name || "—"} (${s.rollNo || s.admissionNo || ""})`,
      }));
  }, [students, searchText]);

  const yearOptions = useMemo(
    () => academicYears.map((y) => ({ value: y._id, label: y.name || y.year })),
    [academicYears],
  );

  const selectedStudent = useMemo(() => {
    const list = Array.isArray(students?.students) ? students.students : (Array.isArray(students) ? students : []);
    return list.find((s) => (s.studentId?._id || s._id) === selectedStudentId);
  }, [students, selectedStudentId]);

  /* ── Summary ── */
  const summary = useMemo(() => {
    const total   = myFees.reduce((a, f) => a + (f.amount || 0), 0);
    const paid    = myFees.reduce((a, f) => a + (f.paidAmount || 0), 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [myFees]);

  /* ── Pay ── */
  const handlePay = async () => {
    try {
      const vals = await form.validateFields();
      setPaying(true);
      const result = await dispatch(
        payStudentFee({
          id:      payModal.fee._id,
          payload: {
            method:    vals.method,
            amount:    vals.amount,
            note:      vals.note,
            reference: vals.reference,
            date:      vals.date?.toISOString() || new Date().toISOString(),
          },
        }),
      ).unwrap();
      message.success("Payment recorded successfully");
      setPayModal({ open: false, fee: null });
      setReceiptModal({
        open: true,
        fee:  payModal.fee,
        payment: {
          amount:    vals.amount,
          method:    vals.method,
          reference: vals.reference,
          date:      vals.date || dayjs(),
        },
      });
      form.resetFields();
      // refresh fees
      dispatch(fetchMyFees({ studentId: selectedStudentId, academicYearId: selectedAcademicYearId }));
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  /* ── Print receipt ── */
  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Fee Receipt</title><style>body{margin:0;padding:0}</style></head><body>`);
    w.document.write(content.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  /* ── Table columns ── */
  const columns = [
    {
      title:     "Fee Head",
      dataIndex: "headName",
      render:    (v, r) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {v || r?.feeHeadId?.name || "—"}
        </span>
      ),
    },
    {
      title:  "Total Amount",
      dataIndex: "amount",
      align:  "right",
      render: (v) => <span style={{ fontWeight: 700 }}>{fmtCurrency(v)}</span>,
    },
    {
      title:  "Paid",
      dataIndex: "paidAmount",
      align:  "right",
      render: (v) => <span style={{ color: "#5BA89A", fontWeight: 700 }}>{fmtCurrency(v)}</span>,
    },
    {
      title:  "Balance",
      align:  "right",
      render: (_, r) => {
        const bal = (r.amount || 0) - (r.paidAmount || 0);
        return <span style={{ color: bal > 0 ? "#D96B7A" : "#5BA89A", fontWeight: 700 }}>{fmtCurrency(bal)}</span>;
      },
    },
    {
      title:  "Due Date",
      dataIndex: "dueDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title:  "Status",
      dataIndex: "status",
      render: (v) => {
        const m = STATUS_META[v] || STATUS_META.unpaid;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 99, fontSize: 12,
            fontWeight: 600, background: m.bg, color: m.color,
          }}>
            {m.icon} {m.label}
          </span>
        );
      },
    },
    {
      title:  "Action",
      align:  "center",
      render: (_, r) => {
        const isPaid = r.status === "paid";
        return (
          <Button
            size="small"
            type={isPaid ? "default" : "primary"}
            icon={<DollarOutlined />}
            disabled={isPaid}
            onClick={() => {
              const balance = (r.amount || 0) - (r.paidAmount || 0);
              form.setFieldsValue({ amount: balance, date: dayjs(), method: "cash" });
              setPayModal({ open: true, fee: r });
            }}
            style={isPaid ? {} : { background: "var(--primary)", borderColor: "var(--primary)" }}
          >
            {isPaid ? "Paid" : "Collect"}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Fee Collection"
        subtitle="Search student, view assigned fees, record payments and print receipts"
        icon={<DollarOutlined />}
      />

      {/* ── Search filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16, alignItems: "end",
        }}>
          <div>
            <FL>Academic Year</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="Select academic year"
              options={yearOptions}
              value={selectedAcademicYearId || undefined}
              onChange={setSelectedAcademicYearId}
            />
          </div>
          <div>
            <FL>Student</FL>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Search student name / roll no"
              value={selectedStudentId || undefined}
              options={studentOptions}
              loading={studentsLoading}
              filterOption={false}
              onSearch={setSearchText}
              onChange={(v) => { setSelectedStudentId(v); setSearchText(""); }}
              suffixIcon={<SearchOutlined />}
              notFoundContent={studentsLoading ? <Spin size="small" /> : "No students found"}
            />
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {myFees.length > 0 && (
        <div style={{ ...statGrid(160), marginBottom: 0 }}>
          {[
            { label: "Total Fees",   value: summary.total,   color: "var(--primary)" },
            { label: "Amount Paid",  value: summary.paid,    color: "#5BA89A" },
            { label: "Balance Due",  value: summary.pending, color: "#D96B7A" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "var(--surface)", border: "1px solid var(--border-muted)",
              borderRadius: 12, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={iconWell(color, 40)}>
                <DollarOutlined />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{fmtCurrency(value)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Fee table ── */}
      <div style={{ ...sectionPanel, marginTop: 16 }}>
        {!selectedStudentId || !selectedAcademicYearId ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "var(--text-muted)" }}>
                Select a student and academic year to view fee details
              </span>
            }
          />
        ) : (
          <Spin spinning={feesLoading}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
                {selectedStudent?.name || selectedStudent?.studentId?.name || "Student"} — Fee Ledger
              </span>
            </div>
            <Table
              className={TABLE_CLS}
              rowKey="_id"
              columns={columns}
              dataSource={myFees}
              pagination={false}
              scroll={{ x: 720 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "32px 0", color: "var(--text-muted)" }}>
                    No fees assigned for this academic year
                  </div>
                ),
              }}
            />
          </Spin>
        )}
      </div>

      {/* ── Payment collection modal ── */}
      <Modal
        open={payModal.open}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            Collect Fee — {payModal.fee?.headName || payModal.fee?.feeHeadId?.name}
          </span>
        }
        onOk={handlePay}
        onCancel={() => { setPayModal({ open: false, fee: null }); form.resetFields(); }}
        okText="Record Payment"
        confirmLoading={paying}
        okButtonProps={{ style: { background: "var(--primary)", borderColor: "var(--primary)" } }}
        width={440}
      >
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f8f5ff", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Balance Due</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#D96B7A" }}>
            {fmtCurrency((payModal.fee?.amount || 0) - (payModal.fee?.paidAmount || 0))}
          </div>
        </div>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Payment Method" name="method" rules={[{ required: true }]}>
            <Radio.Group>
              {METHOD_OPTIONS.map((m) => (
                <Radio.Button key={m.value} value={m.value}>{m.label}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Amount" name="amount" rules={[{ required: true, type: "number", min: 1 }]}>
              <InputNumber
                style={{ width: "100%" }}
                prefix="₹"
                min={1}
                max={(payModal.fee?.amount || 0) - (payModal.fee?.paidAmount || 0)}
              />
            </Form.Item>
            <Form.Item label="Payment Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item label="Reference / Cheque No" name="reference">
            <Input placeholder="Transaction ID, cheque no, etc." />
          </Form.Item>
          <Form.Item label="Note (optional)" name="note">
            <Input.TextArea rows={2} placeholder="Any remarks…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Receipt modal ── */}
      <Modal
        open={receiptModal.open}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            Payment Receipt
          </span>
        }
        onCancel={() => setReceiptModal({ open: false, fee: null, payment: null })}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}
            style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
            Print Receipt
          </Button>,
          <Button key="close" onClick={() => setReceiptModal({ open: false, fee: null, payment: null })}>
            Close
          </Button>,
        ]}
        width={520}
      >
        <Receipt
          ref={receiptRef}
          fee={receiptModal.fee}
          payment={receiptModal.payment}
          student={selectedStudent?.studentId || selectedStudent}
          school={user?.school}
        />
      </Modal>
    </div>
  );
};

export default FeeCollection;
