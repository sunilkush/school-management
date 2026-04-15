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
import { getAttempts, startAttempt } from "../../../features/attemptSlice";

const { Title, Text } = Typography;

const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], results = [], loading } = useSelector((state) => state.exams || {});
  const { attempts = [], loading: attemptsLoading } = useSelector((state) => state.attempts || {});
  const [scheduleFilter, setScheduleFilter] = useState("upcoming");
  const {user} = useSelector((state) => state.auth || {});
  const schoolId = user?.school?._id || user?.schoolId || user?.school || null;
  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "asc" }));
    dispatch(getStudentResults());
    dispatch(getAttempts({ status: "in_progress", limit: 100, schoolId }));
  }, [dispatch, schoolId]);

  const inProgressByExam = useMemo(() => {
    const map = new Map();
    attempts.forEach((attempt) => {
      const examId = attempt?.examId?._id || attempt?.examId;
      if (!examId) return;
      map.set(`${examId}`, attempt);
    });
    return map;
  }, [attempts]);

  const filteredExams = useMemo(() => {
    const now = dayjs();
    if (scheduleFilter === "all") return exams;
    return exams.filter((exam) => {
      const examDate = dayjs(exam.examDate);
      if (scheduleFilter === "upcoming") return examDate.isAfter(now, "day") || examDate.isSame(now, "day");
      return examDate.isBefore(now, "day");
    });
  }, [exams, scheduleFilter]);

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
    if (!results.length) return null;
    const passed = results.filter((result) => result.resultStatus === "PASS").length;
    const avgPercentage = Math.round(
      results.reduce((acc, result) => acc + Number(result.percentage || 0), 0) / results.length
    );
    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      avgPercentage,
    };
  }, [results]);

  const nextExam = useMemo(() => {
    const now = dayjs();
    return exams
      .filter((exam) => dayjs(exam.examDate).isAfter(now, "day") || dayjs(exam.examDate).isSame(now, "day"))
      .sort((a, b) => dayjs(a.examDate).valueOf() - dayjs(b.examDate).valueOf())[0];
  }, [exams]);

  const handleStartAttempt = async (examId) => {
    if (!schoolId) {
      message.error("School context missing. Please re-login and try again.");
      return;
    }

    try {
      const attempt = await dispatch(startAttempt({ examId, schoolId })).unwrap();
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
                const canStart = exam.status === "published";

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
                        <Text type="secondary">Duration: {exam.durationMinutes ?? 0} minutes</Text>

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

        {!results.length ? (
          <Empty description="No published results" />
        ) : (
          <Collapse
            items={results.map((result) => ({
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
