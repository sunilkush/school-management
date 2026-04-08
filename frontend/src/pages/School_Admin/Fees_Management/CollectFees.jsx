import React, { useEffect, useMemo, useState } from "react";
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

  const handleOpenCollectModal = async (record) => {
    if (!record?.studentId) {
      message.warning("Student id not found");
      return;
    }
     setSelectedStudent(record);
    setModalVisible(true);
    setLoadingFees(true);
    form.resetFields();
     try {
      const fees = await dispatch(fetchMyFees(record.studentId)).unwrap();
      const unpaidFees = (fees || []).filter(
        (fee) => fee.status !== "paid" && Number(fee.dueAmount || 0) > 0
      );
      setStudentFees(unpaidFees);
      if (!unpaidFees.length) {
        message.info("No pending fee found for this student");
      }
    } catch (err) {
      message.error(err?.message || "Unable to fetch student fees");
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
      setModalVisible(false);
      setSelectedStudent(null);
      setStudentFees([]);
      form.resetFields();
    } catch (err) {
      message.error(err?.message || "Fee collection failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchName.toLowerCase()) &&
       (filterClass ? student.classId === filterClass : true)
  );

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Class", dataIndex: "className", key: "className" },
    { title: "Section", dataIndex: "section", key: "section" },
   
    {
      title: "Actions",
      key: "actions",
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
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Finance</Breadcrumb.Item>
        <Breadcrumb.Item>Collect Fees</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Filters */}
        <div style={{ marginBottom: 16, display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by student name"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by class"
            style={{ width: 150 }}
            allowClear
             value={filterClass || undefined}
            onChange={(value) => setFilterClass(value)}
          >
            {schoolClasses.map((schoolClass) => (
              <Option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Students Table */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />

        {/* Collect Fee Modal */}
        <Modal
          title={`Collect Fee for ${selectedStudent?.name}`}
           open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedStudent(null);
             setStudentFees([]);
            form.resetFields();
          }}
          footer={null}
             destroyOnHidden
        >
           {loadingFees ? (
            <div className="py-8 text-center">
              <LoadingOutlined spin /> Loading fees...
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleCollectFee}>
              <Form.Item
                label="Pending Fee"
                name="studentFeeId"
                rules={[{ required: true, message: "Select pending fee" }]}
              >
                <Select placeholder="Select pending fee">
                  {studentFees.map((fee) => (
                    <Option key={fee._id} value={fee._id}>
                      {fee.feeStructureId?.feeHeadId?.name || "Fee"} | Due ₹
                      {fee.dueAmount} |{" "}
                      <Tag color={fee.status === "partial" ? "orange" : "red"}>
                        {fee.status}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{ required: true, message: "Enter fee amount" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Enter amount"
                min={0}
                prefix="₹"
              />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedStudent(null);
                     setStudentFees([]);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                 <Button
                  type="primary"
                  htmlType="submit"
                  icon={<DollarOutlined />}
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
