import React, { useEffect, useRef, useState } from "react";
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
import { DollarOutlined, PrinterOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchMyFees } from "../../../features/studentFeeSlice";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";
import { createPayment } from "../../../features/paymentSlice";
import {
  generateInstallments,
  fetchFeeInstallments,
} from "../../../features/feeInstallmentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pageCard, sectionPanel, tableHeadCss, pill } from "../../../styles/pageStyles";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const FeeStudent = () => {
  const dispatch = useDispatch();

  const { myFees = [], loading: feeLoading } = useSelector(
    (state) => state.studentFee
  );

  const { myEnrollment } = useSelector((state) => state.students);

  const { installments = [], loading: installmentLoading } = useSelector(
    (state) => state.feeInstallment
  );

  const enrollmentId   = myEnrollment?.enrollmentId;
  const studentId      = myEnrollment?.studentId;
  const academicYearId = myEnrollment?.academicYear?._id;

  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [chequeNo, setChequeNo] = useState("");

  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");
  const [receiptInstallment, setReceiptInstallment] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMyStudentEnrollment());
  }, [dispatch]);

  useEffect(() => {
    if (enrollmentId && studentId) {
      dispatch(fetchMyFees({ studentId, academicYearId }));
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    }
  }, [dispatch, enrollmentId, studentId, academicYearId]);

  const handleGenerateInstallments = async () => {
    try {
      await dispatch(
        generateInstallments({
          studentId,
          academicYearId,
          frequency: selectedFrequency,
        })
      ).unwrap();

      message.success(`Installments generated (${selectedFrequency})`);
      setFrequencyModalOpen(false);
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    } catch (err) {
      message.error(err || "Failed to generate installments");
    }
  };

  const openPayModal = (installment) => {
    setSelectedInstallment(installment);
    setAmountPaid(installment.amount - installment.paidAmount);
    setPaymentMethod("online");
    setChequeNo("");
    setOpen(true);
  };

  const closePayModal = () => {
    setOpen(false);
    setPaymentMethod("online");
    setChequeNo("");
  };

  const handleOfflinePayment = async () => {
    try {
      await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          amount: amountPaid,
          paymentMode: paymentMethod,
          ...(paymentMethod === "cheque" && chequeNo ? { transactionId: chequeNo } : {}),
        })
      ).unwrap();

      message.success(`${paymentMethod === "cheque" ? "Cheque" : "Cash"} payment recorded successfully`);
      closePayModal();
      dispatch(fetchMyFees({ studentId, academicYearId }));
      dispatch(fetchFeeInstallments({ studentId, academicYearId }));
    } catch (err) {
      message.error(err || "Payment failed");
    }
  };

  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      message.error("Razorpay SDK failed to load");
      return;
    }

    try {
      const paymentInit = await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          paymentMode: "razorpay",
        })
      ).unwrap();

      const options = {
        key: paymentInit?.data?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentInit?.data?.amount,
        currency: "INR",
        order_id: paymentInit?.data?.orderId,
        name: "School Fee Payment",
        description: selectedInstallment.installmentName,
        handler: async (response) => {
          await dispatch(
            createPayment({
              installmentId: selectedInstallment._id,
              paymentMode: "razorpay",
              razorpay: response,
            })
          ).unwrap();

          message.success("Online payment successful");
          closePayModal();
          dispatch(fetchMyFees({ studentId, academicYearId }));
          dispatch(fetchFeeInstallments({ studentId, academicYearId }));
        },
        theme: { color: "var(--primary)" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      message.error(err || "Payment failed");
    }
  };

  const handlePrintReceipt = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>body{font-family:sans-serif;padding:24px;max-width:480px;margin:auto;}
      h2{text-align:center;margin-bottom:4px;}
      .sub{text-align:center;color:#666;font-size:13px;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;}
      td,th{padding:8px 10px;border:1px solid #ddd;font-size:13px;}
      th{background:#f5f5f5;font-weight:600;}
      .total{font-weight:700;}
      .footer{text-align:center;color:#888;font-size:11px;margin-top:24px;}
      </style></head>
      <body onload="window.print();window.close()">
      ${content}
      </body></html>`);
    win.document.close();
  };

  const feeColumns = [
    {
      title: "Fee Head",
      render: (_, r) => r.feeStructureId?.feeHeadId?.name || "-",
    },
    { title: "Total", dataIndex: "totalAmount", render: (v) => `₹${v}` },
    { title: "Paid", dataIndex: "paidAmount", render: (v) => `₹${v}` },
    { title: "Due", dataIndex: "dueAmount", render: (v) => `₹${v}` },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) =>
        s === "paid" ? (
          <span style={pill("#22C55E", "rgba(220,252,231,0.15)")}>PAID</span>
        ) : (
          <span style={pill("#EF4444", "#fff1f2")}>DUE</span>
        ),
    },
  ];

  const installmentColumns = [
    { title: "Installment", dataIndex: "installmentName" },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Paid", dataIndex: "paidAmount", render: (v) => `₹${v}` },
    {
      title: "Due",
      render: (_, r) => `₹${r.amount - r.paidAmount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <span style={pill(s === "paid" ? "#22C55E" : "#F59E0B", s === "paid" ? "rgba(220,252,231,0.15)" : "#fffbeb")}>
          {s}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          {r.status !== "paid" && (
            <Button type="primary" size="small" onClick={() => openPayModal(r)}>Pay</Button>
          )}
          {r.status === "paid" && (
            <Button size="small" icon={<PrinterOutlined />} onClick={() => setReceiptInstallment(r)}>
              Receipt
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("fees-tbl")}{tableHeadCss("inst-tbl")}</style>
      <PageHeader
        title="My Fees"
        subtitle="View your fee structure and manage payments"
        icon={<DollarOutlined />}
      />

      <div style={{ ...sectionPanel, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--text-primary)" }}>
          Fee Summary
        </div>
        <Table
          className="fees-tbl"
          columns={feeColumns}
          dataSource={myFees}
          rowKey="_id"
          loading={feeLoading}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Installments</div>
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
          dataSource={installments}
          rowKey="_id"
          loading={installmentLoading}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title="Select Installment Type"
        open={frequencyModalOpen}
        onCancel={() => setFrequencyModalOpen(false)}
        onOk={handleGenerateInstallments}
        centered
      >
        <Radio.Group
          value={selectedFrequency}
          onChange={(e) => setSelectedFrequency(e.target.value)}
        >
          <Space direction="vertical">
            <Radio value="monthly">Monthly</Radio>
            <Radio value="quarterly">Quarterly</Radio>
            <Radio value="yearly">Yearly</Radio>
          </Space>
        </Radio.Group>
      </Modal>

      <Modal
        title="Pay Installment"
        open={open}
        onCancel={closePayModal}
        centered
        footer={[
          <Button key="cancel" onClick={closePayModal}>Cancel</Button>,
          paymentMethod === "online"
            ? (
              <Button key="pay" type="primary" icon={<DollarOutlined />} onClick={handleRazorpayPayment}>
                Pay Online (Razorpay)
              </Button>
            ) : (
              <Button key="pay" type="primary" icon={<DollarOutlined />} onClick={handleOfflinePayment}>
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
                <span style={{ fontWeight: 700, color: "#EF4444" }}>
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
                <tr>
                  <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>Installment</th>
                  <td style={{ padding: "8px 10px", border: "1px solid #ddd" }}>{receiptInstallment.installmentName}</td>
                </tr>
                <tr>
                  <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>Total Amount</th>
                  <td style={{ padding: "8px 10px", border: "1px solid #ddd" }}>₹{receiptInstallment.amount}</td>
                </tr>
                <tr>
                  <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>Amount Paid</th>
                  <td style={{ padding: "8px 10px", border: "1px solid #ddd", fontWeight: 700, color: "#22C55E" }}>₹{receiptInstallment.paidAmount}</td>
                </tr>
                <tr>
                  <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>Status</th>
                  <td style={{ padding: "8px 10px", border: "1px solid #ddd", textTransform: "uppercase", color: "#22C55E", fontWeight: 700 }}>
                    {receiptInstallment.status}
                  </td>
                </tr>
                {receiptInstallment.paidAt && (
                  <tr>
                    <th style={{ padding: "8px 10px", border: "1px solid #ddd", textAlign: "left", background: "#f5f5f5" }}>Paid On</th>
                    <td style={{ padding: "8px 10px", border: "1px solid #ddd" }}>
                      {new Date(receiptInstallment.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                )}
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
