import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Empty,
  Flex,
  InputNumber,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CreditCardOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyFees } from "../../../features/studentFeeSlice";
import {
  fetchFeeInstallments,
  generateInstallments,
} from "../../../features/feeInstallmentSlice";
import { createPayment } from "../../../features/paymentSlice";

const { Title, Text } = Typography;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const getErrorMessage = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err?.message || err?.payload?.message || err?.data?.message || fallback;
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

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

  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);

  const [paying, setPaying] = useState(false);

  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0]?.userId);
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.userId === selectedChildId) || null,
    [children, selectedChildId]
  );

  const enrollmentId = selectedChild?._id;

  const refreshFeeData = () => {
    if (!enrollmentId || !academicYearId) return;

    dispatch(
      fetchMyFees({
        studentId: enrollmentId,
        academicYearId,
      })
    );

    dispatch(
      fetchFeeInstallments({
        studentId: enrollmentId,
        academicYearId,
      })
    );
  };

  useEffect(() => {
    refreshFeeData();
  }, [dispatch, enrollmentId, academicYearId]);

  const totalFees = useMemo(
    () => myFees.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    [myFees]
  );

  const paidFees = useMemo(
    () => myFees.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
    [myFees]
  );

  const dueFees = useMemo(
    () => myFees.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0),
    [myFees]
  );

  const paidPercent = totalFees ? Math.round((paidFees / totalFees) * 100) : 0;

  const groupedInstallments = useMemo(() => {
    if (!Array.isArray(installments)) return [];

    const map = {};

    installments.forEach((inst) => {
      const feeStructure =
        inst?.studentFeeId?.feeStructureId || inst?.feeStructureId || {};

      const feeId = feeStructure?._id || inst?.studentFeeId?._id || inst?._id;

      if (!map[feeId]) {
        map[feeId] = {
          key: feeId,
          feeHead: feeStructure?.feeHeadId?.name || inst?.feeHead?.name || "Fee",
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          installments: [],
        };
      }

      const amount = Number(inst.amount || 0);
      const paid = Number(inst.paidAmount || 0);

      map[feeId].installments.push(inst);
      map[feeId].totalAmount += amount;
      map[feeId].paidAmount += paid;
      map[feeId].dueAmount += amount - paid;
    });

    return Object.values(map);
  }, [installments]);

  const openPayModal = (installment) => {
    const due = Number(installment.amount || 0) - Number(installment.paidAmount || 0);
    setSelectedInstallment(installment);
    setAmountPaid(due);
    setPaymentOpen(true);
  };

const handleGenerateInstallments = async () => {
  if (!enrollmentId || !academicYearId) {
    message.error("Student and academic year are required");
    return;
  }

  try {
    await dispatch(
      generateInstallments({
        studentId: enrollmentId,
        academicYearId,
      })
    ).unwrap();

    message.success("Installments generated successfully");
   /*  setFrequencyModalOpen(false); */
    refreshFeeData();
  } catch (err) {
    message.error(getErrorMessage(err, "Failed to generate installments"));
  }
};

  const handleCashPayment = async () => {
    if (!selectedInstallment?._id || !amountPaid) return;

    try {
      setPaying(true);

      await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          amount: amountPaid,
          paymentMode: "cash",
        })
      ).unwrap();

      message.success("Cash payment saved successfully");
      setPaymentOpen(false);
      refreshFeeData();
    } catch (err) {
      message.error(getErrorMessage(err, "Payment failed"));
    } finally {
      setPaying(false);
    }
  };

  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpay();

    if (!loaded) {
      message.error("Razorpay SDK failed to load");
      return;
    }

    try {
      setPaying(true);

      const paymentInit = await dispatch(
        createPayment({
          installmentId: selectedInstallment._id,
          amount: amountPaid,
          paymentMode: "razorpay",
        })
      ).unwrap();

      const options = {
        key: paymentInit?.data?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentInit?.data?.amount,
        currency: "INR",
        order_id: paymentInit?.data?.orderId,
        name: "School Fee Payment",
        description: selectedInstallment?.installmentName || "Fee Payment",
        handler: async (response) => {
          await dispatch(
            createPayment({
              installmentId: selectedInstallment._id,
              amount: amountPaid,
              paymentMode: "razorpay",
              razorpay: response,
            })
          ).unwrap();

          message.success("Online payment successful");
          setPaymentOpen(false);
          refreshFeeData();
        },
        theme: { color: "#1677ff" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      message.error(getErrorMessage(err, "Online payment failed"));
    } finally {
      setPaying(false);
    }
  };

  const feeColumns = [
    {
      title: "Fee Head",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.feeStructureId?.feeHeadId?.name || "Fee"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.feeStructureId?.frequency || "Fee structure"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      render: money,
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      render: (v) => <Text type="success">{money(v)}</Text>,
    },
    {
      title: "Due",
      dataIndex: "dueAmount",
      render: (v) => <Text type="danger">{money(v)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "paid" ? "success" : s === "partial" ? "warning" : "error"}>
          {String(s || "due").toUpperCase()}
        </Tag>
      ),
    },
  ];

  const installmentColumns = [
    {
      title: "Installment",
      dataIndex: "installmentName",
      render: (v) => <Text strong>{v || "-"}</Text>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "-"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: money,
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      render: (v) => <Text type="success">{money(v)}</Text>,
    },
    {
      title: "Due",
      render: (_, r) => (
        <Text type="danger">
          {money(Number(r.amount || 0) - Number(r.paidAmount || 0))}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "paid" ? "success" : s === "partial" ? "warning" : "orange"}>
          {String(s || "pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      fixed: "right",
      render: (_, r) => {
        const due = Number(r.amount || 0) - Number(r.paidAmount || 0);

        return r.status !== "paid" && due > 0 ? (
          <Button type="primary" size="small" onClick={() => openPayModal(r)}>
            Pay Now
          </Button>
        ) : (
          <Tag color="success">Paid</Tag>
        );
      },
    },
  ];

  const noChild = !selectedChildId;
  const noEnrollment = selectedChildId && !enrollmentId;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "24px",
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          marginBottom: 18,
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        }}
      >
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Parent Fee Portal
              </Title>
              <Text type="secondary">
                View child fee details, installments, and make secure payments.
              </Text>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Flex gap={10} justify="flex-end" wrap="wrap">
              <Select
                size="large"
                placeholder="Select child"
                value={selectedChildId}
                onChange={setSelectedChildId}
                loading={childrenLoading}
                style={{ minWidth: 260, flex: 1 }}
                options={children.map((child) => ({
                  label: `${child.name || "Student"} (${child.registrationNumber || "-"})`,
                  value: child.userId,
                }))}
              />

              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={refreshFeeData}
                disabled={!enrollmentId || !academicYearId}
              >
                Refresh
              </Button>
            </Flex>
          </Col>
        </Row>

        {noEnrollment ? (
          <Alert
            style={{ marginTop: 16, borderRadius: 14 }}
            type="warning"
            showIcon
            message="Active enrollment not found for this child."
          />
        ) : null}
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title="Total Fees" value={totalFees} formatter={money} prefix={<WalletOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title="Paid" value={paidFees} formatter={money} valueStyle={{ color: "#16a34a" }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title="Pending" value={dueFees} formatter={money} valueStyle={{ color: "#dc2626" }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Text type="secondary">Payment Progress</Text>
            <Progress percent={paidPercent} status={paidPercent === 100 ? "success" : "active"} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <UserOutlined />
            Student Fee Summary
          </Space>
        }
        bordered={false}
        style={{
          borderRadius: 24,
          marginBottom: 18,
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        }}
      >
        {noChild ? (
          <Empty description="Please select a child to view fees" />
        ) : noEnrollment ? (
          <Empty description="No active enrollment found for selected child" />
        ) : (
          <Table
            columns={feeColumns}
            dataSource={myFees}
            rowKey="_id"
            loading={feeLoading}
            pagination={false}
            scroll={{ x: 850 }}
          />
        )}
      </Card>

      <Card
        title="Installments"
        bordered={false}
        style={{
          borderRadius: 24,
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
        }}
        extra={
         <Button
            type="primary"
            disabled={!enrollmentId || !academicYearId || installments.length > 0}
            onClick={handleGenerateInstallments}
          >
            Generate Installments
          </Button>
        }
      >
        {noChild ? (
          <Empty description="Please select a child to view installments" />
        ) : noEnrollment ? (
          <Empty description="No active enrollment found for selected child" />
        ) : !groupedInstallments.length ? (
          <Empty description="No installments generated yet" />
        ) : (
          <Collapse
            bordered={false}
            style={{ background: "transparent" }}
            items={groupedInstallments.map((item) => ({
              key: item.key,
              label: (
                <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                  <Text strong>{item.feeHead}</Text>

                  <Space wrap>
                    <Tag color="blue">Total {money(item.totalAmount)}</Tag>
                    <Tag color="green">Paid {money(item.paidAmount)}</Tag>
                    <Tag color="red">Due {money(item.dueAmount)}</Tag>
                  </Space>
                </Flex>
              ),
              children: (
                <Table
                  columns={installmentColumns}
                  dataSource={item.installments}
                  rowKey="_id"
                  loading={installmentLoading}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              ),
            }))}
          />
        )}
      </Card>

    

      <Modal
        open={paymentOpen}
        onCancel={() => setPaymentOpen(false)}
        footer={null}
        centered
        width={440}
      >
        {selectedInstallment && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <Title level={4} style={{ marginBottom: 4 }}>
                Pay Installment
              </Title>
              <Text type="secondary">Complete your fee payment securely</Text>
            </div>

            <Card
              bordered={false}
              style={{ background: "#f8fafc", borderRadius: 18 }}
            >
              <Descriptions column={1}>
                <Descriptions.Item label="Installment">
                  {selectedInstallment.installmentName}
                </Descriptions.Item>
                <Descriptions.Item label="Due Amount">
                  {money(
                    Number(selectedInstallment.amount || 0) -
                      Number(selectedInstallment.paidAmount || 0)
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <InputNumber
              size="large"
              style={{ width: "100%" }}
              min={1}
              max={
                Number(selectedInstallment.amount || 0) -
                Number(selectedInstallment.paidAmount || 0)
              }
              value={amountPaid}
              onChange={setAmountPaid}
              formatter={(value) =>
                value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
              }
              parser={(value) => value?.replace(/[₹,\s]/g, "")}
            />

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                size="large"
                type="primary"
                icon={<CreditCardOutlined />}
                loading={paying}
                onClick={handleRazorpayPayment}
              >
                Pay Online
              </Button>

              <Button
                block
                size="large"
                icon={<DownloadOutlined />}
                loading={paying}
                onClick={handleCashPayment}
              >
                Mark Cash Payment
              </Button>
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ParentFees;