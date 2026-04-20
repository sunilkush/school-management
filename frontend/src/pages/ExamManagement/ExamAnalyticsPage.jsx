import { Card, Col, Row, Statistic, Table } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamAnalytics } from "../../features/examManagementSlice";

export default function ExamAnalyticsPage() {
  const dispatch = useDispatch();
  const { analytics } = useSelector((state) => state.examManagement);

  useEffect(() => { dispatch(fetchExamAnalytics({ params: {} })); }, [dispatch]);

  return (
    <>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Exams" value={analytics?.examCount || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Participation" value={analytics?.attemptsCount || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pass %" value={analytics?.passPercentage || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending Evaluation" value={analytics?.pendingEvaluations || 0} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}><Card title="Top Performers"><Table pagination={false} rowKey="_id" dataSource={analytics?.topPerformers || []} columns={[{ title: "Student", render: (_, r) => r.studentId?.name }, { title: "%", dataIndex: "percentage" }]} /></Card></Col>
        <Col span={12}><Card title="Weak Performers"><Table pagination={false} rowKey="_id" dataSource={analytics?.weakPerformers || []} columns={[{ title: "Student", render: (_, r) => r.studentId?.name }, { title: "%", dataIndex: "percentage" }]} /></Card></Col>
      </Row>
    </>
  );
}
