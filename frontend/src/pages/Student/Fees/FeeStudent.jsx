import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  message,
  Col,
  InputNumber,
  Radio,
} from "antd";
import { useDispatch, useSelector } from "react-redux";

import { fetchMyFees } from "../../../features/studentFeeSlice";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";
import { createPayment } from "../../../features/paymentSlice";
import {
  generateInstallments,
  fetchFeeInstallments,
} from "../../../features/feeInstallmentSlice";

/* ================= RAZORPAY SCRIPT LOADER ================= */
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

  /* ================= REDUX STATE ================= */
  const { myFees = [], loading: feeLoading } = useSelector(
    (state) => state.studentFee
  );

  const { myEnrollment } = useSelector((state) => state.students);

  const { installments = [], loading: installmentLoading } = useSelector(
    (state) => state.feeInstallment
  );

  const enrollmentId = myEnrollment?.enrollmentId;

  /* ================= LOCAL STATE ================= */
  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);

  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    dispatch(fetchMyStudentEnrollment());
  }, [dispatch]);

  useEffect(() => {
    if (enrollmentId) {
      dispatch(fetchMyFees(enrollmentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    }
  }, [dispatch, enrollmentId]);

  /* ================= GENERATE INSTALLMENTS ================= */
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

  /* ================= OPEN PAY MODAL ================= */
  const openPayModal = (installment) => {
    setSelectedInstallment(installment);
    setAmountPaid(installment.amount - installment.paidAmount);
    setOpen(true);
  };

  /* ================= CASH PAYMENT ================= */
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
      dispatch(fetchMyFees(enrollmentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    } catch (err) {
      message.error(err || "Payment failed");
    }
  };

  /* ================= RAZORPAY PAYMENT ================= */
  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      message.error("Razorpay SDK failed to load");
      return;
    }

    try {
      const { payload } = await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          paymentMode: "razorpay",
        })
      ).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payload.amount,
        currency: "INR",
        order_id: payload.orderId,
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
          dispatch(fetchMyFees(enrollmentId));
          dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
        },
        theme: { color: "#1677ff" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      message.error(err || "Payment failed");
    }
  };

  /* ================= TABLE COLUMNS ================= */
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
        s === "paid" ? <Tag color="green">PAID</Tag> : <Tag color="red">DUE</Tag>,
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
        <Tag color={s === "paid" ? "green" : "orange"}>{s}</Tag>
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
    <>
      {/* ===== FEES ===== */}
      <Card title="My Fees">
        <Col style={{ overflow: "auto" }}>
          <Table
            columns={feeColumns}
            dataSource={myFees}
            rowKey="_id"
            loading={feeLoading}
            pagination={false}
          />
        </Col>
      </Card>

      {/* ===== INSTALLMENTS ===== */}
      <Card
        title="Installments"
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            disabled={installments.length > 0}
            onClick={() => setFrequencyModalOpen(true)}
          >
            Generate Installments
          </Button>
        }
      >
        <Table
          columns={installmentColumns}
          dataSource={installments}
          rowKey="_id"
          loading={installmentLoading}
          pagination={false}
        />
      </Card>

      {/* ===== FREQUENCY MODAL ===== */}
      <Modal
        title="Select Installment Type"
        open={frequencyModalOpen}
        onCancel={() => setFrequencyModalOpen(false)}
        onOk={handleGenerateInstallments}
      >
        <Radio.Group
          value={selectedFrequency}
          onChange={(e) => setSelectedFrequency(e.target.value)}
        >
          <Radio value="monthly">Monthly</Radio>
          <Radio value="quarterly">Quarterly</Radio>
          <Radio value="yearly">Yearly</Radio>
        </Radio.Group>
      </Modal>

      {/* ===== PAY MODAL ===== */}
      <Modal
        title="Pay Installment"
        open={open}
        onCancel={() => setOpen(false)}
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
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Installment">
                {selectedInstallment.installmentName}
              </Descriptions.Item>
              <Descriptions.Item label="Due">
                ₹{selectedInstallment.amount - selectedInstallment.paidAmount}
              </Descriptions.Item>
            </Descriptions>

            <InputNumber
              style={{ width: "100%", marginTop: 12 }}
              min={1}
              max={
                selectedInstallment.amount -
                selectedInstallment.paidAmount
              }
              value={amountPaid}
              onChange={setAmountPaid}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default FeeStudent;
