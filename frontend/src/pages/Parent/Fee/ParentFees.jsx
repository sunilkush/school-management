import React, { useEffect, useMemo, useState } from "react";
import { Alert, Empty, Select, Space } from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StudentFeeLedger from "../../../components/fees/StudentFeeLedger.jsx";

/**
 * Parent fee portal: pick a child, see the year's fee structure and installment schedule, and pay
 * any due installments online. Each child is shown separately — siblings can be at different
 * schools and every school collects into its own account.
 */
const ParentFees = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId");

  const { children = [], loading: childrenLoading } = useSelector((s) => s.studentPortal || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;

  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (selectedChildId || !children.length) return;
    const requested = requestedChildId && children.some((c) => c.userId === requestedChildId);
    setSelectedChildId(requested ? requestedChildId : children[0]?.userId);
  }, [children, selectedChildId, requestedChildId]);

  const selectedChild = useMemo(() => children.find((c) => c.userId === selectedChildId) || null, [children, selectedChildId]);
  // The Student record id — what every fee record is keyed by.
  const studentId = selectedChild?._id;

  return (
    <>
      <PageHeader
        title="Fees"
        subtitle="Fee structure, due installments and online payment for your child"
        icon={<WalletOutlined />}
        extra={
          <Space wrap>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childrenLoading}
              style={{ minWidth: 240 }}
              options={children.map((c) => ({
                label: `${c.name || "Student"}${c.className ? ` · ${c.className}` : ""} (${c.registrationNumber || "—"})`,
                value: c.userId,
              }))}
            />
          </Space>
        }
      />

      <div className="page-wrapper">
        {!selectedChildId ? (
          <div className="section-panel">
            <Empty description={childrenLoading ? "Loading…" : "No linked child found"} />
          </div>
        ) : !studentId ? (
          <Alert type="warning" showIcon message="Active enrollment not found for this child." style={{ borderRadius: 10 }} />
        ) : !academicYearId ? (
          <Alert type="info" showIcon message="Select an academic year from the top bar to view fees." style={{ borderRadius: 10 }} />
        ) : (
          <StudentFeeLedger
            key={studentId}
            mode="online"
            studentId={studentId}
            academicYearId={academicYearId}
            student={{ name: selectedChild?.name, className: selectedChild?.className, section: selectedChild?.sectionName }}
          />
        )}
      </div>
    </>
  );
};

export default ParentFees;
