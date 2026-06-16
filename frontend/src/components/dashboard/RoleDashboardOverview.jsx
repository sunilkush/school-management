import React from "react";
import {
  Card,
  Col,
  Empty,
  List,
  Row,
  Skeleton,
  Space,
  Statistic,
  Typography,
  Alert,
  Button,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
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

const MetricCardSkeleton = () => (
  <Card style={{ borderRadius: 12 }}>
    <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
  </Card>
);

const RoleDashboardOverview = ({ titlePrefix = "Dashboard" }) => {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRoleDashboardOverviewQuery();

  const loading = isLoading || isFetching;

  if (isError) {
    return (
      <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message="Failed to load dashboard"
          description={
            error?.data?.message ||
            error?.message ||
            "An unexpected error occurred. Please try again."
          }
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={refetch}>
              Retry
            </Button>
          }
          style={{ borderRadius: 10 }}
        />
      </Space>
    );
  }

  const metrics = data?.metrics || [];
  const upcomingExams = data?.lists?.upcomingExams || [];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card style={{ borderRadius: 12 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {titlePrefix}
        </Title>
        <Text type="secondary">
          Live overview based on your role permissions and school data.
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Col key={i} xs={24} sm={12} md={8}>
              <MetricCardSkeleton />
            </Col>
          ))
        ) : metrics.length ? (
          metrics.map((metric) => (
            <Col key={metric.key} xs={24} sm={12} md={8}>
              <Card style={{ borderRadius: 12 }}>
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
            <Card style={{ borderRadius: 12 }}>
              <Empty description="No dashboard metrics available yet" />
            </Card>
          </Col>
        )}
      </Row>

      {!loading && upcomingExams.length > 0 && (
        <Card title="Upcoming Exams" style={{ borderRadius: 12 }}>
          <List
            dataSource={upcomingExams}
            renderItem={(exam) => (
              <List.Item>
                <List.Item.Meta
                  title={exam.title || "Exam"}
                  description={
                    exam.date
                      ? dayjs(exam.date).format("DD MMM YYYY")
                      : "Date not assigned"
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </Space>
  );
};

export default RoleDashboardOverview;
