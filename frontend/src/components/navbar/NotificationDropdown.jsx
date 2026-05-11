import { BellOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Dropdown, List, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead } from "../../features/notificationSlice";
import { getRoleName, getRolePath } from "../../utils/roles";

const { Text } = Typography;

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const allNotifications = useSelector((state) => state.notifications.items);
  const [notifications, setNotifications] = useState([]);

  const notificationPath = useMemo(() => `/dashboard/${getRolePath(getRoleName(user))}/notification`, [user]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const rows = await dispatch(fetchNotifications()).unwrap();
        if (!mounted) return;
        setNotifications(rows.slice(0, 5));
      } catch {
        if (!mounted) return;
        setNotifications([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [dispatch, user]);

  useEffect(() => {
    setNotifications(allNotifications.slice(0, 5));
  }, [allNotifications]);

  const openNotification = async (item) => {
    if (item?._id && !item.isRead) {
      try {
        const updated = await dispatch(markNotificationRead(item._id)).unwrap();
        setNotifications((prev) => prev.map((row) => (row._id === item._id ? updated : row)));
      } catch {
        // Keep navigation available even if read receipt update fails.
      }
    }
    navigate(notificationPath);
  };

  const notificationMenu = (
    <div
      style={{
        width: 360,
        maxHeight: 440,
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: "No notifications" }}
        header={
          <Space style={{ padding: "10px 12px", width: "100%", justifyContent: "space-between" }}>
            <Text strong>Notifications</Text>
            <Text type="secondary">{unreadCount} unread</Text>
          </Space>
        }
        footer={
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Button type="link" onClick={() => navigate(notificationPath)}>See all notifications</Button>
          </div>
        }
        renderItem={(item) => (
          <List.Item onClick={() => openNotification(item)} style={{ padding: "10px 16px", cursor: "pointer", background: item.isRead ? "#fff" : "#f6ffed" }}>
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}>🔔</Avatar>}
              title={<Text strong={!item.isRead}>{item.title}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown dropdownRender={() => notificationMenu} trigger={["click"]} placement="bottomRight" arrow>
      <Badge count={unreadCount} offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer", color: "var(--text-primary)" }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
