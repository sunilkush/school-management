import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Modal, Select, Button, Space, Tooltip, Popconfirm, message, Spin, Input, Empty,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, SearchOutlined,
} from "@ant-design/icons";
import { GraduationCap, Users, BookOpen, Layers } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClassTeacherAssignments,
  assignClassTeacher,
  removeClassTeacher,
} from "../../../features/classTeacherSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchAllUser } from "../../../features/authSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill, toolbarRow,
  tableContainer, tableHeadCss, avatarStyle, modalTitle,
} from "../../../styles/pageStyles";

// Class names are plain strings like "Class 10", "Nursery", "UKG" — a plain alphabetical sort
// would put "Class 10" before "Class 2". Pre-primary names get a fixed rank ahead of any numbered
// class (matching real school progression); numbered classes sort on the number they contain;
// anything unrecognized falls back to alphabetical, after the numbered classes.
const PRE_PRIMARY_RANK = { "pre-nursery": 0, "playgroup": 1, "nursery": 2, "lkg": 3, "kg": 3, "ukg": 4 };

const classSortKey = (name) => {
  const n = (name || "").trim().toLowerCase();
  if (n in PRE_PRIMARY_RANK) return PRE_PRIMARY_RANK[n];
  const match = n.match(/(\d+)/);
  if (match) return 100 + Number(match[1]);
  return 9999;
};

const compareClassNames = (a, b) => {
  const diff = classSortKey(a) - classSortKey(b);
  return diff !== 0 ? diff : (a || "").localeCompare(b || "");
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const ClassTeacherAssignmentPage = () => {
  const dispatch = useDispatch();
  const { assignments, loading, saving } = useSelector((s) => s.classTeacher);
  const { schoolClasses = [] }           = useSelector((s) => s.schoolClass);
  const { sections = [] }                = useSelector((s) => s.section);
  const { users = [], user: me }         = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear || {});

  const schoolId = me?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [modal, setModal] = useState({ open: false });
  const [form,  setForm]  = useState({ teacherId: null, schoolClassId: null, sectionId: null });
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => { setPage(1); }, [searchText]);

  // selectedAcademicYear is normally populated as a side effect of <AcademicYearSwitcher> mounting
  // in the Topbar — but that component is skipped entirely on mobile widths (and could in theory
  // mount after this page), so relying on it alone left academicYearId null and every class/section
  // list here unscoped. Fetching it directly makes this page correct on its own; the shared reducer
  // (academicYearSlice.js) is idempotent about this — repeating the fetch is harmless.
  useEffect(() => {
    if (!schoolId) return;
    if (!activeYear) dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId, activeYear]);

  // Class/Section lists are fetched scoped to the active academic year — both endpoints already
  // accept academicYearId server-side, this was previously just not being sent. Only gated on
  // schoolId, not academicYearId: when selectedAcademicYear hasn't loaded into redux yet,
  // academicYearId is simply omitted and every endpoint here already falls back to the school's
  // active year on its own — gating the whole effect on it caused the entire page (including the
  // teacher list, unrelated to academic year at all) to silently fetch nothing. Once
  // fetchActiveAcademicYear above resolves, academicYearId changes and this effect re-runs to
  // narrow everything down to the active session.
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchClassTeacherAssignments(academicYearId ? { academicYearId } : {}));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchSections({ schoolId, academicYearId }));
    dispatch(fetchAllUser({ isActive: true }));
  }, [dispatch, schoolId, academicYearId]);

  // Only teachers / class teachers for the dropdown
  const teacherOptions = useMemo(() =>
    users
      .filter((u) => {
        const rn = u?.role?.name?.toLowerCase();
        return (
          ["teacher", "class teacher", "sports teacher"].includes(rn) &&
          (u?.school?._id === schoolId || u?.schoolId === schoolId)
        );
      })
      .map((u) => ({ value: u._id, label: `${u.name} (${u.role?.name})` })),
    [users, schoolId]
  );

  const classOptions = useMemo(() =>
    [...schoolClasses]
      .sort((a, b) => compareClassNames(a.name || a.grade, b.name || b.grade))
      .map((c) => ({ value: c._id, label: c.name || c.grade })),
    [schoolClasses]
  );

  const sectionOptions = useMemo(() =>
    sections
      .filter((s) => !form.schoolClassId || s.schoolClassId === form.schoolClassId)
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((s) => ({ value: s._id, label: s.name })),
    [sections, form.schoolClassId]
  );

  const stats = useMemo(() => {
    const wholeClass = assignments.filter((a) => !a.sectionId).length;
    const sectionLevel = assignments.length - wholeClass;
    return {
      total: assignments.length,
      classesThisSession: schoolClasses.length,
      wholeClass,
      sectionLevel,
    };
  }, [assignments, schoolClasses]);

  const filteredAssignments = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const base = q
      ? assignments.filter((a) => {
          const teacher = (a.teacherId?.name || "").toLowerCase();
          const cls = (a.schoolClassId?.name || a.schoolClassId?.grade || "").toLowerCase();
          const sec = (a.sectionId?.name || "").toLowerCase();
          return teacher.includes(q) || cls.includes(q) || sec.includes(q);
        })
      : assignments;

    // The backend returns these in raw insertion order — sort by class (Nursery → Class 12), then
    // by section within a class, so the table reads in the same order a school admin thinks in.
    return [...base].sort((a, b) => {
      const classDiff = compareClassNames(
        a.schoolClassId?.name || a.schoolClassId?.grade,
        b.schoolClassId?.name || b.schoolClassId?.grade
      );
      if (classDiff !== 0) return classDiff;
      return (a.sectionId?.name || "").localeCompare(b.sectionId?.name || "");
    });
  }, [assignments, searchText]);

  const openModal = () => {
    setForm({ teacherId: null, schoolClassId: null, sectionId: null });
    setModal({ open: true });
  };

  const handleAssign = async () => {
    if (!form.teacherId || !form.schoolClassId) {
      return message.warning("Teacher and Class are required");
    }
    try {
      await dispatch(assignClassTeacher({ ...form, academicYearId })).unwrap();
      message.success("Class teacher assigned");
      setModal({ open: false });
      dispatch(fetchClassTeacherAssignments({ academicYearId }));
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to assign");
    }
  };

  const handleRemove = async (id) => {
    try {
      await dispatch(removeClassTeacher(id)).unwrap();
      message.success("Assignment removed");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to remove");
    }
  };

  const columns = [
    {
      title: "#",
      width: 48,
      render: (_, __, index) => (
        <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {(page - 1) * PAGE_SIZE + index + 1}
        </span>
      ),
    },
    {
      title: "Teacher",
      render: (_, r) => (
        <Space>
          <div style={avatarStyle(r.teacherId?.name, 34)}>
            {(r.teacherId?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {r.teacherId?.name || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {r.teacherId?.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Class",
      render: (_, r) => (
        <span style={pill("#2563EB", "rgba(219,234,254,0.4)")}>
          {r.schoolClassId?.name || r.schoolClassId?.grade || "—"}
        </span>
      ),
    },
    {
      title: "Section",
      render: (_, r) => r.sectionId?.name
        ? <span style={pill("#0D9488", "rgba(204,251,241,0.5)")}>{r.sectionId.name}</span>
        : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Whole class</span>,
    },
    {
      title: "Session",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {r.academicYearId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      align: "right",
      render: (_, r) => (
        <Popconfirm
          title="Remove this class teacher assignment?"
          okText="Yes, Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleRemove(r._id)}
        >
          <Tooltip title="Remove">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Class Teacher Assignments"
        subtitle={
          selectedAcademicYear?.name
            ? `Active session: ${selectedAcademicYear.name} — classes below are scoped to this session`
            : "Assign a teacher as class in-charge for each class/section"
        }
        icon={<GraduationCap size={20} />}
        extra={
          <Space wrap>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => dispatch(fetchClassTeacherAssignments(academicYearId ? { academicYearId } : {}))}
              />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              Assign Class Teacher
            </Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<Users size={18} />}        label="Assignments"        value={stats.total}            color="#7C3AED" />
        <StatCard icon={<BookOpen size={18} />}      label="Classes This Session" value={stats.classesThisSession} color="#2563EB" />
        <StatCard icon={<GraduationCap size={18} />} label="Whole-Class"         value={stats.wholeClass}       color="#15803D" />
        <StatCard icon={<Layers size={18} />}        label="Section-Level"       value={stats.sectionLevel}     color="#0D9488" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={toolbarRow}>
          <Input
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by teacher, class or section"
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            style={{ width: 280 }}
          />
        </div>

        <style>{tableHeadCss("cta-tbl")}</style>
        <div className="cta-tbl" style={tableContainer}>
          <Spin spinning={loading}>
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={filteredAssignments}
              pagination={{ current: page, pageSize: PAGE_SIZE, showSizeChanger: false, onChange: setPage }}
              scroll={{ x: 700 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "32px 0" }}>
                    <Empty
                      description={
                        searchText
                          ? "No assignments match your search"
                          : 'No class teacher assignments yet this session. Click "Assign Class Teacher" to begin.'
                      }
                    />
                  </div>
                ),
              }}
            />
          </Spin>
        </div>
      </div>

      {/* ── Assign Modal ── */}
      <Modal
        open={modal.open}
        title={modalTitle(<GraduationCap size={18} />, "Assign Class Teacher", selectedAcademicYear?.name)}
        onOk={handleAssign}
        onCancel={() => setModal({ open: false })}
        okText="Assign"
        confirmLoading={saving}
        width={460}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              Teacher <span style={{ color: "var(--danger)" }}>*</span>
            </div>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Select teacher…"
              value={form.teacherId}
              onChange={(v) => setForm((f) => ({ ...f, teacherId: v }))}
              optionFilterProp="label"
              options={teacherOptions}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              Class <span style={{ color: "var(--danger)" }}>*</span>
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class…"
              value={form.schoolClassId}
              onChange={(v) => setForm((f) => ({ ...f, schoolClassId: v, sectionId: null }))}
              options={classOptions}
              notFoundContent="No classes in the active session"
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              Section <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(optional — leave blank for whole class)</span>
            </div>
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Select section…"
              value={form.sectionId}
              onChange={(v) => setForm((f) => ({ ...f, sectionId: v || null }))}
              options={sectionOptions}
              disabled={!form.schoolClassId}
            />
          </div>

          <div style={{
            background: "var(--surface-soft)", borderRadius: 10,
            padding: "10px 14px", fontSize: 12, color: "var(--text-muted)",
          }}>
            One teacher can be class in-charge of only one class per academic year.
            Assigning a new teacher will automatically replace the current one.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassTeacherAssignmentPage;
