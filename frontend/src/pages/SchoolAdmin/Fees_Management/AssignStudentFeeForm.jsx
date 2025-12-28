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
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { currentUser } from "../../../features/authSlice";
import { fetchFeeStructures } from "../../../features/feeStructureSlice";
import { assignFeesToStudents } from "../../../features/studentFeeSlice";

const { Option } = Select;

const AssignStudentFee = () => {
  const [form] = Form.useForm();
  const [mode, setMode] = useState("bulk");
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);

  const dispatch = useDispatch();

  const { schoolStudents = [] } = useSelector((s) => s.students);
  const { classList = [] } = useSelector((s) => s.class || {});
  const { academicYears = [] } = useSelector((s) => s.academicYear);
  const { user } = useSelector((s) => s.auth);
  const { feeStructures = [] } = useSelector((s) => s.feeStructure);

  const schoolId = user?.school?._id;

  /* 🔹 Load logged-in user */
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  /* 🔹 Load required data */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchStudentsBySchoolId({ schoolId }));
    dispatch(fetchAllClasses({ schoolId }));
    dispatch(fetchActiveAcademicYear(schoolId));
    dispatch(fetchFeeStructures({ schoolId }));
  }, [dispatch, schoolId]);

  /* 🔹 Fee table selection */
  const rowSelection = {
    selectedRowKeys: selectedFeeIds,
    onChange: (keys) => setSelectedFeeIds(keys),
  };

  /* 🔹 Fee Table Columns */
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
      render: () => (
        <InputNumber min={0} placeholder="Optional" style={{ width: "100%" }} />
      ),
    },
  ];

  /* 🔥 FINAL SUBMIT (Single + Bulk API aligned) */
  const onFinish = async (values) => {
    try {
      if (!selectedFeeIds.length) {
        return message.warning("Please select at least one fee structure");
      }

      let payloadBase = {
        academicYearId: values.academicYearId,
        schoolId,
      };

      // 🔹 SINGLE STUDENT
      if (mode === "single") {
        payloadBase.studentId = values.studentId;
      }

      // 🔹 BULK (Class-wise)
      if (mode === "bulk") {
        const studentIds = schoolStudents
          .filter((s) => s.class?._id === values.classId)
          .map((s) => s._id);

        if (!studentIds.length) {
          return message.warning("No students found in selected class");
        }

        payloadBase.studentIds = studentIds;
      }

      // 🔹 Assign each selected FeeStructure
      for (const feeStructureId of selectedFeeIds) {
        await dispatch(
          assignFeesToStudents({
            ...payloadBase,
            feeStructureId,
          })
        ).unwrap();
      }

      message.success("Fees assigned successfully");
      form.resetFields();
      setSelectedFeeIds([]);
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
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Student">
              {schoolStudents.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.userDetails?.name} ({s.class?.name}-{s.section?.name})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* BULK */}
        {mode === "bulk" && (
          <Form.Item
            name="classId"
            label="Class"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Class">
              {classList.map((c) => (
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
          rules={[{ required: true }]}
        >
          <Select placeholder="Select Academic Year">
            {academicYears.map((y) => (
              <Option key={y._id} value={y._id}>
                {y.name}
              </Option>
            ))}
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
