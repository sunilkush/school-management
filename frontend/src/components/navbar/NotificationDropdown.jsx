import { BellOutlined } from "@ant-design/icons";
import { Avatar, Badge, Dropdown, List, Typography } from "antd";
import { useEffect, useState } from "react";
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

 const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const allNotifications = await getNotifications();
        if (!mounted) return;
        setNotifications(getVisibleNotificationsForUser(allNotifications, user).slice(0, 5));
      } catch {
        if (!mounted) return;
        setNotifications([]);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  const notificationMenu = (
    <div
      style={{
        width: 340,
        maxHeight: 420,
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: "No notifications" }}
        header={<Text strong style={{ padding: "10px" }}>Notifications</Text>}
        footer={
          <div
            style={{ textAlign: "center", cursor: "pointer", color: "#1890ff" }}
            onClick={() => navigate(`/dashboard/${getRolePath(user?.role?.name)}/notification`)}
          >
            See all notifications
          </div>
        }
        renderItem={(item) => (
          <List.Item style={{ padding: "10px 16px", cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}>🔔</Avatar>}
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
        <BellOutlined style={{ fontSize: 20, cursor: "pointer", color: "var(--text-primary)" }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
