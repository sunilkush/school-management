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
  Input,
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
  PrinterOutlined,
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
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [chequeNo, setChequeNo] = useState("");

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
    setPaymentMethod("online");
    setChequeNo("");
    setPaymentOpen(true);
  };

  const closePayModal = () => {
    setPaymentOpen(false);
    setPaymentMethod("online");
    setChequeNo("");
  };

  const handlePrintReceipt = (installment) => {
    const child = children.find((c) => c.userId === selectedChildId);
    const w = window.open("", "_blank", "width=700,height=600");
    w.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>body{font-family:Arial,sans-serif;padding:30px}table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:8px 12px}th{background:#f4f4f4}h2{text-align:center}</style>
      </head><body>
      <h2>Fee Payment Receipt</h2>
      <p><strong>Student:</strong> ${child?.name || "—"} &nbsp;&nbsp;
         <strong>Class:</strong> ${child?.className || "—"} ${child?.sectionName || ""}</p>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Installment</td><td>${installment.installmentName || "—"}</td></tr>
        <tr><td>Amount</td><td>₹${Number(installment.amount || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td>Paid</td><td>₹${Number(installment.paidAmount || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td>Due Date</td><td>${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString("en-IN") : "—"}</td></tr>
        <tr><td>Status</td><td>${String(installment.status || "—").toUpperCase()}</td></tr>
        <tr><td>Printed On</td><td>${new Date().toLocaleString("en-IN")}</td></tr>
      </table>
      </body></html>
    `);
    w.document.close();
    w.print();
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

  const handleOfflinePayment = async () => {
    if (!selectedInstallment?._id || !amountPaid) return;

    try {
      setPaying(true);

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
          closePayModal();
          refreshFeeData();
        },
        theme: { color: "#2563EB" },
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
        return (
          <Space size={4}>
            {r.status !== "paid" && due > 0 ? (
              <Button type="primary" size="small" onClick={() => openPayModal(r)}>Pay Now</Button>
            ) : (
              <Tag color="success">Paid</Tag>
            )}
            {r.status === "paid" && (
              <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrintReceipt(r)}>
                Receipt
              </Button>
            )}
          </Space>
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
          boxShadow: "0 10px 30px rgba(37,99,235,0.06)",
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
            <Statistic title="Paid" value={paidFees} formatter={money} valueStyle={{ color: "#22C55E" }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title="Pending" value={dueFees} formatter={money} valueStyle={{ color: "#EF4444" }} prefix={<ClockCircleOutlined />} />
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
          boxShadow: "0 10px 30px rgba(37,99,235,0.06)",
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
          boxShadow: "0 10px 30px rgba(37,99,235,0.06)",
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
        title="Pay Installment"
        open={paymentOpen}
        onCancel={closePayModal}
        centered
        width={460}
        footer={[
          <Button key="cancel" onClick={closePayModal}>Cancel</Button>,
          paymentMethod === "online"
            ? (
              <Button key="pay" type="primary" icon={<CreditCardOutlined />} loading={paying} onClick={handleRazorpayPayment}>
                Pay Online (Razorpay)
              </Button>
            ) : (
              <Button key="pay" type="primary" icon={<WalletOutlined />} loading={paying} onClick={handleOfflinePayment}>
                Confirm {paymentMethod === "cheque" ? "Cheque" : "Cash"} Payment
              </Button>
            ),
        ]}
      >
        {selectedInstallment && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card bordered={false} style={{ background: "#F8FAFC", borderRadius: 14 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Installment">
                  <Text strong>{selectedInstallment.installmentName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Due Amount">
                  <Text strong style={{ color: "#EF4444", fontSize: 16 }}>
                    {money(Number(selectedInstallment.amount || 0) - Number(selectedInstallment.paidAmount || 0))}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                Amount to Pay
              </Text>
              <InputNumber
                size="large"
                style={{ width: "100%" }}
                min={1}
                max={Number(selectedInstallment.amount || 0) - Number(selectedInstallment.paidAmount || 0)}
                value={amountPaid}
                onChange={setAmountPaid}
                formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                parser={(v) => v?.replace(/[₹,\s]/g, "")}
              />
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Payment Method
              </Text>
              <Space direction="vertical" style={{ width: "100%" }}>
                {[
                  { value: "online", label: "💳 Pay Online (Razorpay)", desc: "Secure card / UPI / netbanking via Razorpay" },
                  { value: "cash",   label: "💵 Cash",   desc: "Record an offline cash payment" },
                  { value: "cheque", label: "📋 Cheque", desc: "Record a cheque payment (enter cheque no. below)" },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => { setPaymentMethod(opt.value); setChequeNo(""); }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: `2px solid ${paymentMethod === opt.value ? "#2563EB" : "var(--border-muted)"}`,
                      background: paymentMethod === opt.value ? "#EFF6FF" : "var(--surface)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Text strong style={{ color: paymentMethod === opt.value ? "#2563EB" : "var(--text-primary)" }}>
                      {opt.label}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{opt.desc}</Text>
                  </div>
                ))}
              </Space>
            </div>

            {paymentMethod === "cheque" && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Cheque Number
                </Text>
                <Input
                  size="large"
                  placeholder="Enter cheque number"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ParentFees;