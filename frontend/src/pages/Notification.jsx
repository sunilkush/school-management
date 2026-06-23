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
  Flex,
  Form,
  Grid,
  Input,
  List,
  Row,
  Select,
  Skeleton,
  Space,
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
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../styles/pageStyles";

const { Text, Paragraph, Title } = Typography;
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

const NotifSkeleton = () => (
  <Space direction="vertical" size={10} style={{ width: "100%" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ ...sectionPanel, padding: 16, marginBottom: 0 }}>
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </div>
    ))}
  </Space>
);

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
      const created = await saveNotifications(payload);
      setAllNotifications((prev) => [created, ...prev]);
      form.resetFields();
      message.success("Notification created successfully.");
      loadNotifications();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to create notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (notif) => {
    if (!notif?._id || notif.isRead) return;
    try {
      const updated = await markNotificationAsRead(notif._id);
      setAllNotifications((prev) => prev.map((item) => (item._id === notif._id ? updated : item)));
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
      color: "#14B8A6",
      helper: "Assigned to you",
    },
    {
      title: "Unread",
      value: unreadCount,
      icon: <BellOutlined />,
      color: "#F59E0B",
      helper: "Needs attention",
    },
    {
      title: "Scheduled",
      value: analytics.scheduled || 0,
      icon: <CalendarOutlined />,
      color: "#2563EB",
      helper: "Planned delivery",
    },
    {
      title: "Opened",
      value: analytics.opened || 0,
      icon: <EyeOutlined />,
      color: "#22C55E",
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
              <Select mode="tags" tokenSeparators={[","]} placeholder="Example: Class 10, Section A" maxTagCount="responsive" />
            </Form.Item>
          </Col>
        </>
      );
    }
    if (selectedLevel === "user") {
      return (
        <Col xs={24}>
          <Form.Item label="Specific users" name="targetUserIds" rules={[{ required: true, message: "Enter target users" }]}>
            <Select mode="tags" tokenSeparators={[","]} placeholder="Add emails, registration IDs, or user IDs" maxTagCount="responsive" />
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
    <>
      <PageHeader
        title="Notifications"
        subtitle="Role-wise, user-level, and user-specific notification center for every portal role."
        icon={<NotificationOutlined />}
        extra={
          <Space wrap>
            <Tag icon={<TeamOutlined />} color="blue" style={{ padding: "4px 10px", borderRadius: 99 }}>
              {safeText(roleName, "User")}
            </Tag>
            {unreadCount > 0 && (
              <Button icon={<CheckCircleOutlined />} onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
            {canCreateNotification && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => form.scrollToField("title")}>
                Create Broadcast
              </Button>
            )}
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* Stat Cards */}
        <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
          {statCards.map((stat) => (
            <Col xs={12} md={6} key={stat.title}>
              <Card
                style={{
                  borderRadius: 14,
                  border: "1px solid var(--border-muted)",
                  borderTop: `4px solid ${stat.color}`,
                }}
                styles={{ body: { padding: isMobile ? "14px 16px" : "16px 20px" } }}
              >
                <Flex align="center" gap={12}>
                  <div style={iconWell(stat.color, isMobile ? 38 : 44)}>
                    <span style={{ fontSize: isMobile ? 17 : 20 }}>{stat.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
                      {stat.title}
                    </div>
                    {!isMobile && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{stat.helper}</div>
                    )}
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {!canCreateNotification && (
          <Alert
            type="info"
            showIcon
            message="You can view notifications assigned to your role, level, or user account."
            style={{ borderRadius: 12, marginBottom: 20 }}
          />
        )}

        {/* Create / Broadcast Form */}
        {canCreateNotification && (
          <div style={{ ...sectionPanel, marginBottom: 20 }}>
            <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
              <div style={iconWell("#7C3AED", 36)}>
                <SendOutlined style={{ fontSize: 16 }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block" }}>
                  Create / Broadcast Notification
                </Text>
                <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Compose an announcement, choose audience, and send now or schedule for later.
                </Text>
              </div>
            </Flex>

            <Form
              layout="vertical"
              form={form}
              onFinish={onCreateNotification}
              initialValues={{ level: "all", channels: ["inApp"] }}
              requiredMark="optional"
            >
              <Row gutter={[14, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item label="Target type" name="level" rules={[{ required: true, message: "Please select target type" }]}>
                    <Select options={LEVEL_OPTIONS} placeholder="Select audience type" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item label="Notification title" name="title" rules={[{ required: true, message: "Please enter title" }]}>
                    <Input placeholder="Example: Exam timetable published" />
                  </Form.Item>
                </Col>

                {renderConditionalTargetFields()}

                <Col xs={24}>
                  <Form.Item label="Message" name="message" rules={[{ required: true, message: "Please enter message" }]}>
                    <Input.TextArea rows={isMobile ? 4 : 4} placeholder="Write a concise message with all important details for recipients..." />
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
                        ].map((ch) => (
                          <Col xs={12} sm={6} lg={12} key={ch.value}>
                            <Checkbox value={ch.value}>{ch.label}</Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item label="Schedule delivery" name="scheduledAt" extra="Leave empty to publish immediately.">
                    <DatePicker showTime style={{ width: "100%" }} placeholder="Choose date and time" />
                  </Form.Item>
                </Col>
              </Row>

              <Flex
                align="center"
                justify="space-between"
                gap={12}
                style={{ flexDirection: isMobile ? "column-reverse" : "row", paddingTop: 4 }}
              >
                <Form.Item name="saveAsDraft" valuePropName="checked" noStyle>
                  <Checkbox>Save as draft instead of publishing now</Checkbox>
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting} block={isMobile}>
                  Publish Notification
                </Button>
              </Flex>
            </Form>
          </div>
        )}

        {/* Notifications List */}
        <div style={sectionPanel}>
          <Flex vertical={isMobile || isTablet} gap={12} align={isMobile || isTablet ? "stretch" : "center"} justify="space-between" style={{ marginBottom: 16 }}>
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 15, color: "var(--text-primary)" }}>
                My Notifications
              </Text>
              <Badge count={unreadCount} overflowCount={99} />
            </Flex>
            <Flex gap={8} wrap="wrap" align="center" justify={isMobile ? "flex-start" : "flex-end"}>
              <Input.Search
                allowClear
                placeholder="Search notifications"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: isMobile ? "100%" : 220 }}
              />
              <Select
                style={{ width: isMobile ? "100%" : 160 }}
                value={filterLevel}
                onChange={setFilterLevel}
                options={FILTER_OPTIONS}
              />
            </Flex>
          </Flex>

          {loading ? (
            <NotifSkeleton />
          ) : filteredNotifications.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                search || filterLevel !== "all"
                  ? "No notifications match your search or filter."
                  : "No notifications available for your account."
              }
              style={{ padding: isMobile ? "32px 0" : "56px 0" }}
            />
          ) : (
            <List
              split={false}
              dataSource={filteredNotifications}
              rowKey={(item) => item._id || item.id}
              renderItem={(item) => {
                const title = safeText(item?.title, "Notification");
                const notifMsg = safeText(item?.message, "No message available");
                const createdBy = safeText(item?.createdBy, "System");
                const level = safeText(item?.level, "all");
                const status = safeText(item?.status, "sent");

                return (
                  <List.Item style={{ padding: "0 0 10px" }}>
                    <div
                      onClick={() => handleMarkRead(item)}
                      style={{
                        width: "100%",
                        cursor: item.isRead ? "default" : "pointer",
                        background: item.isRead ? "var(--surface)" : "linear-gradient(90deg, rgba(37,99,235,0.04) 0%, var(--surface) 60%)",
                        borderLeft: item.isRead ? "4px solid transparent" : "4px solid #2563EB",
                        borderRadius: 14,
                        border: "1px solid var(--border-muted)",
                        borderLeftWidth: 4,
                        borderLeftColor: item.isRead ? "var(--border-muted)" : "#2563EB",
                        padding: isMobile ? 14 : 16,
                        boxShadow: item.isRead ? "0 1px 4px rgba(0,0,0,0.03)" : "0 4px 14px rgba(37,99,235,0.08)",
                        transition: "box-shadow 0.2s ease",
                      }}
                    >
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Flex vertical={isMobile} gap={8} justify="space-between" align={isMobile ? "flex-start" : "center"}>
                          <Flex align="flex-start" gap={10}>
                            <Badge status={item.isRead ? "default" : "processing"} style={{ marginTop: 7 }} />
                            <Space direction="vertical" size={2}>
                              <Text strong style={{ fontSize: isMobile ? 14 : 15, color: "var(--text-primary)" }}>
                                {title}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                By {createdBy} • {formatDate(item.createdAt)}
                              </Text>
                            </Space>
                          </Flex>
                          <Flex gap={4} wrap="wrap" align="center" justify={isMobile ? "flex-start" : "flex-end"}>
                            <Tag color={getLevelColor(level)} style={{ borderRadius: 99, fontSize: 11 }}>{level}</Tag>
                            <Tag color={getStatusColor(status)} style={{ borderRadius: 99, fontSize: 11 }}>{status}</Tag>
                            {!item.isRead && (
                              <Tag color="processing" style={{ borderRadius: 99, fontSize: 11 }}>Unread</Tag>
                            )}
                          </Flex>
                        </Flex>
                        <Paragraph style={{ marginBottom: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                          {notifMsg}
                        </Paragraph>
                      </Space>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Notification;
