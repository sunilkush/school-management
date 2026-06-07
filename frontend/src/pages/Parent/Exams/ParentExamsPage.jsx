import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Card,
  Collapse,
  Empty,
  Progress,
  Select,
  Segmented,
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
import ExamPageHeader from "../../../components/exams/ExamPageHeader";
import ExamStatCards from "../../../components/exams/ExamStatCards";

const { Text } = Typography;

const ParentExamsPage = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading } = useSelector((state) => state.studentPortal || {});
  const { exams = [], results = [], loading, error } = useSelector((state) => state.exams || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState("upcoming");

  useEffect(() => {
    dispatch(fetchMyChildren())
      .unwrap()
      .catch((err) => message.error(err || "Failed to load children"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.userId === selectedChildId) || null,
    [children, selectedChildId]
  );

  useEffect(() => {
    if (!selectedChildId) return;
    dispatch(getParentResults({ studentId: selectedChildId })).unwrap().catch(() => null);
  }, [dispatch, selectedChildId]);

  useEffect(() => {
    if (!selectedChild?.classId) return;
    dispatch(
      getExams({
         studentId: selectedChildId,
        schoolClassId: selectedChild.classId,
        ...(selectedChild.sectionId ? { sectionId: selectedChild.sectionId } : {}),
        sortBy: "examDate",
        sortOrder: "asc",
        status: "published",
      })
    ).unwrap().catch(() => null);
  }, [dispatch, selectedChild, selectedChildId]);

  const summary = useMemo(() => {
    const total = results.length;
    const passed = results.filter((result) => result.resultStatus === "PASS").length;
    const avgPercentage = total
      ? Math.round(results.reduce((acc, result) => acc + Number(result.percentage || 0), 0) / total)
      : 0;
    return { total, passed, failed: total - passed, avgPercentage };
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
      return scheduleFilter === "upcoming"
        ? examDate.isAfter(now, "day") || examDate.isSame(now, "day")
        : examDate.isBefore(now, "day");
    });
  }, [exams, scheduleFilter]);

  const resultColumns = [
    { title: "Subject", dataIndex: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks" },
    {
      title: "Status",
      render: (_, row) => <Tag color={row.isPassed ? "green" : "red"}>{row.isPassed ? "PASS" : "FAIL"}</Tag>,
    },
  ];

  if (!childrenLoading && !children.length) {
    return (
      <Card>
        <Empty description="No linked children found for this parent account" />
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%", padding: "24px" }} size="middle">
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <ExamPageHeader
          title="Child Exam Hub"
          subtitle="Monitor exam schedules and results with a parent-friendly, printable layout."
          breadcrumbItems={[{ title: "Dashboard" }, { title: "Exams" }]}
          actions={[
            <Select
              key="child"
              placeholder="Select child"
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childrenLoading}
              style={{ width: 340, maxWidth: "100%" }}
              options={children.map((child) => ({
                label: `${child.name}${child.className ? ` (${child.className}${child.sectionName ? ` - ${child.sectionName}` : ""})` : ""}`,
                value: child.userId,
              }))}
            />,
          ]}
        />
        <Tag color={nextExam ? "blue" : "default"} style={{ marginTop: 8 }}>
          {nextExam ? `Next: ${nextExam.title || "Exam"} (${dayjs(nextExam.examDate).format("DD MMM YYYY")})` : "No upcoming exam"}
        </Tag>
      </Card>

      <ExamStatCards
        items={[
          { key: "published", title: "Results Published", value: summary.total },
          { key: "pass", title: "Pass", value: summary.passed, valueStyle: { color: "#389e0d" } },
          { key: "fail", title: "Fail", value: summary.failed, valueStyle: { color: "#cf1322" } },
          { key: "avg", title: "Avg %", value: summary.avgPercentage, suffix: "%" },
        ]}
      />

      <Card>
        <Statistic title="Performance Trend" value={summary.avgPercentage} suffix="%" />
        <Progress percent={summary.avgPercentage} size="small" strokeColor="#1677ff" />
      </Card>

      {error ? <Alert type="error" showIcon message="Some exam data failed to load" description={String(error)} /> : null}

      <Card loading={loading}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space style={{ justifyContent: "space-between", width: "100%" }} wrap>
            <Text strong>Exam Schedule</Text>
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

          {!filteredExams.length ? (
            <Empty description="No exams scheduled for selected child" />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {filteredExams.map((exam) => (
                <Card key={exam._id} size="small">
                  <Space direction="vertical" size={2}>
                    <Text strong>{exam.title || "Untitled Exam"}</Text>
                    <Text type="secondary">{dayjs(exam.examDate).format("DD MMM YYYY")}</Text>
                    <Text>{exam.subjectId?.name || "Subject N/A"}</Text>
                    <Text type="secondary">Total {exam.totalMarks ?? 0} • Passing {exam.passingMarks ?? 0}</Text>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Space>
      </Card>

      <Card loading={loading}>
        <Text strong>Published Results</Text>
        {!results.length ? (
          <Empty description="No published results found" style={{ marginTop: 16 }} />
        ) : (
          <Collapse
            style={{ marginTop: 16 }}
            items={results.map((result) => ({
              key: result._id,
              label: `${result.examId?.title || "Exam"} • ${result.percentage}% • Grade ${result.grade || "-"}`,
              children: (
                <>
                  <Table
                    rowKey={(row) => `${row.subjectId}-${row.subjectName}`}
                    pagination={false}
                    columns={resultColumns}
                    dataSource={result.subjects || []}
                  />
                  <Space size="large" wrap style={{ marginTop: 12 }}>
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
    </Space>
  );
};

export default ParentExamsPage;
