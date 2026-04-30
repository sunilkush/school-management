import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";

const { Content } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || value?.id || "";
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getApiMessage = (err, fallback = "Something went wrong") => {
  const msg =
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.payload?.message ||
    err?.message ||
    err?.error;

  return typeof msg === "string" ? msg : fallback;
};

const CollectFees = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const [loadingFees, setLoadingFees] = useState(false);
  const [studentFees, setStudentFees] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [pendingFeesByStudent, setPendingFeesByStudent] = useState({});
  const [loadingPendingByStudent, setLoadingPendingByStudent] = useState({});
  const [selectedFeeDueAmount, setSelectedFeeDueAmount] = useState(0);
  const [alertInfo, setAlertInfo] = useState(null);

  const { user } = useSelector((s) => s.auth || {});
  const { schoolStudents = [] } = useSelector((s) => s.students || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id || user?.schoolId || "";
  const academicYearId = selectedAcademicYear?._id || "";

  const showAlert = (type, message, description = "") => {
    setAlertInfo({ type, message, description });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const students = useMemo(() => {
    return schoolStudents.map((s) => {
      const studentId =
        getId(s.student) || getId(s.studentId) || getId(s.user) || getId(s);

      const classObj = s.class || s.schoolClass || s.schoolClassId || {};
      const classId = getId(classObj) || getId(s.classId) || getId(s.schoolClassId);

      return {
        key: s._id || studentId,
        studentId,
        enrollmentId: s._id,
        name: s.user?.name || s.name || "-",
        email: s.user?.email || s.email || "-",
        regNo: s.registrationNumber || s.regId || "-",
        className: classObj?.name || s.className || "-",
        classId,
        section: s.section?.name || s.sectionName || "-",
      };
    });
  }, [schoolStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchName.toLowerCase();

      const matchSearch =
        !q ||
        `${s.name} ${s.email} ${s.regNo}`.toLowerCase().includes(q);

      const matchClass = filterClass ? s.classId === filterClass : true;

      return matchSearch && matchClass;
    });
  }, [students, searchName, filterClass]);

  const totalPendingAmount = useMemo(() => {
    return filteredStudents.reduce((sum, s) => {
      return sum + Number(pendingFeesByStudent[s.studentId] || 0);
    }, 0);
  }, [filteredStudents, pendingFeesByStudent]);

  const dueStudentsCount = useMemo(() => {
    return filteredStudents.filter(
      (s) => Number(pendingFeesByStudent[s.studentId] || 0) > 0
    ).length;
  }, [filteredStudents, pendingFeesByStudent]);

  const fetchPendingTotalForStudent = useCallback(
    async (studentId) => {
      if (!studentId) return 0;

      setLoadingPendingByStudent((prev) => ({
        ...prev,
        [studentId]: true,
      }));

      try {
        const response = await dispatch(fetchMyFees({ studentId })).unwrap();

        const fees = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        const totalPending = fees.reduce((sum, fee) => {
          if (fee.status === "paid") return sum;
          return sum + Number(fee.dueAmount || 0);
        }, 0);

        setPendingFeesByStudent((prev) => ({
          ...prev,
          [studentId]: totalPending,
        }));

        return totalPending;
      } catch {
        setPendingFeesByStudent((prev) => ({
          ...prev,
          [studentId]: 0,
        }));
        return 0;
      } finally {
        setLoadingPendingByStudent((prev) => ({
          ...prev,
          [studentId]: false,
        }));
      }
    },
    [dispatch]
  );

  const refreshData = useCallback(() => {
    if (!schoolId || !academicYearId) {
      showAlert(
        "warning",
        "Academic Year Required",
        "Please select active academic year first."
      );
      return;
    }

    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));

    dispatch(
      fetchStudentsBySchoolId({
        schoolId,
        academicYearId,
        ...(filterClass && { schoolClassId: filterClass }),
      })
    );
  }, [dispatch, schoolId, academicYearId, filterClass]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!students.length) return;
    const ids = students.map((s) => s.studentId).filter(Boolean);
    Promise.all(ids.map(fetchPendingTotalForStudent));
  }, [students, fetchPendingTotalForStudent]);

  const handleOpenCollectModal = async (record) => {
    if (!record?.studentId) {
      showAlert("error", "Student Not Found", "Student id not found.");
      return;
    }

    const due = Number(pendingFeesByStudent[record.studentId] || 0);

    if (due <= 0) {
      showAlert("info", "No Pending Fee", `${record.name} has no pending fee.`);
      return;
    }

    setSelectedStudent(record);
    setModalVisible(true);
    setLoadingFees(true);
    setSelectedFeeDueAmount(0);
    setStudentFees([]);

    form.resetFields();
    form.setFieldsValue({ paymentMode: "cash" });

    try {
      const response = await dispatch(
        fetchMyFees({ studentId: record.studentId })
      ).unwrap();

      const fees = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const unpaidFees = fees.filter(
        (f) => f.status !== "paid" && Number(f.dueAmount || 0) > 0
      );

      setStudentFees(unpaidFees);

      if (!unpaidFees.length) {
        showAlert("info", "No Pending Fee", "No pending fee found for this student.");
      }
    } catch (err) {
      showAlert("error", "Failed To Fetch Fees", getApiMessage(err));
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleCollectFee = async (values) => {
    try {
      setSubmitting(true);

      await dispatch(
        payStudentFee({
          id: values.studentFeeId,
          payload: {
            paidAmount: Number(values.amount),
            paymentMode: values.paymentMode,
            referenceNo: values.referenceNo || "",
            remarks: values.remarks || "",
          },
        })
      ).unwrap();

      showAlert(
        "success",
        "Fee Collected Successfully",
        `${money(values.amount)} collected from ${selectedStudent?.name || "student"}.`
      );

      if (selectedStudent?.studentId) {
        await fetchPendingTotalForStudent(selectedStudent.studentId);
      }

      setModalVisible(false);
      setSelectedStudent(null);
      setStudentFees([]);
      setSelectedFeeDueAmount(0);
      form.resetFields();

      refreshData();
    } catch (err) {
      showAlert(
        "error",
        "Fee Collection Failed",
        getApiMessage(err, "Fee collection failed.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.regNo} • {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Class",
      key: "class",
      render: (_, record) => (
        <Tag color="blue">
          {record.className} - {record.section}
        </Tag>
      ),
    },
    {
      title: "Fee Status",
      key: "feeStatus",
      render: (_, record) => {
        const id = record.studentId;

        if (loadingPendingByStudent[id]) {
          return (
            <Tag icon={<LoadingOutlined spin />} color="processing">
              Checking
            </Tag>
          );
        }

        const due = Number(pendingFeesByStudent[id] || 0);

        return due > 0 ? (
          <Tag color="red">Pending {money(due)}</Tag>
        ) : (
          <Tag color="green">No Due</Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 160,
      render: (_, record) => {
        const id = record.studentId;
        const due = Number(pendingFeesByStudent[id] || 0);
        const isLoadingDue = Boolean(loadingPendingByStudent[id]);

        return (
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => handleOpenCollectModal(record)}
            disabled={isLoadingDue || due <= 0}
          >
            Collect
          </Button>
        );
      },
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb" }}>
      <Content>
        {alertInfo && (
          <Alert
            type={alertInfo.type}
            showIcon
            closable
            message={alertInfo.message}
            description={alertInfo.description}
            onClose={() => setAlertInfo(null)}
            style={{ marginBottom: 16, borderRadius: 12 }}
          />
        )}

        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            marginBottom: 18,
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size={2}>
                <Title level={3} style={{ margin: 0 }}>
                  Fee Collection
                </Title>
                <Text type="secondary">
                  Accountant panel for collecting pending student fees.
                </Text>
              </Space>
            </Col>

            <Col xs={24} lg={12} style={{ textAlign: "right" }}>
              <Button icon={<ReloadOutlined />} onClick={refreshData}>
                Refresh
              </Button>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc" }}>
                <Statistic
                  title="Students"
                  value={filteredStudents.length}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc" }}>
                <Statistic
                  title="Due Students"
                  value={dueStudentsCount}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc" }}>
                <Statistic
                  title="Total Pending"
                  value={money(totalPendingAmount)}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#f8fafc" }}>
                <Statistic
                  title="Academic Year"
                  value={selectedAcademicYear?.name || "-"}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
          }}
          title={
            <Space>
              Student Fee List
              <Badge count={filteredStudents.length} color="blue" />
            </Space>
          }
        >
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={10}>
              <Input
                placeholder="Search by name, email, registration no."
                prefix={<SearchOutlined />}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} md={8}>
              <Select
                placeholder="Filter by class"
                allowClear
                style={{ width: "100%" }}
                value={filterClass || undefined}
                onChange={(value) => setFilterClass(value || "")}
              >
                {schoolClasses.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name || c.boardClassId?.name || "Unnamed Class"}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={6}>
              <Button block onClick={() => {
                setSearchName("");
                setFilterClass("");
              }}>
                Clear Filters
              </Button>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={filteredStudents}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            rowKey="key"
            scroll={{ x: 900 }}
            locale={{
              emptyText: (
                <Empty description="No students found for selected filters" />
              ),
            }}
          />
        </Card>

        <Modal
          title={
            <Space direction="vertical" size={0}>
              <Text strong>Collect Fee</Text>
              <Text type="secondary">
                {selectedStudent?.name || "-"} • {selectedStudent?.className || "-"} -{" "}
                {selectedStudent?.section || "-"}
              </Text>
            </Space>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedStudent(null);
            setStudentFees([]);
            setSelectedFeeDueAmount(0);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          {loadingFees ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <LoadingOutlined spin /> Loading pending fees...
            </div>
          ) : !studentFees.length ? (
            <Empty description="No pending fee found" />
          ) : (
            <Form form={form} layout="vertical" onFinish={handleCollectFee}>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
                message="Payment Collection"
                description="Select a pending fee head and collect full or partial amount."
              />

              <Form.Item
                label="Pending Fee"
                name="studentFeeId"
                rules={[{ required: true, message: "Please select fee" }]}
              >
                <Select
                  placeholder="Select fee"
                  onChange={(value) => {
                    const fee = studentFees.find(
                      (f) => String(f._id || f.id) === String(value)
                    );
                    const due = Number(fee?.dueAmount || 0);

                    setSelectedFeeDueAmount(due);
                    form.setFieldsValue({ amount: due });
                  }}
                >
                  {studentFees.map((fee) => {
                    const feeId = fee?._id || fee?.id;
                    return (
                      <Option key={feeId} value={feeId}>
                        {fee.feeStructureId?.feeHeadId?.name ||
                          fee.feeStructureId?.name ||
                          "Fee"}{" "}
                        | Due {money(fee.dueAmount)}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                rules={[
                  { required: true, message: "Please enter amount" },
                  {
                    validator: (_, value) => {
                      if (!value || Number(value) <= 0) {
                        return Promise.reject(
                          new Error("Amount must be greater than 0")
                        );
                      }

                      if (
                        selectedFeeDueAmount &&
                        Number(value) > selectedFeeDueAmount
                      ) {
                        return Promise.reject(
                          new Error("Amount cannot be greater than due amount")
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  max={selectedFeeDueAmount || undefined}
                  placeholder="Enter paid amount"
                  addonBefore="₹"
                />
              </Form.Item>

              <Form.Item
                label="Payment Mode"
                name="paymentMode"
                initialValue="cash"
                rules={[{ required: true, message: "Please select payment mode" }]}
              >
                <Select
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Online", value: "online" },
                    { label: "Cheque", value: "cheque" },
                    { label: "Bank Transfer", value: "bank_transfer" },
                    { label: "UPI", value: "upi" },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Reference No." name="referenceNo">
                <Input placeholder="Txn ID / UTR / Cheque No. optional" />
              </Form.Item>

              <Form.Item label="Remarks" name="remarks">
                <Input.TextArea rows={3} placeholder="Optional remarks" />
              </Form.Item>

              <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                <Space>
                  <Button
                    onClick={() => {
                      setModalVisible(false);
                      setSelectedStudent(null);
                      setStudentFees([]);
                      setSelectedFeeDueAmount(0);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<CheckCircleOutlined />}
                  >
                    Collect Payment
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default CollectFees;