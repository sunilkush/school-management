import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  InputNumber,
  message,
} from "antd";
import { CreditCardOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyFees } from "../../../features/studentFeeSlice";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";
import { createPayment } from "../../../features/paymentSlice";
import { generateInstallments, fetchFeeInstallments, resetInstallmentState } from "../../../features/feeInstallmentSlice";

const FeeStudent = () => {
  const dispatch = useDispatch();

  const { myFees = [], loading } = useSelector(
    (state) => state.studentFee
  );
  const { myEnrollment } = useSelector((state) => state.students);
  const { installments, loading: instLoading, success } = useSelector((state) => state.feeInstallment);

  const enrollmentId = myEnrollment?.enrollmentId;

  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);

  /* ================= FETCH ENROLLMENT ================= */
  useEffect(() => {
    dispatch(fetchMyStudentEnrollment());
  }, [dispatch]);

  /* ================= FETCH FEES ================= */
  useEffect(() => {
    if (enrollmentId) {
      dispatch(fetchMyFees(enrollmentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    }
  }, [dispatch, enrollmentId, success]);

  /* ================= OPEN PAY MODAL ================= */
  const openPayModal = (installment) => {
    if (installment.status === "paid") {
      message.info("Installment already paid");
      return;
    }
    setSelectedInstallment(installment);
    setAmountPaid(installment.dueAmount);
    setOpen(true);
  };

  /* ================= SUBMIT PAYMENT ================= */
  const handleSubmitPayment = async () => {
    if (!selectedInstallment) return;

    const payload = {
      studentId: selectedInstallment.studentId,
      installmentId: selectedInstallment._id,
      amountPaid,
      paymentMode: "cash",
      receiptNo: `RCT-${Date.now()}`,
    };

    try {
      await dispatch(createPayment(payload)).unwrap();
      message.success("Payment Successful");
      setOpen(false);
      dispatch(fetchMyFees(enrollmentId));
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    } catch (err) {
      message.error(err || "Payment failed");
    }
  };

  /* ================= GENERATE INSTALLMENTS ================= */
  const handleGenerateInstallments = async () => {
    if (!enrollmentId) return;

    try {
      await dispatch(generateInstallments({ studentId: enrollmentId })).unwrap();
      message.success("Installments generated successfully");
      dispatch(resetInstallmentState());
      dispatch(fetchFeeInstallments({ studentId: enrollmentId }));
    } catch (err) {
      message.error(err || "Failed to generate installments");
    }
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Fee Type",
      render: (_, record) => record.feeStructureId?.feeHeadId?.name || "-",
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      render: (v) => `₹ ${v}`,
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      render: (v) => `₹ ${v}`,
    },
    {
      title: "Due",
      dataIndex: "dueAmount",
      render: (v) => `₹ ${v}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) =>
        s === "paid" ? <Tag color="green">PAID</Tag> : <Tag color="red">DUE</Tag>,
    },
    {
      title: "Action",
      render: (_, record) =>
        record.status !== "paid" && (
          <Button
            type="primary"
            size="small"
            onClick={() => openPayModal(record)}
          >
            Pay
          </Button>
        ),
    },
  ];

  return (
    <>
      <Card
        title="My Fees"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleGenerateInstallments}
            loading={instLoading}
          >
            Generate Installments
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={installments.length ? installments : myFees}
          rowKey="_id"
          loading={loading || instLoading}
          pagination={false}
        />
      </Card>

      {/* ================= PAY MODAL ================= */}
      <Modal
        title="Pay Fee"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmitPayment}
      >
        {selectedInstallment && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Installment">
                {selectedInstallment.name || "Installment"}
              </Descriptions.Item>
              <Descriptions.Item label="Due Amount">
                ₹ {selectedInstallment.dueAmount}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <label>Amount to Pay</label>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={selectedInstallment.dueAmount}
                value={amountPaid}
                onChange={setAmountPaid}
              />
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default FeeStudent;
