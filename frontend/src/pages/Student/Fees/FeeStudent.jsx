import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  message,
  InputNumber,
  Radio,
  Space,
} from "antd";
import { DollarOutlined } from "@ant-design/icons";
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

  const enrollmentId = myEnrollment?.enrollmentId;
  const studentId = myEnrollment?.studentId;

  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);

  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");

  useEffect(() => {
    dispatch(fetchMyStudentEnrollment());
  }, [dispatch]);

  useEffect(() => {
    if (enrollmentId) {
      if (studentId) dispatch(fetchMyFees(studentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    }
  }, [dispatch, enrollmentId, studentId]);

  const handleGenerateInstallments = async () => {
    try {
      await dispatch(
        generateInstallments({
          studentId: enrollmentId,
          frequency: selectedFrequency,
        })
      ).unwrap();

      message.success(`Installments generated (${selectedFrequency})`);
      setFrequencyModalOpen(false);
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    } catch (err) {
      message.error(err || "Failed to generate installments");
    }
  };

  const openPayModal = (installment) => {
    setSelectedInstallment(installment);
    setAmountPaid(installment.amount - installment.paidAmount);
    setOpen(true);
  };

  const handleCashPayment = async () => {
    try {
      await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          amount: amountPaid,
          paymentMode: "cash",
        })
      ).unwrap();

      message.success("Payment successful");
      setOpen(false);
      if (studentId) dispatch(fetchMyFees(studentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
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

          message.success("Payment successful");
          setOpen(false);
          if (studentId) dispatch(fetchMyFees(studentId));
          dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
        },
        theme: { color: "var(--primary)" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      message.error(err || "Payment failed");
    }
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
          <span style={pill("#16a34a", "#f0fdf4")}>PAID</span>
        ) : (
          <span style={pill("#dc2626", "#fff1f2")}>DUE</span>
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
        <span style={pill(s === "paid" ? "#16a34a" : "#d97706", s === "paid" ? "#f0fdf4" : "#fffbeb")}>
          {s}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_, r) =>
        r.status !== "paid" && (
          <Button type="primary" size="small" onClick={() => openPayModal(r)}>
            Pay
          </Button>
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
        onCancel={() => setOpen(false)}
        centered
        footer={[
          <Button key="cash" onClick={handleCashPayment}>
            Pay Cash
          </Button>,
          <Button key="online" type="primary" onClick={handleRazorpayPayment}>
            Pay Online
          </Button>,
        ]}
      >
        {selectedInstallment && (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Installment">
                {selectedInstallment.installmentName}
              </Descriptions.Item>
              <Descriptions.Item label="Due">
                ₹{selectedInstallment.amount - selectedInstallment.paidAmount}
              </Descriptions.Item>
            </Descriptions>

            <InputNumber
              style={{ width: "100%" }}
              min={1}
              max={selectedInstallment.amount - selectedInstallment.paidAmount}
              value={amountPaid}
              onChange={setAmountPaid}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default FeeStudent;
