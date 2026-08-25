import React, { useEffect, useState } from "react";
import {
  Table, Row, Col, Select, Input, DatePicker, Button, Space, Tag, Flex, Typography,
} from "antd";
import { SearchOutlined, MailOutlined, ReloadOutlined, MessageOutlined, AppstoreOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../../../features/notificationSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const getChannelType = (channels = {}) => {
  if (channels.sms && channels.email) return "SMS+Email";
  if (channels.sms) return "SMS";
  if (channels.email) return "Email";
  return "App";
};

const getAudienceLabel = (n) => {
  if (n.level === "all") return "All";
  if (n.level === "role" && n.targetRoles?.length) return n.targetRoles.join(", ");
  return "All";
};

const SmsEmailHistory = () => {
  const dispatch = useDispatch();
  const { items: notifications, loading } = useSelector((s) => s.notification);

  const [filters, setFilters] = useState({ type: null, search: "", dateRange: null });

  useEffect(() => {
    dispatch(fetchNotifications({ status: "sent" }));
  }, [dispatch]);

  const history = notifications
    .filter((n) => n.channels?.sms || n.channels?.email || n.channels?.inApp)
    .map((n) => ({
      ...n,
      channelType: getChannelType(n.channels),
      audience: getAudienceLabel(n),
      dateSent: n.createdAt,
    }));

  const filteredData = history.filter((item) => {
    const matchType = filters.type ? item.channelType.includes(filters.type) : true;
    const matchSearch =
      !filters.search ||
      item.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.message?.toLowerCase().includes(filters.search.toLowerCase());
    const matchDate =
      !filters.dateRange ||
      (dayjs(item.dateSent).isAfter(filters.dateRange[0], "day") &&
        dayjs(item.dateSent).isBefore(filters.dateRange[1], "day"));
    return matchType && matchSearch && matchDate;
  });

  const totalApp = history.filter((h) => h.channels?.inApp).length;
  const totalSMS = history.filter((h) => h.channels?.sms).length;
  const totalEmail = history.filter((h) => h.channels?.email).length;

  const statCards = [
    { label: "In-App Notifications", value: totalApp, color: "var(--success)", icon: <AppstoreOutlined /> },
    { label: "SMS Sent", value: totalSMS, color: "var(--primary)", icon: <MessageOutlined /> },
    { label: "Emails Sent", value: totalEmail, color: "var(--warning)", icon: <MailOutlined /> },
  ];

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (v) => <Text strong style={{ color: "var(--text-primary)" }}>{v}</Text>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (v) => <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Audience",
      key: "audience",
      render: (_, r) => (
        <Tag color="purple" style={{ borderRadius: 99 }}>{getAudienceLabel(r)}</Tag>
      ),
    },
    {
      title: "Channel",
      key: "channel",
      render: (_, r) => (
        <Space size={4}>
          {r.channels?.inApp && <Tag color="blue" style={{ borderRadius: 99 }}>App</Tag>}
          {r.channels?.sms && <Tag color="green" style={{ borderRadius: 99 }}>SMS</Tag>}
          {r.channels?.email && <Tag color="orange" style={{ borderRadius: 99 }}>Email</Tag>}
        </Space>
      ),
    },
    {
      title: "Sent By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (v) => <Text style={{ fontSize: 13 }}>{v || "—"}</Text>,
    },
    {
      title: "Date Sent",
      dataIndex: "dateSent",
      key: "dateSent",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—",
      sorter: (a, b) => new Date(a.dateSent) - new Date(b.dateSent),
      defaultSortOrder: "descend",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag
          color={v === "sent" ? "green" : v === "scheduled" ? "blue" : "default"}
          style={{ borderRadius: 99 }}
        >
          {v}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("comm-history-tbl")}</style>
      <PageHeader
        title="Communication History"
        subtitle="View all sent notifications and broadcast history"
        icon={<MailOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchNotifications({ status: "sent" }))}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      <div style={pageWrapper}>
        {/* Stat Cards */}
        <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
          {statCards.map((s) => (
            <Col xs={24} sm={8} key={s.label}>
              <div style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border-muted)",
                borderTop: `4px solid ${s.color}`,
                padding: "16px 20px",
              }}>
                <Flex align="center" gap={14}>
                  <div style={iconWell(s.color, 44)}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                      {s.label}
                    </div>
                  </div>
                </Flex>
              </div>
            </Col>
          ))}
        </Row>

        {/* Filters */}
        <div style={{ ...sectionPanel, marginBottom: 20, padding: "14px 20px" }}>
          <Flex align="center" gap={10} wrap="wrap">
            <Select
              placeholder="Filter by Channel"
              allowClear
              style={{ width: 160 }}
              onChange={(value) => setFilters((f) => ({ ...f, type: value }))}
            >
              <Option value="SMS">SMS</Option>
              <Option value="Email">Email</Option>
              <Option value="App">In-App</Option>
            </Select>

            <Input
              placeholder="Search title or message"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              allowClear
            />

            <RangePicker
              onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates }))}
            />

            <Button onClick={() => setFilters({ type: null, search: "", dateRange: null })}>
              Reset
            </Button>

            <Text type="secondary" style={{ marginLeft: "auto", fontSize: 13 }}>
              {filteredData.length} records
            </Text>
          </Flex>
        </div>

        {/* Table */}
        <div style={sectionPanel}>
          <Table
            className="comm-history-tbl"
            scroll={{ x: 800 }}
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10, showTotal: (t) => `${t} total records` }}
            locale={{ emptyText: "No communication history found." }}
          />
        </div>
      </div>
    </>
  );
};

export default SmsEmailHistory;
