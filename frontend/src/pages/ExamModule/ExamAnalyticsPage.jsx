import React, { useEffect } from "react";
import { Card, Col, Row, Statistic, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchClassPerformance, fetchExamAnalyticsOverview, fetchSubjectPerformance, fetchTopperList } from "../../features/exam/examAnalyticsSlice";

const ExamAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { overview, classPerformance, subjectPerformance, toppers, loading } = useSelector((s) => s.examAnalytics || {});
  useEffect(() => {
    dispatch(fetchExamAnalyticsOverview());
    dispatch(fetchClassPerformance());
    dispatch(fetchSubjectPerformance());
    dispatch(fetchTopperList());
  }, [dispatch]);
  const stat = overview?.resultStats || {};
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}><Card><Statistic title="Pass Count" value={stat.passCount || 0} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="Total Results" value={stat.total || 0} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="Avg %" value={Number(stat.avgPercentage || 0).toFixed(2)} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="Exam States" value={(overview?.examStats || []).length} loading={loading} /></Card></Col>
      <Col span={12}><Card title="Class Performance"><Table size="small" rowKey="_id" dataSource={classPerformance || []} pagination={false} columns={[{ title: "Class", dataIndex: "_id" }, { title: "Avg %", dataIndex: "avgPercentage" }, { title: "Pass", dataIndex: "passCount" }, { title: "Total", dataIndex: "total" }]} /></Card></Col>
      <Col span={12}><Card title="Subject Performance"><Table size="small" rowKey="_id" dataSource={subjectPerformance || []} pagination={false} columns={[{ title: "Subject", dataIndex: "_id" }, { title: "Avg", dataIndex: "avgObtained" }, { title: "Pass", dataIndex: "passCount" }, { title: "Total", dataIndex: "total" }]} /></Card></Col>
      <Col span={24}><Card title="Topper List"><Table size="small" rowKey="_id" dataSource={toppers || []} columns={[{ title: "Student", dataIndex: "studentId" }, { title: "%", dataIndex: "percentage" }, { title: "Rank", dataIndex: "classRank" }]} /></Card></Col>
    </Row>
  );
};

export default ExamAnalyticsPage;
