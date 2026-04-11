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
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";

const { Content } = Layout;
const { Option } = Select;

const CollectFees = () => {
  const dispatch = useDispatch();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();

  const [searchName, setSearchName] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const [loadingFees, setLoadingFees] = useState(false);
  const [studentFees, setStudentFees] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [pendingFeesByStudent, setPendingFeesByStudent] = useState({});
  const [loadingPendingByStudent, setLoadingPendingByStudent] = useState({});
  const [selectedFeeDueAmount, setSelectedFeeDueAmount] = useState(0);

  const { user } = useSelector((s) => s.auth);
  const { schoolStudents = [] } = useSelector((s) => s.students);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId }));
  }, [dispatch, schoolId]);

  const students = useMemo(
    () =>
      schoolStudents.map((s) => ({
        key: s._id,
        studentId: s.student?._id,
        name: s.user?.name || "-",
        className: s.class?.name || "-",
        classId: s.class?._id,
        section: s.section?.name || "-",
      })),
    [schoolStudents]
  );

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
          payload: { paidAmount: Number(values.amount) },
        })
      ).unwrap();

      message.success(`Fee collected for ${selectedStudent?.name}`);

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

  const filteredStudents = students.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchName.toLowerCase()) &&
      (filterClass ? s.classId === filterClass : true)
  );

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Class", dataIndex: "className" },
    { title: "Section", dataIndex: "section" },
    {
      title: "Pending Fee",
      render: (_, record) => {
        const id = record.studentId;

        if (loadingPendingByStudent[id]) {
          return <LoadingOutlined spin />;
        }

        const due = Number(pendingFeesByStudent[id] || 0);

        return due > 0 ? (
          <Tag color="red">₹{due}</Tag>
        ) : (
          <Tag color="green">No Due</Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => handleOpenCollectModal(record)}
        >
          Collect Fee
        </Button>
      ),
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
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search student"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchName(e.target.value)}
          />

          <Select
            placeholder="Filter by class"
            allowClear
            style={{ width: 200 }}
            onChange={setFilterClass}
          >
            {schoolClasses.map((c) => (
              <Option key={c._id} value={c._id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredStudents}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />

        <Modal
          title={`Collect Fee for ${selectedStudent?.name}`}
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
            <div className="text-center py-6">
              <LoadingOutlined spin /> Loading...
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleCollectFee}>
              <Form.Item
                label="Pending Fee"
                name="studentFeeId"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select fee"
                  onChange={(value) => {
                    const fee = studentFees.find((f) => f._id === value);
                    const due = Number(fee?.dueAmount || 0);

                    setSelectedFeeDueAmount(due);
                    form.setFieldsValue({ amount: due });
                  }}
                >
                  {studentFees.map((fee) => (
                    <Option key={fee._id} value={fee._id}>
                      {fee.feeStructureId?.feeHeadId?.name || "Fee"} | ₹
                      {fee.dueAmount}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={selectedFeeDueAmount || undefined}
                />
              </Form.Item>

              <Form.Item style={{ textAlign: "right" }}>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>
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