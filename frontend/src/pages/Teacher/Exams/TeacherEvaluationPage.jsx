import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckCircleOutlined, FilterOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { evaluateAttempt, getAttempts } from "../../../features/attemptSlice";
import ExamPageHeader from "../../../components/exams/ExamPageHeader";
import ExamStatCards from "../../../components/exams/ExamStatCards";

const { Text } = Typography;

const TeacherEvaluationPage = () => {
  const dispatch = useDispatch();
  const { attempts = [], loading, error } = useSelector((state) => state.attempts || {});
  const [marksByAttempt, setMarksByAttempt] = useState({});
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  useEffect(() => {
    dispatch(getAttempts({ status: "submitted", limit: 100 }));
  }, [dispatch]);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    attempts.forEach((attempt) => {
      const id = attempt?.examId?.subjectId?._id || attempt?.examId?.subjectId;
      const name = attempt?.examId?.subjectId?.name || "Unassigned";
      if (!map.has(id || name)) map.set(id || name, { label: name, value: id || name });
    });
    return Array.from(map.values());
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attempts.filter((attempt) => {
      const subjectId = attempt?.examId?.subjectId?._id || attempt?.examId?.subjectId;
      const bySubject = subjectFilter === "all" ? true : `${subjectId || ""}` === `${subjectFilter}`;
      const bySearch = q
        ? `${attempt?.examId?.title || ""} ${attempt?.studentId?.name || ""}`.toLowerCase().includes(q)
        : true;
      return bySubject && bySearch;
    });
  }, [attempts, search, subjectFilter]);

  const summary = useMemo(() => {
    const total = filteredAttempts.length;
    const highRisk = filteredAttempts.filter((a) => (a?.answers?.length || 0) === 0).length;
    const avgMarks = total
      ? Math.round(
          filteredAttempts.reduce((acc, a) => acc + Number(a?.totalObtainedMarks || 0), 0) / total
        )
      : 0;

    return { total, highRisk, avgMarks };
  }, [filteredAttempts]);

  const updateMarks = (attemptId, value) => {
    setMarksByAttempt((prev) => ({ ...prev, [attemptId]: value || 0 }));
  };

  const finalize = async (attempt) => {
    const maxMarks = Number(attempt?.examId?.totalMarks || 100);
    const marks = Math.min(Math.max(Number(marksByAttempt[attempt._id] || 0), 0), maxMarks);

    try {
      await dispatch(
        evaluateAttempt({
          attemptId: attempt._id,
          evaluations: [],
          grade: marks >= maxMarks * 0.35 ? "PASS" : "FAIL",
        })
      ).unwrap();

      message.success("Evaluation finalized");
      dispatch(getAttempts({ status: "submitted", limit: 100 }));
    } catch (err) {
      message.error(err || "Failed to finalize evaluation");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <ExamPageHeader
          title="Evaluation Queue"
          subtitle="Review submitted attempts, assign marks, and finalize outcomes quickly."
          breadcrumbItems={[{ title: "Dashboard" }, { title: "Exams" }, { title: "Evaluation" }]}
          actions={[
            <Input.Search
              key="search"
              allowClear
              placeholder="Search exam or student"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />,
            <Select
              key="subject"
              value={subjectFilter}
              onChange={setSubjectFilter}
              style={{ width: 180 }}
              prefix={<FilterOutlined />}
              options={[{ label: "All Subjects", value: "all" }, ...subjectOptions]}
            />,
          ]}
        />
      </Card>

      <ExamStatCards
        items={[
          { key: "queue", title: "Pending in Queue", value: summary.total },
          { key: "risk", title: "Requires Attention", value: summary.highRisk },
          { key: "avg", title: "Avg Current Score", value: summary.avgMarks },
        ]}
      />

      {error ? <Alert type="error" showIcon message="Failed to load attempts" description={String(error)} /> : null}

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={filteredAttempts}
          locale={{ emptyText: <Empty description="No submitted attempts found" /> }}
          columns={[
            {
              title: "Attempt",
              render: (_, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{row?.examId?.title || "-"}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{row?.examId?.subjectId?.name || "Subject N/A"}</Text>
                </Space>
              ),
            },
            { title: "Student", render: (_, row) => row?.studentId?.name || row?.studentId || "-" },
            { title: "Questions", render: (_, row) => row?.answers?.length || 0, width: 120 },
            {
              title: "Assign Score",
              width: 170,
              render: (_, row) => (
                <InputNumber
                  min={0}
                  max={Number(row?.examId?.totalMarks || 100)}
                  value={marksByAttempt[row._id]}
                  onChange={(v) => updateMarks(row._id, v)}
                />
              ),
            },
            {
              title: "Finalize",
              width: 140,
              render: (_, row) => (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => finalize(row)}>
                  Finalize
                </Button>
              ),
            },
            {
              title: "Status",
              width: 120,
              render: () => <Tag color="processing">Pending</Tag>,
            },
          ]}
        />
      </Card>
    </Space>
  );
};

export default TeacherEvaluationPage;
