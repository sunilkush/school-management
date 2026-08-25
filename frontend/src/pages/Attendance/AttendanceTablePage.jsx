import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, DatePicker, Button, Tag, Empty, Popconfirm,
  message, Drawer, Form, Input, TimePicker, Tooltip,
} from "antd";
import {
  BankOutlined, CalendarOutlined, TeamOutlined, UnorderedListOutlined,
  SearchOutlined, EditOutlined, DeleteOutlined, LoginOutlined,
  LogoutOutlined, AimOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchAttendance, deleteAttendanceRecord, updateAttendanceRecord,
  setAttendanceFilters,
} from "../../features/attendanceSlice";
import { fetchSchoolClasses }      from "../../features/schoolClassSlice";
import { fetchSchools }            from "../../features/schoolSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import PageHeader                  from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, tableHeadCss,
} from "../../styles/pageStyles";

const TABLE_CLS = "sa-att-tbl";

/* ── theme ── */
const C = {
  primary:    "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  success:    "var(--success)", successLight: "var(--success-light)",
  warning:    "var(--warning)", warningLight: "var(--warning-light)",
  danger:     "var(--danger)", dangerLight:  "var(--danger-light)",
  purple:     "var(--purple)", purpleLight:  "rgba(var(--purple-rgb), 0.12)",
  cyan:       "var(--cyan)", cyanLight:    "var(--cyan-light)",
  accent:     "var(--accent)", accentLight:  "var(--accent-light)",
  border:     "var(--border)", text:         "var(--text)",
  textSub:    "var(--text-secondary)", textMuted:    "var(--text-muted)",
  surface:    "var(--surface)", surfaceSoft:  "var(--surface-soft)",
};

const STATUS_CFG = {
  present: { color: C.success,  bg: C.successLight, border: "var(--success-light)", label: "Present"  },
  absent:  { color: C.danger,   bg: C.dangerLight,  border: "var(--danger-light)", label: "Absent"   },
  late:    { color: C.warning,  bg: C.warningLight, border: "var(--warning)", label: "Late"     },
  halfday: { color: C.purple,   bg: C.purpleLight,  border: "rgba(var(--purple-rgb), 0.5)", label: "Half Day" },
  leave:   { color: C.cyan,     bg: C.cyanLight,    border: "rgba(var(--cyan-rgb), 0.5)", label: "On Leave" },
};

const ROLE_OPTIONS = [
  { value: "student",          label: "Student"          },
  { value: "teacher",          label: "Teacher"          },
  { value: "staff",            label: "Staff"            },
  { value: "support_staff",    label: "Support Staff"    },
  { value: "accountant",       label: "Accountant"       },
  { value: "principal",        label: "Principal"        },
  { value: "vice_principal",   label: "Vice Principal"   },
  { value: "librarian",        label: "Librarian"        },
  { value: "hostel_warden",    label: "Hostel Warden"    },
  { value: "transport_manager",label: "Transport Manager"},
];

/* ── helpers ── */
const FL = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
    {children}
  </div>
);

function fmtTime(d) { return d ? dayjs(d).format("hh:mm A") : null; }

function workingHrs(ci, co) {
  if (!ci || !co) return null;
  const diff = new Date(co) - new Date(ci);
  if (diff <= 0) return null;
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status];
  if (!cfg) return <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 20, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const AttendanceTablePage = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { list, filters, pagination, loading } = useSelector((s) => s.attendance);
  const { user }               = useSelector((s) => s.auth || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { schools = [] }       = useSelector((s) => s.school || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const isSuperAdmin = user?.role?.name === "Super Admin";

  const [saSchoolId,       setSaSchoolId]       = useState(null);
  const [saAcademicYearId, setSaAcademicYearId] = useState(null);
  const [yearLoading,      setYearLoading]       = useState(false);
  const [editRecord,       setEditRecord]        = useState(null);
  const [editLoading,      setEditLoading]       = useState(false);

  const schoolId       = isSuperAdmin ? saSchoolId       : (user?.school?._id || null);
  const academicYearId = isSuperAdmin ? saAcademicYearId : (selectedAcademicYear?._id || null);

  const schoolOptions = useMemo(() => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label), [schools]);
  const classes = useMemo(() => { if (Array.isArray(schoolClasses)) return schoolClasses; if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes; return []; }, [schoolClasses]);
  const classOptions   = useMemo(() => classes.map((c) => ({ value: c._id, label: c.name })), [classes]);
  const sectionOptions = useMemo(() => { const sel = classes.find((c) => c._id === filters.classId); return sel?.sections?.map((s) => ({ value: s._id, label: s.name })) || []; }, [classes, filters.classId]);

  useEffect(() => { if (isSuperAdmin) dispatch(fetchSchools()); }, [isSuperAdmin, dispatch]);

  useEffect(() => {
    if (isSuperAdmin || !schoolId) return;
    dispatch(setAttendanceFilters({ schoolId }));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [isSuperAdmin, schoolId, academicYearId, dispatch]);

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
    } catch { dispatch(fetchSchoolClasses({ schoolId: val })); }
    finally { setYearLoading(false); }
  };

  useEffect(() => { if (filters.schoolId) dispatch(fetchAttendance(filters)); }, [filters, dispatch]);

  /* ── Summary stats from loaded list ── */
  const stats = useMemo(() => {
    const s = { total: list.length, present: 0, absent: 0, late: 0, gpsVerified: 0 };
    list.forEach((r) => {
      if (r.status === "present") s.present++;
      if (r.status === "absent")  s.absent++;
      if (r.status === "late")    s.late++;
      if (r.gpsVerified)          s.gpsVerified++;
    });
    return s;
  }, [list]);

  /* ── Edit drawer ── */
  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue({
      status:    record.status,
      checkInAt:  record.checkInAt  ? dayjs(record.checkInAt)  : null,
      checkOutAt: record.checkOutAt ? dayjs(record.checkOutAt) : null,
      remarks:   record.remarks || "",
    });
  };

  const handleSaveEdit = async () => {
    let values;
    try { values = await form.validateFields(); } catch { return; }
    setEditLoading(true);
    try {
      await dispatch(updateAttendanceRecord({
        id: editRecord._id,
        payload: {
          status:    values.status,
          remarks:   values.remarks || "",
          checkInAt:  values.checkInAt  ? values.checkInAt.toISOString()  : null,
          checkOutAt: values.checkOutAt ? values.checkOutAt.toISOString() : null,
        },
      })).unwrap();
      message.success("Attendance record updated");
      setEditRecord(null);
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to update record");
    } finally { setEditLoading(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAttendanceRecord(id)).unwrap();
      message.success("Record deleted");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to delete record");
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      width: 110,
      render: (v) => (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
          {dayjs(v).format("DD MMM YYYY")}
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>
            {dayjs(v).format("ddd")}
          </div>
        </div>
      ),
    },
    {
      title: "User",
      render: (_, row) => {
        const name  = row?.userId?.name  || "—";
        const email = row?.userId?.email || "";
        const initial = name[0]?.toUpperCase() || "?";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: C.primaryLighter, color: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13,
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{name}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      width: 120,
      render: (v) => (
        <Tag color="geekblue" style={{ fontSize: 11, textTransform: "capitalize", borderRadius: 6 }}>
          {(v || "—").replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: "Check-In",
      width: 100,
      render: (_, row) => {
        const t = fmtTime(row.checkInAt);
        return t ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.success, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
            <LoginOutlined style={{ fontSize: 11 }} /> {t}
          </span>
        ) : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>;
      },
    },
    {
      title: "Check-Out",
      width: 100,
      render: (_, row) => {
        const t = fmtTime(row.checkOutAt);
        return t ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.danger, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
            <LogoutOutlined style={{ fontSize: 11 }} /> {t}
          </span>
        ) : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>;
      },
    },
    {
      title: "Working Hrs",
      width: 105,
      render: (_, row) => {
        const wh = workingHrs(row.checkInAt, row.checkOutAt);
        return wh ? (
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <ClockCircleOutlined style={{ fontSize: 11 }} /> {wh}
          </span>
        ) : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>;
      },
    },
    {
      title: "GPS",
      width: 80,
      render: (_, row) =>
        row.gpsVerified ? (
          <Tooltip title={row.distanceFromSchool != null ? `${row.distanceFromSchool}m from school` : "GPS Verified"}>
            <span style={{ color: C.accent, fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
              <AimOutlined /> Verified
            </span>
          </Tooltip>
        ) : <span style={{ color: C.textMuted, fontSize: 11 }}>—</span>,
    },
    {
      title: "Actions",
      width: 100,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(row)}
            style={{ borderColor: C.primary, color: C.primary, borderRadius: 6, fontSize: 12 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this record?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(row._id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ borderRadius: 6, fontSize: 12 }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Records"
        subtitle="View, edit and manage all attendance entries with check-in/out times"
        icon={<UnorderedListOutlined />}
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>

          {isSuperAdmin && (
            <div>
              <FL>School</FL>
              <Select
                showSearch placeholder="Select school" style={{ width: "100%" }}
                value={saSchoolId || undefined} options={schoolOptions}
                allowClear loading={yearLoading}
                filterOption={(inp, opt) => opt.label.toLowerCase().includes(inp.toLowerCase())}
                onChange={handleSASchoolChange}
                suffixIcon={<BankOutlined />}
              />
              {saAcademicYearId === null && saSchoolId && !yearLoading && (
                <div style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>No active academic year</div>
              )}
            </div>
          )}

          <div>
            <FL>Role</FL>
            <Select
              style={{ width: "100%" }} placeholder="All roles" allowClear
              value={filters.role || undefined} options={ROLE_OPTIONS}
              onChange={(v) => dispatch(setAttendanceFilters({ role: v || null, page: 1 }))}
              suffixIcon={<TeamOutlined />}
            />
          </div>

          <div>
            <FL>Class</FL>
            <Select
              style={{ width: "100%" }} placeholder="All classes" allowClear
              disabled={!schoolId} value={filters.classId || undefined} options={classOptions}
              onChange={(v) => dispatch(setAttendanceFilters({ classId: v || null, sectionId: null, page: 1 }))}
            />
          </div>

          <div>
            <FL>Section</FL>
            <Select
              style={{ width: "100%" }} placeholder="All sections" allowClear
              disabled={!filters.classId} value={filters.sectionId || undefined} options={sectionOptions}
              onChange={(v) => dispatch(setAttendanceFilters({ sectionId: v || null, page: 1 }))}
            />
          </div>

          <div>
            <FL>Date</FL>
            <DatePicker
              style={{ width: "100%" }}
              value={filters.date ? dayjs(filters.date) : null}
              allowClear placeholder="Any date"
              onChange={(v) => dispatch(setAttendanceFilters({ date: v?.toISOString() || null, page: 1 }))}
              suffixIcon={<CalendarOutlined />}
            />
          </div>

          <div>
            <FL>&nbsp;</FL>
            <Button
              type="primary" icon={<SearchOutlined />}
              style={{ width: "100%" }}
              disabled={!schoolId} loading={loading}
              onClick={() => dispatch(fetchAttendance(filters))}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {list.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { key: "total",       label: "Total",         color: C.primary,  bg: C.primaryLighter, icon: <UnorderedListOutlined /> },
            { key: "present",     label: "Present",       color: C.success,  bg: C.successLight,   icon: <CheckCircleOutlined />  },
            { key: "absent",      label: "Absent",        color: C.danger,   bg: C.dangerLight,    icon: <CloseCircleOutlined />  },
            { key: "late",        label: "Late",          color: C.warning,  bg: C.warningLight,   icon: <ClockCircleOutlined />  },
            { key: "gpsVerified", label: "GPS Verified",  color: C.accent,   bg: C.accentLight,    icon: <AimOutlined />          },
          ].map(({ key, label, color, bg, icon }) => (
            <div key={key} style={{
              background: bg, borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 100,
              border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${color} 13%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 14 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{stats[key]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ ...sectionPanel, marginTop: 14, overflow: "hidden", padding: 0 }}>
        {!schoolId && !loading ? (
          <div style={{ padding: 40 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: C.textMuted }}>{isSuperAdmin ? "Select a school to view attendance records" : "No school associated with your account"}</span>}
            />
          </div>
        ) : (
          <>
            {/* Loading bar — non-blocking, above the table */}
            <style>{`@keyframes att-progress{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}`}</style>
            {loading && (
              <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                animation: "att-progress 1.2s ease-in-out infinite",
              }} />
            )}
            <div style={{ overflowX: "auto" }}>
              <table className={TABLE_CLS} style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surfaceSoft }}>
                    {columns.map((col) => (
                      <th key={col.title} style={{
                        padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                        color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em",
                        borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                        width: col.width,
                      }}>
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: "40px 0", textAlign: "center", color: C.textMuted }}>
                        {loading ? "Loading records…" : "No attendance records found"}
                      </td>
                    </tr>
                  ) : list.map((row) => (
                    <tr
                      key={row._id}
                      style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceSoft)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {columns.map((col) => (
                        <td key={col.title} style={{ padding: "11px 14px" }}>
                          {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    size="small" disabled={pagination.page <= 1 || loading}
                    onClick={() => dispatch(setAttendanceFilters({ page: pagination.page - 1 }))}
                    style={{ borderRadius: 6 }}
                  >
                    Prev
                  </Button>
                  <span style={{ padding: "0 12px", lineHeight: "24px", fontSize: 12, color: C.textSub }}>
                    {pagination.page} / {pagination.totalPages || Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <Button
                    size="small" disabled={pagination.page >= (pagination.totalPages || 1) || loading}
                    onClick={() => dispatch(setAttendanceFilters({ page: pagination.page + 1 }))}
                    style={{ borderRadius: 6 }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Drawer ── */}
      <Drawer
        title={
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Edit Attendance Record</div>
            {editRecord && (
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400, marginTop: 2 }}>
                {editRecord?.userId?.name || "—"} · {dayjs(editRecord?.date).format("DD MMM YYYY")}
              </div>
            )}
          </div>
        }
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        width={400}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button type="primary" loading={editLoading} onClick={handleSaveEdit} style={{ background: C.primary, borderColor: C.primary }}>
              Save Changes
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>

          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>STATUS</span>} name="status" rules={[{ required: true, message: "Status is required" }]}>
            <Select size="large" style={{ borderRadius: 8 }}>
              {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                <Select.Option key={val} value={val}>
                  <span style={{ color: cfg.color, fontWeight: 700 }}>● {cfg.label}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>CHECK-IN TIME</span>}
              name="checkInAt"
            >
              <TimePicker
                format="hh:mm A"
                use12Hours
                size="large"
                style={{ width: "100%", borderRadius: 8 }}
                placeholder="Select time"
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>CHECK-OUT TIME</span>}
              name="checkOutAt"
            >
              <TimePicker
                format="hh:mm A"
                use12Hours
                size="large"
                style={{ width: "100%", borderRadius: 8 }}
                placeholder="Select time"
              />
            </Form.Item>
          </div>

          {/* Live working hours preview */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.checkInAt !== curr.checkInAt || prev.checkOutAt !== curr.checkOutAt}>
            {({ getFieldValue }) => {
              const ci = getFieldValue("checkInAt");
              const co = getFieldValue("checkOutAt");
              const wh = ci && co ? workingHrs(ci.toDate(), co.toDate()) : null;
              return wh ? (
                <div style={{
                  background: C.accentLight, borderRadius: 8, padding: "8px 12px",
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                  color: C.accent, fontWeight: 700, fontSize: 13,
                  border: `1px solid color-mix(in srgb, ${C.accent} 19%, transparent)`,
                }}>
                  <ClockCircleOutlined /> Working Hours: {wh}
                </div>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>REMARKS</span>}
            name="remarks"
          >
            <Input.TextArea
              rows={3} placeholder="Optional remarks..."
              maxLength={300} showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* Record info */}
          {editRecord && (
            <div style={{ background: C.surfaceSoft, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Record Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Date",   value: dayjs(editRecord.date).format("DD MMM YYYY")   },
                  { label: "Role",   value: (editRecord.role || "—").replace(/_/g, " ")     },
                  { label: "GPS",    value: editRecord.gpsVerified ? `Yes · ${editRecord.distanceFromSchool ?? ""}m` : "No" },
                  { label: "Marked By", value: editRecord?.markedBy?.name || "—"            },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default AttendanceTablePage;
