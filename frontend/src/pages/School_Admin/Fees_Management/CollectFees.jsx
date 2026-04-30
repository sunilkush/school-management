import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Input,
  Select,
  Button,
  Modal,
  Form,
  InputNumber,
  Space,
  message,
  Tag,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";

const { Content } = Layout;
const { Option } = Select;

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


  const { schoolStudents = [] } = useSelector((s) => s.students || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});







   const students = useMemo(() => {
    const getId = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      return value?._id || value?.id || "";
    };

    return schoolStudents.map((s) => {
      const studentId = getId(s.student) || getId(s.studentId) || getId(s.user) || getId(s);
      const classObj = s.class || s.schoolClass || s.schoolClassId || {};
      const classId = getId(classObj) || getId(s.classId) || getId(s.schoolClassId);

      return {
        key: s._id || studentId,
        studentId,
        name: s.user?.name || s.name || "-",
        className: classObj?.name || s.className || "-",
        classId,
        section: s.section?.name || s.sectionName || "-",
      };
    });
  }, [schoolStudents]);

  const fetchPendingTotalForStudent = useCallback(
    async (studentId) => {
      if (!studentId) return 0;

      setLoadingPendingByStudent((prev) => ({
        ...prev,
        [studentId]: true,
      }));

      try {
        const fees = await dispatch(fetchMyFees({ studentId })).unwrap();

        const totalPending = (fees || []).reduce((sum, fee) => {
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

  useEffect(() => {
    if (!students.length) return;

    const ids = students.map((s) => s.studentId).filter(Boolean);

    Promise.all(ids.map(fetchPendingTotalForStudent));
  }, [students, fetchPendingTotalForStudent]);

  const handleOpenCollectModal = async (record) => {
    if (!record?.studentId) {
      message.warning("Student id not found");
      return;
    }

    setSelectedStudent(record);
    setModalVisible(true);
    setLoadingFees(true);
    setSelectedFeeDueAmount(0);
    form.resetFields();

    try {
      const fees = await dispatch(
        fetchMyFees({ studentId: record.studentId })
      ).unwrap();

      const unpaidFees = (fees || []).filter(
        (f) => f.status !== "paid" && Number(f.dueAmount || 0) > 0
      );

      setStudentFees(unpaidFees);

      if (!unpaidFees.length) {
        message.info("No pending fee found");
      }
    } catch (err) {
      message.error(err?.message || "Failed to fetch fees");
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
          },
        })
      ).unwrap();

      message.success(`Fee collected for ${selectedStudent?.name || "student"}`);

      if (selectedStudent?.studentId) {
        await fetchPendingTotalForStudent(selectedStudent.studentId);
      }

      setModalVisible(false);
      setSelectedStudent(null);
      setStudentFees([]);
      setSelectedFeeDueAmount(0);
      form.resetFields();

    
    } catch (err) {
      message.error(err?.message || "Fee collection failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchName = (s.name || "")
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const matchClass = filterClass ? s.classId === filterClass : true;
 // Fee collection page par sirf wahi students dikhaye jin ki fee assigned/pending ho
      const dueAmount = Number(pendingFeesByStudent[s.studentId] || 0);
      const hasAssignedPendingFee = dueAmount > 0;

      return matchName && matchClass && hasAssignedPendingFee;
    });
   }, [students, searchName, filterClass, pendingFeesByStudent]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Class",
      dataIndex: "className",
    },
    {
      title: "Section",
      dataIndex: "section",
    },
    {
      title: "Pending Fee",
      render: (_, record) => {
        const id = record.studentId;

        if (loadingPendingByStudent[id]) {
          return <LoadingOutlined spin />;
        }

        const due = Number(pendingFeesByStudent[id] || 0);

        return due > 0 ? (
          <Tag color="red">₹{due.toLocaleString("en-IN")}</Tag>
        ) : (
          <Tag color="green">No Due</Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => {
        const id = record.studentId;
        const due = Number(pendingFeesByStudent[id] || 0);
        const isLoadingDue = Boolean(loadingPendingByStudent[id]);
        const isCollectDisabled = isLoadingDue || due <= 0;

        return (
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => handleOpenCollectModal(record)}
            disabled={isCollectDisabled}
          >
            Collect Fee
          </Button>
        );
      },
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Finance</Breadcrumb.Item>
        <Breadcrumb.Item>Collect Fees</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search student"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />

          <Select
            placeholder="Filter by class"
            allowClear
            style={{ width: 220 }}
            value={filterClass || undefined}
            onChange={(value) => setFilterClass(value || "")}
          >
            {schoolClasses.map((c) => (
              <Option key={c._id} value={c._id}>
                {c.name || c.boardClassId?.name || "Unnamed Class"}
              </Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredStudents}
          pagination={{ pageSize: 5 }}
          rowKey="key"
          scroll={{ x: 800 }}
        />

        <Modal
          title={`Collect Fee for ${selectedStudent?.name || "-"}`}
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
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <LoadingOutlined spin /> Loading...
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleCollectFee}>
              <Form.Item
                label="Pending Fee"
                name="studentFeeId"
                rules={[{ required: true, message: "Please select fee" }]}
              >
                <Select
                  placeholder="Select fee"
                  onChange={(value) => {
                    const fee = studentFees.find((f) => String(f._id || f.id) === String(value));
                    const due = Number(fee?.dueAmount || 0);

                    setSelectedFeeDueAmount(due);
                    form.setFieldsValue({ amount: due });
                  }}
                >
                   {studentFees.map((fee) => {
                    const feeId = fee?._id || fee?.id;
                    return (
                    <Option key={feeId} value={feeId}>
                      {fee.feeStructureId?.feeHeadId?.name || "Fee"} | ₹
                      {Number(fee.dueAmount || 0).toLocaleString("en-IN")}
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
                        return Promise.reject("Amount must be greater than 0");
                      }

                      if (
                        selectedFeeDueAmount &&
                        Number(value) > selectedFeeDueAmount
                      ) {
                        return Promise.reject(
                          "Amount cannot be greater than due amount"
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
                />
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
                    disabled={!studentFees.length}
                  >
                    Collect
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