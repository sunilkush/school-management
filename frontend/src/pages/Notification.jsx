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
  Input,
  List,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckCircleOutlined, SendOutlined } from "@ant-design/icons";
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

const Notification = () => {
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [allNotifications, setAllNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filterLevel, setFilterLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const matchesLevel = filterLevel === "all" || item.level === filterLevel;
      const matchesSearch =
        !query ||
        [item.title, item.message, item.createdBy]
          .filter(Boolean)
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

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Title level={3} style={{ marginBottom: 0 }}>Notifications</Title>
          <Text type="secondary">
            Role-wise, user-level, and user-specific in-app notification center for every portal role.
          </Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card><Statistic title="Visible" value={visibleNotifications.length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Unread" value={unreadCount} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Scheduled" value={analytics.scheduled || 0} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Opened" value={analytics.opened || 0} /></Card></Col>
      </Row>

      {!canCreateNotification && (
        <Alert type="info" showIcon message="You can view notifications assigned to your role, level, or user account." />
      )}

      {canCreateNotification && (
        <Card title="Create / Broadcast Notification">
          <Form
            layout="vertical"
            form={form}
            onFinish={onCreateNotification}
            initialValues={{ level: "all", channels: ["inApp"] }}
          >
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="Target Type" name="level" rules={[{ required: true, message: "Please select target type" }]}>
                  <Select options={LEVEL_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item label="Title" name="title" rules={[{ required: true, message: "Please enter title" }]}>
                  <Input placeholder="Exam update / Fees reminder / Event circular" />
                </Form.Item>
              </Col>
            </Row>

            {(selectedLevel === "role" || selectedLevel === "user-level") && (
              <Form.Item label="Roles" name="targetRoles" rules={[{ required: true, message: "Select at least one role" }]}>
                <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Select roles" />
              </Form.Item>
            )}

            {selectedLevel === "user-level" && (
              <Form.Item label="User Levels" name="targetLevels" rules={[{ required: true, message: "Enter at least one user level" }]}>
                <Select mode="tags" tokenSeparators={[","]} placeholder="Class 10, Class 12, Science, Section A" />
              </Form.Item>
            )}

            {selectedLevel === "user" && (
              <Form.Item label="User IDs / Emails / Registration IDs" name="targetUserIds" rules={[{ required: true, message: "Enter target users" }]}>
                <Select mode="tags" tokenSeparators={[","]} placeholder="user@mail.com, 67e83e0f..., REG-001" />
              </Form.Item>
            )}

            <Form.Item label="Message" name="message" rules={[{ required: true, message: "Please enter message" }]}>
              <Input.TextArea rows={4} placeholder="Write notification details..." />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label="Delivery Channels" name="channels" rules={[{ required: true, message: "Select at least one channel" }]}>
                  <Checkbox.Group
                    options={[
                      { label: "In App", value: "inApp" },
                      { label: "Email", value: "email" },
                      { label: "SMS", value: "sms" },
                      { label: "WhatsApp", value: "whatsapp" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Schedule (optional)" name="scheduledAt">
                  <DatePicker showTime style={{ width: "100%" }} placeholder="Send later" />
                </Form.Item>
              </Col>
            </Row>

            <Space wrap>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>Publish Notification</Button>
              <Form.Item name="saveAsDraft" valuePropName="checked" noStyle>
                <Checkbox>Save as draft</Checkbox>
              </Form.Item>
            </Space>
          </Form>
        </Card>
      )}

      <Card
        title={<Space>My Notifications <Badge count={unreadCount} /></Space>}
        extra={
          <Space wrap>
            <Input.Search allowClear placeholder="Search notifications" value={search} onChange={(event) => setSearch(event.target.value)} style={{ width: 220 }} />
            <Select style={{ minWidth: 180 }} value={filterLevel} onChange={setFilterLevel} options={FILTER_OPTIONS} />
            <Button icon={<CheckCircleOutlined />} onClick={handleMarkAllRead} disabled={!unreadCount}>Mark all read</Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spin /></div>
        ) : filteredNotifications.length === 0 ? (
          <Empty description="No notifications available for your account." />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredNotifications}
            renderItem={(item) => (
              <List.Item
                key={item._id || item.id}
                onClick={() => handleMarkRead(item)}
                style={{ cursor: item.isRead ? "default" : "pointer", background: item.isRead ? "transparent" : "#f6ffed", padding: 16 }}
              >
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Space wrap>
                    <Badge status={item.isRead ? "default" : "processing"} />
                    <Text strong>{item.title}</Text>
                    <Tag color="blue">{item.level || "all"}</Tag>
                    <Tag color={item.status === "scheduled" ? "orange" : item.status === "draft" ? "default" : "green"}>{item.status || "sent"}</Tag>
                    <Text type="secondary">By {item.createdBy || "System"}</Text>
                  </Space>
                  <Paragraph style={{ marginBottom: 0 }}>{item.message}</Paragraph>
                  <Text type="secondary">{formatDate(item.createdAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
};

export default Notification;