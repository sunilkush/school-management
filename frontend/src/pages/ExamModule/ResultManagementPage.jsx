import React, { useEffect } from "react";
import { Button, Card, Form, Select, Space, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamResults, generateExamResults, publishExamResultsV2, unpublishExamResults } from "../../features/exam/examResultSlice";
import { fetchExamsV2 } from "../../features/exam/examSliceV2";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";

const ResultManagementPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.examResultsV2 || {});
  const { list: exams } = useSelector((s) => s.examModuleExam || {});
  const { schoolClasses } = useSelector((s) => s.schoolClass || {});
  const { sections } = useSelector((s) => s.section || {});
  const [form] = Form.useForm();
  useEffect(() => {
    dispatch(fetchExamResults());
    dispatch(fetchExamsV2());
    dispatch(fetchSchoolClasses());
    dispatch(fetchSections());
  }, [dispatch]);

  const examOptions = (exams || []).map((item) => ({ label: item.name, value: item._id }));
  const classOptions = (schoolClasses || []).map((item) => ({ label: item.name, value: item._id }));
  const sectionOptions = (sections || []).map((item) => ({ label: item.name, value: item._id }));
  const actionWithPayload = async (action, values) => {
    await dispatch(action(values));
    dispatch(fetchExamResults());
  };
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Result Generation & Publish">
        <Form layout="inline" form={form} onFinish={(values) => actionWithPayload(generateExamResults, values)}>
          <Form.Item name="examId" rules={[{ required: true }]}><Select style={{ width: 220 }} placeholder="Exam" options={examOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="schoolClassId" rules={[{ required: true }]}><Select style={{ width: 170 }} placeholder="Class" options={classOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="sectionId" rules={[{ required: true }]}><Select style={{ width: 170 }} placeholder="Section" options={sectionOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Generate</Button></Form.Item>
          <Form.Item><Button onClick={() => actionWithPayload(publishExamResultsV2, form.getFieldsValue())}>Publish</Button></Form.Item>
          <Form.Item><Button danger onClick={() => actionWithPayload(unpublishExamResults, form.getFieldsValue())}>Unpublish</Button></Form.Item>
        </Form>
      </Card>
      <Card title="Exam Results">
        <Table rowKey="_id" loading={loading} dataSource={list || []} columns={[
          { title: "Student", dataIndex: "studentId" },
          { title: "Exam", dataIndex: "examId" },
          { title: "Total", dataIndex: "totalObtainedMarks" },
          { title: "Percentage", dataIndex: "percentage" },
          { title: "Grade", dataIndex: "overallGrade" },
          { title: "Status", dataIndex: "resultStatus" },
        ]} />
      </Card>
    </Space>
  );
};

export default ResultManagementPage;
