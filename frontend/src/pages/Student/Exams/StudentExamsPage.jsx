import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ClockCircleOutlined, PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getExams, getStudentResults } from "../../../features/examSlice";
import { getActiveAttemptByExam, getAttempts, startAttempt } from "../../../features/attemptSlice";

const { Title, Text } = Typography;
const getExamWindowMeta = (exam, now = dayjs()) => {
  const startAt = exam?.startTime ? dayjs(exam.startTime) : null;
  const endAt = exam?.endTime ? dayjs(exam.endTime) : null;
  const isPublished = exam?.status === "published";

  if (!isPublished) {
    return { canStart: false, reason: "Exam is not published yet", color: "default" };
  }

  if (!startAt?.isValid() || !endAt?.isValid()) {
    return { canStart: false, reason: "Exam time window is not configured", color: "default" };
  }

  if (now.isBefore(startAt)) {
    return {
      canStart: false,
      reason: `Starts at ${startAt.format("DD MMM YYYY, hh:mm A")}`,
      color: "gold",
    };
  }

  if (now.isAfter(endAt)) {
    return {
      canStart: false,
      reason: `Closed at ${endAt.format("DD MMM YYYY, hh:mm A")}`,
      color: "red",
    };
  }

  return { canStart: true, reason: "Live now", color: "green" };
};


const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], results = [], loading } = useSelector((state) => state.exams || {});
  const { attempts = [], loading: attemptsLoading } = useSelector((state) => state.attempts || {});
  const safeExams = Array.isArray(exams) ? exams : [];
  const safeResults = Array.isArray(results) ? results : [];
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const [scheduleFilter, setScheduleFilter] = useState("upcoming");
  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "asc" }));
    dispatch(getStudentResults());
    dispatch(getAttempts({ status: "in_progress", limit: 100 }));
  }, [dispatch]);

  const inProgressByExam = useMemo(() => {
    const map = new Map();
    safeAttempts.forEach((attempt) => {
      const examId = attempt?.examId?._id || attempt?.examId;
      if (!examId) return;
      map.set(`${examId}`, attempt);
    });
    return map;
  }, [safeAttempts]);

  const filteredExams = useMemo(() => {
    const now = dayjs();
    if (scheduleFilter === "all") return safeExams;
    return safeExams.filter((exam) => {
      const examDate = dayjs(exam.examDate);
      if (scheduleFilter === "upcoming") return examDate.isAfter(now, "day") || examDate.isSame(now, "day");
      return examDate.isBefore(now, "day");
    });
  }, [safeExams, scheduleFilter]);

  const resultColumns = [
    { title: "Subject", dataIndex: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks" },
    { title: "Passing", dataIndex: "passingMarks" },
    {
      title: "Status",
      render: (_, row) => <Tag color={row.isPassed ? "green" : "red"}>{row.isPassed ? "PASS" : "FAIL"}</Tag>,
    },
  ];

  const summary = useMemo(() => {
    if (!safeResults.length) return null;
    const passed = safeResults.filter((result) => result.resultStatus === "PASS").length;
    const avgPercentage = Math.round(
      safeResults.reduce((acc, result) => acc + Number(result.percentage || 0), 0) / safeResults.length
    );
    return {
      total: safeResults.length,
      passed,
      failed: safeResults.length - passed,
      avgPercentage,
    };
  }, [safeResults]);

  const nextExam = useMemo(() => {
    const now = dayjs();
    return safeExams
      .filter((exam) => dayjs(exam.examDate).isAfter(now, "day") || dayjs(exam.examDate).isSame(now, "day"))
      .sort((a, b) => dayjs(a.examDate).valueOf() - dayjs(b.examDate).valueOf())[0];
  }, [safeExams]);

  const handleStartAttempt = async (examId) => {
    try {
      const activeAttempt = await dispatch(getActiveAttemptByExam(examId)).unwrap();
      if (activeAttempt?._id) {
        navigate(`/dashboard/student/exams/exam-live?attemptId=${activeAttempt._id}`);
        message.info("Resuming existing attempt");
        return;
      }
      const attempt = await dispatch(startAttempt({ examId })).unwrap();
      navigate(`/dashboard/student/exams/exam-live?attemptId=${attempt._id}`);
      message.success("Exam started successfully");
    } catch (error) {
      message.error(error || "Unable to start exam");
    }
  };

  const openExistingAttempt = (attemptId) => {
    navigate(`/dashboard/student/exams/exam-live?attemptId=${attemptId}`);
  };

  const openReview = (attemptId) => {
    navigate(`/dashboard/student/exams/attempt-review?attemptId=${attemptId}`);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={2}>
              <Title level={4} style={{ marginBottom: 0 }}>Exam Hub</Title>
              <Text type="secondary">Check schedule, start live exam attempts, and monitor results.</Text>
              <Tag color={nextExam ? "blue" : "default"} icon={<ClockCircleOutlined />}>
                {nextExam
                  ? `Next: ${nextExam.title} (${dayjs(nextExam.examDate).format("DD MMM YYYY")})`
                  : "No upcoming exam"}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic title="Average Percentage" value={summary?.avgPercentage || 0} suffix="%" />
              <Progress percent={summary?.avgPercentage || 0} size="small" strokeColor="#1677ff" />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Space style={{ justifyContent: "space-between", width: "100%" }} wrap>
            <Title level={4} style={{ marginBottom: 0 }}>Exam Schedule</Title>
            <Segmented
              value={scheduleFilter}
              onChange={setScheduleFilter}
              options={[
                { label: "Upcoming", value: "upcoming" },
                { label: "Completed", value: "completed" },
                { label: "All", value: "all" },
              ]}
            />
          </Space>

          {!!inProgressByExam.size && (
            <Alert
              type="info"
              showIcon
              message={`${inProgressByExam.size} exam attempt(s) are currently in progress. You can resume directly.`}
            />
          )}

          {filteredExams.length ? (
            <Row gutter={[12, 12]}>
              {filteredExams.map((exam) => {
                const attempt = inProgressByExam.get(`${exam._id}`);
                const examWindow = getExamWindowMeta(exam);
                const canStart = examWindow.canStart;

                return (
                  <Col xs={24} lg={12} key={exam._id}>
                    <Card
                      type="inner"
                      title={exam.title || "Untitled Exam"}
                      extra={<Tag color={exam.status === "published" ? "green" : "default"}>{exam.status || "draft"}</Tag>}
                    >
                      <Space direction="vertical" size={6} style={{ width: "100%" }}>
                        <Text type="secondary">{dayjs(exam.examDate).format("DD MMM YYYY")}</Text>
                        <Text>{exam.subjectId?.name || "Subject N/A"}</Text>
                        <Text>Total: {exam.totalMarks ?? 0} • Passing: {exam.passingMarks ?? 0}</Text>
                        <Text type="secondary">Start Time: {exam.startTime ? dayjs(exam.startTime).format(" HH:mm") : "N/A"} | End Time: {exam.endTime ? dayjs(exam.endTime).format(" HH:mm") : "N/A"}</Text>
                        <Text type="secondary">Duration: {exam.durationMinutes ?? 0} minutes</Text>
                          <Tag color={examWindow.color}>{examWindow.reason}</Tag>
                        <Space wrap>
                          {attempt ? (
                            <Button icon={<ReloadOutlined />} type="primary" onClick={() => openExistingAttempt(attempt._id)}>
                              Resume Attempt
                            </Button>
                          ) : (
                            <Button
                              icon={<PlayCircleOutlined />}
                              type="primary"
                              disabled={!canStart}
                              onClick={() => handleStartAttempt(exam._id)}
                            >
                              Start Exam
                            </Button>
                          )}

                          {attempt && (
                            <Button onClick={() => openReview(attempt._id)}>Attempt Review</Button>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty description="No exams scheduled" />
          )}
        </Space>
      </Card>

      <Card loading={loading || attemptsLoading}>
        <Title level={4}>Published Results</Title>
        {summary && (
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={24} sm={8}><Card size="small"><Statistic title="Total Results" value={summary.total} /></Card></Col>
            <Col xs={24} sm={8}><Card size="small"><Statistic title="Passed" value={summary.passed} valueStyle={{ color: "#389e0d" }} /></Card></Col>
            <Col xs={24} sm={8}><Card size="small"><Statistic title="Failed" value={summary.failed} valueStyle={{ color: "#cf1322" }} /></Card></Col>
          </Row>
        )}

        {!safeResults.length ? (
          <Empty description="No published results" />
        ) : (
          <Collapse
            items={safeResults.map((result) => ({
              key: result._id,
              label: `${result.examId?.title || "Exam"} | ${result.percentage}% | Grade ${result.grade}`,
              children: (
                <>
                  <Table
                    rowKey={(row) => `${row.subjectId}-${row.subjectName}`}
                    pagination={false}
                    columns={resultColumns}
                    dataSource={result.subjects || []}
                  />
                  <Text strong>
                    Status: <Tag color={result.resultStatus === "PASS" ? "green" : "red"}>{result.resultStatus}</Tag>
                  </Text>
                </>
              ),
            }))}
          />
        )}
      </Card>
    </Space>
  );
};

export default StudentExamsPage;
