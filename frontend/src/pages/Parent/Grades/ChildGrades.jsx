import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Button, Col, Collapse, Empty, Row, Select, Space, Table, Tag } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, TrophyOutlined,
} from "@ant-design/icons";
import { getParentResults } from "../../../features/examSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid, pill } from "../../../styles/pageStyles";

const STAT_COLORS = ["#14B8A6", "#22C55E", "#EF4444", "#F59E0B"];

const ChildGrades = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId");
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});
  const { results = [], loading } = useSelector((s) => s.exams || {});
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (selectedChildId || !children.length) return;
    const requested = requestedChildId && children.some((c) => c.userId === requestedChildId);
    setSelectedChildId(requested ? requestedChildId : children[0].userId);
  }, [children, selectedChildId, requestedChildId]);

  useEffect(() => {
    if (selectedChildId) dispatch(getParentResults({ studentId: selectedChildId }));
  }, [dispatch, selectedChildId]);

  const summary = useMemo(() => {
    const total  = results.length;
    const passed = results.filter((r) => r.resultStatus === "PASS").length;
    const scores = results.map((r) => Number(r.percentage || 0)).filter(Boolean);
    const avg    = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { total, passed, failed: total - passed, avg };
  }, [results]);

  // Chart data: one bar per exam showing percentage
  const chartData = useMemo(() =>
    results.map((r) => ({
      name: (r.examId?.title || "Exam").substring(0, 12),
      percentage: Number(r.percentage || 0),
    })),
  [results]);

  const subjectColumns = [
    { title: "Subject",  dataIndex: "subjectName", key: "subjectName", render: (v, r) => v || r.subjectId?.name || "—" },
    { title: "Obtained", dataIndex: "obtainedMarks", key: "obtainedMarks" },
    { title: "Total",    dataIndex: "totalMarks",    key: "totalMarks" },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={r.isPassed ? "green" : "red"} icon={r.isPassed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {r.isPassed ? "PASS" : "FAIL"}
        </Tag>
      ),
    },
  ];

  const statMeta = [
    { key: "total",  label: "Total Exams",   value: summary.total,  icon: <TrophyOutlined /> },
    { key: "passed", label: "Passed",         value: summary.passed, icon: <CheckCircleOutlined /> },
    { key: "failed", label: "Failed",         value: summary.failed, icon: <CloseCircleOutlined /> },
    { key: "avg",    label: "Average %",      value: summary.avg !== null ? `${summary.avg}%` : "—", icon: <TrophyOutlined /> },
  ];

  return (
    <>
      <PageHeader
        title="Child Grades"
        subtitle="View published exam results and subject-wise performance."
        icon={<TrophyOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => selectedChildId && dispatch(getParentResults({ studentId: selectedChildId }))}
            >
              Refresh
            </Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {/* Stats */}
        <div className="stat-grid" style={statGrid(160)}>
          {statMeta.map(({ key, label, icon, value }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                  Exam Performance
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, "Score"]} />
                    <Legend />
                    <Bar dataKey="percentage" name="Score %" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        )}

        {/* Exam Collapse */}
        <div style={sectionPanel}>
          {!selectedChildId ? (
            <Empty description="Select a child to view grades" />
          ) : !results.length ? (
            <Empty description="No published results found" />
          ) : (
            <Collapse
              items={results.map((result) => ({
                key: result._id,
                label: (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600 }}>{result.examId?.title || "Exam"}</span>
                    <span style={pill(result.resultStatus === "PASS" ? "#22C55E" : "#EF4444", result.resultStatus === "PASS" ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)")}>
                      {result.resultStatus}
                    </span>
                    <span style={pill("#14B8A6", "rgba(20,184,166,0.2)")}>{result.percentage}%</span>
                    <span style={pill("#2563EB", "#e0f2fe")}>Grade {result.grade}</span>
                  </div>
                ),
                children: (
                  <Table
                    rowKey={(r) => r.subjectId || r.subjectName}
                    columns={subjectColumns}
                    dataSource={result.subjects || []}
                    pagination={false}
                    size="small"
                  />
                ),
              }))}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ChildGrades;
