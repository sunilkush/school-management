import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Card,
  Col,
  Collapse,
  Empty,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { getExams, getParentResults } from "../../../features/examSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const ParentExamsPage = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading } = useSelector((state) => state.studentPortal || {});
  const { exams = [], results = [], loading } = useSelector((state) => state.exams || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState("upcoming");

  useEffect(() => {
    dispatch(fetchMyChildren())
      .unwrap()
      .catch((error) => message.error(error || "Failed to load children"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.userId === selectedChildId) || null,
    [children, selectedChildId]
  );

  useEffect(() => {
    if (!selectedChildId) return;

    dispatch(getParentResults({ studentId: selectedChildId }))
      .unwrap()
      .catch((error) => message.error(error || "Failed to load published results"));
  }, [dispatch, selectedChildId]);

  useEffect(() => {
    if (!selectedChild?.classId) return;

    dispatch(
      getExams({
        schoolClassId: selectedChild.classId,
        ...(selectedChild.sectionId ? { sectionId: selectedChild.sectionId } : {}),
        sortBy: "examDate",
        sortOrder: "asc",
        status: "published",
      })
    )
      .unwrap()
      .catch((error) => message.error(error || "Failed to load exam schedule"));
  }, [dispatch, selectedChild]);

  const summary = useMemo(() => {
    if (!results.length) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        avgPercentage: 0,
      };
    }

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

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={2}>
              <Title level={4} style={{ marginBottom: 0 }}>Child Exam Dashboard</Title>
              <Text type="secondary">Track exam schedule and published results child-wise.</Text>
              <Select
                placeholder="Select child"
                value={selectedChildId}
                onChange={setSelectedChildId}
                loading={childrenLoading}
                style={{ width: 320, maxWidth: "100%" }}
                options={children.map((child) => ({
                  label: `${child.name}${child.className ? ` (${child.className}${child.sectionName ? ` - ${child.sectionName}` : ""})` : ""}`,
                  value: child.userId,
                }))}
              />
              <Tag color={nextExam ? "blue" : "default"}>
                {nextExam
                  ? `Next: ${nextExam.title || "Exam"} (${dayjs(nextExam.examDate).format("DD MMM YYYY")})`
                  : "No upcoming exam"}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic title="Average Percentage" value={summary.avgPercentage || 0} suffix="%" />
              <Progress percent={summary.avgPercentage || 0} size="small" strokeColor="#1677ff" />
            </Card>
          </Col>
        </Row>
      </Card>

      {!selectedChildId ? (
        <Card>
          <Empty description="No child selected" />
        </Card>
      ) : (
        <>
          <Card>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card size="small"><Statistic title="Results Published" value={summary.total} /></Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="Pass Count" value={summary.passed} valueStyle={{ color: "#389e0d" }} />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic title="Fail Count" value={summary.failed} valueStyle={{ color: "#cf1322" }} />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card loading={loading}>
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

              {selectedChild?.className ? (
                <Alert
                  type="info"
                  showIcon
                  message={`Showing published exams for ${selectedChild.className}${selectedChild.sectionName ? ` - ${selectedChild.sectionName}` : ""}.`}
                />
              ) : null}

              {!filteredExams.length ? (
                <Empty description="No exams scheduled" />
              ) : (
                <Row gutter={[12, 12]}>
                  {filteredExams.map((exam) => (
                    <Col xs={24} md={12} lg={8} key={exam._id}>
                      <Card
                        type="inner"
                        title={exam.title || "Untitled Exam"}
                        extra={<Tag color={exam.status === "published" ? "green" : "default"}>{exam.status || "draft"}</Tag>}
                      >
                        <Space direction="vertical" size={6}>
                          <Text type="secondary">{dayjs(exam.examDate).format("DD MMM YYYY")}</Text>
                          <Text>{exam.subjectId?.name || "Subject N/A"}</Text>
                          <Text>Total: {exam.totalMarks ?? 0} • Passing: {exam.passingMarks ?? 0}</Text>
                          <Text type="secondary">Duration: {exam.durationMinutes ?? 0} mins</Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Space>
          </Card>

          <Card loading={loading}>
            <Title level={4}>Published Results</Title>
            {!results.length ? (
              <Empty description="No published child results found" />
            ) : (
              <Collapse
                items={results.map((result) => ({
                  key: result._id,
                  label: `${result.examId?.title || "Exam"} | ${result.percentage}% | Grade ${result.grade || "-"}`,
                  children: (
                    <>
                      <Table
                        rowKey={(row) => `${row.subjectId}-${row.subjectName}`}
                        pagination={false}
                        columns={resultColumns}
                        dataSource={result.subjects || []}
                      />
                      <Space size="large" style={{ marginTop: 12 }} wrap>
                        <Text strong>Rank: {result.rank || "-"}</Text>
                        <Text strong>Obtained: {result.totalObtainedMarks || 0}/{result.totalMaximumMarks || 0}</Text>
                        <Text strong>
                          Status: <Tag color={result.resultStatus === "PASS" ? "green" : "red"}>{result.resultStatus}</Tag>
                        </Text>
                      </Space>
                    </>
                  ),
                }))}
              />
            )}
          </Card>
        </>
      )}
    </Space>
  );
};

export default ParentExamsPage;
