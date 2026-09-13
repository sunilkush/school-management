import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Button, Spin, Empty, Grid, Avatar } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import RupeeIcon from "../icons/RupeeIcon";

import { fetchStudentsBySchoolId } from "../../features/studentSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import PageHeader from "../layout/PageHeader";
import { pageWrapper, avatarColor } from "../../styles/pageStyles";
import StudentFeeLedger from "./StudentFeeLedger.jsx";

const { useBreakpoint } = Grid;

const FL = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
    {children}
  </div>
);

const getStudentName = (s) => s?.user?.name || s?.name || "—";
const getStudentId = (s) => s?.student?._id?.toString() || s?.studentId?.toString() || s?._id?.toString();

/**
 * Shared "find student → see their fee schedule → collect" workspace, used by both School Admin
 * (FeeCollection.jsx) and Accountant (CollectFees.jsx). The schedule, selection of installments,
 * counter payment and receipt all live in StudentFeeLedger, which the parent and student fee
 * screens use too.
 */
const CollectFeeWorkspace = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { user } = useSelector((s) => s.auth || {});
  const { schoolStudents = [], loading: studentsLoading } = useSelector((s) => s.students || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && selectedClassId) {
      setSelectedStudentId(null);
      dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, schoolClassId: selectedClassId, limit: 500 }));
    }
  }, [schoolId, academicYearId, selectedClassId, dispatch]);

  const studentList = useMemo(() => (Array.isArray(schoolStudents) ? schoolStudents : []), [schoolStudents]);

  const studentOptions = useMemo(
    () =>
      studentList
        .filter((s) => !searchText || getStudentName(s).toLowerCase().includes(searchText.toLowerCase()))
        .map((s) => ({
          value: getStudentId(s),
          label: `${getStudentName(s)} (Roll: ${s.rollNumber ?? "—"} | Reg: ${s.registrationNumber || "—"})`,
        })),
    [studentList, searchText]
  );

  const classOptions = useMemo(() => (schoolClasses || []).map((c) => ({ value: c._id, label: c.name })), [schoolClasses]);
  const selectedEnrollment = useMemo(() => studentList.find((s) => getStudentId(s) === selectedStudentId), [studentList, selectedStudentId]);

  const header = <PageHeader title="Fee Collection" subtitle="Find a student, pick the installments being paid and record the payment" icon={<RupeeIcon />} />;

  if (!academicYearId) {
    return (
      <div style={pageWrapper}>
        {header}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 32, textAlign: "center" }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>No active academic year selected</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Please select an academic year from the top navigation to continue.</div>
        </div>
      </div>
    );
  }

  const clearAll = () => { setSelectedClassId(null); setSelectedStudentId(null); setSearchText(""); };

  return (
    <div style={{ ...pageWrapper, padding: isMobile ? "12px" : "clamp(12px,3vw,24px)" }}>
      {header}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: isMobile ? "14px" : "20px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 14, alignItems: "end" }}>
          <div>
            <FL>Class</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class"
              options={classOptions}
              value={selectedClassId || undefined}
              onChange={(v) => { setSelectedClassId(v); setSelectedStudentId(null); setSearchText(""); }}
              showSearch
              optionFilterProp="label"
              size={isMobile ? "large" : "middle"}
              allowClear
              onClear={clearAll}
            />
          </div>

          <div>
            <FL>Student</FL>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder={selectedClassId ? "Search by student name" : "Select class first"}
              value={selectedStudentId || undefined}
              options={studentOptions}
              loading={studentsLoading}
              filterOption={false}
              onSearch={setSearchText}
              onChange={(v) => { setSelectedStudentId(v); setSearchText(""); }}
              suffixIcon={<SearchOutlined />}
              notFoundContent={!selectedClassId ? "Select a class first" : studentsLoading ? <Spin size="small" /> : "No students found"}
              disabled={!selectedClassId}
              size={isMobile ? "large" : "middle"}
            />
          </div>

          {(selectedClassId || selectedStudentId) && (
            <Button onClick={clearAll} style={{ borderRadius: 8 }} size={isMobile ? "large" : "middle"}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {selectedEnrollment && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar size={isMobile ? 44 : 52} style={{ background: avatarColor(getStudentName(selectedEnrollment)).bg, color: avatarColor(getStudentName(selectedEnrollment)).color, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {getStudentName(selectedEnrollment)[0]?.toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getStudentName(selectedEnrollment)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {[
                selectedEnrollment?.schoolClass?.name,
                selectedEnrollment?.section?.name ? `Section ${selectedEnrollment.section.name}` : null,
                selectedEnrollment?.rollNumber ? `Roll: ${selectedEnrollment.rollNumber}` : null,
                selectedEnrollment?.registrationNumber ? `Reg: ${selectedEnrollment.registrationNumber}` : null,
              ].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {selectedStudentId ? (
        <StudentFeeLedger
          mode="collect"
          studentId={selectedStudentId}
          academicYearId={academicYearId}
          student={{
            name: getStudentName(selectedEnrollment),
            className: selectedEnrollment?.schoolClass?.name,
            section: selectedEnrollment?.section?.name,
          }}
        />
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: "var(--text-muted)" }}>{!selectedClassId ? "Select a class to get started" : "Select a student to view fee details"}</span>}
            style={{ padding: "40px 0" }}
          />
        </div>
      )}
    </div>
  );
};

export default CollectFeeWorkspace;
