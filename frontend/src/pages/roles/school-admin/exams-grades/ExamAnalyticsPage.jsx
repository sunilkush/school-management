import React, { useMemo, useState } from "react";
import { Alert, Card, Col, Empty, Row, Select, Space, Statistic, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getExamAnalytics, getExams } from "../../../../features/examSlice";

const { Title, Text } = Typography;

const ExamAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], analytics, loading, error } = useSelector((state) => state.exams || {});
  const [examId, setExamId] = useState();

  React.useEffect(() => {
    dispatch(getExams());
  }, [dispatch]);

  React.useEffect(() => {
    if (examId) dispatch(getExamAnalytics(examId));
  }, [examId, dispatch]);

  const stats = useMemo(() => {
    const totalAttempts = analytics?.attempts?.total || 0;
    const averageScore = Number(analytics?.evaluation?.averageObtainedMarks || 0);
    const passRate = Number(analytics?.evaluation?.passPercentage || 0);

    return {
      totalAttempts,
      averageScore,
      passRate,
    };
  }, [analytics]);

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Title level={4}>Exam Analytics</Title>
        <Select
          value={examId}
          onChange={setExamId}
          placeholder="Select exam"
          style={{ width: 320 }}
          options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
        />

        {error ? <Alert type="error" message="Unable to load exam analytics" description={String(error)} showIcon /> : null}

        {!examId ? (
          <Empty description="Select exam to view analytics" />
        ) : (
          <>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card loading={loading}>
                  <Statistic title="Attempts" value={stats.totalAttempts} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loading}>
                  <Statistic title="Average Score" value={stats.averageScore} suffix="%" precision={2} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loading}>
                  <Statistic title="Pass Rate" value={stats.passRate} suffix="%" precision={2} />
                </Card>
              </Col>
            </Row>

            <Card loading={loading}>
              <Text strong>Risk Level: </Text>
              <Text>{analytics?.enterpriseInsights?.riskLevel || "n/a"}</Text>
              <br />
              <Text type="secondary">{analytics?.enterpriseInsights?.recommendation || "No recommendation available."}</Text>
            </Card>
          </>
        )}
      </Space>
    </Card>
  );
};

export default ExamAnalyticsPage;