import React, { useEffect } from "react";
import { Empty, Spin } from "antd";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyStudentEnrollment } from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StudentFeeLedger from "../../../components/fees/StudentFeeLedger.jsx";

/** A student's own fees: structure, installment schedule, online payment and receipts. */
const FeeStudent = () => {
  const dispatch = useDispatch();
  const { myEnrollment, loading } = useSelector((s) => s.students || {});

  useEffect(() => { dispatch(fetchMyStudentEnrollment()); }, [dispatch]);

  const studentId = myEnrollment?.studentId;
  const academicYearId = myEnrollment?.academicYear?._id;

  return (
    <>
      <PageHeader
        title="My Fees"
        subtitle={myEnrollment?.academicYear?.name ? `Academic year ${myEnrollment.academicYear.name}` : "Fee structure, installments and payments"}
        icon={<RupeeIcon />}
      />
      <div className="page-wrapper">
        {studentId && academicYearId ? (
          <StudentFeeLedger
            mode="online"
            studentId={studentId}
            academicYearId={academicYearId}
            student={{
              name: myEnrollment?.studentName || myEnrollment?.name,
              className: myEnrollment?.schoolClass?.name || myEnrollment?.className,
              section: myEnrollment?.section?.name || myEnrollment?.sectionName,
            }}
          />
        ) : (
          <div className="section-panel">
            {loading ? <div style={{ textAlign: "center", padding: 32 }}><Spin /></div> : <Empty description="No active enrollment found" />}
          </div>
        )}
      </div>
    </>
  );
};

export default FeeStudent;
