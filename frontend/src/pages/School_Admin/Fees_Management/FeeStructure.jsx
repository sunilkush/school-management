import React, { useEffect, useMemo, useState } from "react";
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
  Space,
} from "antd";
import { Plus } from "lucide-react";

import { fetchSchoolClasses } from "../../../features/schoolClassSlice";

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

  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  
  const { feeHeads = [] } = useSelector((s) => s.feeHead);
  const { feeStructures, loading } = useSelector((s) => s.feeStructure);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const academicYearId = selectedAcademicYear?._id;
  const schoolId = user?.school?._id;
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    schoolClassId: undefined,
    academicYearId: undefined,
  });

  const feeStructureQuery = useMemo(
    () => ({
      schoolId,
      ...(filters.schoolClassId ? { schoolClassId: filters.schoolClassId } : {}),
      ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
    }),
    [schoolId, filters.schoolClassId, filters.academicYearId]
  );

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchSchoolClasses({ schoolId }));
   
    dispatch(fetchFeeHeads({ schoolId }));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchFeeStructures(feeStructureQuery));
  }, [dispatch, schoolId, feeStructureQuery]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(createFeeStructure({ ...values, schoolId, academicYearId})).unwrap();

      message.success("Fee Structure Created");
      setOpen(false);
      form.resetFields();

      dispatch(fetchFeeStructures(feeStructureQuery));
    } catch (err) {
      message.error(err || "Duplicate fee structure already exists");
    }
  };

  const columns = [
    {
      title: "Class",
      render: (r) => r.schoolClassId?.name || "-",
    },
    {
      title: "Academic Year",
      render: (r) => r.academicYearId?.name || "-",
    },
    {
      title: "Fee Head",
      render: (r) => r.feeHeadId?.name || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      render: (v) => (v ? v.toUpperCase() : "-"),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 space-y-5">
      <Card>
        <Space wrap className="w-full justify-between">
          <Space wrap>
            <Select
              allowClear
              style={{ minWidth: 220 }}
              placeholder="Filter by class"
              value={filters.schoolClassId}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, schoolClassId: value }))
              }
            >
              {schoolClasses?.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>

            
          </Space>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => setOpen(true)}
          >
            Add Fee Structure
          </Button>
        </Space>
      </Card>

      <Card title="Fee Structure List">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feeStructures}
          loading={loading}
        />
      </Card>

      <Modal
        title="Create Fee Structure"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="schoolClassId"
            label="Class"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Class">
              {schoolClasses?.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
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
            <InputNumber className="w-full" min={0} placeholder="Enter amount" />
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