import React, { useEffect } from "react";
import { Card, Col, Row, Statistic, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamResults, fetchReportCard } from "../../features/exam/examResultSlice";

export const StudentResultPortalPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.examResultsV2 || {});
  useEffect(() => { dispatch(fetchExamResults()); }, [dispatch]);
  const latest = list?.[0] || {};
  return (
    <Row gutter={16}>
      <Col span={8}><Card><Statistic title="Latest Percentage" value={latest.percentage || 0} suffix="%" /></Card></Col>
      <Col span={8}><Card><Statistic title="Latest Grade" value={latest.overallGrade || "-"} /></Card></Col>
      <Col span={8}><Card><Statistic title="Class Rank" value={latest.classRank || "-"} /></Card></Col>
      <Col span={24}><Card title="Published Results"><Table loading={loading} rowKey="_id" dataSource={list || []} columns={[{ title: "Exam", dataIndex: "examId" }, { title: "Total", dataIndex: "totalObtainedMarks" }, { title: "Percentage", dataIndex: "percentage" }, { title: "Status", dataIndex: "resultStatus" }]} /></Card></Col>
    </Row>
  );
};

export const ReportCardPage = () => {
  const dispatch = useDispatch();
  const { reportCard } = useSelector((s) => s.examResultsV2 || {});
  useEffect(() => {
    dispatch(fetchReportCard());
  }, [dispatch]);
  const latest = reportCard;
  return (
    <Card title="Report Card" extra={<button onClick={() => window.print()}>Print</button>}>
      {!latest ? <p>No published result available.</p> : (
        <>
          <h3>{latest?.exam?.name || "Exam"}</h3>
          <p><strong>Student:</strong> {latest?.student?.name}</p>
          <p><strong>Class:</strong> {latest?.student?.className} - {latest?.student?.sectionName}</p>
          <p><strong>Registration No:</strong> {latest?.student?.registrationNo || "-"}</p>
          <p>Total: {latest?.totals?.totalObtainedMarks}/{latest?.totals?.totalMaxMarks}</p>
          <p>Percentage: {latest?.totals?.percentage}%</p>
          <p>Grade: {latest?.totals?.overallGrade}</p>
          <p>Class Rank: {latest?.totals?.classRank || "-"}</p>
          <p>Section Rank: {latest?.totals?.sectionRank || "-"}</p>
          <Table
            rowKey={(row) => row.subjectId}
            pagination={false}
            dataSource={latest?.marks || []}
            columns={[
              { title: "Subject", dataIndex: "subjectName" },
              { title: "Max", dataIndex: "maxMarks" },
              { title: "Obtained", dataIndex: "obtainedMarks" },
              { title: "Grade", dataIndex: "grade" },
              { title: "Pass", dataIndex: "isPassed", render: (v) => (v ? "Yes" : "No") },
              { title: "Remarks", dataIndex: "remarks" },
            ]}
          />
        </>
      )}
    </Card>
  );
};
