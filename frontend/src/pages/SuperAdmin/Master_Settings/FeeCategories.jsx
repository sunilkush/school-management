import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Card,
  Select,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
} from "antd";

import { Plus } from "lucide-react";
import dayjs from "dayjs";

import {
  fetchAllFees,
  deleteFees,
  createFee,
} from "../../../features/feesSlice";

import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";

const { Option } = Select;

const FeesCategories = () => {

  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schools = [] } = useSelector((s) => s.school);
  const { activeYear } = useSelector((s) => s.academicYear);
  const { feesList: rawFees = [], loading } = useSelector((s) => s.fees);

const feesList = Array.isArray(rawFees)
  ? rawFees
  : rawFees?.data || [];

  const { schoolStudents = [] } = useSelector((s) => s.students);
  console.log("schoolStudents:", schoolStudents);
  const [schoolId, setSchoolId] = useState(null);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  /* ======================
       LOAD SCHOOLS
  ====================== */
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);


  /* ======================
       SCHOOL CHANGE
  ====================== */
  const handleSchoolChange = (id) => {
    setSchoolId(id);
    setAcademicYearId(null);

    dispatch(fetchActiveAcademicYear(id));
  };


  /* ======================
        SET ACTIVE YEAR
  ====================== */
  useEffect(() => {
    if (activeYear?._id) {
      setAcademicYearId(activeYear._id);
    }
  }, [activeYear]);


  /* ======================
    LOAD FEES + STUDENTS
  ====================== */
  useEffect(() => {

    if (!schoolId || !academicYearId) return;

    dispatch(fetchAllFees({ schoolId, academicYearId }));
    
    if (schoolId) {
    dispatch(
      fetchStudentsBySchoolId({
        schoolId,
        academicYearId // ya leave undefined
      })
    );
  }

  }, [dispatch, schoolId, academicYearId]);


  /* ======================
        TABLE COLUMNS
  ====================== */
  const columns = [
    {
      title: "Student",
      render: (r) => r?.studentId?.name || "-",
    },
    {
      title: "Amount ₹",
      dataIndex: "amount",
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
    },
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
    },
    {
      title: "Due Date",
      render: (r) =>
        r?.dueDate ? dayjs(r.dueDate).format("DD MMM YYYY") : "-",
    },
    {
      title: "Status",
      render: (r) => (
        <Tag color={r.status === "paid" ? "green" : "orange"}>
          {r?.status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (r) => (
        <Button
          danger
          size="small"
          loading={loading}
          onClick={() => dispatch(deleteFees(r._id))}
        >
          Delete
        </Button>
      ),
    },
  ];


  /* ======================
        SUMMARY
  ====================== */
const paidTotal = feesList.filter(f => f.status === "paid")
  .reduce((a,b)=>a + (b.amount || 0), 0);

const pendingTotal = Array.isArray(feesList)
  ? feesList.filter((f) => f.status === "pending")
      .reduce((a, b) => a + (b.amount || 0), 0)
  : 0;

const total = paidTotal + pendingTotal;



  /* ======================
          SUBMIT
  ====================== */
const handleSubmit = async (values) => {
  try {
    setSubmitting(true);

    await dispatch(
      createFee({
        academicYearId: values.academicYearId,
        studentId: values.studentId,   // ✅ enough to derive all info
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        transactionId: values.transactionId,
        status: values.status,
        dueDate: values.dueDate.toISOString(),
      })
    ).unwrap();

    message.success("✅ Fee added successfully");

    setOpenModal(false);
    form.resetFields();

    // ✅ reload via selected filters
    dispatch(fetchAllFees({ schoolId, academicYearId }));

  } catch (err) {
    message.error(err || "❌ Failed to add fee");
  } finally {
    setSubmitting(false);
  }
};


  /* ======================
            UI
  ====================== */
  return (

    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* -------------- FILTERS -------------- */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Select
            placeholder="Select School"
            value={schoolId}
            onChange={handleSchoolChange}
          >
            {schools.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Select disabled value={academicYearId}>
            <Option value={academicYearId}>
              Active Academic Year
            </Option>
          </Select>

          <Button
            type="primary"
            icon={<Plus />}
            disabled={!schoolId || !academicYearId}
            onClick={() => setOpenModal(true)}
          >
            Add New Fee
          </Button>

        </div>
      </Card>


      {/* -------------- SUMMARY -------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card>
          Total Fees
          <h2 className="text-xl font-bold">₹ {total}</h2>
        </Card>

        <Card>
          Paid
          <h2 className="text-xl text-green-600 font-bold">
            ₹ {paidTotal}
          </h2>
        </Card>

        <Card>
          Pending
          <h2 className="text-xl text-orange-500 font-bold">
            ₹ {pendingTotal}
          </h2>
        </Card>

      </div>


      {/* -------------- TABLE -------------- */}
      <Card title="Fees Records">
        <Table
        rowKey="_id"
        columns={columns}
        dataSource={feesList}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      </Card>


      {/* -------------- MODAL -------------- */}
      <Modal
        title="Add New Fee"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Save Fee"
      >

        <Form layout="vertical" form={form} onFinish={handleSubmit}>

          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true }]}
          >
          
            <Select placeholder="Select Student">
              {schoolStudents.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s?.userDetails?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Fee Amount"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Razorpay">Razorpay</Option>
              <Option value="Stripe">Stripe</Option>
              <Option value="PayPal">PayPal</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="transactionId"
            label="Transaction ID"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="status"
            label="Payment Status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

        </Form>

      </Modal>

    </div>
  );
};

export default FeesCategories;
