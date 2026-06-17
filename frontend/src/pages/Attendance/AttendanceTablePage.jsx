import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, DatePicker, Button, Table, Tag, Space,
  Spin, Empty, Popconfirm, message,
} from "antd";
import {
  BankOutlined, CalendarOutlined, TeamOutlined,
  UnorderedListOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchAttendance, deleteAttendanceRecord, updateAttendanceRecord,
  setAttendanceFilters,
} from "../../features/attendanceSlice";
import { fetchSchoolClasses }        from "../../features/schoolClassSlice";
import { fetchSchools }              from "../../features/schoolSlice";
import { fetchActiveAcademicYear }   from "../../features/academicYearSlice";
import StatusTag                     from "../../components/attendance/StatusTag";
import PageHeader                    from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, toolbarRow, tableHeadCss,
} from "../../styles/pageStyles";

const TABLE_CLS = "sa-table-tbl";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "staff",   label: "Staff"   },
];

/* ── Filter label ───────────────────────────────────────────────────── */
const FL = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  }}>
    {children}
  </div>
);

/* ── Main component ─────────────────────────────────────────────────── */
const AttendanceTablePage = () => {
  const dispatch = useDispatch();

  const { list, filters, pagination, loading } = useSelector((s) => s.attendance);
  const { user }                = useSelector((s) => s.auth || {});
  const { schoolClasses = [] }  = useSelector((s) => s.schoolClass || {});
  const { schools = [] }        = useSelector((s) => s.school || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const isSuperAdmin = user?.role?.name === "Super Admin";
  const [saSchoolId,       setSaSchoolId]       = useState(null);
  const [saAcademicYearId, setSaAcademicYearId] = useState(null);
  const [yearLoading,      setYearLoading]       = useState(false);

  const schoolId       = isSuperAdmin ? saSchoolId       : (user?.school?._id || null);
  const academicYearId = isSuperAdmin ? saAcademicYearId : (selectedAcademicYear?._id || selectedAcademicYear || null);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c._id, label: c.name })),
    [classes],
  );

  const sectionOptions = useMemo(() => {
    const sel = classes.find((c) => c._id === filters.classId);
    return sel?.sections?.map((s) => ({ value: s._id, label: s.name })) || [];
  }, [classes, filters.classId]);

  /* ── Init ── */
  useEffect(() => {
    if (isSuperAdmin) dispatch(fetchSchools());
  }, [isSuperAdmin, dispatch]);

  /* ── Non-SA: load classes when school/year from global state changes ── */
  useEffect(() => {
    if (isSuperAdmin || !schoolId) return;
    dispatch(setAttendanceFilters({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [isSuperAdmin, schoolId, academicYearId, dispatch]);

  /* ── SA: fetch active year + classes when school is selected ── */
  const handleSASchoolChange = async (val) => {
    setSaSchoolId(val || null);
    setSaAcademicYearId(null);
    dispatch(setAttendanceFilters({ schoolId: val || null, classId: null, sectionId: null, page: 1 }));

    if (!val) return;

    setYearLoading(true);
    try {
      const result = await dispatch(fetchActiveAcademicYear(val)).unwrap();
      const yearId = result?._id || null;
      setSaAcademicYearId(yearId);
      dispatch(fetchSchoolClasses({ schoolId: val, academicYearId: yearId }));
    } catch {
      // No active year — still load classes without a year filter
      dispatch(fetchSchoolClasses({ schoolId: val }));
    } finally {
      setYearLoading(false);
    }
  };

  /* ── Re-fetch when filters change ── */
  useEffect(() => {
    if (!filters.schoolId) return;
    dispatch(fetchAttendance(filters));
  }, [filters, dispatch]);

  /* ── Update status ── */
  const handleStatus = (id, status) => {
    dispatch(updateAttendanceRecord({ id, payload: { status } }));
  };

  /* ── Delete ── */
  const handleDelete = (id) => {
    dispatch(deleteAttendanceRecord(id));
    message.success("Record deleted");
  };

  /* ── Table columns ── */
  const columns = [
    {
      title:  "Date",
      dataIndex: "date",
      width:  110,
      render: (v) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
          {dayjs(v).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      title:  "User",
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {row?.userId?.name || "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {row?.userId?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title:  "Role",
      dataIndex: "role",
      width:  100,
      render: (v) => (
        <Tag color="geekblue" style={{ fontSize: 11, textTransform: "capitalize" }}>
          {v || "—"}
        </Tag>
      ),
    },
    {
      title:  "Status",
      dataIndex: "status",
      width:  110,
      render: (status) => <StatusTag status={status} />,
    },
    {
      title:  "Actions",
      width:  200,
      render: (_, row) => (
        <Space size={4} wrap>
          <Button
            size="small"
            onClick={() => handleStatus(row._id, "present")}
            style={{ fontSize: 11, borderColor: "#16a34a", color: "#16a34a" }}
          >
            Present
          </Button>
          <Button
            size="small"
            onClick={() => handleStatus(row._id, "absent")}
            style={{ fontSize: 11, borderColor: "#dc2626", color: "#dc2626" }}
          >
            Absent
          </Button>
          <Popconfirm
            title="Delete this record?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(row._id)}
          >
            <Button danger size="small" style={{ fontSize: 11 }}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Records"
        subtitle="Browse, filter, update and delete attendance entries"
        icon={<UnorderedListOutlined />}
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 14,
          alignItems: "end",
        }}>

          {/* School — Super Admin only */}
          {isSuperAdmin && (
            <div>
              <FL>School</FL>
              <Select
                showSearch
                placeholder="Select school"
                style={{ width: "100%" }}
                value={saSchoolId || undefined}
                options={schoolOptions}
                allowClear
                loading={yearLoading}
                filterOption={(inp, opt) =>
                  opt.label.toLowerCase().includes(inp.toLowerCase())
                }
                onChange={handleSASchoolChange}
                suffixIcon={<BankOutlined />}
              />
              {saAcademicYearId === null && saSchoolId && !yearLoading && (
                <div style={{ fontSize: 11, color: "#d97706", marginTop: 4 }}>
                  No active academic year found for this school
                </div>
              )}
            </div>
          )}

          {/* Role */}
          <div>
            <FL>Role</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="All roles"
              allowClear
              value={filters.role || undefined}
              options={ROLE_OPTIONS}
              onChange={(v) => dispatch(setAttendanceFilters({ role: v || null, page: 1 }))}
              suffixIcon={<TeamOutlined />}
            />
          </div>

          {/* Class */}
          <div>
            <FL>Class</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="All classes"
              allowClear
              disabled={!schoolId}
              value={filters.classId || undefined}
              options={classOptions}
              onChange={(v) =>
                dispatch(setAttendanceFilters({ classId: v || null, sectionId: null, page: 1 }))
              }
            />
          </div>

          {/* Section */}
          <div>
            <FL>Section</FL>
            <Select
              style={{ width: "100%" }}
              placeholder="All sections"
              allowClear
              disabled={!filters.classId}
              value={filters.sectionId || undefined}
              options={sectionOptions}
              onChange={(v) =>
                dispatch(setAttendanceFilters({ sectionId: v || null, page: 1 }))
              }
            />
          </div>

          {/* Date */}
          <div>
            <FL>Date</FL>
            <DatePicker
              style={{ width: "100%" }}
              value={filters.date ? dayjs(filters.date) : null}
              allowClear
              placeholder="Any date"
              onChange={(v) =>
                dispatch(setAttendanceFilters({ date: v?.toISOString() || null, page: 1 }))
              }
              suffixIcon={<CalendarOutlined />}
            />
          </div>

          {/* Search button */}
          <div>
            <FL>&nbsp;</FL>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ width: "100%" }}
              disabled={!schoolId}
              onClick={() => dispatch(fetchAttendance(filters))}
              loading={loading}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={sectionPanel}>
        {!schoolId && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "var(--text-muted)" }}>
                {isSuperAdmin
                  ? "Select a school to view attendance records"
                  : "No school associated with your account"}
              </span>
            }
          />
        ) : (
          <Spin spinning={loading}>
            <Table
              className={TABLE_CLS}
              rowKey="_id"
              columns={columns}
              dataSource={list}
              pagination={{
                current:  pagination.page,
                pageSize: pagination.limit,
                total:    pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `${total} records`,
                onChange: (page, limit) =>
                  dispatch(setAttendanceFilters({ page, limit })),
              }}
              scroll={{ x: 680 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "32px 0", color: "var(--text-muted)" }}>
                    No attendance records found
                  </div>
                ),
              }}
            />
          </Spin>
        )}
      </div>
    </div>
  );
};

export default AttendanceTablePage;
