import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Spin, Typography, message } from "antd";
import {
  SearchOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  BankOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from "../../../features/subjectSlice.js";
import PageHeader from "../../../components/layout/PageHeader.jsx";

const { Text } = Typography;

const C = { primary: "#7c3aed", success: "#10b981", warning: "#f59e0b", danger: "#ef4444", info: "#06b6d4" };

/* ─── Pastel palette — one per subject card ──────────────────── */
const PASTEL = [
  { accent: "#7c3aed", light: "#ede9fe" },
  { accent: "#0369a1", light: "#e0f2fe" },
  { accent: "#047857", light: "#d1fae5" },
  { accent: "#b45309", light: "#fef3c7" },
  { accent: "#be123c", light: "#ffe4e6" },
  { accent: "#0e7490", light: "#cffafe" },
  { accent: "#7e22ce", light: "#f3e8ff" },
  { accent: "#be185d", light: "#fce7f3" },
];

/* ─── helpers ────────────────────────────────────────────────── */
const toDisplay = (v, fallback = "—") => {
  if (v == null) return fallback;
  const t = String(v).trim();
  return t.length ? t : fallback;
};

/* ─── Stat row ───────────────────────────────────────────────── */
const StatRow = ({ total, active, inactive, global: glob }) => (
  <div style={{
    display: "flex", gap: 1, background: "var(--border)",
    border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
    marginBottom: 16,
  }}>
    {[
      { icon: <BookOutlined />,         label: "Total",    value: total,    color: C.primary },
      { icon: <CheckCircleOutlined />,  label: "Active",   value: active,   color: C.success },
      { icon: <GlobalOutlined />,       label: "Global",   value: glob,     color: C.info    },
      { icon: <CloseCircleOutlined />,  label: "Inactive", value: inactive, color: C.danger  },
    ].map((s) => (
      <div key={s.label} style={{
        flex: 1, background: "var(--surface)", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${s.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: s.color, fontSize: 14,
        }}>
          {s.icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{s.label}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Subject card ───────────────────────────────────────────── */
const SubjectCard = ({ item, index, onEdit, onDelete }) => {
  const p    = PASTEL[index % PASTEL.length];
  const name = toDisplay(item?.name, "Unnamed");
  const canManage = !item?.isGlobal;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-soft)",
    }}>
      {/* Pastel top strip */}
      <div style={{ height: 4, background: p.accent, opacity: 0.7 }} />

      {/* Card header */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: p.light + "55",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: p.light, border: `1.5px solid ${p.accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: p.accent,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <Text strong style={{ fontSize: 13, color: "var(--text)" }}>{name}</Text>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
            background: item?.isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
            color: item?.isActive ? C.success : C.danger,
            border: `1px solid ${item?.isActive ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {item?.isActive
              ? <CheckCircleOutlined style={{ fontSize: 10 }} />
              : <CloseCircleOutlined style={{ fontSize: 10 }} />}
            {item?.isActive ? "Active" : "Inactive"}
          </span>
          {canManage && (
            <>
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => onEdit(item)} />
              <Popconfirm title="Delete this subject?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => onDelete(item)}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {/* Category / Type chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {item?.category && (
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 6,
              background: `${p.accent}12`, color: p.accent,
              border: `1px solid ${p.accent}25`,
            }}>
              {toDisplay(item.category)}
            </span>
          )}
          {item?.type && (
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 6,
              background: "var(--surface-soft)", color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
              {toDisplay(item.type)}
            </span>
          )}
        </div>

        {/* Marks + Scope row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Text style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            <BookOutlined style={{ marginRight: 4, color: p.accent }} />
            Pass{" "}
            <strong style={{ color: "var(--text)" }}>{toDisplay(item?.passMarks, "0")}</strong>
            {" / Max "}
            <strong style={{ color: "var(--text)" }}>{toDisplay(item?.maxMarks, "0")}</strong>
          </Text>

          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 99,
            display: "inline-flex", alignItems: "center", gap: 4,
            background: item?.isGlobal ? "rgba(6,182,212,0.1)" : "rgba(124,58,237,0.08)",
            color: item?.isGlobal ? C.info : C.primary,
            border: `1px solid ${item?.isGlobal ? "rgba(6,182,212,0.2)" : "rgba(124,58,237,0.2)"}`,
          }}>
            {item?.isGlobal
              ? <><GlobalOutlined style={{ fontSize: 10 }} /> Global</>
              : <><BankOutlined   style={{ fontSize: 10 }} /> {toDisplay(item?.schoolId?.name, "School")}</>
            }
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Page ───────────────────────────────────────────────────── */
const Subjects = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const { user }                   = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }   = useSelector((s) => s.academicYear || {});
  const { subjects = [], loading } = useSelector((s) => s.subject || {});
  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const refresh = () => dispatch(getAllSubjects({ page: 1, limit: 50, schoolId, academicYearId }));

  useEffect(() => {
    if (schoolId) refresh();
  }, [dispatch, schoolId, academicYearId]);

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    form.setFieldsValue({
      name: item.name,
      category: item.category,
      type: item.type,
      maxMarks: item.maxMarks,
      passMarks: item.passMarks,
      description: item.description,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    form.resetFields();
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editTarget) {
        await dispatch(updateSubject({ subjectId: editTarget._id, subjectData: values })).unwrap();
        message.success("Subject updated");
      } else {
        await dispatch(createSubject(values)).unwrap();
        message.success("Subject created");
      }
      closeModal();
      refresh();
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await dispatch(deleteSubject(item._id)).unwrap();
      message.success("Subject deleted");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete subject");
    }
  };

  const safe = useMemo(() => (Array.isArray(subjects) ? subjects : []), [subjects]);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return q ? safe.filter((s) => toDisplay(s?.name, "").toLowerCase().includes(q)) : safe;
  }, [safe, searchText]);

  const stats = useMemo(() => ({
    total:    safe.length,
    active:   safe.filter((s) =>  s?.isActive).length,
    inactive: safe.filter((s) => !s?.isActive).length,
    global:   safe.filter((s) =>  s?.isGlobal).length,
  }), [safe]);

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle={`Curriculum management · ${safe.length} subjects`}
        icon={<BookOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Subject
          </Button>
        }
      />

      <div style={{ padding: "20px 24px 40px" }}>
        {/* Stats */}
        <StatRow
          total={stats.total}
          active={stats.active}
          inactive={stats.inactive}
          global={stats.global}
        />

        {/* Toolbar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14, gap: 10, flexWrap: "wrap",
        }}>
          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing{" "}
            <strong style={{ color: C.primary }}>{filtered.length}</strong>
            {" "}of {safe.length} subjects
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />}
            placeholder="Search subjects…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220, fontSize: 13 }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", borderRadius: 12,
            background: "var(--surface)", border: "1px dashed var(--border)",
          }}>
            <BookOutlined style={{ fontSize: 36, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>No subjects found</Text>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {searchText ? `No results for "${searchText}"` : "No subjects added yet"}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {filtered.map((item, i) => (
              <SubjectCard key={item?._id || i} item={item} index={i} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <Modal
        title={editTarget ? "Edit Subject" : "Add Subject"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editTarget ? "Save Changes" : "Create"}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Mathematics" />
          </Form.Item>
          <Form.Item name="category" label="Category" initialValue="Core">
            <Select
              options={[
                { value: "Core", label: "Core" },
                { value: "Elective", label: "Elective" },
                { value: "Language", label: "Language" },
                { value: "Practical", label: "Practical" },
                { value: "Optional", label: "Optional" },
              ]}
            />
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue="Theory">
            <Select
              options={[
                { value: "Theory", label: "Theory" },
                { value: "Practical", label: "Practical" },
                { value: "Both", label: "Both" },
              ]}
            />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="maxMarks" label="Max Marks" initialValue={100}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="passMarks" label="Pass Marks" initialValue={33}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Subjects;
