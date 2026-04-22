import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  List,
  Row,
   Spin,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useSelector } from "react-redux";
import {
  createNotificationPayload,
  getNotifications,
  getVisibleNotificationsForUser,
  saveNotifications,
} from "../utils/notifications";

const { Title, Text } = Typography;

const LEVEL_OPTIONS = [
  { label: "All Roles & Users", value: "all" },
  { label: "Role-wise", value: "role" },
  { label: "User Level-wise", value: "user-level" },
  { label: "Specific Users", value: "user" },
];

const ROLE_OPTIONS = [
  "Super Admin",
  "School Admin",
  "Principal",
  "Vice Principal",
  "Teacher",
  "Student",
  "Parent",
  "Accountant",
  "Receptionist",
  "Librarian",
  "Staff",
].map((role) => ({ label: role, value: role }));

const Notification = () => {
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
   const [allNotifications, setAllNotifications] = useState([]);
  const [filterLevel, setFilterLevel] = useState("all");
  const [loading, setLoading] = useState(true);

  const visibleNotifications = useMemo(
    () => getVisibleNotificationsForUser(allNotifications, user),
    [allNotifications, user]
  );

  const filteredNotifications = useMemo(() => {
    if (filterLevel === "all") return visibleNotifications;
    return visibleNotifications.filter((item) => item.level === filterLevel);
  }, [visibleNotifications, filterLevel]);

  const canCreateNotification = [
    "Super Admin",
    "School Admin",
    "Principal",
    "Vice Principal",
  ].includes(user?.role?.name);

  const selectedLevel = Form.useWatch("level", form);

const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getNotifications();
      setAllNotifications(rows);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to load notifications";
      message.error(errorMessage);
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
      targetLevels: values.targetLevels
        ? values.targetLevels
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : [],
      targetUserIds: values.targetUserIds
        ? values.targetUserIds
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : [],
      createdBy: user?.name || user?.fullName || user?.email || "Unknown",
    });

    try {
      const createdNotification = await saveNotifications(payload);
      setAllNotifications((prev) => [createdNotification, ...prev]);
      form.resetFields();
      message.success("Notification created successfully.");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to create notification";
      message.error(errorMessage);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Title level={3} style={{ marginBottom: 0 }}>Level-wise Notifications</Title>
      <Text type="secondary">
        Dashboard notifications for all roles and users with role-wise and level-wise targeting.
      </Text>

      {!canCreateNotification && (
        <Alert
          type="info"
          showIcon
          message="You can view notifications assigned to your role/user level."
        />
      )}

      {canCreateNotification && (
        <Card title="Create Notification">
          <Form layout="vertical" form={form} onFinish={onCreateNotification}>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Target Type"
                  name="level"
                  initialValue="all"
                  rules={[{ required: true, message: "Please select target type" }]}
                >
                  <Select options={LEVEL_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[{ required: true, message: "Please enter title" }]}
                >
                  <Input placeholder="Exam update / Fees reminder / Event circular" />
                </Form.Item>
              </Col>
            </Row>

            {(selectedLevel === "role" || selectedLevel === "user-level") && (
              <Form.Item
                label="Roles"
                name="targetRoles"
                rules={[{ required: true, message: "Select at least one role" }]}
              >
                <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Select roles" />
              </Form.Item>
            )}

            {selectedLevel === "user-level" && (
              <Form.Item
                label="User Levels (comma-separated)"
                name="targetLevels"
                rules={[{ required: true, message: "Enter at least one user level" }]}
              >
                <Input placeholder="Class 10, Class 12, Science" />
              </Form.Item>
            )}

            {selectedLevel === "user" && (
              <Form.Item
                label="User IDs / Emails (comma-separated)"
                name="targetUserIds"
                rules={[{ required: true, message: "Enter target users" }]}
              >
                <Input placeholder="user1@mail.com, 67e83e0f..., user2@mail.com" />
              </Form.Item>
            )}

            <Form.Item
              label="Message"
              name="message"
              rules={[{ required: true, message: "Please enter message" }]}
            >
              <Input.TextArea rows={3} placeholder="Write notification details..." />
            </Form.Item>

            <Button type="primary" htmlType="submit">
              Publish Notification
            </Button>
          </Form>
        </Card>
      )}

      <Card
        title="My Notifications"
        extra={
          <Select
            style={{ minWidth: 180 }}
            value={filterLevel}
            onChange={setFilterLevel}
            options={LEVEL_OPTIONS}
          />
        }
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <Spin />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty description="No notifications available for your account." />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredNotifications}
            renderItem={(item) => (
              <List.Item key={item._id || item.id}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Space>
                    <Text strong>{item.title}</Text>
                    <Tag color="blue">{item.level}</Tag>
                    <Text type="secondary">By {item.createdBy}</Text>
                  </Space>
                  <Text>{item.message}</Text>
                  <Text type="secondary">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
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
