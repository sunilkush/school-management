import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker, Button, Spin, Empty, message } from "antd";
import {
  EditOutlined, BankOutlined, TeamOutlined, CalendarOutlined, SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchAttendance, markBulkAttendance,
  setAttendanceFilters, setDraftAttendanceStatus,
} from "../../features/attendanceSlice";
import { fetchSchoolClasses }     from "../../features/schoolClassSlice";
import { fetchSchools }           from "../../features/schoolSlice";
import { fetchAllAcademicYears }  from "../../features/academicYearSlice";
import BulkAttendanceTable        from "../../components/attendance/BulkAttendanceTable";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";
import PageHeader                 from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles";

const FilterLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  }}>
    {children}
  </div>
);

/* Roles that support check-in / check-out time tracking */
const TIME_ROLES = new Set(["teacher", "staff", "support_staff", "accountant", "principal", "vice_principal", "librarian", "hostel_warden", "transport_manager"]);

const MarkAttendancePage = () => {
  const dispatch = useDispatch();

  const { list, draftRecords, loading, filters } = useSelector((s) => s.attendance);
  const { user }                 = useSelector((s) => s.auth || {});
  const { schoolClasses = [] }   = useSelector((s) => s.schoolClass || {});
  const { schools = [] }         = useSelector((s) => s.school || {});
  const { selectedAcademicYear, academicYears = [] } = useSelector((s) => s.academicYear || {});

  const isSuperAdmin = user?.role?.name === "Super Admin";
  const [saSchoolId, setSaSchoolId] = useState(null);

  const schoolId = isSuperAdmin ? saSchoolId : (user?.school?._id || null);

  /**
   * The year to work in: the chosen school's own running year.
   *
   * The header's year belongs to whoever is signed in, which for a Super Admin is nobody's school
   * in particular — so using it here loaded the classes of some other school's year, or of none.
   * The school's active year is the one its classes, sections and enrolments are filed under.
   */
  const academicYear = useMemo(() => {
    if (!schoolId) return null;   // nothing to say until a school is chosen
    const ofThisSchool = academicYears.filter((y) => String(y.schoolId?._id || y.schoolId || "") === String(schoolId));
    const pool = ofThisSchool.length ? ofThisSchool : academicYears;
    return pool.find((y) => y.isActive)
      || (String(selectedAcademicYear?.schoolId || "") === String(schoolId) ? selectedAcademicYear : null)
      || pool[0]
      || null;
  }, [academicYears, selectedAcademicYear, schoolId]);
  const academicYearId = academicYear?._id || null;

  /* time state: { [userId]: dayjs | null } */
  const [checkIns,  setCheckIns]  = useState({});
  const [checkOuts, setCheckOuts] = useState({});

  const showTimes = TIME_ROLES.has(filters.role);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses))         return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  useEffect(() => { if (isSuperAdmin) dispatch(fetchSchools()); }, [isSuperAdmin, dispatch]);

  /* A school's years have to be in hand before its running one can be picked. */
  useEffect(() => {
    if (schoolId) dispatch(fetchAllAcademicYears(schoolId));
  }, [schoolId, dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    // A class picked under one year does not exist under another, so it goes when the year moves.
    dispatch(setAttendanceFilters({ schoolId, classId: null, sectionId: null }));
    // Without a year this would return every class the school has ever had, across all years.
    if (academicYearId) dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  /* Reset times when role changes (student ↔ staff) */
  useEffect(() => {
    setCheckIns({});
    setCheckOuts({});
  }, [filters.role]);

  const rows = useMemo(
    () => list.map((item) => ({
      userId: item.userId?._id || item.userId,
      name:   item.userId?.name,
      email:  item.userId?.email,
      status: item.status,
    })),
    [list],
  );

  const handleLoad = () => {
    if (!filters.schoolId) return message.warning("Please select a school first");
    setCheckIns({});
    setCheckOuts({});
    dispatch(fetchAttendance(filters));
  };

  const handleSave = async () => {
    const records = rows.map((r) => {
      const status    = draftRecords[r.userId] || "present";
      const hasTime   = showTimes && (status === "present" || status === "late");
      return {
        userId:    r.userId,
        status,
        checkInAt:  hasTime && checkIns[r.userId]  ? checkIns[r.userId].toISOString()  : null,
        checkOutAt: hasTime && checkOuts[r.userId] ? checkOuts[r.userId].toISOString() : null,
      };
    });

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
        message.error(res.payload || "Failed to save attendance");
      }
    } catch {
      message.error("Server error. Please try again.");
    }
  };

  const handleCheckInChange = useCallback((userId, v) => {
    setCheckIns((prev) => ({ ...prev, [userId]: v }));
  }, []);

  const handleCheckOutChange = useCallback((userId, v) => {
    setCheckOuts((prev) => ({ ...prev, [userId]: v }));
  }, []);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Mark Attendance"
        subtitle="Load users, set status and check-in/out times, then save in one click"
        icon={<EditOutlined />}
      />

      {/* ── Filter panel ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>

          {isSuperAdmin && (
            <div>
              <FilterLabel>School</FilterLabel>
              <Select
                showSearch placeholder="Select school" style={{ width: "100%" }}
                value={saSchoolId || undefined} options={schoolOptions}
                filterOption={(inp, opt) => opt.label.toLowerCase().includes(inp.toLowerCase())}
                onChange={(val) => {
                  setSaSchoolId(val || null);
                  dispatch(setAttendanceFilters({ schoolId: val || null, classId: null, sectionId: null }));
                }}
                suffixIcon={<BankOutlined />}
              />
            </div>
          )}

          {/* Which year everything below comes from — the school's own, not the header's. */}
          <div>
            <FilterLabel>Academic year</FilterLabel>
            <div style={{
              height: 32, display: "flex", alignItems: "center", padding: "0 11px",
              border: "1px solid var(--border-muted)", borderRadius: 6,
              fontSize: 14, color: academicYear ? "var(--text-primary)" : "var(--text-muted)",
              background: "var(--surface-soft)",
            }}>
              {academicYear
                ? `${academicYear.name}${academicYear.isActive ? " · running" : ""}`
                : (schoolId ? "This school has no year set up" : "Pick a school")}
            </div>
          </div>

          <div>
            <FilterLabel>Class</FilterLabel>
            <Select
              placeholder={academicYearId ? "Select class" : "Pick a school first"}
              style={{ width: "100%" }}
              value={filters.classId || undefined} allowClear disabled={!schoolId || !academicYearId}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              onChange={(val) => dispatch(setAttendanceFilters({ classId: val || null, sectionId: null }))}
            />
          </div>

          <div>
            <FilterLabel>Section</FilterLabel>
            <Select
              placeholder="Select section" style={{ width: "100%" }}
              value={filters.sectionId || undefined} allowClear disabled={!filters.classId}
              options={classes.find((c) => c._id === filters.classId)?.sections?.map((s) => ({ value: s._id, label: s.name })) || []}
              onChange={(val) => dispatch(setAttendanceFilters({ sectionId: val || null }))}
            />
          </div>

          <div>
            <FilterLabel>Date</FilterLabel>
            <DatePicker
              style={{ width: "100%" }}
              value={filters.date ? dayjs(filters.date) : dayjs()}
              onChange={(v) => dispatch(setAttendanceFilters({ date: v?.toISOString() || null }))}
              suffixIcon={<CalendarOutlined />}
            />
          </div>

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

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button
            type="primary" icon={<TeamOutlined />}
            onClick={handleLoad} loading={loading} disabled={!schoolId}
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
                {schoolId ? 'Click "Load Users" to fetch attendance records' : "Select a school first"}
              </span>
            }
          />
        ) : (
          <Spin spinning={loading}>
            <BulkAttendanceTable
              rows={rows}
              draftMap={draftRecords}
              loading={loading}
              onStatusChange={(userId, status) => dispatch(setDraftAttendanceStatus({ userId, status }))}
              showTimes={showTimes}
              checkIns={checkIns}
              checkOuts={checkOuts}
              onCheckInChange={handleCheckInChange}
              onCheckOutChange={handleCheckOutChange}
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
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{rows.length}</span>{" "}records loaded
            {showTimes && (
              <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 12 }}>
                · Check-In/Out times enabled for this role
              </span>
            )}
          </span>
          <Button
            type="primary" size="large" icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!rows.length || loading} loading={loading}
          >
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkAttendancePage;
