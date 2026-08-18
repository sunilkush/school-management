import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Badge, Drawer, Dropdown, Grid, Skeleton, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../utils/notifications";
import { getRoleName, getRolePath } from "../../utils/roles";

const { useBreakpoint } = Grid;

/* ── relative time ─────────────────────────────────────────── */
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* ── icon config by notification level ─────────────────────── */
const levelConfig = {
  all:        { icon: <BellOutlined />,       bg: "rgba(var(--purple-rgb), 0.12)", color: "var(--purple)" },
  role:       { icon: <TeamOutlined />,       bg: "var(--success-light)", color: "var(--success)" },
  "user-level": { icon: <InfoCircleOutlined />, bg: "var(--primary-light)", color: "var(--primary)" },
  user:       { icon: <UserOutlined />,       bg: "var(--warning-light)", color: "var(--warning-hover)" },
  warning:    { icon: <WarningOutlined />,    bg: "var(--danger-light)", color: "var(--danger-hover)" },
  achievement:{ icon: <TrophyOutlined />,     bg: "var(--warning-light)", color: "#CA8A04" },
};
const getLevel = (item) => levelConfig[item?.level] || levelConfig.all;

/* ── single notification row ────────────────────────────────── */
const NotifItem = ({ item, onClick }) => {
  const { icon, bg, color } = getLevel(item);
  const unread = !item.isRead;

  return (
    <div
      onClick={() => onClick(item)}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        cursor: "pointer",
        background: unread ? "rgba(var(--purple-rgb), 0.04)" : "transparent",
        borderLeft: unread ? "3px solid var(--primary,#7c3aed)" : "3px solid transparent",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft,#f8fafc)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = unread ? "rgba(var(--purple-rgb), 0.04)" : "transparent")}
    >
      {/* icon circle */}
      <div style={{
        flexShrink: 0,
        width: 38, height: 38,
        borderRadius: "50%",
        background: bg,
        color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        {icon}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 13,
            fontWeight: unread ? 700 : 500,
            color: "var(--text-primary,#111)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 200,
          }}>
            {item.title || "Notification"}
          </span>
          {unread && (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--primary,#7c3aed)",
              flexShrink: 0, marginTop: 4,
            }} />
          )}
        </div>

        <p style={{
          fontSize: 12,
          color: "var(--text-muted,#6b7280)",
          margin: 0,
          lineHeight: 1.45,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {item.message || "No message"}
        </p>

        <span style={{ fontSize: 11, color: "var(--text-muted,#9ca3af)", marginTop: 4, display: "block" }}>
          <ClockCircleOutlined style={{ marginRight: 4, fontSize: 10 }} />
          {timeAgo(item.createdAt || item.updatedAt)}
        </span>
      </div>
    </div>
  );
};

/* ── main component ─────────────────────────────────────────── */
const NotificationDropdown = () => {
  const navigate  = useNavigate();
  const screens   = useBreakpoint();
  const { user }  = useSelector((state) => state.auth);

  const [notifications, setNotifications]   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [markingAll, setMarkingAll]         = useState(false);
  const [open, setOpen]                     = useState(false);

  const roleName          = getRoleName(user);
  const notificationPath  = useMemo(
    () => `/dashboard/${getRolePath(roleName)}/notification`,
    [roleName]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  /* fetch on open */
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    getNotifications()
      .then((rows) => { if (alive) setNotifications(Array.isArray(rows) ? rows.slice(0, 6) : []); })
      .catch(() => { if (alive) setNotifications([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, user?._id]);

  const openNotification = async (item) => {
    if (item?._id && !item.isRead) {
      try {
        const updated = await markNotificationAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, ...updated, isRead: true } : n))
        );
      } catch { /* still navigate */ }
    }
    setOpen(false);
    navigate(notificationPath);
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const isMobile = !screens.md;

  const panelContent = (
    <div style={{ background: "var(--card,#fff)", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid var(--border-muted,#f0f0f0)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,var(--purple),var(--purple-hover))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BellOutlined style={{ color: "#fff", fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary,#111)", lineHeight: 1.2 }}>
              Notifications
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted,#6b7280)" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <Tooltip title="Mark all as read">
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 8,
                border: "1px solid var(--border-muted,#e5e7eb)",
                background: "transparent", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                color: "var(--primary,#7c3aed)",
                opacity: markingAll ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--purple-rgb), 0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <CheckOutlined style={{ fontSize: 10 }} />
              Mark all read
            </button>
          </Tooltip>
        )}
      </div>

      {/* ── List ── */}
      <div style={{
        flex: isMobile ? 1 : "unset",
        maxHeight: isMobile ? "none" : 340,
        overflowY: "auto",
        padding: "6px 6px",
      }}>
        {loading ? (
          <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((k) => (
              <div key={k} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Skeleton.Avatar active size={38} />
                <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 1 }} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <BellOutlined style={{ fontSize: 24, color: "var(--text-muted)" }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary,#374151)", marginBottom: 4 }}>
              No notifications yet
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted,#6b7280)" }}>
              You're all caught up!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {notifications.map((item) => (
              <NotifItem key={item._id} item={item} onClick={openNotification} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && (
        <div style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border-muted,#f0f0f0)",
        }}>
          <button
            onClick={() => { setOpen(false); navigate(notificationPath); }}
            style={{
              width: "100%", padding: "9px 0",
              borderRadius: 10,
              border: "1px solid var(--primary,#7c3aed)",
              background: "transparent",
              color: "var(--primary,#7c3aed)",
              fontWeight: 600, fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary,#7c3aed)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--primary,#7c3aed)";
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );

  /* ── Bell trigger button (shared) ── */
  const bellBtn = (
    <button
      type="button"
      aria-label="Open notifications"
      onClick={() => isMobile && setOpen(true)}
      style={{
        width: 37, height: 37,
        border: "1px solid var(--border-muted,#e5e7eb)",
        borderRadius: 10,
        background: "var(--card,#fff)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary,#7c3aed)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-muted,#e5e7eb)")}
    >
      <Badge
        count={unreadCount}
        size="small"
        offset={[-2, 3]}
        style={{ backgroundColor: "var(--primary,#7c3aed)" }}
      >
        <BellOutlined style={{ fontSize: 18, color: "var(--text-primary,#374151)" }} />
      </Badge>
    </button>
  );

  /* ── Mobile: bottom-sheet Drawer ── */
  if (isMobile) {
    return (
      <>
        {bellBtn}
        <Drawer
          placement="bottom"
          open={open}
          onClose={() => setOpen(false)}
          height="auto"
          closable={false}
          styles={{
            body: { padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" },
            wrapper: { borderRadius: "20px 20px 0 0", overflow: "hidden", maxHeight: "50vh" },
          }}
        >
          {/* drag handle */}
          <div style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border-muted,#e5e7eb)" }} />
          </div>
          {panelContent}
        </Drawer>
      </>
    );
  }

  /* ── Desktop: dropdown ── */
  return (
    <Dropdown
      dropdownRender={() => (
        <div style={{
          width: 380,
          background: "var(--card,#fff)",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
          border: "1px solid var(--border-muted,#e5e7eb)",
          overflow: "hidden",
        }}>
          {panelContent}
        </div>
      )}
      trigger={["click"]}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      {bellBtn}
    </Dropdown>
  );
};

export default NotificationDropdown;
