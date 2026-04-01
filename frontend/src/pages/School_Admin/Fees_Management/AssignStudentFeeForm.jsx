import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Select,
  Radio,
  Button,
  Table,
  InputNumber,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { currentUser } from "../../../features/authSlice";
import { fetchFeeStructures } from "../../../features/feeStructureSlice";
import { assignFeesToStudents } from "../../../features/studentFeeSlice";

const { Option } = Select;

const AssignStudentFee = () => {
  const [form] = Form.useForm();
  const [mode, setMode] = useState("bulk");
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});

  const dispatch = useDispatch();

  const { schoolStudents = [] } = useSelector((s) => s.students);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { user } = useSelector((s) => s.auth);
  const { feeStructures = [] } = useSelector((s) => s.feeStructure);

  const schoolId = user?.school?._id;

  /* 🔹 Load user */
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  /* 🔹 Load required data */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchStudentsBySchoolId({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId }));
    dispatch(fetchActiveAcademicYear(schoolId));
    dispatch(fetchFeeStructures({ schoolId }));
  }, [dispatch, schoolId]);

  /* 🔹 Auto-fill Academic Year */
  useEffect(() => {
    if (selectedAcademicYear?._id) {
      form.setFieldsValue({
        academicYearId: selectedAcademicYear._id,
      });
    }
  }, [selectedAcademicYear, form]);

  /* 🔹 Fee selection */
  const rowSelection = {
    selectedRowKeys: selectedFeeIds,
    onChange: (keys) => setSelectedFeeIds(keys),
  };

  /* 🔹 Table Columns */
  const columns = [
    {
      title: "Fee Head",
      render: (_, r) => r.feeHeadId?.name,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
    },
    {
      title: "Amount",
      dataIndex: "amount",
    },
    {
      title: "Custom Amount",
      render: (_, record) => (
        <InputNumber
          min={0}
          placeholder="Optional"
          style={{ width: "100%" }}
          value={customAmounts[record._id]}
          onChange={(val) =>
            setCustomAmounts((prev) => ({
              ...prev,
              [record._id]: val,
            }))
          }
        />
      ),
    },
  ];

  /* 🔥 FINAL SUBMIT */
  const onFinish = async (values) => {
    try {
      if (!selectedFeeIds.length) {
        return message.warning("Please select at least one fee structure");
      }

      let payloadBase = {
        academicYearId: values.academicYearId,
        schoolId,
      };

      // 🔹 SINGLE MODE
      if (mode === "single") {
        payloadBase.studentId = values.studentId;
      }

      // 🔹 BULK MODE
      if (mode === "bulk") {
        const studentIds = schoolStudents
          .filter(
            (s) => (s.class?._id || s.classId) === values.schoolClassId
          )
          .map((s) => s._id);

        if (!studentIds.length) {
          return message.warning("No students found in selected class");
        }

        payloadBase.studentIds = studentIds;
      }

      // 🔹 Assign fees
      for (const feeStructureId of selectedFeeIds) {
        await dispatch(
          assignFeesToStudents({
            ...payloadBase,
            feeStructureId,
            customAmount: customAmounts[feeStructureId] || null,
          })
        ).unwrap();
      }

      message.success("Fees assigned successfully");
      form.resetFields();
      setSelectedFeeIds([]);
      setCustomAmounts({});
    } catch (err) {
      message.error(err?.message || "Failed to assign fee");
    }
  };

  return (
    <Card title="Assign Fees to Student">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* MODE */}
        <Form.Item label="Assignment Mode">
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value="bulk">Bulk (Class Wise)</Radio>
            <Radio value="single">Single Student</Radio>
          </Radio.Group>
        </Form.Item>

        {/* SINGLE */}
        {mode === "single" && (
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: "Please select student" }]}
          >
            <Select placeholder="Select Student">
              {schoolStudents.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.user?.name} ({s.class?.name}-{s.section?.name})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* BULK */}
        {mode === "bulk" && (
          <Form.Item
            name="schoolClassId"
            label="Class"
            rules={[{ required: true, message: "Please select class" }]}
          >
            <Select placeholder="Select Class">
              {schoolClasses.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* ACADEMIC YEAR */}
        <Form.Item
          name="academicYearId"
          label="Academic Year"
          rules={[{ required: true, message: "Please select academic year" }]}
        >
          <Select placeholder="Select Academic Year">
            {selectedAcademicYear?._id && (
              <Option
                key={selectedAcademicYear._id}
                value={selectedAcademicYear._id}
              >
                {selectedAcademicYear.name || selectedAcademicYear.year}
              </Option>
            )}
          </Select>
        </Form.Item>

        {/* FEES TABLE */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feeStructures}
          rowSelection={rowSelection}
          pagination={false}
        />

        <Button
          type="primary"
          htmlType="submit"
          style={{ marginTop: 16 }}
          disabled={!selectedFeeIds.length}
        >
          Assign Fee
        </Button>
      </Form>
    </Card>
  );
};

export default AssignStudentFee;