import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, Row, Space, Tag, Typography, message } from "antd";

import QuestionCard from "./components/QuestionCard";
import ExamTimer from "./components/ExamTimer";
import AutosaveIndicator from "./components/AutosaveIndicator";
import { autosaveAnswer, getAttemptById, submitAttempt } from "../../../features/attemptSlice";

const { Title, Text } = Typography;

const resolveQuestionId = (question) => question?.questionRef?._id || question?.questionRef || question?.questionId;

const normalizeQuestion = (answerItem) => {
  const snapshot = answerItem?.snapshot || answerItem?.questionSnapshot || answerItem?.questionRef || {};
  return {
    ...answerItem,
    _id: resolveQuestionId(answerItem),
    text: snapshot?.statement || snapshot?.questionText || snapshot?.title || "Untitled Question",
    type: snapshot?.questionType || snapshot?.type || "subjective",
    options: snapshot?.options || [],
    marks: snapshot?.marks ?? 0,
  };
};

const ExamLive = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = useMemo(() => new URLSearchParams(location.search).get("attemptId"), [location.search]);
  const { currentAttempt, loading } = useSelector((state) => state.attempts || {});

  const [answers, setAnswers] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState("idle");
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimerRef = useRef();
  useEffect(() => {
    if (!attemptId) return;
    dispatch(getAttemptById(attemptId));
  }, [attemptId, dispatch]);

  useEffect(() => {
    if (!currentAttempt?.answers?.length) return;

    const mapped = currentAttempt.answers.reduce((acc, answerRow) => {
      const key = resolveQuestionId(answerRow);
      if (!key) return acc;
      acc[key] = answerRow.answer ?? answerRow.response ?? null;
      return acc;
    }, {});

    setAnswers(mapped);
  }, [currentAttempt]);

  const questions = useMemo(() => {
    if (!currentAttempt?.answers?.length) return [];
    return currentAttempt.answers.map(normalizeQuestion);
  }, [currentAttempt]);

  const handleAnswerChange = (qid, answer) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }));
    setAutosaveStatus("saving");

    if (!attemptId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      dispatch(autosaveAnswer({ attemptId, questionId: qid, answer }))
        .unwrap()
        .then(() => setAutosaveStatus("saved"))
        .catch(() => setAutosaveStatus("error"));
    }, 350);
  };

  useEffect(() => () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
  }, []);

  const buildSubmitPayload = () => {
    return questions.map((question) => ({
      questionRef: `${question._id}`,
      answer: answers[question._id] ?? null,
      flagged: false,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      message.error("Attempt ID missing");
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildSubmitPayload();
      await dispatch(submitAttempt({ attemptId, answers: payload })).unwrap();
      message.success("Exam submitted successfully");
      navigate(`/dashboard/student/exams/attempt-review?attemptId=${attemptId}`);
    } catch (error) {
      message.error(error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!attemptId) {
    return <Empty description="No attempt selected. Start exam from Exam Hub." />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card loading={loading}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ marginBottom: 0 }}>Live Exam</Title>
              <Text type="secondary">Attempt ID: {attemptId}</Text>
              <Tag color="blue">Status: {currentAttempt?.status || "in_progress"}</Tag>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <ExamTimer duration={(currentAttempt?.examId?.durationMinutes || 30) * 60} onTimeUp={handleSubmit} />
          </Col>
        </Row>
      </Card>

      {!questions.length ? (
        <Card loading={loading}>
          <Empty description="No question snapshot available in this attempt" />
        </Card>
      ) : (
        <>
          {questions.map((question, i) => (
            <QuestionCard
              key={question._id}
              index={i}
              question={question}
              userAnswer={answers[question._id]}
              onAnswerChange={handleAnswerChange}
            />
          ))}

          <Card>
            <Row justify="space-between" align="middle" gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <AutosaveIndicator status={autosaveStatus} />
              </Col>
              <Col xs={24} md={12}>
                <Button type="primary" size="large" onClick={handleSubmit} block loading={submitting}>
                  Submit Exam
                </Button>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Space>
  );
};

export default ExamLive;
