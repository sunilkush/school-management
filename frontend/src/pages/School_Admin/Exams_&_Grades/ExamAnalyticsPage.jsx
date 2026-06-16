import React, { useMemo, useState } from "react";
import { Alert, Col, Empty, Row, Select, Space, Statistic, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { BarChartOutlined, TrophyOutlined, TeamOutlined } from "@ant-design/icons";
import { getExamAnalytics, getExams } from "../../../features/examSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  toolbarRow,
  statCard,
  statLabel,
  statValue,
  statGrid,
} from "../../../styles/pageStyles";

const { Text } = Typography;

const ExamAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], analytics, loading, error } = useSelector((state) => state.exams || {});
  const [examId, setExamId] = useState();

  React.useEffect(() => {
    dispatch(getExams());
  }, [dispatch]);

  React.useEffect(() => {
    if (examId) dispatch(getExamAnalytics(examId));
  }, [examId, dispatch]);

  const stats = useMemo(() => {
    const totalAttempts = analytics?.attempts?.total || 0;
    const averageScore = Number(analytics?.evaluation?.averageObtainedMarks || 0);
    const passRate = Number(analytics?.evaluation?.passPercentage || 0);
    return { totalAttempts, averageScore, passRate };
  }, [analytics]);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Exam Analytics"
        subtitle="Track performance, pass rates, and insights for each exam."
        icon={<BarChartOutlined />}
      />

      <div style={{ marginTop: 20 }}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <div className="page-toolbar" style={toolbarRow}>
            <Select
              value={examId}
              onChange={setExamId}
              placeholder="Select exam to view analytics"
              style={{ width: 320 }}
              options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
            />
          </div>
        </div>

        {error ? (
          <Alert
            type="error"
            message="Unable to load exam analytics"
            description={String(error)}
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        ) : null}

        {!examId ? (
          <div style={pageCard}>
            <Empty
              description="Select an exam above to view analytics"
              style={{ padding: "48px 24px" }}
            />
          </div>
        ) : (
          <>
            <div className="stat-grid" style={statGrid(200)}>
              {[
                { key: "attempts", title: "Total Attempts", value: stats.totalAttempts, color: "var(--primary)", icon: <TeamOutlined /> },
                { key: "avg", title: "Average Score", value: `${stats.averageScore.toFixed(2)}%`, color: "#0284c7", icon: <TrophyOutlined /> },
                { key: "pass", title: "Pass Rate", value: `${stats.passRate.toFixed(2)}%`, color: "#059669", icon: <BarChartOutlined /> },
              ].map((item) => (
                <div key={item.key} style={statCard({ color: item.color })}>
                  <div>
                    <div style={statLabel(item.color)}>{item.title}</div>
                    <div style={statValue(item.color)}>{item.value}</div>
                  </div>
                  <span style={{ fontSize: 28, color: item.color, opacity: 0.6 }}>{item.icon}</span>
                </div>
              ))}
            </div>

            <div style={sectionPanel}>
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  Risk Level:{" "}
                  <Text style={{ color: "var(--text-secondary)" }}>
                    {analytics?.enterpriseInsights?.riskLevel || "n/a"}
                  </Text>
                </Text>
                <Text type="secondary">
                  {analytics?.enterpriseInsights?.recommendation || "No recommendation available."}
                </Text>
              </Space>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamAnalyticsPage;
