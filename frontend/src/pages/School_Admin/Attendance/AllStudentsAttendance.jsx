import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  DatePicker,
  Input,
  Spin,
  Empty,
  Table,
  message,
  Progress,
} from "antd";
import {
  SaveOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { markBulkAttendance } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
  sectionPanel,
} from "../../../styles/pageStyles";

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "present", label: "P",  fullLabel: "Present",  color: "#5BA89A" },
  { value: "absent",  label: "A",  fullLabel: "Absent",   color: "#D96B7A" },
  { value: "late",    label: "L",  fullLabel: "Late",     color: "#D4922A" },
  { value: "halfday", label: "H",  fullLabel: "Half Day", color: "#D4922A" },
  { value: "leave",   label: "Lv", fullLabel: "Leave",    color: "#0891b2" },
];

const TABLE_CLS    = "stud-att-tbl";
const DEFAULT_STATUS = "present";

/* ── Inline status button ────────────────────────────────────────── */
const StatusBtn = ({ opt, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "4px 10px",
      borderRadius: 6,
      border: `1.5px solid ${active ? opt.color : "var(--border-muted)"}`,
      background: active ? `${opt.color}18` : "transparent",
      color: active ? opt.color : "var(--text-muted)",
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      fontSize: 12,
      lineHeight: 1.4,
      transition: "all 0.15s",
    }}
  >
    {opt.label}
  </button>
);

const AllStudentsAttendance = () => {
  const dispatch = useDispatch();

  const { schoolStudents = [], loading: studLoading } = useSelector(
    (s) => s.students || {}
  );
  const { loading: attLoading } = useSelector((s) => s.attendance || {});
  const { user: currentUser }   = useSelector((s) => s.auth || {});
  const { schoolClasses = [] }  = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId       = currentUser?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedClassId, setSelectedClassId]   = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [attendanceDate, setAttendanceDate]       = useState(dayjs());
  const [searchText, setSearchText]               = useState("");
  const [filterStatus, setFilterStatus]           = useState(null);
  const [attendance, setAttendance]               = useState({});

  /* ── Normalise data ── */
  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const students = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (Array.isArray(schoolStudents?.students)) return schoolStudents.students;
    if (Array.isArray(schoolStudents?.data?.students))
      return schoolStudents.data.students;
    return [];
  }, [schoolStudents]);

  /* ── Fetch ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  /* ── Derived ── */
  const selectedClassObj = useMemo(
    () => classes.find((c) => c._id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const sectionOptions = useMemo(
    () =>
      (selectedClassObj?.sections || []).map((s) => ({
        value: s._id,
        label: s.name,
      })),
    [selectedClassObj]
  );

  const handleClassChange = (val) => {
    setSelectedClassId(val || null);
    setSelectedSectionId(null);
  };

  /* ── Filtered students ── */
  const filteredStudents = useMemo(() => {
    const q = searchText.toLowerCase();
    return students.filter((s) => {
      const classId   = s?.schoolClass?._id || s?.schoolClassId;
      const sectionId = s?.section?._id     || s?.sectionId;

      if (selectedClassId   && classId   !== selectedClassId)   return false;
      if (selectedSectionId && sectionId !== selectedSectionId) return false;

      if (filterStatus) {
        const currentStatus = attendance[s._id] || DEFAULT_STATUS;
        if (currentStatus !== filterStatus) return false;
      }

      const name = (s?.user?.name || "").toLowerCase();
      const roll = `${s?.rollNumber || s?.registrationNumber || ""}`.toLowerCase();
      if (q && !name.includes(q) && !roll.includes(q)) return false;
      return true;
    });
  }, [students, selectedClassId, selectedSectionId, filterStatus, searchText, attendance]);

  /* ── Live summary ── */
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0 };
    filteredStudents.forEach((s) => {
      const st = attendance[s._id] || DEFAULT_STATUS;
      if (counts[st] !== undefined) counts[st]++;
    });
    const total = filteredStudents.length;
    return {
      ...counts,
      total,
      rate: total ? Math.round((counts.present / total) * 100) : 0,
    };
  }, [filteredStudents, attendance]);

  /* ── Actions ── */
  const handleChange = (id, value) =>
    setAttendance((p) => ({ ...p, [id]: value }));

  const markAll = (status) => {
    const updated = {};
    filteredStudents.forEach((s) => (updated[s._id] = status));
    setAttendance((p) => ({ ...p, ...updated }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId)   return message.warning("Please select a class first");
    if (!selectedSectionId) return message.warning("Please select a section first");

    const records = filteredStudents
      .map((s) => ({
        userId: s?.user?._id,
        status: attendance[s._id] || DEFAULT_STATUS,
      }))
      .filter((r) => r.userId);

    if (!records.length) return message.warning("No students found");

    const res = await dispatch(
      markBulkAttendance({
        schoolId,
        role: "student",
        classId:   selectedClassId,
        sectionId: selectedSectionId,
        date: attendanceDate.startOf("day").toISOString(),
        records,
      })
    );

    if (res?.meta?.requestStatus === "fulfilled") {
      message.success(`Attendance saved for ${records.length} students`);
    } else {
      message.error(res?.payload || "Failed to save attendance");
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "Student",
      render: (_, r) => {
        const name = r?.user?.name || "—";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--primary-light)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}
            >
              {name[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Roll: {r?.rollNumber || r?.registrationNumber || "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Class / Section",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r?.schoolClass?.name || "—"}
          {r?.section?.name && ` • ${r.section.name}`}
        </span>
      ),
    },
    {
      title: "Attendance",
      render: (_, r) => {
        const current = attendance[r._id] || DEFAULT_STATUS;
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((opt) => (
              <StatusBtn
                key={opt.value}
                opt={opt}
                active={current === opt.value}
                onClick={() => handleChange(r._id, opt.value)}
              />
            ))}
          </div>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Student Attendance"
        subtitle="Mark class-wise student attendance for today"
        icon={<TeamOutlined />}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={attLoading}
            onClick={handleSubmit}
            disabled={!selectedClassId || !selectedSectionId}
          >
            Save Attendance
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          <Select
            placeholder="Select Class"
            value={selectedClassId}
            onChange={handleClassChange}
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            allowClear
            style={{ width: "100%" }}
          />
          <Select
            placeholder="Select Section"
            value={selectedSectionId}
            onChange={(v) => setSelectedSectionId(v || null)}
            options={sectionOptions}
            allowClear
            disabled={!selectedClassId}
            style={{ width: "100%" }}
          />
          <DatePicker
            value={attendanceDate}
            onChange={(d) => setAttendanceDate(d || dayjs())}
            disabledDate={(c) => c && c > dayjs().endOf("day")}
            style={{ width: "100%" }}
          />
          <Select
            placeholder="Filter by Status"
            allowClear
            value={filterStatus}
            onChange={(v) => setFilterStatus(v || null)}
            options={STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.fullLabel,
            }))}
            style={{ width: "100%" }}
          />
          <Input
            placeholder="Search name / roll no"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* Mark-All row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontWeight: 600,
              marginRight: 2,
            }}
          >
            Mark All:
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              onClick={() => markAll(opt.value)}
              style={{
                borderColor: opt.color,
                color: opt.color,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {opt.fullLabel}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={statGrid(130)}>
        {[
          { key: "total",   label: "Total",    color: "var(--primary)" },
          { key: "present", label: "Present",  color: "#5BA89A"        },
          { key: "absent",  label: "Absent",   color: "#D96B7A"        },
          { key: "late",    label: "Late",     color: "#D4922A"        },
          { key: "leave",   label: "Leave",    color: "#0891b2"        },
        ].map(({ key, label, color }) => (
          <div
            key={key}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={iconWell(color, 36)}>
              <UserOutlined />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {label}
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}
              >
                {summary[key]}
              </div>
            </div>
          </div>
        ))}

        {/* Attendance Rate */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Attendance Rate
          </div>
          <Progress
            percent={summary.rate}
            strokeColor="#5BA89A"
            trailColor="var(--border-muted)"
            size="small"
            format={(p) => (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5BA89A" }}>
                {p}%
              </span>
            )}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-muted)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <Spin spinning={studLoading}>
          {filteredStudents.length > 0 ? (
            <Table
              className={TABLE_CLS}
              rowKey="_id"
              columns={columns}
              dataSource={filteredStudents}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              scroll={{ x: 500 }}
            />
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    {!selectedClassId
                      ? "Select a class to view students"
                      : "No students found with current filters"}
                  </span>
                }
              />
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default AllStudentsAttendance;
