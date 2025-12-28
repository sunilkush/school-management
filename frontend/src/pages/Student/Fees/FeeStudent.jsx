import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Modal, Descriptions, message } from "antd";
import { CreditCardOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";

import { currentUser } from "../../../features/authSlice";
const FeeStudent = () => {
  const dispatch = useDispatch();
  const { myFees = [], loading } = useSelector((state) => state.studentFee);
    const { user } = useSelector((state) => state.auth);
  const studentId = user?._id ;
  const [open, setOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  /* ================= FETCH FEES ================= */
  useEffect(() => {
    dispatch(fetchMyFees(studentId));
    dispatch(currentUser());
  }, [dispatch, studentId]);

  /* ================= PAY FEE ================= */
  const handlePay = async (feeId) => {
    try {
      await dispatch(payStudentFee({ id: feeId, payload: {} })).unwrap();
      message.success("Fee paid successfully");
    } catch (err) {
      message.error(err?.message || "Failed to pay fee");
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Academic Year",
      dataIndex: ["academicYear", "name"],
    },
    {
      title: "Fee Type",
      dataIndex: ["fee", "feeName"],
    },
    {
      title: "Total Fee",
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
      render: (_, record) => `₹ ${record.totalAmount - record.paidAmount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "paid" ? <Tag color="green">PAID</Tag> : <Tag color="red">DUE</Tag>,
    },
    {
      title: "Action",
      render: (_, record) => (
        <>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedFee(record);
              setOpen(true);
            }}
            style={{ marginRight: 8 }}
          >
            View
          </Button>

          {record.status !== "paid" && (
            <Button
              type="primary"
              icon={<CreditCardOutlined />}
              size="small"
              onClick={() => handlePay(record._id)}
            >
              Pay
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <Card title="My Fees" bordered={false} style={{ marginBottom: 20 }}>
        <Table
          columns={columns}
          dataSource={myFees}
          rowKey="_id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* ================= PAYMENT DETAIL MODAL ================= */}
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Fee Details" width={600}>
        {selectedFee && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Academic Year">{selectedFee.academicYear?.name}</Descriptions.Item>
            <Descriptions.Item label="Fee Type">{selectedFee.fee?.feeName}</Descriptions.Item>
            <Descriptions.Item label="Total Fee">₹ {selectedFee.totalAmount}</Descriptions.Item>
            <Descriptions.Item label="Paid Amount">₹ {selectedFee.paidAmount}</Descriptions.Item>
            <Descriptions.Item label="Due Amount">
              ₹ {selectedFee.totalAmount - selectedFee.paidAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {selectedFee.status === "paid" ? <Tag color="green">PAID</Tag> : <Tag color="red">DUE</Tag>}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default FeeStudent;
