import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Select,
  Table,
  Button,
  Modal,
  Form,
  Switch,
  message,
} from "antd";
import { Plus } from "lucide-react";

import { fetchSchools } from "../../../features/schoolSlice.js";
import {
  fetchFeeHeads,
  createFeeHead,
} from "../../../features/headSlice.js";

const { Option } = Select;

const FEE_HEAD_TYPES = [
  "Admission Fee",
  "Tuition Fee",
  "Registration Fee",
  "Transport Fee",
  "Exam Fee",
  "Library Fee",
  "Computer Fee",
  "Hostel Fee",
  "Mess Fee",
  "Sports Fee",
  "Books Fee",
  "Uniform Fee",
  "Fine",
  "Late Fee Fine",
];

const SchoolFeeCategories = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schools = [] } = useSelector((s) => s.school);
  const { feeHeads = [], loading } = useSelector((s) => s.feeHead);
  const { user } = useSelector((state) => state.auth); // ✅ current user

  const [schoolId, setSchoolId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ================= LOAD SCHOOLS ================= */
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  /* ================= SET DEFAULT SCHOOL (CURRENT USER) ================= */
  useEffect(() => {
    if (user?.school?._id) {
      setSchoolId(user.school._id);
    }
  }, [user]);

  /* ================= LOAD FEE HEADS ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchFeeHeads({ schoolId }));
    }
  }, [schoolId, dispatch]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    if (!schoolId) {
      return message.warning("School not selected");
    }
    try {
      setSubmitting(true);
      await dispatch(
        createFeeHead({
          schoolId, // ✅ auto from current user
          name: values.name,
          type: values.type,
          isEditable: values.isEditable,
        })
      ).unwrap();
      message.success("Fee Head Created Successfully");
      setOpenModal(false);
      form.resetFields();
      dispatch(fetchFeeHeads({ schoolId }));
    } catch (err) {
      message.error(err?.message || "Failed to create fee head");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= TABLE ================= */
  const columns = [
    { title: "Fee Head", dataIndex: "name" },
    { title: "Type", dataIndex: "type" },
    {
      title: "Editable",
      render: (r) => (r.isEditable ? "Yes" : "No"),
    },
  ];

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-5 bg-gray-50">
      {/* HEADER */}
      <Card>
        <div className="flex gap-4 items-center">
          <Select
            placeholder="Select School"
            value={schoolId}
            onChange={setSchoolId}
            style={{ width: 260 }}
            disabled={user?.role?.name !== "Super Admin"} // ✅ optional security
          >
            {schools.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            disabled={!schoolId}
            onClick={() => setOpenModal(true)}
          >
            Add Fee Head
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card title="Fee Heads">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feeHeads}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        title="Create Fee Head"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Create"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ isEditable: true }}
        >
          <Form.Item
            name="name"
            label="Fee Head Name"
            rules={[{ required: true, message: "Select fee head" }]}
          >
            <Select placeholder="Select Fee Head">
              {FEE_HEAD_TYPES.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Fee Type"
            rules={[{ required: true, message: "Select fee type" }]}
          >
            <Select placeholder="Select Type">
              <Option value="recurring">Recurring</Option>
              <Option value="one-time">One Time</Option>
              <Option value="penalty">Penalty</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isEditable"
            label="Is Editable?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolFeeCategories;
