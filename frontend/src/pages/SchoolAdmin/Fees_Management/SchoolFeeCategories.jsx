import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";
import { Plus } from "lucide-react";

import { currentUser } from "../../../features/authSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";
import { fetchAllFees, createFee } from "../../../features/feesSlice.js";
import { fetchAllClasses } from "../../../features/classSlice.js";
import { fetchSection } from "../../../features/sectionSlice.js";
 
const { Option } = Select;

const SchoolFeeCategories = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  /* =======================
     REDUX STATE
  ======================= */
  const { user, loading: userLoading } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const { feesList = [], loading } = useSelector((s) => s.fees);
   const { classList = [] } = useSelector((state) => state.class || {});
  const { sections = [] } = useSelector((s) => s.section);
   console.log("sections:", sections);
  /* =======================
     LOCAL STATE
  ======================= */
  const [academicYearId, setAcademicYearId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  /* =======================
     LOAD CURRENT USER
  ======================= */
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  /* =======================
     SCHOOL ID
  ======================= */
  const schoolId = user?.school?._id || user?.schoolId;
  
  /* =======================
     LOAD ACADEMIC YEAR + CLASSES
  ======================= */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchActiveAcademicYear(schoolId));
    dispatch(fetchAllClasses({schoolId}));
  }, [schoolId, dispatch]);

  /* =======================
     SET ACTIVE YEAR
  ======================= */
  useEffect(() => {
    if (activeYear?._id) {
      setAcademicYearId(activeYear._id);
    }
  }, [activeYear]);

  /* =======================
     LOAD FEES (FIXED)
  ======================= */
  useEffect(() => {
    if (schoolId && academicYearId) {
     // dispatch(fetchAllFees({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  /* =======================
     CLASS CHANGE → LOAD SECTIONS
  ======================= */
  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    form.setFieldsValue({ sectionId: undefined });
    dispatch(fetchSection({ schoolId, classId }));
  };

  /* =======================
     SUBMIT FORM (FIXED)
  ======================= */
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      await dispatch(
        createFee({
          schoolId,                 // ✅ REQUIRED
          academicYearId,           // ✅ REQUIRED
          classId: values.classId,
          sectionId: values.sectionId,
          feeName: values.feeName,
          amount: Number(values.amount),
          dueDate: values.dueDate.toISOString(),
        })
      ).unwrap();

      message.success("✅ Fee created successfully");
      setOpenModal(false);
      form.resetFields();

      dispatch(fetchAllFees({ schoolId, academicYearId }));
    } catch (err) {
      message.error(err?.message || "❌ Failed to create fee");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     TABLE COLUMNS
  ======================= */
  const columns = [
    { title: "Class", render: (_, r) => r.classId?.name },
    { title: "Section", render: (_, r) => r.sectionId?.name },
    { title: "Fee Name", dataIndex: "feeName" },
    { title: "Amount", dataIndex: "amount" },
    {
      title: "Due Date",
      render: (_, r) => dayjs(r.dueDate).format("DD MMM YYYY"),
    },
  ];

  if (userLoading) return null;

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 space-y-5 bg-gray-50">
      <Card className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">School Fees</h3>

        <Button
          type="primary"
          icon={<Plus size={18} />}
          disabled={!academicYearId || !schoolId}
          onClick={() => setOpenModal(true)}
        >
          Add Fee
        </Button>
      </Card>

      {Array.isArray(feesList) && feesList.length > 0 && (
        <Card>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={feesList}
            loading={loading}
            pagination={false}
          />
        </Card>
      )}

      {/* =======================
          CREATE FEE MODAL
      ======================= */}
      <Modal
        title="Create Fee"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Create Fee"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="classId"
            label="Class"
            rules={[{ required: true, message: "Class is required" }]}
          >
            <Select placeholder="Select class" onChange={handleClassChange}>
              {classList.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sectionId"
            label="Section"
            rules={[{ required: true, message: "Section is required" }]}
          >
            <Select placeholder="Select section" disabled={!selectedClassId}>
              {sections.map((sec) => (
                <Option key={sec._id} value={sec._id}>
                  {sec.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="feeName"
            label="Fee Name"
            rules={[{ required: true, message: "Fee name is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: "Amount is required" },
              {
                validator: (_, v) =>
                  v > 0
                    ? Promise.resolve()
                    : Promise.reject("Amount must be greater than 0"),
              },
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Due date is required" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolFeeCategories;
