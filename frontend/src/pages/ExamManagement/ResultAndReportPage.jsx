import { Button, Card, Input, Space, Table, Typography, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamResults, fetchReportCard, processResults, publishResults } from "../../features/examManagementSlice";

export default function ResultAndReportPage() {
  const dispatch = useDispatch();
  const { results, reportCard } = useSelector((state) => state.examManagement);
  const [examId, setExamId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");

  const runProcess = async () => {
    const res = await dispatch(processResults({ body: { examId, academicYearId, schoolClassId } }));
    if (!res.error) message.success("Result processing started");
  };

  const runPublish = async () => {
    const res = await dispatch(publishResults({ body: { academicYearId, schoolClassId, publishStatus: "published" } }));
    if (!res.error) message.success("Results published");
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Result Processing">
        <Space wrap>
          <Input value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Exam ID" />
          <Input value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} placeholder="Academic Year ID" />
          <Input value={schoolClassId} onChange={(e) => setSchoolClassId(e.target.value)} placeholder="Class ID" />
          <Button onClick={runProcess}>Process</Button>
          <Button onClick={runPublish}>Publish</Button>
          <Button onClick={() => dispatch(fetchExamResults({ examId }))}>Load Exam Results</Button>
          <Button onClick={() => dispatch(fetchReportCard({ params: {} }))}>Load Report Card</Button>
        </Space>
      </Card>
      <Card title="Exam Results"><Table rowKey="_id" dataSource={results} columns={[{ title: "Student", render: (_, row) => row.studentId?.name }, { title: "%", dataIndex: "percentage" }, { title: "Grade", dataIndex: "overallGrade" }]} /></Card>
      <Card title="Report Card (Print Friendly)">
        {reportCard ? (
          <>
            <Typography.Title level={5}>{reportCard.student?.name}</Typography.Title>
            <Typography.Text>Total: {reportCard.summary?.obtainedMarks}/{reportCard.summary?.totalMarks} ({reportCard.summary?.percentage}%)</Typography.Text>
          </>
        ) : <Typography.Text type="secondary">No report card loaded.</Typography.Text>}
      </Card>
    </Space>
  );
}
