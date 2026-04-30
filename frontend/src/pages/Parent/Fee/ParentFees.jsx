import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyFees } from "../../../features/studentFeeSlice";
import {
  fetchFeeInstallments,
  generateInstallments,
} from "../../../features/feeInstallmentSlice";
import { createPayment } from "../../../features/paymentSlice";

const { Title, Text } = Typography;

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ParentFees = () => {
  const dispatch = useDispatch();

  const { children = [], loading: childrenLoading } = useSelector(
    (state) => state.studentPortal || {}
  );
  const { myFees = [], loading: feeLoading } = useSelector(
    (state) => state.studentFee || {}
  );
  const { installments = [], loading: installmentLoading } = useSelector(
    (state) => state.feeInstallment || {}
  );

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.userId === selectedChildId) || null,
    [children, selectedChildId]
  );

  const enrollmentId = selectedChild?.enrollmentId;
  const selectedStudentId = selectedChild?._id || selectedChild?.studentId || selectedChild?.userId;
  useEffect(() => {
    if (!enrollmentId) return;

    const childStudentIds = children
      .map((child) => child?._id || child?.studentId || child?.userId)
      .filter(Boolean);

    if (childStudentIds.length) dispatch(fetchMyFees(childStudentIds));
    dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
  }, [dispatch, enrollmentId, children]);

  const openPayModal = (installment) => {
    setSelectedInstallment(installment);
    setAmountPaid(installment.amount - installment.paidAmount);
    setOpen(true);
  };

  const handleGenerateInstallments = async () => {
    if (!enrollmentId) {
      message.error("Active enrollment not found for selected child");
      return;
    }

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
      if (selectedStudentId) dispatch(fetchMyFees(selectedStudentId));
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
          if (selectedStudentId) dispatch(fetchMyFees(selectedStudentId));
        },
        theme: { color: "#1677ff" },
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
        s === "paid" ? <Tag color="green">PAID</Tag> : <Tag color="red">DUE</Tag>,
    },
  ];

  const installmentColumns = [
    { title: "Installment", dataIndex: "installmentName" },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Paid", dataIndex: "paidAmount", render: (v) => `₹${v}` },
    { title: "Due", render: (_, r) => `₹${r.amount - r.paidAmount}` },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={s === "paid" ? "green" : "orange"}>{s}</Tag>,
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
      <Card>
        <Title level={4} style={{ margin: 0 }}>Child Fee Details</Title>
        <Select
          placeholder="Select child"
          value={selectedChildId}
          onChange={setSelectedChildId}
          style={{ maxWidth: 340, marginTop: 12, width: "100%" }}
          loading={childrenLoading}
          options={children.map((child) => ({
            label: `${child.name || "Student"} (${child.registrationNumber || "-"})`,
            value: child.userId,
          }))}
        />
        {selectedChildId && !enrollmentId ? (
          <Text type="warning" style={{ display: "block", marginTop: 12 }}>
            Active enrollment not found for this child.
          </Text>
        ) : null}
      </Card>

      <Card title="Fees" style={{ marginTop: 16 }}>
        {!selectedChildId ? (
          <Empty description="Please select a child to view fees" />
        ) : !enrollmentId ? (
          <Empty description="No active enrollment found for selected child" />
        ) : (
          <Col style={{ overflow: "auto" }}>
            <Table
              columns={feeColumns}
              dataSource={myFees}
              rowKey="_id"
              loading={feeLoading}
              pagination={false}
            />
          </Col>
        )}
      </Card>

      <Card
        title="Installments"
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            disabled={!enrollmentId || installments.length > 0}
            onClick={() => setFrequencyModalOpen(true)}
          >
            Generate Installments
          </Button>
        }
      >
        {!selectedChildId ? (
          <Empty description="Please select a child to view installments" />
        ) : !enrollmentId ? (
          <Empty description="No active enrollment found for selected child" />
        ) : (
          <Table
            columns={installmentColumns}
            dataSource={installments}
            rowKey="_id"
            loading={installmentLoading}
            pagination={false}
          />
        )}
      </Card>

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
              max={selectedInstallment.amount - selectedInstallment.paidAmount}
              value={amountPaid}
              onChange={setAmountPaid}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default ParentFees;
