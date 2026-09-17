import {
  BellOutlined,
  CheckCircleFilled,
  CheckOutlined,
  InfoCircleOutlined,
  NotificationOutlined,
  RightOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, Dropdown, Grid, Segmented, Skeleton, Tooltip, notification as antdNotification } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  NOTIFICATIONS_CHANGED,
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../utils/notifications";
import { getRoleName, getRolePath } from "../../utils/roles";

/**
 * The bell in the top bar, and the notifications popup behind it.
 *
 * It used to fetch notifications only when opened, so its unread count read 0 until someone
 * clicked it — a new notice sat unseen until then. Now it checks every 30 seconds while the tab is
 * in view (and at once when the tab comes back), keeps the count on the bell and in the browser
 * tab's title, rings and shows a pop-up when something new arrives, and says once after sign-in
 * how many are waiting.
 *
 * The popup opens on what is unread, groups by day, and opens a notification in place — clicking
 * one used to mark it read and leave for the Notifications page.
 */

const { useBreakpoint } = Grid;
const POLL_MS = 30_000;
const LIST_SIZE = 20;
const SUMMARY_EVERY_MS = 60 * 60 * 1000;

const LEVEL = {
  all: { icon: <NotificationOutlined />, color: "var(--primary)", label: "Everyone" },
  role: { icon: <TeamOutlined />, color: "var(--success)", label: "Your role" },
  "user-level": { icon: <InfoCircleOutlined />, color: "var(--accent)", label: "Your class or group" },
  user: { icon: <UserOutlined />, color: "var(--warning-hover)", label: "Just you" },
  warning: { icon: <WarningOutlined />, color: "var(--danger)", label: "Warning" },
  achievement: { icon: <TrophyOutlined />, color: "var(--warning-hover)", label: "Achievement" },
};
const levelOf = (item) => LEVEL[item?.level] || LEVEL.all;

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const dayGroup = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
};

const CSS = `
  @keyframes nd-ring { 0%,100% { transform: rotate(0) } 15% { transform: rotate(16deg) } 30% { transform: rotate(-14deg) } 45% { transform: rotate(10deg) } 60% { transform: rotate(-8deg) } 75% { transform: rotate(4deg) } }
  .nd-ring { animation: nd-ring 1s ease-in-out 2; transform-origin: 50% 4px; }
  .nd-bell { transition: border-color .15s ease, box-shadow .15s ease; }
  .nd-bell:hover, .nd-bell:focus-visible { border-color: var(--primary) !important; outline: none; }
  .nd-item { transition: background .15s ease; }
  .nd-item:hover, .nd-item:focus-visible { background: var(--surface-soft); outline: none; }
  .nd-item .nd-quick { opacity: 0; transition: opacity .15s ease; }
  .nd-item:hover .nd-quick, .nd-item:focus-within .nd-quick { opacity: 1; }
  @media (hover: none) { .nd-item .nd-quick { opacity: 1; } }
  .nd-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
`;

/* ─────────────────────────── one notification ─────────────────────────── */
const Item = ({ item, expanded, onToggle, onMarkRead }) => {
  const level = levelOf(item);
  const unread = !item.isRead;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      className="nd-item"
      onClick={() => onToggle(item)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(item); } }}
      style={{
        display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", position: "relative",
        background: unread ? "color-mix(in srgb, var(--primary) 5%, transparent)" : "transparent",
      }}
    >
      <span style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0, fontSize: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `color-mix(in srgb, ${level.color} 16%, transparent)`, color: level.color,
      }}>
        {level.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span
            className={expanded ? undefined : "nd-clamp"}
            style={{ flex: 1, WebkitLineClamp: 1, fontSize: 13.5, fontWeight: unread ? 700 : 500, color: "var(--text-primary)", lineHeight: 1.35 }}
          >
            {item.title || "Notification"}
          </span>
          {unread && <span aria-label="Unread" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 6 }} />}
        </div>
        <div
          className={expanded ? undefined : "nd-clamp"}
          style={{
            WebkitLineClamp: 2, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 2,
            whiteSpace: expanded ? "pre-wrap" : undefined, wordBreak: "break-word",
          }}
        >
          {item.message || "No message"}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span>{timeAgo(item.createdAt || item.updatedAt)}</span>
          {item.createdBy && <span>· from {item.createdBy}</span>}
          {expanded && <span>· for {level.label.toLowerCase()}</span>}
        </div>
      </div>

      {unread && (
        <Tooltip title="Mark as read">
          <button
            type="button"
            className="nd-quick"
            aria-label={`Mark "${item.title || "notification"}" as read`}
            onClick={(e) => { e.stopPropagation(); onMarkRead(item); }}
            style={{
              alignSelf: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-muted)",
              background: "var(--surface)", color: "var(--text-secondary)", cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <CheckOutlined style={{ fontSize: 12 }} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

/* ──────────────────────────────── the bell ──────────────────────────────── */
const NotificationDropdown = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [toast, toastHolder] = antdNotification.useNotification();

  const [summary, setSummary] = useState({ count: 0, latest: [] });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("unread");
  const [expandedId, setExpandedId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [ringing, setRinging] = useState(false);
  // Read while the popup is open, so they stay in view under Unread until it closes — otherwise
  // opening one made it vanish from the list you were reading it in.
  const [readHere, setReadHere] = useState(() => new Set());

  const seen = useRef(null);          // ids already announced; null until the first check
  const stopped = useRef(false);      // no point asking again after the server said no
  const openRef = useRef(false);      // read by the check without restarting the timer when the popup opens
  useEffect(() => { openRef.current = open; }, [open]);

  const notificationPath = useMemo(() => `/dashboard/${getRolePath(getRoleName(user))}/notification`, [user]);
  const isMobile = !screens.md;

  /* ── the list shown in the popup ── */
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getNotifications();
      const mine = String(userId || "");
      // Drafts and one's own sends are in the full list for the sender's history, not news in the bell.
      setItems((Array.isArray(rows) ? rows : [])
        .filter((n) => n.status !== "draft" && String(n.createdById || "") !== mine)
        .slice(0, LIST_SIZE));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const openPopup = useCallback((focusId = null) => {
    setTab("unread");
    setExpandedId(focusId);
    setOpen(true);
  }, []);

  /* ── announcements ── */
  const markRead = useCallback(async (item) => {
    if (!item?._id || item.isRead) return;
    setReadHere((prev) => new Set(prev).add(item._id));
    setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
    setSummary((s) => ({ count: Math.max(0, s.count - 1), latest: s.latest.filter((n) => n._id !== item._id) }));
    try { await markNotificationAsRead(item._id); } catch { /* the next check corrects the count */ }
  }, []);

  const announce = useCallback((fresh, total, firstVisit) => {
    setRinging(true);
    setTimeout(() => setRinging(false), 2100);
    const iconFor = (item) => {
      const level = levelOf(item);
      return (
        <span style={{
          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `color-mix(in srgb, ${level.color} 16%, transparent)`, color: level.color, marginTop: -4,
        }}>
          {level.icon}
        </span>
      );
    };

    if (fresh.length === 1 && !firstVisit) {
      const item = fresh[0];
      const key = `notif-${item._id}`;
      toast.open({
        key,
        placement: "topRight",
        duration: 8,
        icon: iconFor(item),
        message: <span style={{ fontWeight: 700 }}>{item.title || "New notification"}</span>,
        description: (
          <div>
            <div className="nd-clamp" style={{ WebkitLineClamp: 3, color: "var(--text-secondary)", fontSize: 13 }}>{item.message}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{item.createdBy ? `From ${item.createdBy} · ` : ""}just now</div>
          </div>
        ),
        btn: (
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="small" onClick={() => { toast.destroy(key); markRead(item); }}>Mark as read</Button>
            <Button size="small" type="primary" onClick={() => { toast.destroy(key); markRead(item); openPopup(item._id); }}>View</Button>
          </div>
        ),
      });
      return;
    }

    const key = firstVisit ? "notif-waiting" : `notif-batch-${Date.now()}`;
    toast.open({
      key,
      placement: "topRight",
      duration: firstVisit ? 6 : 8,
      icon: <span style={{ color: "var(--primary)", fontSize: 22 }}><BellOutlined /></span>,
      message: <span style={{ fontWeight: 700 }}>{firstVisit ? `You have ${total} unread notification${total === 1 ? "" : "s"}` : `${fresh.length} new notifications`}</span>,
      description: (
        <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "var(--text-secondary)", fontSize: 13 }}>
          {fresh.slice(0, 3).map((n) => <li key={n._id} className="nd-clamp" style={{ WebkitLineClamp: 1 }}>{n.title || "Notification"}</li>)}
        </ul>
      ),
      btn: <Button size="small" type="primary" onClick={() => { toast.destroy(key); openPopup(); }}>View</Button>,
    });
  }, [toast, markRead, openPopup]);

  /* ── the check ── */
  const check = useCallback(async () => {
    if (!userId || stopped.current) return;
    try {
      const next = await getUnreadNotifications();
      setSummary(next);
      const firstCheck = seen.current === null;
      const known = seen.current || new Set();
      const fresh = next.latest.filter((n) => !known.has(n._id));
      next.latest.forEach((n) => known.add(n._id));
      seen.current = known;

      if (firstCheck) {
        // Say how many are waiting when the app is opened — at most once an hour, so reloading or
        // opening another tab does not say it again.
        const flag = `notif-summary-${userId}`;
        let saidRecently = false;
        try {
          saidRecently = Date.now() - Number(localStorage.getItem(flag) || 0) < SUMMARY_EVERY_MS;
          if (next.count > 0 && !saidRecently) localStorage.setItem(flag, String(Date.now()));
        } catch { /* storage blocked: say it */ }
        if (!saidRecently && next.count > 0) announce(next.latest, next.count, true);
      } else if (fresh.length) {
        announce(fresh, next.count, false);
        if (openRef.current) loadList();
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) stopped.current = true;
    }
  }, [userId, announce, loadList]);

  useEffect(() => {
    seen.current = null;
    stopped.current = false;
    setSummary({ count: 0, latest: [] });
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    check();
    const timer = setInterval(() => { if (document.visibilityState === "visible") check(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    const onChanged = () => check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
    };
  }, [userId, check]);

  useEffect(() => {
    if (open) loadList();
    else setReadHere(new Set());
  }, [open, loadList]);

  /* The count in the browser tab's title, so a notice is noticed from another tab. */
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = summary.count > 0 ? `(${summary.count > 99 ? "99+" : summary.count}) ${base}` : base;
  }, [summary.count]);
  useEffect(() => () => { document.title = document.title.replace(/^\(\d+\+?\)\s*/, ""); }, []);

  /* ── actions ── */
  const toggle = (item) => {
    setExpandedId((id) => (id === item._id ? null : item._id));
    if (!item.isRead) markRead(item);
  };

  const readAll = async () => {
    if (markingAll || summary.count === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSummary({ count: 0, latest: [] });
      toast.destroy();
    } catch { /* leave as is */ } finally {
      setMarkingAll(false);
    }
  };

  const goToAll = () => { setOpen(false); navigate(notificationPath); };

  const unreadItems = items.filter((n) => !n.isRead);
  const shown = tab === "unread" ? items.filter((n) => !n.isRead || readHere.has(n._id)) : items;
  const groups = shown.reduce((acc, item) => {
    const g = dayGroup(item.createdAt || item.updatedAt);
    (acc[g] = acc[g] || []).push(item);
    return acc;
  }, {});

  /* ── the popup ── */
  const panel = (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: isMobile ? "80vh" : 560, background: "var(--surface)" }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Notifications</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {summary.count > 0 ? `${summary.count} unread` : "You're all caught up"}
          </div>
        </div>
        {summary.count > 0 && (
          <Button type="text" size="small" icon={<CheckOutlined />} loading={markingAll} onClick={readAll} style={{ color: "var(--primary)", fontWeight: 600 }}>
            Mark all read
          </Button>
        )}
      </div>

      <div style={{ padding: "0 16px 10px" }}>
        <Segmented
          block
          size="small"
          value={tab}
          onChange={setTab}
          options={[
            { value: "unread", label: `Unread${summary.count ? ` (${summary.count > 99 ? "99+" : summary.count})` : ""}` },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px", borderTop: "1px solid var(--border-muted)" }}>
        {loading && items.length === 0 ? (
          <div style={{ padding: "14px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[1, 2, 3].map((k) => (
              <div key={k} style={{ display: "flex", gap: 12 }}>
                <Skeleton.Avatar active size={38} />
                <Skeleton active title={{ width: "55%" }} paragraph={{ rows: 1 }} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div style={{ padding: "36px 16px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
              background: tab === "unread" ? "var(--success-light)" : "var(--surface-soft)",
              color: tab === "unread" ? "var(--success)" : "var(--text-muted)", fontSize: 24,
            }}>
              {tab === "unread" ? <CheckCircleFilled /> : <BellOutlined />}
            </div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {tab === "unread" ? "You're all caught up" : "No notifications yet"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              {tab === "unread" ? "New notifications will appear here." : "When something is sent to you, it shows up here."}
            </div>
            {tab === "unread" && items.length > 0 && (
              <Button type="link" size="small" onClick={() => setTab("all")} style={{ marginTop: 6 }}>See earlier notifications</Button>
            )}
          </div>
        ) : (
          ["Today", "Yesterday", "Earlier"].filter((g) => groups[g]?.length).map((g) => (
            <div key={g}>
              <div style={{ padding: "12px 8px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{g}</div>
              {groups[g].map((item) => (
                <Item key={item._id} item={item} expanded={expandedId === item._id} onToggle={toggle} onMarkRead={markRead} />
              ))}
            </div>
          ))
        )}
        {tab === "unread" && summary.count > unreadItems.length && unreadItems.length > 0 && (
          <div style={{ padding: "8px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            {summary.count - unreadItems.length} more unread on the notifications page
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={goToAll}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px",
          border: "none", borderTop: "1px solid var(--border-muted)", background: "var(--surface)",
          color: "var(--primary)", fontWeight: 600, fontSize: 13, cursor: "pointer", font: "inherit",
        }}
      >
        See all notifications <RightOutlined style={{ fontSize: 10 }} />
      </button>
    </div>
  );

  const bell = (
    <button
      type="button"
      className="nd-bell"
      aria-label={summary.count ? `Notifications, ${summary.count} unread` : "Notifications"}
      aria-haspopup="dialog"
      onClick={() => { if (isMobile) setOpen(true); }}
      style={{
        width: 37, height: 37, borderRadius: 10, cursor: "pointer",
        border: "1px solid var(--border-muted)", background: "var(--surface)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Badge count={summary.count} overflowCount={99} size="small" offset={[-2, 3]} style={{ backgroundColor: "var(--danger)", boxShadow: "0 0 0 2px var(--surface)" }}>
        <BellOutlined className={ringing ? "nd-ring" : undefined} style={{ fontSize: 18, color: summary.count ? "var(--text-primary)" : "var(--text-secondary)" }} />
      </Badge>
    </button>
  );

  return (
    <>
      <style>{CSS}</style>
      {toastHolder}
      {isMobile ? (
        <>
          {bell}
          <Drawer
            placement="bottom"
            open={open}
            onClose={() => setOpen(false)}
            height="auto"
            closable={false}
            styles={{
              body: { padding: 0, overflow: "hidden" },
              wrapper: { borderRadius: "20px 20px 0 0", overflow: "hidden" },
            }}
          >
            <div style={{ padding: "10px 0 2px", display: "flex", justifyContent: "center", background: "var(--surface)" }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
            </div>
            {panel}
          </Drawer>
        </>
      ) : (
        <Dropdown
          dropdownRender={() => (
            <div style={{
              width: 400, borderRadius: 16, overflow: "hidden", background: "var(--surface)",
              border: "1px solid var(--border-muted)", boxShadow: "0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.06)",
            }}>
              {panel}
            </div>
          )}
          trigger={["click"]}
          placement="bottomRight"
          open={open}
          onOpenChange={setOpen}
        >
          {bell}
        </Dropdown>
      )}
    </>
  );
};

export default NotificationDropdown;
