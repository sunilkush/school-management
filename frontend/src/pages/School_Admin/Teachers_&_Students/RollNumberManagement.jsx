import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, Empty, Flex, InputNumber,
  Popconfirm, Row, Select, Space, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  CheckOutlined, CloseOutlined, EditOutlined, NumberOutlined,
  ReloadOutlined, SortAscendingOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import {
  autoAssignRollNumbers,
  fetchClassRollNumbers,
  updateRollNumber,
} from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;

/* ─── Gender color ───────────────────────────────────────── */
const GENDER_TAG = {
  Male:   { color: "var(--primary)", bg: "var(--primary-light)", border: "rgba(var(--primary-rgb), 0.19)" },
  Female: { color: "var(--pink-hover)", bg: "var(--pink-light)", border: "rgba(var(--pink-rgb), 0.19)" },
  Other:  { color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.08)", border: "rgba(var(--purple-rgb), 0.19)" },
};

export default function RollNumberManagement() {
  const dispatch = useDispatch();

  const { user }                      = useSelector((s) => s.auth);
  const { selectedAcademicYear }      = useSelector((s) => s.academicYear);
  const { schoolClasses = [] }        = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] }= useSelector((s) => s.section || {});
  const {
    rollNumberList = [],
    rollLoading    = false,
  } = useSelector((s) => s.students);

  const schoolId       = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedClass,   setSelectedClass]   = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingId,       setEditingId]       = useState(null); // enrollmentId being edited
  const [editingValue,    setEditingValue]    = useState(null); // new roll number value
  const [saving,          setSaving]          = useState(false);

  /* ── Load classes on mount ──────────────────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(getClassData({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  /* ── Load sections when class changes ───────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  /* ── Load roll numbers when class+section selected ──────── */
  useEffect(() => {
    if (schoolId && academicYearId && selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({
        schoolId, academicYearId,
        schoolClassId: selectedClass,
        sectionId: selectedSection,
      }));
    }
  }, [schoolId, academicYearId, selectedClass, selectedSection, dispatch]);

  /* ── Section options ────────────────────────────────────── */
  const sectionOptions = useMemo(
    () => (allSections || []).map((s) => ({ value: s._id, label: s.name })),
    [allSections]
  );

  /* ── Refresh ────────────────────────────────────────────── */
  const refresh = () => {
    if (selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({
        schoolId, academicYearId,
        schoolClassId: selectedClass,
        sectionId: selectedSection,
      }));
    }
  };

  /* ── Auto-assign ────────────────────────────────────────── */
  const handleAutoAssign = async () => {
    if (!selectedClass || !selectedSection) {
      message.warning("Select class and section first");
      return;
    }
    const res = await dispatch(autoAssignRollNumbers({
      schoolId, academicYearId,
      schoolClassId: selectedClass,
      sectionId: selectedSection,
    }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success(`Roll numbers assigned to ${res.payload?.assignedCount || 0} students`);
      refresh();
    } else {
      message.error(res.payload || "Auto-assign failed");
    }
  };

  /* ── Save edited roll number ────────────────────────────── */
  const saveEdit = async (enrollmentId) => {
    if (!editingValue || editingValue < 1) {
      message.warning("Roll number must be at least 1");
      return;
    }
    setSaving(true);
    const res = await dispatch(updateRollNumber({ enrollmentId, rollNumber: editingValue }));
    setSaving(false);
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Roll number updated");
      setEditingId(null);
      setEditingValue(null);
      refresh();
    } else {
      message.error(res.payload || "Update failed");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue(null);
  };

  /* ── Stats ──────────────────────────────────────────────── */
  const assignedCount   = rollNumberList.filter((s) => s.rollNumber != null).length;
  const unassignedCount = rollNumberList.length - assignedCount;

  /* ── Table columns ──────────────────────────────────────── */
  const columns = [
    {
      title: "Roll No.",
      dataIndex: "rollNumber",
      width: 120,
      sorter: (a, b) => (a.rollNumber || 999) - (b.rollNumber || 999),
      defaultSortOrder: "ascend",
      render: (val, row) => {
        const isEditing = editingId === row._id;
        if (isEditing) {
          return (
            <Flex align="center" gap={4}>
              <InputNumber
                size="small"
                min={1}
                max={999}
                value={editingValue}
                onChange={setEditingValue}
                style={{ width: 70 }}
                autoFocus
                onPressEnter={() => saveEdit(row._id)}
              />
              <Tooltip title="Save">
                <Button
                  size="small" type="primary" icon={<CheckOutlined />}
                  loading={saving} onClick={() => saveEdit(row._id)}
                />
              </Tooltip>
              <Tooltip title="Cancel">
                <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
              </Tooltip>
            </Flex>
          );
        }
        return (
          <Flex align="center" gap={6}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: val ? "var(--primary-light)" : "var(--surface-soft)",
              border: `1.5px solid ${val ? "rgba(var(--primary-rgb), 0.4)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              color: val ? "var(--primary-hover)" : "var(--text-muted)",
              flexShrink: 0,
            }}>
              {val ?? "—"}
            </div>
            <Button
              size="small" type="link" icon={<EditOutlined />}
              style={{ padding: 0 }}
              onClick={() => { setEditingId(row._id); setEditingValue(val ?? 1); }}
            />
          </Flex>
        );
      },
    },
    {
      title: "Student Name",
      dataIndex: "studentName",
      sorter: (a, b) => a.studentName?.localeCompare(b.studentName),
      render: (name, row) => (
        <Flex align="center" gap={10}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: GENDER_TAG[row.gender]?.bg || "var(--surface-soft)",
            border: `1.5px solid ${GENDER_TAG[row.gender]?.border || "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
            color: GENDER_TAG[row.gender]?.color || "var(--text-secondary)",
            flexShrink: 0,
          }}>
            {name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.email || ""}</div>
          </div>
        </Flex>
      ),
    },
    {
      title: "Reg. No.",
      dataIndex: "registrationNumber",
      width: 150,
      render: (v) => <Text code style={{ fontSize: 11 }}>{v || "—"}</Text>,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      width: 90,
      render: (v) => {
        const m = GENDER_TAG[v] || {};
        return v ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
            color: m.color, background: m.bg, border: `1px solid ${m.color}30`,
          }}>
            {v}
          </span>
        ) : "—";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 90,
      render: (v) => (
        <Tag color={v === "Active" ? "success" : "default"} style={{ borderRadius: 99, fontSize: 11 }}>
          {v || "—"}
        </Tag>
      ),
    },
  ];

  const canFilter = schoolId && academicYearId;

  return (
    <>
      <style>{tableHeadCss("rn-tbl")}</style>

      <PageHeader
        title="Roll Number Management"
        subtitle="Assign and manage student roll numbers by class and section"
        icon={<NumberOutlined />}
        extra={
          <Space wrap>
            {selectedClass && selectedSection && (
              <Button icon={<ReloadOutlined />} onClick={refresh} loading={rollLoading}>
                Refresh
              </Button>
            )}
          </Space>
        }
      />

      <div style={pageWrapper}>

        {!canFilter && (
          <Alert
            type="warning"
            showIcon
            message="Please select an active academic year to manage roll numbers."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        {/* ── Filter Panel ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}>
              <NumberOutlined style={{ fontSize: 17 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                Select Class & Section
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Choose a class and section to view and manage roll numbers
              </Text>
            </div>
          </Flex>

          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={10} md={7}>
              <Select
                placeholder="Select Class"
                style={{ width: "100%" }}
                value={selectedClass}
                onChange={(v) => { setSelectedClass(v); setSelectedSection(null); setEditingId(null); }}
                options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))}
                showSearch
                optionFilterProp="label"
                disabled={!canFilter}
                size="large"
              />
            </Col>
            <Col xs={24} sm={10} md={7}>
              <Select
                placeholder="Select Section"
                style={{ width: "100%" }}
                value={selectedSection}
                onChange={(v) => { setSelectedSection(v); setEditingId(null); }}
                options={sectionOptions}
                showSearch
                optionFilterProp="label"
                disabled={!selectedClass}
                size="large"
              />
            </Col>
            <Col xs={24} sm={24} md={10}>
              {selectedClass && selectedSection && rollNumberList.length > 0 && (
                <Popconfirm
                  title="Auto-assign roll numbers"
                  description="This will assign roll numbers 1, 2, 3... in alphabetical order by student name. Existing roll numbers will be overwritten."
                  onConfirm={handleAutoAssign}
                  okText="Yes, Auto-Assign"
                  cancelText="Cancel"
                >
                  <Button
                    icon={<SortAscendingOutlined />}
                    loading={rollLoading}
                    type="primary"
                    size="large"
                  >
                    Auto-Assign (A → Z)
                  </Button>
                </Popconfirm>
              )}
            </Col>
          </Row>
        </div>

        {/* ── Stats ────────────────────────────────────────── */}
        {rollNumberList.length > 0 && (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[
              { label: "Total Students", value: rollNumberList.length, color: "var(--primary)", emoji: "👨‍🎓" },
              { label: "Assigned",       value: assignedCount,         color: "var(--success)", emoji: "✅" },
              { label: "Unassigned",     value: unassignedCount,       color: "var(--warning-hover)", emoji: "⚠️" },
            ].map((s) => (
              <Col xs={8} key={s.label}>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-muted)",
                  borderTop: `4px solid ${s.color}`,
                  borderRadius: 14, padding: "14px 18px",
                }}>
                  <Flex align="center" gap={10}>
                    <div style={{ fontSize: 24 }}>{s.emoji}</div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                        {s.label}
                      </div>
                    </div>
                  </Flex>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* ── Table ────────────────────────────────────────── */}
        {selectedClass && selectedSection ? (
          <div style={sectionPanel}>
            <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
                Student Roll Numbers
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Click ✏️ to edit a roll number · Click "Auto-Assign" to set all at once
              </Text>
            </Flex>

            <Table
              className="rn-tbl"
              rowKey="_id"
              columns={columns}
              dataSource={rollNumberList}
              loading={rollLoading}
              size="middle"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 20, showTotal: (t) => `${t} students` }}
              locale={{
                emptyText: (
                  <Empty
                    description="No students found in this class-section"
                    style={{ padding: "40px 0" }}
                  />
                ),
              }}
              rowClassName={(r) => r.rollNumber == null ? "row-unassigned" : ""}
            />

            <style>{`
              .row-unassigned td { opacity: 0.7; }
            `}</style>
          </div>
        ) : (
          !rollLoading && (
            <div style={{ ...sectionPanel, textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔢</div>
              <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                Select a Class & Section
              </Text>
              <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Choose a class and section from the dropdowns above to view and manage roll numbers.
              </Text>
            </div>
          )
        )}
      </div>
    </>
  );
}
