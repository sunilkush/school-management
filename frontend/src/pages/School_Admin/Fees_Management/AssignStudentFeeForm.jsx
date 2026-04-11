import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Select,
  Radio,
  Button,
  Table,
  InputNumber,
  message,
  Typography,
} from "antd";
import { useDispatch, useSelector } from "react-redux";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";

import { currentUser } from "../../../features/authSlice";
import { fetchFeeStructures } from "../../../features/feeStructureSlice";
import { assignFeesToStudents } from "../../../features/studentFeeSlice";

const { Option } = Select;
const { Text } = Typography;

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
  const { feeStructures = [], loading } = useSelector((s) => s.feeStructure);

  const schoolId = user?.school?._id;

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchStudentsBySchoolId({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId }));
  
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (selectedAcademicYear?._id) {
      form.setFieldsValue({
        academicYearId: selectedAcademicYear._id,
      });
    }
  }, [selectedAcademicYear, form]);

  const selectedStudentId = Form.useWatch("studentId", form);
  const selectedClassId = Form.useWatch("schoolClassId", form);
  const academicYearId = Form.useWatch("academicYearId", form);

  const selectedStudent = useMemo(
    () => schoolStudents.find((s) => s._id === selectedStudentId),
    [schoolStudents, selectedStudentId]
  );

  const effectiveClassId =
    mode === "single"
      ? selectedStudent?.class?._id || selectedStudent?.classId
      : selectedClassId;

  useEffect(() => {
    if (!schoolId || !academicYearId || !effectiveClassId) {
      return;
    }

    dispatch(
      fetchFeeStructures({
        schoolId,
        academicYearId,
        schoolClassId: effectiveClassId,
      })
    );
  }, [dispatch, schoolId, academicYearId, effectiveClassId]);

  useEffect(() => {
    setSelectedFeeIds((prev) =>
      prev.filter((id) => feeStructures.some((fee) => fee._id === id))
    );
  }, [feeStructures]);

  const rowSelection = {
    selectedRowKeys: selectedFeeIds,
    onChange: (keys) => setSelectedFeeIds(keys),
  };

  const columns = [
    {
      title: "Fee Head",
      render: (_, r) => r.feeHeadId?.name,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      render: (value) => value?.toUpperCase(),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`,
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

  const onFinish = async (values) => {
    try {
      if (!selectedFeeIds.length) {
        return message.warning("Please select at least one fee structure");
      }

      const payloadBase = {
        academicYearId: values.academicYearId,
        schoolId: schoolId,
      };

      if (mode === "single") {
        payloadBase.studentId = values.studentId;
      }

      if (mode === "bulk") {
        const studentIds = schoolStudents
          .filter((s) => (s.class?._id || s.classId) === values.schoolClassId)
          .map((s) => s._id);

        if (!studentIds.length) {
          return message.warning("No students found in selected class");
        }

        payloadBase.studentIds = studentIds;
      }

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
      setMode("bulk");
    } catch (err) {
      message.error(err?.message || "Failed to assign fee");
    }
  };

  return (
    <Card title="Assign Fees to Student">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Assignment Mode">
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value="bulk">Bulk (Class Wise)</Radio>
            <Radio value="single">Single Student</Radio>
          </Radio.Group>
        </Form.Item>

        {mode === "single" && (
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: "Please select student" }]}
          >
            <Select placeholder="Select Student" showSearch optionFilterProp="children">
              {schoolStudents.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.user?.name} ({s.class?.name || "-"}-{s.section?.name || "-"})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

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

        <Form.Item
          name="academicYearId"
          label="Academic Year"
          rules={[{ required: true, message: "Please select academic year" }]}
        >
          <Select placeholder="Select Academic Year">
            {selectedAcademicYear?._id && (
              <Option key={selectedAcademicYear._id} value={selectedAcademicYear._id}>
                {selectedAcademicYear.name || selectedAcademicYear.year}
              </Option>
            )}
          </Select>
        </Form.Item>

        {!effectiveClassId && (
          <Text type="secondary">Select class/student to load fee structures.</Text>
        )}

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feeStructures}
          rowSelection={rowSelection}
          pagination={false}
          loading={loading}
          locale={{ emptyText: "No fee structure found for selected class and academic year" }}
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