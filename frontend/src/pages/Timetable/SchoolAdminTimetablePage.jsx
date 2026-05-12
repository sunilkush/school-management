import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Skeleton, Space, Typography, App } from "antd";
import { CopyOutlined, SaveOutlined } from "@ant-design/icons";
import apiClient from "../../api/httpClient.js";
import { bulkSaveTimetable, 
    copyWeekTimetable, 
    deleteTimetableEntry, 
    fetchRooms, 
    fetchTimeSlots, 
    fetchTimetable, 
    createTimetableEntry, updateTimetableEntry } from "../../features/timetableSlice.js";
import TimetableGrid from "./TimetableGrid.jsx";
import { getId, getName, schoolIdFromUser } from "./timetableUi.js";

const { Title, Text } = Typography;
const teachingTypes = ["regular", "activity", "substitution"];
const types = ["regular", "break", "lunch", "assembly", "activity", "substitution"];

export default function SchoolAdminTimetablePage() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector((s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear);
  const { timeSlots, rooms, entries, loading, saving } = useSelector((s) => s.timetable);
  const schoolId = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;
  const [masters, setMasters] = useState({ classes: [], sections: [], subjects: [], teachers: [] });
  const [filters, setFilters] = useState({ schoolClassId: "", sectionId: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [copyForm] = Form.useForm();

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchTimeSlots({ schoolId, academicYearId }));
    dispatch(fetchRooms({ schoolId }));
    Promise.all([
      apiClient.get("/school-class/class-detailes", { params: { schoolId, academicYearId } }),
      apiClient.get("/sections", { params: { schoolId, academicYearId } }),
      apiClient.get("/subject/all", { params: { schoolId, academicYearId, limit: 200 } }),
      apiClient.get("/user/all", { params: { schoolId, roleName: "Teacher", isActive: true } }),
    ]).then(([c, s, sub, t]) => setMasters({ classes: c.data?.data || [], sections: s.data?.data || [], subjects: sub.data?.data || [], teachers: t.data?.data || [] })).catch((e) => message.error(e.response?.data?.message || e.message));
  }, [dispatch, schoolId, academicYearId, message]);

  useEffect(() => {
    if (!schoolId || !academicYearId || !filters.schoolClassId || !filters.sectionId) return;
    dispatch(fetchTimetable({ schoolId, academicYearId, ...filters })).unwrap().catch(message.error);
  }, [dispatch, schoolId, academicYearId, filters, message]);

  const sections = useMemo(() => masters.sections.filter((s) => !filters.schoolClassId || getId(s.schoolClassId) === filters.schoolClassId), [masters.sections, filters.schoolClassId]);
  const openModal = (seed = {}, entry = null) => { setEditing(entry); form.setFieldsValue({ type: "regular", ...seed, ...entry, timeSlotId: getId(entry?.timeSlotId) || seed.timeSlotId, subjectId: getId(entry?.subjectId), teacherId: getId(entry?.teacherId), roomId: getId(entry?.roomId) }); setModalOpen(true); };
  const save = async () => {
    try {
      const values = await form.validateFields();
      const payload = { schoolId, academicYearId, ...filters, ...values };
      if (editing) await dispatch(updateTimetableEntry({ id: editing._id, payload })).unwrap();
      else await dispatch(createTimetableEntry(payload)).unwrap();
      message.success("Timetable saved"); setModalOpen(false);
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
    } catch (e) { if (typeof e === "string") message.error(e); }
  };
  const remove = (entry) => Modal.confirm({ title: "Delete period?", onOk: async () => { await dispatch(deleteTimetableEntry(entry._id)).unwrap().catch(message.error); dispatch(fetchTimetable({ schoolId, academicYearId, ...filters })); } });
  const bulkSave = () => dispatch(bulkSaveTimetable({ schoolId, academicYearId, ...filters, entries: entries.map((e) => ({ dayOfWeek: e.dayOfWeek, timeSlotId: getId(e.timeSlotId), subjectId: getId(e.subjectId), teacherId: getId(e.teacherId), roomId: getId(e.roomId), type: e.type, note: e.note })) })).unwrap().then(() => message.success("Bulk saved")).catch(message.error);
  const copyWeek = async () => {
    try {
      const values = await copyForm.validateFields();
      await dispatch(copyWeekTimetable({ schoolId, academicYearId, ...values })).unwrap();
      message.success("Timetable copied");
      setCopyOpen(false);
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
    } catch (e) { if (typeof e === "string") message.error(e); }
  };

  const type = Form.useWatch("type", form) || "regular";
  return <Space direction="vertical" size="large" className="w-full">
    <Card className="shadow-sm"><Row justify="space-between" gutter={[16,16]}><Col><Title level={3}>Timetable Planner</Title><Text type="secondary">Build weekly class-section timetables, detect teacher and room conflicts, and publish reliable schedules.</Text></Col><Col><Space wrap><Button icon={<SaveOutlined />} disabled={!entries.length} loading={saving} onClick={bulkSave}>Bulk Save</Button><Button icon={<CopyOutlined />} disabled={!academicYearId} onClick={()=>{copyForm.setFieldsValue({ fromSchoolClassId: filters.schoolClassId, fromSectionId: filters.sectionId }); setCopyOpen(true);}}>Copy Timetable</Button></Space></Col></Row></Card>
    <Card className="shadow-sm"><Row gutter={[16,16]}><Col xs={24} md={8}><Select className="w-full" placeholder="Class" value={filters.schoolClassId || undefined} onChange={(v)=>setFilters({ schoolClassId:v, sectionId:"" })} options={masters.classes.map((c)=>({value:c._id,label:getName(c)}))}/></Col><Col xs={24} md={8}><Select className="w-full" placeholder="Section" value={filters.sectionId || undefined} onChange={(v)=>setFilters((f)=>({...f,sectionId:v}))} options={sections.map((s)=>({value:s._id,label:getName(s)}))}/></Col><Col xs={24} md={8}><Text strong>Academic Year:</Text> {selectedAcademicYear?.name || selectedAcademicYear?.year || "Select active academic year"}</Col></Row></Card>
    <Card className="shadow-sm">{!academicYearId ? <Empty description="Select an academic year first" /> : loading ? <Skeleton active /> : filters.schoolClassId && filters.sectionId ? <TimetableGrid timeSlots={timeSlots} entries={entries} onAdd={(seed)=>openModal(seed)} onEdit={(e)=>openModal({}, e)} onDelete={remove} /> : <Empty description="Select class and section" />}</Card>
    <Modal open={copyOpen} title="Copy Weekly Timetable" onCancel={()=>setCopyOpen(false)} onOk={copyWeek} confirmLoading={saving} destroyOnClose>
      <Form form={copyForm} layout="vertical"><Form.Item name="fromSchoolClassId" label="From Class" rules={[{required:true}]}><Select options={masters.classes.map((c)=>({value:c._id,label:getName(c)}))}/></Form.Item><Form.Item name="fromSectionId" label="From Section" rules={[{required:true}]}><Select options={masters.sections.map((s)=>({value:s._id,label:getName(s)}))}/></Form.Item><Form.Item name="toSchoolClassId" label="To Class" rules={[{required:true}]}><Select options={masters.classes.map((c)=>({value:c._id,label:getName(c)}))}/></Form.Item><Form.Item name="toSectionId" label="To Section" rules={[{required:true}]}><Select options={masters.sections.map((s)=>({value:s._id,label:getName(s)}))}/></Form.Item></Form>
    </Modal>
    <Modal open={modalOpen} title={editing ? "Edit Period" : "Add Period"} onCancel={()=>setModalOpen(false)} onOk={save} confirmLoading={saving} destroyOnClose>
      <Form form={form} layout="vertical"><Form.Item name="dayOfWeek" label="Day" rules={[{required:true}]}><Select options={["monday","tuesday","wednesday","thursday","friday","saturday"].map((d)=>({value:d,label:d}))}/></Form.Item><Form.Item name="timeSlotId" label="Time Slot" rules={[{required:true}]}><Select options={timeSlots.map((s)=>({value:s._id,label:`${s.name} (${s.startTime}-${s.endTime})`}))}/></Form.Item><Form.Item name="type" label="Type" rules={[{required:true}]}><Select options={types.map((t)=>({value:t,label:t}))}/></Form.Item>{teachingTypes.includes(type) ? <><Form.Item name="subjectId" label="Subject" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={masters.subjects.map((s)=>({value:s._id,label:getName(s)}))}/></Form.Item><Form.Item name="teacherId" label="Teacher" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={masters.teachers.map((t)=>({value:t._id,label:getName(t)}))}/></Form.Item></> : null}<Form.Item name="roomId" label="Room"><Select allowClear options={rooms.map((r)=>({value:r._id,label:`${getName(r)} ${r.code || ""}`}))}/></Form.Item><Form.Item name="note" label="Note"><Input.TextArea rows={3}/></Form.Item></Form>
    </Modal>
  </Space>;
}
