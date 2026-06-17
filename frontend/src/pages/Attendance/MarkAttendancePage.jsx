import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker, Button, Spin, Empty, message } from "antd";
import {
  EditOutlined, BankOutlined, TeamOutlined, CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchAttendance, markBulkAttendance,
  setAttendanceFilters, setDraftAttendanceStatus,
} from "../../features/attendanceSlice";
import { fetchSchoolClasses }     from "../../features/schoolClassSlice";
import { fetchSchools }           from "../../features/schoolSlice";
import BulkAttendanceTable        from "../../components/attendance/BulkAttendanceTable";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";
import PageHeader                 from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, 
} from "../../styles/pageStyles";

/* ── Filter label ───────────────────────────────────────────────────── */
const FilterLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  }}>
    {children}
  </div>
);

/* ── Main component ─────────────────────────────────────────────────── */
const MarkAttendancePage = () => {
  const dispatch = useDispatch();

  const { list, draftRecords, loading, filters } = useSelector((s) => s.attendance);
  const { user }                = useSelector((s) => s.auth || {});
  const { schoolClasses = [] }  = useSelector((s) => s.schoolClass || {});
  const { schools = [] }        = useSelector((s) => s.school || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const isSuperAdmin    = user?.role?.name === "Super Admin";
  const [saSchoolId, setSaSchoolId] = useState(null);

  const schoolId     = isSuperAdmin ? saSchoolId : (user?.school?._id || null);
  const academicYearId = selectedAcademicYear?._id || selectedAcademicYear || null;

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  /* ── On mount ── */
  useEffect(() => {
    if (isSuperAdmin) dispatch(fetchSchools());
  }, [isSuperAdmin, dispatch]);

  /* ── When schoolId changes ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(setAttendanceFilters({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  /* ── Rows ── */
  const rows = useMemo(
    () => list.map((item) => ({
      userId: item.userId?._id || item.userId,
      name:   item.userId?.name,
      email:  item.userId?.email,
      status: item.status,
    })),
    [list],
  );

  /* ── Load data ── */
  const handleLoad = () => {
    if (!filters.schoolId) return message.warning("Please select a school first");
    dispatch(fetchAttendance(filters));
  };

  /* ── Save ── */
  const handleSave = async () => {
    const records = rows.map((r) => ({
      userId: r.userId,
      status: draftRecords[r.userId] || "present",
    }));
    if (!records.length) return message.warning("No data to save");

    try {
      const res = await dispatch(markBulkAttendance({
        ...filters,
        date:    filters.date || new Date().toISOString(),
        role:    filters.role || "student",
        records,
      }));
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Attendance saved successfully");
        dispatch(fetchAttendance(filters));
      } else {
        message.error("Failed to save attendance");
      }
    } catch {
      message.error("Server error");
    }
  };

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Mark Attendance"
        subtitle="Load users, bulk-mark status and save in one click"
        icon={<EditOutlined />}
      />

      {/* ── Filter panel ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}>

          {/* School selector — Super Admin only */}
          {isSuperAdmin && (
            <div>
              <FilterLabel>School</FilterLabel>
              <Select
                showSearch
                placeholder="Select school"
                style={{ width: "100%" }}
                value={saSchoolId || undefined}
                options={schoolOptions}
                filterOption={(inp, opt) =>
                  opt.label.toLowerCase().includes(inp.toLowerCase())
                }
                onChange={(val) => {
                  setSaSchoolId(val || null);
                  dispatch(setAttendanceFilters({ schoolId: val || null, classId: null, sectionId: null }));
                }}
                suffixIcon={<BankOutlined />}
              />
            </div>
          )}

          {/* Class */}
          <div>
            <FilterLabel>Class</FilterLabel>
            <Select
              placeholder="Select class"
              style={{ width: "100%" }}
              value={filters.classId || undefined}
              allowClear
              disabled={!schoolId}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              onChange={(val) =>
                dispatch(setAttendanceFilters({ classId: val || null, sectionId: null }))
              }
            />
          </div>

          {/* Section */}
          <div>
            <FilterLabel>Section</FilterLabel>
            <Select
              placeholder="Select section"
              style={{ width: "100%" }}
              value={filters.sectionId || undefined}
              allowClear
              disabled={!filters.classId}
              options={
                classes
                  .find((c) => c._id === filters.classId)
                  ?.sections?.map((s) => ({ value: s._id, label: s.name })) || []
              }
              onChange={(val) =>
                dispatch(setAttendanceFilters({ sectionId: val || null }))
              }
            />
          </div>

          {/* Date */}
          <div>
            <FilterLabel>Date</FilterLabel>
            <DatePicker
              style={{ width: "100%" }}
              value={filters.date ? dayjs(filters.date) : dayjs()}
              onChange={(v) =>
                dispatch(setAttendanceFilters({ date: v?.toISOString() || null }))
              }
              suffixIcon={<CalendarOutlined />}
            />
          </div>

          {/* Role */}
          <div>
            <FilterLabel>Role</FilterLabel>
            <Select
              style={{ width: "100%" }}
              value={filters.role || "student"}
              options={ATTENDANCE_ROLE_OPTIONS}
              onChange={(v) => dispatch(setAttendanceFilters({ role: v }))}
              suffixIcon={<TeamOutlined />}
            />
          </div>
        </div>

        {/* Load button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleLoad}
            loading={loading}
            disabled={!schoolId}
            icon={<TeamOutlined />}
          >
            Load Users
          </Button>
        </div>
      </div>

      {/* ── Attendance table ── */}
      <div style={sectionPanel}>
        {rows.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "var(--text-muted)" }}>
                {schoolId
                  ? 'Click "Load Users" to fetch attendance records'
                  : "Select a school first to load attendance data"}
              </span>
            }
          />
        ) : (
          <Spin spinning={loading}>
            <BulkAttendanceTable
              rows={rows}
              draftMap={draftRecords}
              loading={loading}
              onStatusChange={(userId, status) =>
                dispatch(setDraftAttendanceStatus({ userId, status }))
              }
            />
          </Spin>
        )}
      </div>

      {/* ── Footer ── */}
      {rows.length > 0 && (
        <div style={{
          ...sectionPanel,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{rows.length}</span>
            {" "}records loaded
          </span>
          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            disabled={!rows.length || loading}
            loading={loading}
          >
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkAttendancePage;
