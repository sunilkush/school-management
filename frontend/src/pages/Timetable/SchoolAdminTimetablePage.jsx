import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, Empty, Form, Input, Modal, Row, Select, Skeleton, App,
} from "antd";
import {
  CopyOutlined, SaveOutlined, ScheduleOutlined, FilterOutlined, CalendarOutlined,
} from "@ant-design/icons";
import {
  bulkSaveTimetable, copyWeekTimetable, deleteTimetableEntry,
  fetchTimetable, fetchTimetableMasterData,
  createTimetableEntry, updateTimetableEntry,
} from "../../features/timetableSlice.js";
import TimetableGrid from "./TimetableGrid.jsx";
import { getId, getName, schoolIdFromUser } from "./timetableUi.js";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", warning: "#F59E0B",
};

const teachingTypes = ["regular", "activity", "substitution"];
const types = ["regular", "break", "lunch", "assembly", "activity", "substitution"];
const DAYS_OPTS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
  (d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }),
);

const modalFooter = (onCancel, onOk, loading, okLabel = "Save") => [
  <Button key="cancel" onClick={onCancel}
    style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
    Cancel
  </Button>,
  <Button key="ok" onClick={onOk} loading={loading}
    style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}>
    {okLabel}
  </Button>,
];

export default function SchoolAdminTimetablePage() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const {
    timeSlots, rooms, entries, loading, saving,
    schoolClasses, sections: allSections, subjects, teachers,
  } = useSelector((s) => s.timetable);

  const schoolId      = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;
  const [filters, setFilters]     = useState({ schoolClassId: "", sectionId: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [copyOpen, setCopyOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form]     = Form.useForm();
  const [copyForm] = Form.useForm();

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(
      fetchTimetableMasterData({
        schoolId, academicYearId,
        includeRooms: true, includeSubjects: true, includeTeachers: true,
      }),
    ).unwrap().catch(message.error);
  }, [dispatch, schoolId, academicYearId, message]);

  useEffect(() => {
    if (!schoolId || !academicYearId || !filters.schoolClassId || !filters.sectionId) return;
    dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }))
      .unwrap().catch(message.error);
  }, [dispatch, schoolId, academicYearId, filters, message]);

  const masters = useMemo(
    () => ({ classes: schoolClasses, sections: allSections, subjects, teachers }),
    [schoolClasses, allSections, subjects, teachers],
  );
  const sections = useMemo(
    () => allSections.filter(
      (s) => !filters.schoolClassId || getId(s.schoolClassId) === filters.schoolClassId,
    ),
    [allSections, filters.schoolClassId],
  );
  const fromCopyClassId = Form.useWatch("fromSchoolClassId", copyForm);
  const toCopyClassId   = Form.useWatch("toSchoolClassId", copyForm);
  const fromCopySections = useMemo(
    () => masters.sections.filter((s) => getId(s.schoolClassId) === fromCopyClassId),
    [masters.sections, fromCopyClassId],
  );
  const toCopySections = useMemo(
    () => masters.sections.filter((s) => getId(s.schoolClassId) === toCopyClassId),
    [masters.sections, toCopyClassId],
  );

  const openModal = (seed = {}, entry = null) => {
    setEditing(entry);
    form.setFieldsValue({
      type: "regular", ...seed, ...entry,
      timeSlotId: getId(entry?.timeSlotId) || seed.timeSlotId,
      subjectId:  getId(entry?.subjectId),
      teacherId:  getId(entry?.teacherId),
      roomId:     getId(entry?.roomId),
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      const values  = await form.validateFields();
      const payload = { schoolId, academicYearId, ...filters, ...values };
      if (editing)
        await dispatch(updateTimetableEntry({ id: editing._id, payload })).unwrap();
      else
        await dispatch(createTimetableEntry(payload)).unwrap();
      message.success("Period saved");
      setModalOpen(false);
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
    } catch (e) {
      if (typeof e === "string") message.error(e);
    }
  };

  const remove = (entry) =>
    Modal.confirm({
      title: "Delete this period?",
      content: "This action cannot be undone.",
      okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => {
        await dispatch(deleteTimetableEntry(entry._id)).unwrap().catch(message.error);
        dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
      },
    });

  const bulkSave = () =>
    dispatch(
      bulkSaveTimetable({
        schoolId, academicYearId, ...filters,
        entries: entries.map((e) => ({
          dayOfWeek: e.dayOfWeek, timeSlotId: getId(e.timeSlotId),
          subjectId: getId(e.subjectId), teacherId: getId(e.teacherId),
          roomId: getId(e.roomId), type: e.type, note: e.note,
        })),
      }),
    ).unwrap().then(() => message.success("Bulk saved")).catch(message.error);

  const copyWeek = async () => {
    try {
      const values = await copyForm.validateFields();
      await dispatch(copyWeekTimetable({ schoolId, academicYearId, ...values })).unwrap();
      message.success("Timetable copied successfully");
      setCopyOpen(false);
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
    } catch (e) {
      if (typeof e === "string") message.error(e);
    }
  };

  const type = Form.useWatch("type", form) || "regular";
  const selectedClass   = masters.classes.find((c) => c._id === filters.schoolClassId);
  const selectedSection = sections.find((s) => s._id === filters.sectionId);
  const periodCount     = entries.filter((e) => e.type === "regular").length;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Timetable Planner"
        subtitle="Build and manage weekly class timetables, detect conflicts, and publish schedules"
        icon={<ScheduleOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              icon={<CopyOutlined />}
              disabled={!academicYearId}
              onClick={() => {
                copyForm.setFieldsValue({
                  fromSchoolClassId: filters.schoolClassId,
                  fromSectionId: filters.sectionId,
                });
                setCopyOpen(true);
              }}
              style={{ borderRadius: 9, borderColor: C.border, color: C.textSub, fontWeight: 600 }}
            >
              Copy Week
            </Button>
            <Button
              icon={<SaveOutlined />}
              disabled={!entries.length}
              loading={saving}
              onClick={bulkSave}
              style={{
                borderRadius: 9, background: C.primary,
                borderColor: C.primary, color: "#fff", fontWeight: 600,
              }}
            >
              Bulk Save
            </Button>
          </div>
        }
      />

      {/* ── Filter bar ── */}
      <div style={{ ...sectionPanel, margin: "20px 0 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
          justifyContent: "space-between", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FilterOutlined style={{ color: C.textSub }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Filter Timetable</span>
          </div>
          {selectedAcademicYear && (
            <span style={{
              fontSize: 12, padding: "3px 12px", borderRadius: 20,
              background: C.primaryLighter, color: C.primary,
              border: "1px solid " + C.primaryLight, fontWeight: 600,
            }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {selectedAcademicYear.name || selectedAcademicYear.year}
            </span>
          )}
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={11}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Class
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select class"
              value={filters.schoolClassId || undefined}
              onChange={(v) => setFilters({ schoolClassId: v, sectionId: "" })}
              options={masters.classes.map((c) => ({ value: c._id, label: getName(c) }))}
              size="large"
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={11}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Section
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select section"
              value={filters.sectionId || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, sectionId: v }))}
              options={sections.map((s) => ({ value: s._id, label: getName(s) }))}
              size="large"
              disabled={!filters.schoolClassId}
            />
          </Col>
        </Row>

        {/* Active filter chips */}
        {selectedClass && selectedSection && (
          <div style={{
            marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{
              padding: "5px 14px", borderRadius: 20,
              background: C.accentLight, color: "#0F766E",
              fontSize: 12, fontWeight: 700, border: "1px solid #99F6E4",
            }}>
              {getName(selectedClass)} · {getName(selectedSection)}
            </span>
            <span style={{
              padding: "5px 12px", borderRadius: 20,
              background: "#F8FAFC", color: C.textSub,
              fontSize: 12, fontWeight: 600, border: "1px solid " + C.border,
            }}>
              {timeSlots.length} time slot{timeSlots.length !== 1 ? "s" : ""}
            </span>
            {periodCount > 0 && (
              <span style={{
                padding: "5px 12px", borderRadius: 20,
                background: C.primaryLighter, color: C.primary,
                fontSize: 12, fontWeight: 600, border: "1px solid " + C.primaryLight,
              }}>
                {periodCount} period{periodCount !== 1 ? "s" : ""} scheduled
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Timetable grid ── */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid " + C.border }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Weekly Timetable</span>
        </div>
        <div style={{ padding: 16 }}>
          {!academicYearId ? (
            <Empty description="Select an academic year to get started" />
          ) : loading ? (
            <Skeleton active paragraph={{ rows: 7 }} />
          ) : filters.schoolClassId && filters.sectionId ? (
            <TimetableGrid
              timeSlots={timeSlots}
              entries={entries}
              onAdd={(seed) => openModal(seed)}
              onEdit={(e) => openModal({}, e)}
              onDelete={remove}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: C.textSub }}>
                  Select a class and section above to view or edit the timetable
                </span>
              }
            />
          )}
        </div>
      </div>

      {/* ── Copy Week Modal ── */}
      <Modal
        open={copyOpen}
        title={<span style={{ fontWeight: 700 }}>Copy Weekly Timetable</span>}
        onCancel={() => setCopyOpen(false)}
        footer={modalFooter(() => setCopyOpen(false), copyWeek, saving, "Copy")}
        destroyOnClose
      >
        <Form form={copyForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="fromSchoolClassId" label="From Class" rules={[{ required: true }]}>
            <Select
              options={masters.classes.map((c) => ({ value: c._id, label: getName(c) }))}
              onChange={() => copyForm.setFieldValue("fromSectionId", undefined)}
            />
          </Form.Item>
          <Form.Item name="fromSectionId" label="From Section" rules={[{ required: true }]}>
            <Select
              disabled={!fromCopyClassId}
              options={fromCopySections.map((s) => ({ value: s._id, label: getName(s) }))}
            />
          </Form.Item>
          <Form.Item name="toSchoolClassId" label="To Class" rules={[{ required: true }]}>
            <Select
              options={masters.classes.map((c) => ({ value: c._id, label: getName(c) }))}
              onChange={() => copyForm.setFieldValue("toSectionId", undefined)}
            />
          </Form.Item>
          <Form.Item name="toSectionId" label="To Section" rules={[{ required: true }]}>
            <Select
              disabled={!toCopyClassId}
              options={toCopySections.map((s) => ({ value: s._id, label: getName(s) }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add / Edit Period Modal ── */}
      <Modal
        open={modalOpen}
        title={<span style={{ fontWeight: 700 }}>{editing ? "Edit Period" : "Add Period"}</span>}
        onCancel={() => setModalOpen(false)}
        footer={modalFooter(() => setModalOpen(false), save, saving, editing ? "Update" : "Add")}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="dayOfWeek" label="Day" rules={[{ required: true }]}>
              <Select options={DAYS_OPTS} />
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select
                options={types.map((t) => ({
                  value: t,
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="timeSlotId" label="Time Slot" rules={[{ required: true }]}>
            <Select
              options={timeSlots.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.startTime}–${s.endTime})`,
              }))}
            />
          </Form.Item>
          {teachingTypes.includes(type) && (
            <>
              <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label"
                  options={masters.subjects.map((s) => ({ value: s._id, label: getName(s) }))}
                />
              </Form.Item>
              <Form.Item name="teacherId" label="Teacher" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label"
                  options={masters.teachers.map((t) => ({ value: t._id, label: getName(t) }))}
                />
              </Form.Item>
            </>
          )}
          <Form.Item name="roomId" label="Room (optional)">
            <Select
              allowClear
              options={rooms.map((r) => ({
                value: r._id,
                label: `${getName(r)}${r.code ? " · " + r.code : ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="note" label="Note (optional)">
            <Input.TextArea rows={2} placeholder="Any additional note…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
