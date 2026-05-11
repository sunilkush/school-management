import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Empty,
  Grid,
  List,
  Skeleton,
  Space,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../utils/notifications";
import { getRoleName, getRolePath } from "../../utils/roles";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { user } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const roleName = getRoleName(user);

  const notificationPath = useMemo(
    () => `/dashboard/${getRolePath(roleName)}/notification`,
    [roleName]
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      setLoading(true);

      try {
        const rows = await getNotifications();

        if (!mounted) return;

        setNotifications(Array.isArray(rows) ? rows.slice(0, 5) : []);
      } catch (error) {
        if (!mounted) return;
        setNotifications([]);
        console.error("Failed to load notifications:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user?._id]);

  const openNotification = async (item) => {
    if (!item) return;

    if (item?._id && !item.isRead) {
      try {
        const updated = await markNotificationAsRead(item._id);

        setNotifications((prev) =>
          prev.map((row) =>
            row._id === item._id ? { ...row, ...updated, isRead: true } : row
          )
        );
      } catch {
        // Navigation should still work.
      }
    }

    navigate(notificationPath);
  };

  const goToAllNotifications = () => {
    navigate(notificationPath);
  };

  const dropdownWidth = screens.xs ? "calc(100vw - 24px)" : 390;

  const notificationMenu = (
    <div
      style={{
        width: dropdownWidth,
        maxHeight: screens.xs ? "72vh" : 460,
        overflow: "hidden",
        background: "var(--card, #ffffff)",
        border: "1px solid var(--border, #eef0f4)",
        borderRadius: 18,
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
      }}
    >
      <div
        style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid var(--border, #eef0f4)",
          background:
            "linear-gradient(135deg, rgba(24,144,255,0.10), rgba(82,196,26,0.08))",
        }}
      >
        <Space
          align="center"
          style={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Notifications
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Latest school updates
            </Text>
          </div>

          <Badge
            count={unreadCount}
            showZero
            style={{
              backgroundColor: unreadCount ? "#1677ff" : "#d9d9d9",
            }}
          />
        </Space>
      </div>

      <div
        style={{
          maxHeight: screens.xs ? "55vh" : 320,
          overflowY: "auto",
          padding: 8,
        }}
      >
        {loading ? (
          <div style={{ padding: 12 }}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: "30px 0" }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                onClick={() => openNotification(item)}
                style={{
                  padding: "12px",
                  marginBottom: 8,
                  cursor: "pointer",
                  borderRadius: 14,
                  border: item.isRead
                    ? "1px solid transparent"
                    : "1px solid rgba(22,119,255,0.18)",
                  background: item.isRead
                    ? "transparent"
                    : "linear-gradient(135deg, rgba(22,119,255,0.08), rgba(82,196,26,0.06))",
                  transition: "all 0.2s ease",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={42}
                      style={{
                        background: item.isRead ? "#f5f5f5" : "#e6f4ff",
                        color: item.isRead ? "#8c8c8c" : "#1677ff",
                      }}
                      icon={item.isRead ? <CheckCircleOutlined /> : <BellOutlined />}
                    />
                  }
                  title={
                    <Space
                      align="start"
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text
                        strong={!item.isRead}
                        ellipsis
                        style={{
                          maxWidth: screens.xs ? 190 : 250,
                          fontSize: 14,
                        }}
                      >
                        {item.title || "Notification"}
                      </Text>

                      {!item.isRead && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            flex: "0 0 8px",
                            marginTop: 7,
                            borderRadius: "50%",
                            background: "#1677ff",
                          }}
                        />
                      )}
                    </Space>
                  }
                  description={
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        fontSize: 12,
                        lineHeight: 1.45,
                      }}
                      ellipsis={{
                        rows: 2,
                      }}
                    >
                      {item.message || "No message available"}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--border, #eef0f4)",
          background: "var(--card, #ffffff)",
        }}
      >
        <Button
          block
          type="primary"
          size="middle"
          onClick={goToAllNotifications}
          style={{
            height: 40,
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          See all notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationMenu}
      trigger={["click"]}
      placement="bottomRight"
      arrow
    >
      <button
        type="button"
        aria-label="Open notifications"
        style={{
          width: 42,
          height: 42,
          border: "1px solid var(--border, #eef0f4)",
          borderRadius: 14,
          background: "var(--card, #ffffff)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 3]}>
          <BellOutlined
            style={{
              fontSize: 19,
              color: "var(--text-primary, #1f2937)",
            }}
          />
        </Badge>
      </button>
    </Dropdown>
  );
};

export default NotificationDropdown;