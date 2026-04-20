import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Empty, Input, List, Progress, Row, Space, Statistic, Tag } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAvailableOnlineExams, startOnlineExamAttempt } from "../../features/exam/onlineExamSlice";
import { clearOnlineAnswer, fetchOnlineAttempt, markQuestionReview, saveOnlineAnswer, submitOnlineAttempt } from "../../features/exam/examAttemptSlice";

export const OnlineExamsAvailablePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.onlineExam || {});

  useEffect(() => { dispatch(fetchAvailableOnlineExams()); }, [dispatch]);

  const startExam = async (examId) => {
    const res = await dispatch(startOnlineExamAttempt({ examId }));
    const attemptId = res.payload?._id;
    if (attemptId) navigate(`/dashboard/student/exams/attempt/${attemptId}`);
  };

  return (
    <Card title="Available Online Exams">
      <List loading={loading} dataSource={list || []} locale={{ emptyText: <Empty description="No online exams available" /> }} renderItem={(item) => (
        <List.Item actions={[<Button key="start" type="primary" onClick={() => startExam(item._id)}>Start</Button>]}> 
          <List.Item.Meta title={item.name} description={`${item.examType} • ${new Date(item.startDate).toLocaleDateString()}`} />
          <Tag>{item.status}</Tag>
        </List.Item>
      )} />
    </Card>
  );
};

export const OnlineExamAttemptPage = () => {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { detail, paper, responses, timer, loading } = useSelector((s) => s.examAttemptV2 || {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => { dispatch(fetchOnlineAttempt(attemptId)); }, [attemptId, dispatch]);

  const questions = useMemo(() => (paper?.sections || []).flatMap((sec) => sec.questions || []), [paper]);
  const currentQuestion = questions[currentIndex] || null;

  const saveCurrent = async () => {
    if (!currentQuestion) return;
    await dispatch(saveOnlineAnswer({ attemptId, payload: { questionId: currentQuestion._id, answerText: textAnswer, selectedOption } }));
    dispatch(fetchOnlineAttempt(attemptId));
  };

  const submitNow = async () => {
    await dispatch(submitOnlineAttempt(attemptId));
    navigate(`/dashboard/student/exams/attempt/${attemptId}/result`);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Row gutter={16}>
          <Col span={6}><Statistic title="Remaining (sec)" value={timer?.remainingSeconds ?? 0} /></Col>
          <Col span={6}><Statistic title="Answered" value={detail?.answeredCount || 0} /></Col>
          <Col span={6}><Statistic title="Review" value={detail?.markedForReviewCount || 0} /></Col>
          <Col span={6}><Progress percent={questions.length ? Math.round(((detail?.answeredCount || 0) / questions.length) * 100) : 0} /></Col>
        </Row>
      </Card>
      <Row gutter={16}>
        <Col span={18}>
          <Card loading={loading} title={`Question ${currentIndex + 1}`} extra={<Tag>{currentQuestion?.questionType}</Tag>}>
            <p>{currentQuestion?.questionText}</p>
            {(currentQuestion?.options || []).map((opt) => (
              <Button key={opt.key} style={{ display: "block", marginBottom: 8 }} type={selectedOption === opt.key ? "primary" : "default"} onClick={() => setSelectedOption(opt.key)}>{opt.key}. {opt.text}</Button>
            ))}
            <Input.TextArea rows={4} placeholder="Write your answer..." value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} />
            <Space style={{ marginTop: 12 }}>
              <Button onClick={() => setCurrentIndex((v) => Math.max(v - 1, 0))}>Previous</Button>
              <Button onClick={saveCurrent}>Save & Next</Button>
              <Button onClick={() => dispatch(markQuestionReview({ attemptId, payload: { questionId: currentQuestion?._id, isMarkedForReview: true } }))}>Mark Review</Button>
              <Button onClick={() => dispatch(clearOnlineAnswer({ attemptId, payload: { questionId: currentQuestion?._id } }))}>Clear</Button>
              <Button type="primary" danger onClick={submitNow}>Final Submit</Button>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Question Palette">
            <Space wrap>{questions.map((question, idx) => (<Button key={question._id} size="small" type={idx === currentIndex ? "primary" : "default"} onClick={() => setCurrentIndex(idx)}>{idx + 1}</Button>))}</Space>
          </Card>
          <Card title="Autosave" style={{ marginTop: 12 }}><Tag color="green">Enabled</Tag></Card>
        </Col>
      </Row>
      <Card title="Response Snapshot"><pre style={{ maxHeight: 220, overflow: "auto" }}>{JSON.stringify(responses, null, 2)}</pre></Card>
    </Space>
  );
};

export const OnlineAttemptResultPage = () => {
  const { attemptId } = useParams();
  const { detail } = useSelector((s) => s.examAttemptV2 || {});
  const dispatch = useDispatch();
  useEffect(() => { dispatch(fetchOnlineAttempt(attemptId)); }, [attemptId, dispatch]);
  return (
    <Card title="Online Exam Result">
      <p>Status: <Tag>{detail?.status}</Tag></p>
      <p>Objective Score: {detail?.objectiveScore || 0}</p>
      <p>Subjective Score: {detail?.subjectiveScore || 0}</p>
      <p>Total Score: {detail?.totalScore || 0}</p>
      <p>Evaluation: {detail?.evaluationStatus || "pending"}</p>
    </Card>
  );
};
