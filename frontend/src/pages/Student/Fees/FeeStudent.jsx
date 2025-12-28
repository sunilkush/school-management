import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Modal, Descriptions, message } from "antd";
import { CreditCardOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";

const FeeStudent = () => {
  const dispatch = useDispatch();

  const { myFees = [], loading: feeLoading } = useSelector(
    (state) => state.studentFee
  );

  const { myEnrollment, loading: enrollmentLoading } = useSelector(
    (state) => state.students
  );

  const [open, setOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const enrollmentId = myEnrollment?.enrollmentId;

  /* ================= FETCH ENROLLMENT ================= */
  useEffect(() => {
    dispatch(fetchMyStudentEnrollment());
  }, [dispatch]);

  /* ================= FETCH FEES ================= */
  useEffect(() => {
    if (enrollmentId) {
      dispatch(fetchMyFees(enrollmentId));
    }
  }, [dispatch, enrollmentId]);

  /* ================= PAY FEE ================= */
  const handlePay = async (feeId) => {
    try {
      await dispatch(payStudentFee({ id: feeId })).unwrap();
      message.success("Fee paid successfully");
      dispatch(fetchMyFees(enrollmentId)); // refresh
    } catch (err) {
      message.error(err || "Failed to pay fee");
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Academic Year",
      render: (_, record) => record.academicYearId?.name || "-",
    },
    {
      title: "Fee Type",
      render: (_, record) => record.feeStructureId?.name || "-",
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
      render: (_, record) => `₹ ${record.dueAmount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "paid" ? (
          <Tag color="green">PAID</Tag>
        ) : (
          <Tag color="red">DUE</Tag>
        ),
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
      <Card title="My Fees">
        <Table
          columns={columns}
          dataSource={myFees}
          rowKey="_id"
          loading={feeLoading || enrollmentLoading}
          pagination={false}
        />
      </Card>

      {/* ================= MODAL ================= */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Fee Details"
        width={600}
      >
        {selectedFee && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Academic Year">
              {selectedFee.academicYearId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Fee Type">
              {selectedFee.feeStructureId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Total Fee">
              ₹ {selectedFee.totalAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Paid Amount">
              ₹ {selectedFee.paidAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Due Amount">
              ₹ {selectedFee.dueAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {selectedFee.status === "paid" ? (
                <Tag color="green">PAID</Tag>
              ) : (
                <Tag color="red">DUE</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default FeeStudent;
