import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Grid,
  Input,
  List,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  NotificationOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  createNotificationPayload,
  getNotificationAnalytics,
  getNotifications,
  getVisibleNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  saveNotifications,
} from "../utils/notifications";
import { ALL_ROLE_NAMES, getRoleName } from "../utils/roles";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const LEVEL_OPTIONS = [
  { label: "All Roles & Users", value: "all" },
  { label: "Role-wise", value: "role" },
  { label: "User Level-wise", value: "user-level" },
  { label: "Specific Users", value: "user" },
];

const FILTER_OPTIONS = [{ label: "All", value: "all" }, ...LEVEL_OPTIONS.slice(1)];
const ROLE_OPTIONS = ALL_ROLE_NAMES.map((role) => ({ label: role, value: role }));
const CREATOR_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator", "Receptionist", "IT Support"];

const formatDate = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const safeText = (value, fallback) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => safeText(entry, "")).filter(Boolean).join(", ") || fallback;
  return fallback;
};

const getStatusColor = (status) => {
  if (status === "scheduled") return "orange";
  if (status === "draft") return "default";
  if (status === "failed") return "red";
  return "green";
};

const getLevelColor = (level) => {
  if (level === "role") return "geekblue";
  if (level === "user-level") return "purple";
  if (level === "user") return "cyan";
  return "blue";
};

const Notification = () => {
  const screens = useBreakpoint();
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [allNotifications, setAllNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filterLevel, setFilterLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isMobile = !screens.sm;
  const isTablet = screens.sm && !screens.lg;
  const pagePadding = isMobile ? 12 : 24;
  const roleName = getRoleName(user);
  const canCreateNotification = CREATOR_ROLES.includes(roleName);
  const selectedLevel = Form.useWatch("level", form);

  const visibleNotifications = useMemo(
    () => getVisibleNotificationsForUser(allNotifications, user),
    [allNotifications, user]
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleNotifications.filter((item) => {
      const itemLevel = safeText(item?.level, "all");
      const matchesLevel = filterLevel === "all" || itemLevel === filterLevel;
      const matchesSearch =
        !query ||
        [
          safeText(item?.title, "Notification"),
          safeText(item?.message, "No message available"),
          safeText(item?.createdBy, "System"),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesLevel && matchesSearch;
    });
  }, [visibleNotifications, filterLevel, search]);

  const unreadCount = visibleNotifications.filter((item) => !item.isRead).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, stats] = await Promise.all([getNotifications(), getNotificationAnalytics()]);
      setAllNotifications(rows);
      setAnalytics(stats);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onCreateNotification = async (values) => {
    const payload = createNotificationPayload({
      title: values.title,
      message: values.message,
      level: values.level,
      targetRoles: values.targetRoles || [],
      targetLevels: values.targetLevels || [],
      targetUserIds: values.targetUserIds || [],
      channels: {
        inApp: values.channels?.includes("inApp") ?? true,
        email: values.channels?.includes("email"),
        sms: values.channels?.includes("sms"),
        whatsapp: values.channels?.includes("whatsapp"),
      },
      scheduledAt: values.scheduledAt?.toISOString?.() || null,
      status: values.saveAsDraft ? "draft" : undefined,
    });

    setSubmitting(true);
    try {
      const createdNotification = await saveNotifications(payload);
      setAllNotifications((prev) => [createdNotification, ...prev]);
      form.resetFields();
      message.success("Notification created successfully.");
      loadNotifications();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to create notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (notification) => {
    if (!notification?._id || notification.isRead) return;
    try {
      const updated = await markNotificationAsRead(notification._id);
      setAllNotifications((prev) => prev.map((item) => (item._id === notification._id ? updated : item)));
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
      message.success("All visible notifications marked as read.");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to mark all notifications as read");
    }
  };

  const statCards = [
    {
      title: "Visible",
      value: visibleNotifications.length,
      icon: <InboxOutlined />,
      color: "#7c3aed",
      background: "linear-gradient(135deg, #ede9fe 0%, var(--surface) 100%)",
      helper: "Assigned to you",
    },
    {
      title: "Unread",
      value: unreadCount,
      icon: <BellOutlined />,
      color: "#f97316",
      background: "linear-gradient(135deg, #fff7ed 0%, var(--surface) 100%)",
      helper: "Needs attention",
    },
    {
      title: "Scheduled",
      value: analytics.scheduled || 0,
      icon: <CalendarOutlined />,
      color: "#0284c7",
      background: "linear-gradient(135deg, #e0f2fe 0%, var(--surface) 100%)",
      helper: "Planned delivery",
    },
    {
      title: "Opened",
      value: analytics.opened || 0,
      icon: <EyeOutlined />,
      color: "#059669",
      background: "linear-gradient(135deg, #d1fae5 0%, var(--surface) 100%)",
      helper: "Engagement",
    },
  ];

  const renderConditionalTargetFields = () => {
    if (selectedLevel === "role") {
      return (
        <Col xs={24} lg={12}>
          <Form.Item label="Target roles" name="targetRoles" rules={[{ required: true, message: "Select at least one role" }]}>
            <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Choose one or more roles" maxTagCount="responsive" />
          </Form.Item>
        </Col>
      );
    }

    if (selectedLevel === "user-level") {
      return (
        <>
          <Col xs={24} lg={12}>
            <Form.Item label="Target roles" name="targetRoles" rules={[{ required: true, message: "Select at least one role" }]}>
              <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Choose roles for this user level" maxTagCount="responsive" />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="User levels" name="targetLevels" rules={[{ required: true, message: "Enter at least one user level" }]}>
              <Select mode="tags" tokenSeparators={[","]} placeholder="Example: Class 10, Section A, Science" maxTagCount="responsive" />
            </Form.Item>
          </Col>
        </>
      );
    }

    if (selectedLevel === "user") {
      return (
        <Col xs={24}>
          <Form.Item label="Specific users" name="targetUserIds" rules={[{ required: true, message: "Enter target users" }]}>
            <Select
              mode="tags"
              tokenSeparators={[","]}
              placeholder="Add emails, registration IDs, or user IDs separated by commas"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Col>
      );
    }

    return (
      <Col xs={24}>
        <Alert
          type="success"
          showIcon
          message="Broadcasting to everyone"
          description="This notification will be visible to every role and user account in the portal."
          style={{ borderRadius: 12 }}
        />
      </Col>
    );
  };

  return (
    <div style={{ width: "100%", padding: pagePadding, background: "var(--surface-page)", minHeight: "100vh" }}>
      <Space direction="vertical" size={isMobile ? 14 : 20} style={{ width: "100%" }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
          }}
          styles={{ body: { padding: isMobile ? 18 : 28 } }}
        >
          <Row gutter={[20, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space align="center" wrap>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "var(--primary)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    <NotificationOutlined />
                  </span>
                  <Badge count={unreadCount} overflowCount={99} offset={[4, 0]}>
                    <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>
                      Notifications
                    </Title>
                  </Badge>
                </Space>
                <Paragraph type="secondary" style={{ margin: 0, maxWidth: 760 }}>
                  Modern role-wise, user-level, and user-specific notification center for every portal role.
                </Paragraph>
              </Space>
            </Col>
            <Col xs={24} lg={8}>
              <Space direction={isMobile ? "vertical" : "horizontal"} size={12} style={{ width: "100%", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                <Tag icon={<TeamOutlined />} color="blue" style={{ marginInlineEnd: 0, padding: "4px 10px", borderRadius: 999 }}>
                  {safeText(roleName, "User")}
                </Tag>
                {canCreateNotification && (
                  <Button type="primary" icon={<SendOutlined />} size="large" block={isMobile} onClick={() => form.scrollToField("title")}>
                    Create Broadcast
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
          {statCards.map((stat) => (
            <Col xs={12} md={6} key={stat.title}>
              <Card
                bordered={false}
                style={{ borderRadius: 18, background: stat.background, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", height: "100%" }}
                styles={{ body: { padding: isMobile ? 14 : 18 } }}
              >
                <Space direction="vertical" size={isMobile ? 8 : 12} style={{ width: "100%" }}>
                  <span
                    style={{
                      width: isMobile ? 34 : 42,
                      height: isMobile ? 34 : 42,
                      borderRadius: 12,
                      background: `${stat.color}18`,
                      color: stat.color,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? 18 : 22,
                    }}
                  >
                    {stat.icon}
                  </span>
                  <Statistic title={stat.title} value={stat.value} valueStyle={{ fontSize: isMobile ? 22 : 28, color: "var(--text-primary)" }} />
                  {!isMobile && <Text type="secondary">{stat.helper}</Text>}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {!canCreateNotification && (
          <Alert type="info" showIcon message="You can view notifications assigned to your role, level, or user account." style={{ borderRadius: 14 }} />
        )}

        {canCreateNotification && (
          <Card
            bordered={false}
            style={{ borderRadius: 20, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)" }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <div>
                <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                  Create / Broadcast Notification
                </Title>
                <Text type="secondary">Compose an announcement, choose its audience, and send now or schedule it for later.</Text>
              </div>

              <Form
                layout="vertical"
                form={form}
                onFinish={onCreateNotification}
                initialValues={{ level: "all", channels: ["inApp"] }}
                requiredMark="optional"
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Target type" name="level" rules={[{ required: true, message: "Please select target type" }]}>
                      <Select options={LEVEL_OPTIONS} placeholder="Select audience type" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item label="Notification title" name="title" rules={[{ required: true, message: "Please enter title" }]}>
                      <Input placeholder="Example: Exam timetable published" size="large" />
                    </Form.Item>
                  </Col>

                  {renderConditionalTargetFields()}

                  <Col xs={24}>
                    <Form.Item label="Message" name="message" rules={[{ required: true, message: "Please enter message" }]}>
                      <Input.TextArea rows={isMobile ? 4 : 5} placeholder="Write a concise message with all important details for recipients..." />
                    </Form.Item>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Form.Item label="Delivery channels" name="channels" rules={[{ required: true, message: "Select at least one channel" }]}>
                      <Checkbox.Group style={{ width: "100%" }}>
                        <Row gutter={[8, 8]}>
                          {[
                            { label: "In App", value: "inApp" },
                            { label: "Email", value: "email" },
                            { label: "SMS", value: "sms" },
                            { label: "WhatsApp", value: "whatsapp" },
                          ].map((channel) => (
                            <Col xs={12} sm={6} lg={12} key={channel.value}>
                              <Checkbox value={channel.value}>{channel.label}</Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Form.Item label="Schedule delivery" name="scheduledAt" extra="Leave empty to publish immediately.">
                      <DatePicker showTime style={{ width: "100%" }} placeholder="Choose date and time" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column-reverse" : "row",
                    gap: 12,
                    alignItems: isMobile ? "stretch" : "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                  }}
                >
                  <Form.Item name="saveAsDraft" valuePropName="checked" noStyle>
                    <Checkbox>Save as draft instead of publishing now</Checkbox>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting} size="large" block={isMobile}>
                    Publish Notification
                  </Button>
                </div>
              </Form>
            </Space>
          </Card>
        )}

        <Card
          bordered={false}
          style={{ borderRadius: 20, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)" }}
          styles={{ body: { padding: isMobile ? 16 : 24 } }}
        >
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={10}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space align="center" wrap>
                    <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                      My Notifications
                    </Title>
                    <Badge count={unreadCount} overflowCount={99} />
                  </Space>
                  <Text type="secondary">Review assigned alerts and mark important updates as read.</Text>
                </Space>
              </Col>
              <Col xs={24} lg={14}>
                <Row gutter={[10, 10]} justify={isMobile || isTablet ? "start" : "end"}>
                  <Col xs={24} sm={12} md={10}>
                    <Input.Search
                      allowClear
                      placeholder="Search notifications"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={7}>
                    <Select style={{ width: "100%" }} value={filterLevel} onChange={setFilterLevel} options={FILTER_OPTIONS} />
                  </Col>
                  <Col xs={24} md={7}>
                    <Button icon={<CheckCircleOutlined />} onClick={handleMarkAllRead} disabled={!unreadCount} block={isMobile || isTablet} style={{ width: "100%" }}>
                      Mark all read
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>

            {loading ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {[1, 2, 3].map((item) => (
                  <Card key={item} bordered={false} style={{ borderRadius: 16, background: "#fafafa" }}>
                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                  </Card>
                ))}
              </Space>
            ) : filteredNotifications.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={search || filterLevel !== "all" ? "No notifications match your search or filter." : "No notifications available for your account."}
                style={{ padding: isMobile ? "24px 0" : "48px 0" }}
              />
            ) : (
              <List
                split={false}
                dataSource={filteredNotifications}
                renderItem={(item) => {
                  const title = safeText(item?.title, "Notification");
                  const notificationMessage = safeText(item?.message, "No message available");
                  const createdBy = safeText(item?.createdBy, "System");
                  const level = safeText(item?.level, "all");
                  const status = safeText(item?.status, "sent");

                  return (
                    <List.Item key={item._id || item.id || `${title}-${item.createdAt}`} style={{ padding: "0 0 12px" }}>
                      <Card
                        bordered={false}
                        onClick={() => handleMarkRead(item)}
                        style={{
                          width: "100%",
                          cursor: item.isRead ? "default" : "pointer",
                          background: item.isRead ? "var(--surface)" : "linear-gradient(90deg, #ede9fe 0%, var(--surface) 100%)",
                          borderLeft: item.isRead ? "4px solid transparent" : "4px solid var(--primary)",
                          borderRadius: 16,
                          boxShadow: item.isRead ? "0 4px 16px rgba(15, 23, 42, 0.04)" : "0 8px 24px rgba(124, 58, 237, 0.10)",
                        }}
                        styles={{ body: { padding: isMobile ? 14 : 18 } }}
                      >
                        <Space direction="vertical" size={10} style={{ width: "100%" }}>
                          <Row gutter={[12, 8]} align="top" justify="space-between">
                            <Col xs={24} md={15}>
                              <Space size={8} align="start">
                                <Badge status={item.isRead ? "default" : "processing"} style={{ marginTop: 7 }} />
                                <Space direction="vertical" size={4}>
                                  <Text strong style={{ fontSize: isMobile ? 15 : 16 }}>
                                    {title}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    By {createdBy} • {formatDate(item.createdAt)}
                                  </Text>
                                </Space>
                              </Space>
                            </Col>
                            <Col xs={24} md={9}>
                              <Space wrap size={[6, 6]} style={{ width: "100%", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                                <Tag color={getLevelColor(level)} style={{ marginInlineEnd: 0, borderRadius: 999 }}>
                                  {level}
                                </Tag>
                                <Tag color={getStatusColor(status)} style={{ marginInlineEnd: 0, borderRadius: 999 }}>
                                  {status}
                                </Tag>
                                {!item.isRead && <Tag color="processing" style={{ marginInlineEnd: 0, borderRadius: 999 }}>Unread</Tag>}
                              </Space>
                            </Col>
                          </Row>
                          <Paragraph style={{ marginBottom: 0, color: "var(--text-secondary)" }}>{notificationMessage}</Paragraph>
                        </Space>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default Notification;