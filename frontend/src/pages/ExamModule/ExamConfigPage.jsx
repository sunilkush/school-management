import React, { useEffect } from "react";
import { Button, Card, Form, InputNumber, Select, Space, Switch, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createExamSubjectConfig, fetchExamSubjectConfigs } from "../../features/exam/examSubjectConfigSlice";
import { fetchExamsV2 } from "../../features/exam/examSliceV2";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";
import { getAllSubjects } from "../../features/subjectSlice";

const ExamConfigPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.examSubjectConfig || {});
  const { list: exams } = useSelector((s) => s.examModuleExam || {});
  const { schoolClasses } = useSelector((s) => s.schoolClass || {});
  const { sections } = useSelector((s) => s.section || {});
  const { subjects } = useSelector((s) => s.subject || {});
  const [form] = Form.useForm();
  useEffect(() => {
    dispatch(fetchExamSubjectConfigs());
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
      <Card title="Subject & Marks Configuration">
        <Form form={form} layout="inline" onFinish={async (values) => { await dispatch(createExamSubjectConfig(values)); form.resetFields(); dispatch(fetchExamSubjectConfigs()); }}>
          <Form.Item name="examId" rules={[{ required: true }]}><Select placeholder="Exam" style={{ width: 200 }} options={examOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="schoolClassId" rules={[{ required: true }]}><Select placeholder="Class" style={{ width: 160 }} options={classOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="sectionId"><Select placeholder="Section" style={{ width: 160 }} options={sectionOptions} showSearch optionFilterProp="label" allowClear /></Form.Item>
          <Form.Item name="subjectId" rules={[{ required: true }]}><Select placeholder="Subject" style={{ width: 170 }} options={subjectOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="maxMarks" rules={[{ required: true }]}><InputNumber placeholder="Max" min={1} /></Form.Item>
          <Form.Item name="passingMarks" rules={[{ required: true }]}><InputNumber placeholder="Pass" min={0} /></Form.Item>
          <Form.Item name="gradeApplicable" valuePropName="checked" initialValue><Switch checkedChildren="Grade" unCheckedChildren="No Grade" /></Form.Item>
          <Form.Item name="evaluationMode" initialValue="offline"><Select style={{ width: 120 }} options={["offline", "online", "hybrid"].map((x) => ({ value: x, label: x }))} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Save</Button></Form.Item>
        </Form>
      </Card>
      <Card title="Configured Subjects">
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Exam", dataIndex: "examId" },
          { title: "Class", dataIndex: "schoolClassId" },
          { title: "Section", dataIndex: "sectionId" },
          { title: "Subject", dataIndex: "subjectId" },
          { title: "Max", dataIndex: "maxMarks" },
          { title: "Pass", dataIndex: "passingMarks" },
          { title: "Mode", dataIndex: "evaluationMode" },
        ]} />
      </Card>
    </Space>
  );
};

export default ExamConfigPage;
