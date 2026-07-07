import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Modal, Select, Button, Space, Tooltip, Popconfirm, Tag, message, Spin,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, TeamOutlined,
} from "@ant-design/icons";
import { GraduationCap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClassTeacherAssignments,
  assignClassTeacher,
  removeClassTeacher,
} from "../../../features/classTeacherSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchAllUser } from "../../../features/authSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";

const ClassTeacherAssignmentPage = () => {
  const dispatch = useDispatch();
  const { assignments, loading, saving } = useSelector((s) => s.classTeacher);
  const { schoolClasses = [] }           = useSelector((s) => s.schoolClass);
  const { sections = [] }                = useSelector((s) => s.sections);
  const { users = [], user: me }         = useSelector((s) => s.auth);
  const schoolId = me?.school?._id;

  const [modal, setModal] = useState({ open: false });
  const [form,  setForm]  = useState({ teacherId: null, schoolClassId: null, sectionId: null });

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchClassTeacherAssignments());
    dispatch(fetchSchoolClasses({ schoolId }));
    dispatch(fetchSections({ schoolId }));
    dispatch(fetchAllUser({ isActive: true }));
  }, [dispatch, schoolId]);

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
    schoolClasses.map((c) => ({ value: c._id, label: c.name || c.grade })),
    [schoolClasses]
  );

  const sectionOptions = useMemo(() =>
    sections
      .filter((s) => !form.schoolClassId || s.schoolClassId === form.schoolClassId)
      .map((s) => ({ value: s._id, label: s.name })),
    [sections, form.schoolClassId]
  );

  const openModal = () => {
    setForm({ teacherId: null, schoolClassId: null, sectionId: null });
    setModal({ open: true });
  };

  const handleAssign = async () => {
    if (!form.teacherId || !form.schoolClassId) {
      return message.warning("Teacher and Class are required");
    }
    try {
      await dispatch(assignClassTeacher(form)).unwrap();
      message.success("Class teacher assigned");
      setModal({ open: false });
      dispatch(fetchClassTeacherAssignments());
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
      title: "Teacher",
      render: (_, r) => (
        <Space>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#7c3aed22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "#7c3aed", fontSize: 14,
          }}>
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
        <Tag color="blue">{r.schoolClassId?.name || r.schoolClassId?.grade || "—"}</Tag>
      ),
    },
    {
      title: "Section",
      render: (_, r) => r.sectionId?.name
        ? <Tag color="cyan">{r.sectionId.name}</Tag>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>All sections</span>,
    },
    {
      title: "Academic Year",
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
        subtitle="Assign a teacher as class in-charge for each class/section"
        icon={<GraduationCap size={20} />}
        extra={
          <Space>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => dispatch(fetchClassTeacherAssignments())}
              />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              Assign Class Teacher
            </Button>
          </Space>
        }
      />

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={assignments}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <div style={{ padding: "32px 0", color: "var(--text-muted)" }}>
                  No class teacher assignments yet. Click "Assign Class Teacher" to begin.
                </div>
              ),
            }}
          />
        </Spin>
      </div>

      {/* ── Assign Modal ── */}
      <Modal
        open={modal.open}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            Assign Class Teacher
          </span>
        }
        onOk={handleAssign}
        onCancel={() => setModal({ open: false })}
        okText="Assign"
        confirmLoading={saving}
        width={460}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              Teacher <span style={{ color: "#ef4444" }}>*</span>
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
              Class <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class…"
              value={form.schoolClassId}
              onChange={(v) => setForm((f) => ({ ...f, schoolClassId: v, sectionId: null }))}
              options={classOptions}
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
