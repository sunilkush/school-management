import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Select,
  Button,
  DatePicker,
  Input,
  Table,
  message,
  Spin,
  Empty,
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
import { fetchAssignedClasses } from "../../../features/classSlice";
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
  { value: "present", label: "P",  fullLabel: "Present",  color: "#22C55E" },
  { value: "absent",  label: "A",  fullLabel: "Absent",   color: "#EF4444" },
  { value: "late",    label: "L",  fullLabel: "Late",     color: "#F59E0B" },
  { value: "halfday", label: "H",  fullLabel: "Half Day", color: "#F59E0B" },
  { value: "leave",   label: "Lv", fullLabel: "Leave",    color: "#0891b2" },
];

const TABLE_CLS      = "teacher-att-tbl";
const DEFAULT_STATUS = "present";

const getId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v?._id || v?.id || null;
};

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

const StudentAttendance = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { schoolStudents = [], loading: studLoading } = useSelector(
    (s) => s.students || {}
  );
  const { loading: attLoading }      = useSelector((s) => s.attendance || {});
  const { classAssignTeacher = [] }  = useSelector((s) => s.class || {});
  const { user }                     = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }     = useSelector((s) => s.academicYear || {});

  const schoolId       = user?.school?._id || user?.schoolId || null;
  const academicYearId = selectedAcademicYear?._id || null;

  const [selectedKey,    setSelectedKey]    = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [searchText,     setSearchText]     = useState("");
  const [filterStatus,   setFilterStatus]   = useState(null);
  const [attendance,     setAttendance]     = useState({});

  const query          = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const prefilledClassId = query.get("classId");

  /* ── Fetch ── */
  useEffect(() => {
    if (!schoolId || !academicYearId || !user?._id) return;
    dispatch(
      fetchAssignedClasses({ schoolId, academicYearId, teacherId: user._id })
    );
  }, [dispatch, schoolId, academicYearId, user?._id]);

  /* ── Normalise students ── */
  const students = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (Array.isArray(schoolStudents?.students)) return schoolStudents.students;
    return [];
  }, [schoolStudents]);

  /* ── Build class-section list from teacher assignments ── */
  const classSections = useMemo(() => {
    const result = [];
    const seen   = new Set();

    (Array.isArray(classAssignTeacher) ? classAssignTeacher : []).forEach(
      (item) => {
        const classId   = getId(item);
        const className = item?.name || "Class";

        (Array.isArray(item?.sections) ? item.sections : []).forEach(
          (section) => {
            const sectionId   =
              getId(section?.sectionId) || getId(section);
            const sectionName =
              section?.sectionId?.name || section?.name || "Section";

            if (!classId || !sectionId) return;
            const key = `${classId}-${sectionId}`;
            if (seen.has(key)) return;
            seen.add(key);
            result.push({ key, classId, sectionId, className, sectionName });
          }
        );
      }
    );
    return result;
  }, [classAssignTeacher]);

  /* ── Auto-select first or prefilled class ── */
  useEffect(() => {
    if (!classSections.length) return;
    if (selectedKey) return; // already set
    const prefilled = prefilledClassId
      ? classSections.find((c) => c.classId === prefilledClassId)
      : null;
    setSelectedKey((prefilled || classSections[0]).key);
  }, [classSections, selectedKey, prefilledClassId]);

  const selectedClassObj = useMemo(
    () => classSections.find((c) => c.key === selectedKey) || null,
    [classSections, selectedKey]
  );

  // Scoped to just the selected class-section — this used to fetch every student in the school
  // on every visit just to filter it down to one section's worth afterward.
  useEffect(() => {
    if (!schoolId || !academicYearId || !selectedClassObj) return;
    dispatch(fetchStudentsBySchoolId({
      schoolId,
      academicYearId,
      schoolClassId: selectedClassObj.classId,
      sectionId: selectedClassObj.sectionId,
      limit: 200,
    }));
  }, [dispatch, schoolId, academicYearId, selectedClassObj]);

  const classStudents = students;

  /* ── Seed default status ── */
  useEffect(() => {
    setAttendance((prev) => {
      const next = { ...prev };
      classStudents.forEach((s) => {
        if (!next[s._id]) next[s._id] = DEFAULT_STATUS;
      });
      return next;
    });
  }, [classStudents]);

  /* ── Filtered view ── */
  const filteredStudents = useMemo(() => {
    const q = searchText.toLowerCase();
    return classStudents.filter((s) => {
      const status = attendance[s._id] || DEFAULT_STATUS;
      if (filterStatus && status !== filterStatus) return false;
      const name = (s?.user?.name || s?.name || "").toLowerCase();
      const reg  = `${s?.registrationNumber || ""}`.toLowerCase();
      if (q && !name.includes(q) && !reg.includes(q)) return false;
      return true;
    });
  }, [classStudents, searchText, filterStatus, attendance]);

  /* ── Live summary ── */
  const summary = useMemo(() => {
    const counts = {
      present: 0, absent: 0, late: 0, halfday: 0, leave: 0,
    };
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
    if (!selectedClassObj) return message.warning("Please select a class");

    const records = classStudents
      .map((s) => {
        const userId =
          getId(s?.user) || getId(s?.userId) || s?._id;
        return { userId, status: attendance[s._id] || DEFAULT_STATUS };
      })
      .filter((r) => r.userId);

    if (!records.length) return message.warning("No students found");

    try {
      await dispatch(
        markBulkAttendance({
          schoolId,
          records,
          role: "student",
          // Local calendar-date string, not .toISOString() — avoids the day-shift toISOString()
          // causes near midnight for positive-UTC-offset zones (IST included); mirrors mobile's
          // formatDateOnly() fix for the same bug.
          date: attendanceDate.format("YYYY-MM-DD"),
          classId:   selectedClassObj.classId,
          sectionId: selectedClassObj.sectionId,
          academicYearId,
        })
      ).unwrap();
      message.success("Attendance saved successfully");
    } catch (err) {
      message.error(
        typeof err === "string" ? err : err?.message || "Failed to save attendance"
      );
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "Student",
      render: (_, r) => {
        const name = r?.user?.name || r?.name || "—";
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
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Reg: {r?.registrationNumber || "—"}
              </div>
            </div>
          </div>
        );
      },
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
        subtitle="Mark attendance for your assigned classes"
        icon={<TeamOutlined />}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={attLoading}
            onClick={handleSubmit}
            disabled={!selectedClassObj}
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
            placeholder="Select Class & Section"
            value={selectedKey}
            onChange={(v) => setSelectedKey(v)}
            options={classSections.map((c) => ({
              value: c.key,
              label: `${c.className} — ${c.sectionName}`,
            }))}
            showSearch
            optionFilterProp="label"
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
            placeholder="Search name / reg no"
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
      <div style={statGrid(120)}>
        {[
          { key: "total",   label: "Total",   color: "var(--primary)" },
          { key: "present", label: "Present", color: "#22C55E"        },
          { key: "absent",  label: "Absent",  color: "#EF4444"        },
          { key: "late",    label: "Late",    color: "#F59E0B"        },
          { key: "leave",   label: "Leave",   color: "#0891b2"        },
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
              gap: 10,
            }}
          >
            <div style={iconWell(color, 34)}>
              <UserOutlined style={{ fontSize: 14 }} />
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
                style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}
              >
                {summary[key]}
              </div>
            </div>
          </div>
        ))}
        {/* Rate */}
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
            Rate
          </div>
          <Progress
            percent={summary.rate}
            strokeColor="#22C55E"
            trailColor="var(--border-muted)"
            size="small"
            format={(p) => (
              <span
                style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}
              >
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
              scroll={{ x: 460 }}
            />
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    {!selectedClassObj
                      ? "Select a class to begin"
                      : "No students match the current filters"}
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

export default StudentAttendance;
