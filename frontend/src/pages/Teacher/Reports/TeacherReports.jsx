import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Layout,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";
import { fetchReports } from "../../../features/reportSlice";


const { Content } = Layout;
const { Title, Text } = Typography;

const normalizeUserContext = (rawUser) => {
  const roleName =
    (typeof rawUser?.role === "string" ? rawUser?.role : rawUser?.role?.name) ||
    "";

  return {
    role: roleName,
    schoolId: rawUser?.school?._id || rawUser?.schoolId || "",
    teacherName: rawUser?.name || "Teacher",
  };
};

const TeacherReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { summary = [], loading: summaryLoading, error: summaryError } = useSelector(
    (state) => state.dashboard || {}
  );
  const { items = [], loading: reportsLoading, error: reportsError } = useSelector(
    (state) => state.reports || {}
  );

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const rawUser = useMemo(() => {
    const userFromStorage = user?._id
    if (!userFromStorage) return null;

    try {
      return JSON.parse(userFromStorage);
    } catch (error) {
      console.error("Unable to parse user from storage", error);
      return null;
    }
  }, [user?._id]);

  const { role, schoolId, teacherName } = useMemo(
    () => normalizeUserContext(rawUser),
    [rawUser]
  );

  const refreshAll = () => {
    if (role) {
      dispatch(fetchDashboardSummary({ role, schoolId }));
    }
    dispatch(fetchReports({ sort: "-createdAt" }));
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, schoolId]);

  const filteredReports = useMemo(() => {
    const bySearch = String(searchText || "").trim().toLowerCase();

    return items.filter((report) => {
      const matchesType = selectedType === "all" || report?.type === selectedType;
      if (!matchesType) return false;

      if (!bySearch) return true;
      const searchableText = [
        report?.title,
        report?.type,
        report?.generatedBy?.name,
        report?.school?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(bySearch);
    });
  }, [items, searchText, selectedType]);

  const reportTypeOptions = useMemo(() => {
    const types = new Set(items.map((item) => item?.type).filter(Boolean));
    return [
      { label: "All types", value: "all" },
      ...[...types].map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      })),
    ];
  }, [items]);

  const tableColumns = [
    {
      title: "Report Title",
      dataIndex: "title",
      key: "title",
      render: (value) => value || "Untitled report",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (value) => (
        <Tag color="blue" style={{ textTransform: "capitalize" }}>
          {value || "unknown"}
        </Tag>
      ),
    },
    {
      title: "Created By",
      dataIndex: ["generatedBy", "name"],
      key: "generatedBy",
      render: (value) => value || "-",
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
  ];

  const cards = [
    {
      title: "Linked Students",
      value: summary.find((item) => item.title === "Students")?.value || 0,
    },
    {
      title: "Attendance Marked",
      value: summary.find((item) => item.title === "Attendance Marked")?.value || 0,
    },
    {
      title: "Reports Available",
      value: items.length,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <Content style={{ padding: 16 }}>
        <Space
          style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}
          align="start"
          wrap
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              {teacherName} - Reports Dashboard
            </Title>
            <Text type="secondary">
              This page is now fully dynamic and loads reports + summary in real-time.
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Refresh
          </Button>
        </Space>

        {summaryError && <Alert type="error" showIcon message={summaryError} style={{ marginBottom: 12 }} />}
        {reportsError && <Alert type="error" showIcon message={reportsError} style={{ marginBottom: 12 }} />}

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {cards.map((card) => (
            <Col xs={24} md={8} key={card.title}>
              <Card bordered={false}>
                <Statistic title={card.title} value={card.value} loading={summaryLoading} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card bordered={false}>
          <Space wrap style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="Search by title, type, creator"
              allowClear
              style={{ width: 280 }}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <Select
              style={{ width: 180 }}
              options={reportTypeOptions}
              value={selectedType}
              onChange={setSelectedType}
            />
          </Space>

          {reportsLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Empty description="No reports matched your filters" />
          ) : (
            <Table
              rowKey={(record) => record._id}
              columns={tableColumns}
              dataSource={filteredReports}
              pagination={{ pageSize: 8 }}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default TeacherReports;
