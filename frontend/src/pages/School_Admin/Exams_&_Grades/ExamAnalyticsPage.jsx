import React, { useMemo, useState } from "react";
import { Card, Col, Empty, Row, Select, Space, Statistic, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getExamAnalytics, getExams } from "../../../features/examSlice";

const { Title } = Typography;

const ExamAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], analytics } = useSelector((state) => state.exams || {});
  const [examId, setExamId] = useState();

  React.useEffect(() => { dispatch(getExams()); }, [dispatch]);
  React.useEffect(() => { if (examId) dispatch(getExamAnalytics(examId)); }, [examId, dispatch]);

  const stats = useMemo(() => analytics || {}, [analytics]);

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>Exam Analytics</Title>
        <Select value={examId} onChange={setExamId} placeholder="Select exam" style={{ width: 320 }}
          options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
        />
        {!examId ? <Empty description="Select exam to view analytics" /> : (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}><Card><Statistic title="Attempts" value={stats.totalAttempts || 0} /></Card></Col>
            <Col xs={24} sm={8}><Card><Statistic title="Average Score" value={stats.averageScore || 0} suffix="%" /></Card></Col>
            <Col xs={24} sm={8}><Card><Statistic title="Pass Rate" value={stats.passRate || 0} suffix="%" /></Card></Col>
          </Row>
        )}
      </Space>
    </Card>
  );
};

export default ExamAnalyticsPage;
