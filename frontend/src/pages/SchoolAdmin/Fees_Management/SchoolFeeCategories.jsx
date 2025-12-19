import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Select, Table, Button, Modal, Form, Input, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { Plus } from "lucide-react";

import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { fetchAllFees, createFee } from "../../../features/feesSlice";
import { currentUser } from "../../../features/authSlice";

const { Option } = Select;

const SchoolFeeCategories = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schools } = useSelector((s) => s.school);
  const { user, loading: userLoading } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const { feesList = [], loading } = useSelector((s) => s.fees);

  const [schoolId, setSchoolId] = useState(null);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  /* =========================
     LOAD CURRENT USER
  ========================= */
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  /* =========================
     ROLE BASED SCHOOL SETUP
  ========================= */
  useEffect(() => {
    if (!user) return;

    // School Admin → auto school
    if (user.role?.name === "School Admin") {
      setSchoolId(user.school?._id || user.schoolId);
      dispatch(fetchActiveAcademicYear(user.school?._id || user.schoolId));
    }

    // Super Admin → load schools list
    if (user.role?.name === "Super Admin") {
      dispatch(fetchSchools());
    }
  }, [user, dispatch]);

  /* =========================
     ACADEMIC YEAR SET
  ========================= */
  useEffect(() => {
    if (activeYear?._id) {
      setAcademicYearId(activeYear._id);
    }
  }, [activeYear]);

  /* =========================
     SCHOOL CHANGE (SUPER ADMIN)
  ========================= */
  const handleSchoolChange = (id) => {
    setSchoolId(id);
    setAcademicYearId(null);
    dispatch(fetchActiveAcademicYear(id));
  };

  /* =========================
     LOAD FEES
  ========================= */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchAllFees({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      await dispatch(
        createFee({
          schoolId,
          academicYearId,
          feeName: values.feeName,
          amount: values.amount,
          dueDate: values.dueDate.toISOString(),
        })
      ).unwrap();

      message.success("✅ Fee Created");
      setOpenModal(false);
      form.resetFields();

      dispatch(fetchAllFees({ schoolId, academicYearId }));
    } catch (err) {
      console.error(err);
      message.error("❌ Failed to create fee");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     TABLE
  ========================= */
  const columns = [
    { title: "Fee Name", dataIndex: "feeName" },
    { title: "Amount", dataIndex: "amount" },
    {
      title: "Due Date",
      render: (r) => dayjs(r.dueDate).format("DD MMM YYYY"),
    },
  ];

  if (userLoading) return null;

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6 space-y-5 bg-gray-50">
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          {user?.role?.name === "Super Admin" && (
            <Select
              placeholder="Select School"
              value={schoolId}
              onChange={handleSchoolChange}
            >
              {schools?.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          )}

          <Select disabled value={academicYearId}>
            {activeYear && (
              <Option value={activeYear._id}>{activeYear.name}</Option>
            )}
          </Select>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            disabled={!schoolId || !academicYearId}
            onClick={() => setOpenModal(true)}
          >
            Add Fees
          </Button>
        </div>
      </Card>

      <Card title="School Fees">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feesList}
          loading={loading}
        />
      </Card>
        {console.log(feesList)}
      <Modal
        title="Create School Fee"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Create Fee"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="feeName" label="Fee Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolFeeCategories;
