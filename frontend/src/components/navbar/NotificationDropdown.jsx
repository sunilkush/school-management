import { BellOutlined } from "@ant-design/icons";
import { Avatar, Badge, Dropdown, List, Typography } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getNotifications, getVisibleNotificationsForUser } from "../../utils/notifications";

const { Text } = Typography;

const getRolePath = (roleName) =>
  (roleName || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const notifications = useMemo(() => {
    const allNotifications = getNotifications();
    return getVisibleNotificationsForUser(allNotifications, user).slice(0, 5);
  }, [user]);

  const notificationMenu = (
    <div
      style={{
        width: 340,
        maxHeight: 420,
        overflowY: "auto",
        backgroundColor: "var(--color-card-bg)",
        borderRadius: 4,
        boxShadow: "0 8px 24px rgba(33,37,41,0.12)",
        border: "1px solid var(--color-border)",
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: "No notifications" }}
        header={<Text strong style={{ padding: "10px" }}>Notifications</Text>}
        footer={
          <div
            style={{ textAlign: "center", cursor: "pointer", color: "var(--color-primary)" }}
            onClick={() => navigate(`/dashboard/${getRolePath(user?.role?.name)}/notification`)}
          >
            See all notifications
          </div>
        }
        renderItem={(item) => (
          <List.Item style={{ padding: "10px 16px", cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: "#e6f7ff", color: "var(--color-primary)" }}>🔔</Avatar>}
              title={<Text>{item.title}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown overlay={notificationMenu} trigger={["click"]} placement="bottomRight" arrow>
      <Badge count={notifications.length} offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer", color: "var(--color-text)" }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
