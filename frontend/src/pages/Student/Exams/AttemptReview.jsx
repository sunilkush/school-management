import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Alert, Card, Col, Divider, Empty, List, Progress, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { getAttemptById } from "../../../features/attemptSlice";

const { Title, Text } = Typography;

const resolveQuestionText = (answer, index) => {
  const snapshot = answer?.snapshot || answer?.questionSnapshot || answer?.questionRef || {};
  return snapshot?.statement || snapshot?.questionText || snapshot?.title || `Question ${index + 1}`;
};

const formatAttemptAnswer = (answer) => {
  const raw = answer?.answer ?? answer?.response;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(", ") || "-";
  if (raw && typeof raw === "object") {
    if (raw.text || raw.value) return `${raw.text || raw.value}`;
    return JSON.stringify(raw);
  }
  return raw?.toString?.().trim() || "-";
};

const resolveAttemptStatus = (attempt) => {
  const status = attempt?.status || "in_progress";
  if (status === "evaluated") return { color: "green", label: "Evaluated" };
  if (status === "submitted") return { color: "blue", label: "Submitted" };
  return { color: "gold", label: "In Progress" };
};

const resolveMaxMarks = (answer) => {
  const snapshot = answer?.snapshot || answer?.questionSnapshot || answer?.questionRef || {};
  return Number(answer?.maxMarks ?? snapshot?.marks ?? snapshot?.points ?? 0) || 0;
};

const AttemptReview = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const attemptId = useMemo(() => new URLSearchParams(location.search).get("attemptId"), [location.search]);

  const { currentAttempt: attempt, loading, error } = useSelector((state) => state.attempts || {});

  useEffect(() => {
    if (attemptId) {
      dispatch(getAttemptById(attemptId));
    }
  }, [attemptId, dispatch]);

  const answers = Array.isArray(attempt?.answers) ? attempt.answers : [];
  const statusMeta = resolveAttemptStatus(attempt);

  const reviewStats = useMemo(() => {
    if (!attempt) return null;

    const evaluatedAnswers = answers.filter((ans) => ans?.isCorrect !== null && ans?.isCorrect !== undefined);
    const correct = evaluatedAnswers.filter((ans) => ans.isCorrect).length;
    const answered = answers.filter((ans) => {
      const value = ans?.answer ?? ans?.response;
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === "object") return Object.keys(value).length > 0;
      return value !== null && value !== undefined && `${value}`.trim() !== "";
    }).length;

    const totalPossible = answers.reduce((sum, ans) => sum + resolveMaxMarks(ans), 0);
    const obtained = Number(attempt?.totalMarksObtained ?? attempt?.totalObtainedMarks ?? 0) || 0;
    const percentage = totalPossible ? Math.round((obtained / totalPossible) * 100) : 0;

    return {
      totalQuestions: answers.length,
      answered,
      correct,
      evaluatedCount: evaluatedAnswers.length,
      totalPossible,
      obtained,
      percentage,
    };
  }, [attempt, answers]);

  if (!attemptId) {
    return <Empty description="Attempt ID missing. Open review from Exam Hub." />;
  }

  if (loading && !attempt) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!attempt) {
    return <Empty description="Attempt not found" />;
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Title level={3} style={{ margin: 0 }}>Attempt Review</Title>
          <Text type="secondary">Exam: {attempt?.examId?.title || "N/A"}</Text>
          <Space wrap>
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
            <Tag color="purple">Attempt ID: {attemptId}</Tag>
          </Space>
          {error ? <Alert type="warning" showIcon message={error} /> : null}

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Total Score" value={reviewStats?.obtained ?? 0} /></Card></Col>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Possible Marks" value={reviewStats?.totalPossible ?? 0} /></Card></Col>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Score %" value={reviewStats?.percentage ?? 0} suffix="%" /></Card></Col>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Answered" value={reviewStats?.answered ?? 0} suffix={`/${reviewStats?.totalQuestions ?? 0}`} /></Card></Col>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Correct" value={reviewStats?.correct ?? 0} suffix={`/${reviewStats?.evaluatedCount ?? 0}`} /></Card></Col>
            <Col xs={24} sm={12} md={8}><Card size="small"><Statistic title="Submitted" value={attempt?.submittedAt ? dayjs(attempt.submittedAt).format("DD MMM, hh:mm A") : "Pending"} /></Card></Col>
          </Row>

          <Text type="secondary">
            Started: {attempt?.startedAt ? dayjs(attempt.startedAt).format("DD MMM YYYY, hh:mm A") : "-"}
          </Text>
          <Progress percent={reviewStats?.percentage ?? 0} showInfo strokeColor="#1677ff" />
        </Space>
      </Card>

      <Card>
        <Divider orientation="left" style={{ marginTop: 0 }}>Question-wise Review</Divider>

        {answers.length ? (
          <List
            itemLayout="vertical"
            dataSource={answers}
            renderItem={(ans, index) => {
              const marksObtained = Number(ans?.marksObtained ?? 0) || 0;
              const maxMarks = resolveMaxMarks(ans);
              const hasEvaluation = ans?.isCorrect !== null && ans?.isCorrect !== undefined;

              return (
                <List.Item key={ans?._id || `${index}-${resolveQuestionText(ans, index)}`}>
                  <Card style={{ width: "100%" }}>
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Text strong>Q{index + 1}. {resolveQuestionText(ans, index)}</Text>
                      <Text>Answer: {formatAttemptAnswer(ans)}</Text>
                      <Space wrap>
                        <Tag color="blue">Marks: {marksObtained}/{maxMarks}</Tag>
                        {hasEvaluation ? (
                          <Tag color={ans.isCorrect ? "green" : "red"}>{ans.isCorrect ? "Correct" : "Incorrect"}</Tag>
                        ) : (
                          <Tag color="default">Pending evaluation</Tag>
                        )}
                        {ans?.flagged ? <Tag color="orange">Flagged</Tag> : null}
                      </Space>
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="No answers found" />
        )}
      </Card>
    </Space>
  );
};

export default AttemptReview;