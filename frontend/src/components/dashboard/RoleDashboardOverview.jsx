import React from "react";
import { Card, Col, Empty, List, Row, Skeleton, Space, Statistic, Typography } from "antd";
import dayjs from "dayjs";
import { useGetRoleDashboardOverviewQuery } from "../../services/schoolDashboardApi";

const { Text, Title } = Typography;

const formatMetricValue = (metric = {}) => {
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(metric.value || 0));
  }

  return Number.isFinite(metric.value) || typeof metric.value === "number"
    ? metric.value
    : metric.value || 0;
};

const RoleDashboardOverview = ({ titlePrefix = "Dashboard" }) => {
  const { data, isLoading, isFetching } = useGetRoleDashboardOverviewQuery();

  if (isLoading || isFetching) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  const metrics = data?.metrics || [];
  const upcomingExams = data?.lists?.upcomingExams || [];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 0 }}>
          {titlePrefix}
        </Title>
        <Text type="secondary">Live overview based on your role permissions and school data.</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {metrics.length ? (
          metrics.map((metric) => (
            <Col key={metric.key} xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title={metric.label}
                  value={formatMetricValue(metric)}
                  suffix={metric.suffix || ""}
                />
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Card>
              <Empty description="No dashboard metrics available yet" />
            </Card>
          </Col>
        )}
      </Row>

      {upcomingExams.length ? (
        <Card title="Upcoming Exams">
          <List
            dataSource={upcomingExams}
            renderItem={(exam) => (
              <List.Item>
                <List.Item.Meta
                  title={exam.title || "Exam"}
                  description={exam.date ? dayjs(exam.date).format("DD MMM YYYY") : "Date not assigned"}
                />
              </List.Item>
            )}
          />
        </Card>
      ) : null}
    </Space>
  );
};

export default RoleDashboardOverview;
