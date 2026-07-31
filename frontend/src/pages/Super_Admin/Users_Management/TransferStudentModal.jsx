import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button, Select, Alert, Space, Tooltip } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { transferStudent } from "../../../features/studentSlice";
import { fetchAllAcademicYears } from "../../../features/academicYearSlice";
import { getClassData } from "../../../features/schoolClassSlice";

/**
 * Per-row "Transfer" action for the Super Admin Students list (UserRoleList via students.jsx).
 * `user` is a User record ({_id, name, school: {_id, name}}) — transferStudent resolves the
 * linked Student profile from userId server-side.
 */
const TransferStudentModal = ({ user }) => {
  const dispatch = useDispatch();
  const { schools = [] } = useSelector((s) => s.school || {});
  const { academicYears = [] } = useSelector((s) => s.academicYear || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetSchoolId, setTargetSchoolId] = useState(null);
  const [targetAcademicYearId, setTargetAcademicYearId] = useState(null);
  const [targetSchoolClassId, setTargetSchoolClassId] = useState(null);
  const [targetSectionId, setTargetSectionId] = useState(null);

  const currentSchoolId = user?.school?._id || user?.school;
  const otherSchools = schools.filter((s) => String(s._id) !== String(currentSchoolId));

  useEffect(() => {
    if (targetSchoolId) dispatch(fetchAllAcademicYears(targetSchoolId));
    setTargetAcademicYearId(null);
    setTargetSchoolClassId(null);
    setTargetSectionId(null);
  }, [dispatch, targetSchoolId]);

  useEffect(() => {
    if (targetSchoolId && targetAcademicYearId) {
      dispatch(getClassData({ schoolId: targetSchoolId, academicYearId: targetAcademicYearId }));
    }
    setTargetSchoolClassId(null);
    setTargetSectionId(null);
  }, [dispatch, targetSchoolId, targetAcademicYearId]);

  const selectedClass = schoolClasses.find((c) => String(c._id) === String(targetSchoolClassId));
  const sectionOptions = (selectedClass?.sections || []).map((sec) => ({ value: sec._id, label: sec.name }));

  const canSubmit = targetSchoolId && targetAcademicYearId && targetSchoolClassId && targetSectionId;

  const reset = () => {
    setTargetSchoolId(null);
    setTargetAcademicYearId(null);
    setTargetSchoolClassId(null);
    setTargetSectionId(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await dispatch(transferStudent({
        userId: user._id,
        targetSchoolId,
        targetAcademicYearId,
        targetSchoolClassId,
        targetSectionId,
      })).unwrap();
      setOpen(false);
      reset();
    } catch {
      // toast already shown by the slice
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Move this student to a different school">
        <Button size="middle" icon={<SwapOutlined />} onClick={() => setOpen(true)}>
          Transfer
        </Button>
      </Tooltip>

      <Modal
        title={`Transfer ${user?.name || "Student"} to another school`}
        open={open}
        onCancel={() => { setOpen(false); reset(); }}
        onOk={handleSubmit}
        okText="Transfer"
        okButtonProps={{ disabled: !canSubmit, loading: submitting }}
        destroyOnClose
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="This moves the student's login and active enrollment to the new school. Their attendance, fee, and exam history at the current school stays there as a historical record."
          />

          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Destination School</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select school"
              showSearch
              optionFilterProp="label"
              value={targetSchoolId}
              onChange={setTargetSchoolId}
              options={otherSchools.map((s) => ({ value: s._id, label: s.name }))}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Academic Year</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select academic year"
              disabled={!targetSchoolId}
              value={targetAcademicYearId}
              onChange={setTargetAcademicYearId}
              options={academicYears.map((ay) => ({ value: ay._id, label: ay.name }))}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Class</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class"
              disabled={!targetAcademicYearId}
              value={targetSchoolClassId}
              onChange={setTargetSchoolClassId}
              options={schoolClasses.map((c) => ({ value: c._id, label: c.name }))}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Section</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select section"
              disabled={!targetSchoolClassId}
              value={targetSectionId}
              onChange={setTargetSectionId}
              options={sectionOptions}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default TransferStudentModal;
