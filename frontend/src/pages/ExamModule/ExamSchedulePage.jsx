import React, { useEffect } from "react";
import { Button, Card, Form, Input, Select, Space, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createExamSchedule, fetchExamSchedules } from "../../features/exam/examScheduleSlice";
import { fetchExamsV2 } from "../../features/exam/examSliceV2";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";
import { getAllSubjects } from "../../features/subjectSlice";

const ExamSchedulePage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.examSchedule || {});
  const { list: exams } = useSelector((s) => s.examModuleExam || {});
  const { schoolClasses } = useSelector((s) => s.schoolClass || {});
  const { sections } = useSelector((s) => s.section || {});
  const { subjects } = useSelector((s) => s.subject || {});
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchExamSchedules());
    dispatch(fetchExamsV2());
    dispatch(fetchSchoolClasses());
    dispatch(fetchSections());
    dispatch(getAllSubjects({ limit: 200 }));
  }, [dispatch]);

  const examOptions = (exams || []).map((item) => ({ label: item.name, value: item._id }));
  const classOptions = (schoolClasses || []).map((item) => ({ label: item.name, value: item._id }));
  const sectionOptions = (sections || []).map((item) => ({ label: item.name, value: item._id }));
  const subjectOptions = (subjects || []).map((item) => ({ label: item.name, value: item._id }));

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Exam Timetable / Schedule">
        <Form layout="inline" form={form} onFinish={async (values) => { await dispatch(createExamSchedule(values)); form.resetFields(); dispatch(fetchExamSchedules()); }}>
          <Form.Item name="examId" rules={[{ required: true }]}><Select style={{ width: 200 }} placeholder="Exam" options={examOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="schoolClassId" rules={[{ required: true }]}><Select style={{ width: 140 }} placeholder="Class" options={classOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="sectionId"><Select style={{ width: 140 }} placeholder="Section" options={sectionOptions} showSearch optionFilterProp="label" allowClear /></Form.Item>
          <Form.Item name="subjectId" rules={[{ required: true }]}><Select style={{ width: 170 }} placeholder="Subject" options={subjectOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="examDate" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="startTime" rules={[{ required: true }]}><Input type="time" /></Form.Item>
          <Form.Item name="endTime" rules={[{ required: true }]}><Input type="time" /></Form.Item>
          <Form.Item name="mode" initialValue="offline"><Select style={{ width: 120 }} options={["offline", "online"].map((m) => ({ value: m, label: m }))} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Add Schedule</Button></Form.Item>
        </Form>
      </Card>
      <Card>
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Exam", dataIndex: "examId" },
          { title: "Date", dataIndex: "examDate", render: (v) => new Date(v).toLocaleDateString() },
          { title: "Time", render: (_, r) => `${r.startTime} - ${r.endTime}` },
          { title: "Subject", dataIndex: "subjectId" },
          { title: "Mode", dataIndex: "mode" },
        ]} />
      </Card>
    </Space>
  );
};

export default ExamSchedulePage;
