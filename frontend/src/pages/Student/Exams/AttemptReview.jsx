import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Card, Typography, List, Tag, Divider, Spin, Empty, Space } from "antd";
import dayjs from "dayjs";
import { getAttemptById } from "../../../features/attemptSlice";

const { Title, Text } = Typography;

const resolveQuestionText = (answer) => {
  const snapshot = answer?.snapshot || answer?.questionSnapshot || answer?.questionRef || {};
  return snapshot?.statement || snapshot?.questionText || snapshot?.title || "Question";
};

const resolveAttemptStatus = (attempt) => {
  const status = attempt?.status || "in_progress";
  if (status === "evaluated") return { color: "green", label: "Evaluated" };
  if (status === "submitted") return { color: "blue", label: "Submitted" };
  return { color: "gold", label: "In Progress" };
};

const AttemptReview = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const attemptId = useMemo(() => new URLSearchParams(location.search).get("attemptId"), [location.search]);
  const { currentAttempt: attempt, loading } = useSelector((state) => state.attempts || {});

  useEffect(() => {
    if (attemptId) dispatch(getAttemptById(attemptId));
  }, [attemptId, dispatch]);

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

  const statusMeta = resolveAttemptStatus(attempt);
  const totalQuestions = attempt?.answers?.length || 0;

  return (
    <div style={{ padding: 8 }}>
      <Title level={3}>Attempt Review</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={4}>
          <Text strong>Exam:</Text>
          <Text>{attempt?.examId?.title || "N/A"}</Text>

          <Text strong>Total Score:</Text>
          <Text>{attempt?.totalMarksObtained ?? attempt?.totalObtainedMarks ?? 0}</Text>

          <Text strong>Status:</Text>
          <Tag color={statusMeta.color}>{statusMeta.label}</Tag>

          <Text strong>Started:</Text>
          <Text>{attempt?.startedAt ? dayjs(attempt.startedAt).format("DD MMM YYYY, hh:mm A") : "-"}</Text>

          <Text strong>Submitted:</Text>
          <Text>{attempt?.submittedAt ? dayjs(attempt.submittedAt).format("DD MMM YYYY, hh:mm A") : "Not submitted"}</Text>

          <Text strong>Questions:</Text>
          <Text>{totalQuestions}</Text>
        </Space>
      </Card>

      <Divider orientation="left">Question-wise Review</Divider>

      {attempt.answers?.length ? (
        <List
          dataSource={attempt.answers}
          renderItem={(ans, index) => (
            <List.Item>
              <Card style={{ width: "100%" }}>
                <Space direction="vertical" size={2}>
                  <Text strong>
                    Q{index + 1}: {resolveQuestionText(ans)}
                  </Text>
                  <Text>Answer: {ans.answer?.toString?.() || ans.response?.toString?.() || "-"}</Text>
                  <Text>Marks: {ans.marksObtained ?? 0}</Text>
                  {ans.isCorrect !== null && ans.isCorrect !== undefined && (
                    <Tag color={ans.isCorrect ? "green" : "red"}>{ans.isCorrect ? "Correct" : "Incorrect"}</Tag>
                  )}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No answers found" />
      )}
    </div>
  );
};

export default AttemptReview;
