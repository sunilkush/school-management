import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Select,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
} from "antd";
import { Plus } from "lucide-react";

import { fetchAllClasses } from "../../../features/classSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";
import { fetchFeeHeads } from "../../../features/headSlice.js";
import { currentUser } from "../../../features/authSlice.js";
import {
  fetchFeeStructures,
  createFeeStructure,
} from "../../../features/feeStructureSlice.js";

const { Option } = Select;

const FeeStructure = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

   const { classList = [] } = useSelector((state) => state.class || {});
  const { academicYears } = useSelector((s) => s.academicYear);
 const { feeHeads = []} = useSelector((s) => s.feeHead);
  const { feeStructures, loading } = useSelector(
    (s) => s.feeStructure
  ); 
   const {user} = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const schoolId = user?.school?._id ;
  /* ================= LOAD DATA ================= */
  useEffect(() => {
    dispatch(fetchAllClasses());
    dispatch(fetchActiveAcademicYear(schoolId));
    dispatch(fetchFeeHeads({ schoolId }));
    dispatch(fetchFeeStructures());
    dispatch(currentUser());
  }, [dispatch,schoolId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    try {
      await dispatch(createFeeStructure({ ...values, schoolId })).unwrap();

      message.success("Fee Structure Created");
      setOpen(false);
      form.resetFields();

      dispatch(fetchFeeStructures());
    } catch (err) {
      message.error(err || "Duplicate fee structure already exists");
    }
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Class",
      render: (r) => r.classId?.name,
    },
    {
      title: "Academic Year",
      render: (r) => r.academicYearId?.name,
    },
    {
      title: "Fee Head",
      render: (r) => r.feeHeadId?.name,
    },
    {
      title: "Amount",
      dataIndex: "amount",
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      render: (v) => v.toUpperCase(),
    },
  ];

  /* ================= UI ================= */
  return (
    <div className="p-6 bg-gray-50 space-y-5">
      <Card>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => setOpen(true)}
        >
          Add Fee Structure
        </Button>
      </Card>

      <Card title="Fee Structure List">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feeStructures}
          loading={loading}
        />
      </Card>

      {/* ================= MODAL ================= */}
      <Modal
        title="Create Fee Structure"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="classId"
            label="Class"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Class">
              {classList?.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="academicYearId"
            label="Academic Year"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Academic Year">
              {academicYears?.map((y) => (
                <Option key={y._id} value={y._id}>
                  {y.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="feeHeadId"
            label="Fee Head"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Fee Head">
              {feeHeads?.map((f) => (
                <Option key={f._id} value={f._id}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="Enter amount"
            />
          </Form.Item>

          <Form.Item
            name="frequency"
            label="Frequency"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Frequency">
              <Option value="monthly">Monthly</Option>
              <Option value="quarterly">Quarterly</Option>
              <Option value="yearly">Yearly</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeStructure;
