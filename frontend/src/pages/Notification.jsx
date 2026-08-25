import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  BellFilled,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  InboxOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined,
  NotificationOutlined,
  SendOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
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
import { iconWell, pageWrapper, sectionPanel } from "../styles/pageStyles";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

/* ─── Constants ──────────────────────────────────────────────────── */
const LEVEL_OPTIONS = [
  { label: "All Roles & Users", value: "all" },
  { label: "Role-wise", value: "role" },
  { label: "User Level-wise", value: "user-level" },
  { label: "Specific Users", value: "user" },
];
const FILTER_OPTIONS = [{ label: "All Types", value: "all" }, ...LEVEL_OPTIONS.slice(1)];
const ROLE_OPTIONS = ALL_ROLE_NAMES.map((role) => ({ label: role, value: role }));
const CREATOR_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator", "Receptionist", "IT Support"];

const LEVEL_META = {
  "all":        { icon: <GlobalOutlined />,    color: "var(--primary)", label: "Broadcast" },
  "role":       { icon: <SolutionOutlined />,  color: "var(--purple)", label: "Role"      },
  "user-level": { icon: <UserSwitchOutlined />,color: "var(--warning-hover)", label: "Level"     },
  "user":       { icon: <UserOutlined />,      color: "var(--success)", label: "User"      },
};

const STATUS_COLOR = {
  scheduled: "var(--warning-hover)",
  draft:     "var(--text-muted)",
  failed:    "var(--danger-hover)",
  sent:      "var(--success)",
};

const CHANNEL_LIST = [
  { key: "inApp",    label: "In App",   icon: <BellFilled />,    color: "var(--primary)" },
  { key: "email",    label: "Email",    icon: <MailOutlined />,   color: "var(--success)" },
  { key: "sms",      label: "SMS",      icon: <MobileOutlined />, color: "var(--warning-hover)" },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageOutlined />,color: "#25D366" }, // WhatsApp's own brand green — distinct third-party brand identity, not a semantic token
];

/* ─── Helpers ────────────────────────────────────────────────────── */
const safeText = (value, fallback) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((e) => safeText(e, "")).filter(Boolean).join(", ") || fallback;
  return fallback;
};

const groupByDate = (items) => {
  const groups = { Today: [], Yesterday: [], "This Week": [], Older: [] };
  const startOfToday     = dayjs().startOf("day");
  const startOfYesterday = dayjs().subtract(1, "day").startOf("day");
  const weekAgo          = dayjs().subtract(7, "day").startOf("day");
  items.forEach((n) => {
    const d = dayjs(n.createdAt);
    if (d.isSame(startOfToday, "day"))     groups["Today"].push(n);
    else if (d.isSame(startOfYesterday, "day")) groups["Yesterday"].push(n);
    else if (d.isAfter(weekAgo))           groups["This Week"].push(n);
    else                                   groups["Older"].push(n);
  });
  return Object.entries(groups).filter(([, v]) => v.length > 0);
};

/* ─── Channel Toggle (Form-compatible) ───────────────────────────── */
const ChannelToggle = ({ value = [], onChange }) => {
  const toggle = (key) => {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };
  return (
    <Flex gap={8} wrap="wrap">
      {CHANNEL_LIST.map((ch) => {
        const active = value.includes(ch.key);
        return (
          <div
            key={ch.key}
            onClick={() => toggle(ch.key)}
            role="button"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 5, padding: "10px 16px", borderRadius: 12,
              border: `1.5px solid ${active ? ch.color : "var(--border-muted)"}`,
              background: active ? `color-mix(in srgb, ${ch.color} 14%, transparent)` : "var(--surface)",
              cursor: "pointer", transition: "all 0.18s",
              minWidth: 72, userSelect: "none",
            }}
          >
            <span style={{ fontSize: 20, color: active ? ch.color : "var(--text-muted)" }}>
              {ch.icon}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: active ? ch.color : "var(--text-muted)" }}>
              {ch.label}
            </span>
          </div>
        );
      })}
    </Flex>
  );
};

/* ─── Level Avatar ───────────────────────────────────────────────── */
const LevelAvatar = ({ level, size = 38 }) => {
  const m = LEVEL_META[level] || LEVEL_META["all"];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `color-mix(in srgb, ${m.color} 18%, transparent)`, border: `1.5px solid color-mix(in srgb, ${m.color} 30%, transparent)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: m.color, fontSize: size * 0.44, flexShrink: 0,
    }}>
      {m.icon}
    </div>
  );
};

/* ─── Notification Item ──────────────────────────────────────────── */
const NotifItem = ({ item, isMobile, onMarkRead }) => {
  const title    = safeText(item?.title, "Notification");
  const notifMsg = safeText(item?.message, "No message available");
  const createdBy = safeText(item?.createdBy, "System");
  const level    = safeText(item?.level, "all");
  const status   = safeText(item?.status, "sent");
  const lm       = LEVEL_META[level] || LEVEL_META["all"];

  const channels = item?.channels
    ? CHANNEL_LIST.filter((c) => item.channels[c.key])
    : [];

  return (
    <div
      onClick={() => !item.isRead && onMarkRead(item)}
      style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        background: item.isRead ? "var(--surface)" : `linear-gradient(135deg, color-mix(in srgb, ${lm.color} 5%, transparent) 0%, var(--surface) 100%)`,
        border: `1px solid ${item.isRead ? "var(--border-muted)" : `color-mix(in srgb, ${lm.color} 30%, transparent)`}`,
        borderLeft: `4px solid ${item.isRead ? "var(--border-muted)" : lm.color}`,
        borderRadius: 14, padding: isMobile ? "12px 14px" : "14px 18px",
        cursor: item.isRead ? "default" : "pointer",
        transition: "box-shadow 0.18s",
        boxShadow: item.isRead ? "none" : `0 4px 18px color-mix(in srgb, ${lm.color} 12%, transparent)`,
      }}
    >
      <LevelAvatar level={level} size={38} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: title + tags */}
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Flex align="center" gap={6}>
            {!item.isRead && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: lm.color, flexShrink: 0, display: "inline-block" }} />
            )}
            <Text strong style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.35 }}>
              {title}
            </Text>
          </Flex>
          <Flex align="center" gap={4} wrap="wrap">
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              color: lm.color, background: `color-mix(in srgb, ${lm.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${lm.color} 25%, transparent)`,
            }}>
              {lm.label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              color: STATUS_COLOR[status] || "var(--text-muted)",
              background: `color-mix(in srgb, ${STATUS_COLOR[status] || "var(--text-muted)"} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${STATUS_COLOR[status] || "var(--text-muted)"} 25%, transparent)`,
            }}>
              {status}
            </span>
          </Flex>
        </Flex>

        {/* Row 2: message */}
        <Paragraph style={{ margin: "5px 0 6px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          {notifMsg}
        </Paragraph>

        {/* Row 3: meta */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={6}>
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
            By {createdBy} · {dayjs(item.createdAt).fromNow()}
          </Text>
          {channels.length > 0 && (
            <Flex gap={5} align="center">
              {channels.map((c) => (
                <Tooltip key={c.key} title={c.label}>
                  <span style={{ color: c.color, fontSize: 12 }}>{c.icon}</span>
                </Tooltip>
              ))}
            </Flex>
          )}
        </Flex>
      </div>
    </div>
  );
};

/* ─── Skeleton ───────────────────────────────────────────────────── */
const NotifSkeleton = () => (
  <Space direction="vertical" size={10} style={{ width: "100%" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ ...sectionPanel, padding: 16, marginBottom: 0, borderRadius: 14 }}>
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </div>
    ))}
  </Space>
);

/* ─── Main Component ─────────────────────────────────────────────── */
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
      const matchesSearch = !query || [
        safeText(item?.title, "Notification"),
        safeText(item?.message, ""),
        safeText(item?.createdBy, ""),
      ].join(" ").toLowerCase().includes(query);
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

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const onCreateNotification = async (values) => {
    const payload = createNotificationPayload({
      title: values.title,
      message: values.message,
      level: values.level,
      targetRoles: values.targetRoles || [],
      targetLevels: values.targetLevels || [],
      targetUserIds: values.targetUserIds || [],
      channels: {
        inApp:    values.channels?.includes("inApp") ?? true,
        email:    values.channels?.includes("email"),
        sms:      values.channels?.includes("sms"),
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
      message.success("Notification published successfully.");
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
      message.error(error?.response?.data?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
      message.success("All notifications marked as read.");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to mark all as read");
    }
  };

  /* ── Conditional target fields ──────────────────────────────────── */
  const renderConditionalTargetFields = () => {
    if (selectedLevel === "role") {
      return (
        <Col xs={24}>
          <Form.Item label="Target roles" name="targetRoles" rules={[{ required: true, message: "Select at least one role" }]}>
            <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Choose one or more roles" maxTagCount="responsive" />
          </Form.Item>
        </Col>
      );
    }
    if (selectedLevel === "user-level") {
      return (
        <>
          <Col xs={24} md={12}>
            <Form.Item label="Target roles" name="targetRoles" rules={[{ required: true, message: "Select at least one role" }]}>
              <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Choose roles" maxTagCount="responsive" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="User levels" name="targetLevels" rules={[{ required: true, message: "Enter at least one level" }]}>
              <Select mode="tags" tokenSeparators={[","]} placeholder="e.g. Class 10, Section A" maxTagCount="responsive" />
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
        <div style={{
          background: "var(--primary-light)", border: "1px solid rgba(var(--primary-rgb), 0.3)", borderRadius: 12,
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <GlobalOutlined style={{ color: "var(--primary)", fontSize: 16 }} />
          <div>
            <Text strong style={{ fontSize: 12, color: "var(--primary-hover)", display: "block" }}>Broadcasting to everyone</Text>
            <Text style={{ fontSize: 11, color: "var(--info)" }}>
              Visible to every role and user account in the portal.
            </Text>
          </div>
        </div>
      </Col>
    );
  };

  /* ── Stat cards ─────────────────────────────────────────────────── */
  const STAT_CARDS = [
    { title: "Visible",   value: visibleNotifications.length, icon: <InboxOutlined />,   color: "var(--accent)", helper: "Assigned to you"    },
    { title: "Unread",    value: unreadCount,                 icon: <BellOutlined />,    color: "var(--warning)", helper: "Needs attention"     },
    { title: "Scheduled", value: analytics.scheduled || 0,   icon: <CalendarOutlined />, color: "var(--primary)", helper: "Planned delivery"   },
    { title: "Opened",    value: analytics.opened || 0,      icon: <EyeOutlined />,     color: "var(--success)", helper: "Engagement"          },
  ];

  /* ── Grouped notifications ──────────────────────────────────────── */
  const groupedNotifications = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Role-wise, user-level, and user-specific notification center."
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
          </Space>
        }
      />

      <div style={pageWrapper}>

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {STAT_CARDS.map((s) => (
            <Col xs={12} md={6} key={s.title}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border-muted)",
                borderTop: `4px solid ${s.color}`,
                borderRadius: 14, padding: isMobile ? "12px 14px" : "16px 18px",
              }}>
                <Flex align="center" gap={12}>
                  <div style={iconWell(s.color, isMobile ? 36 : 42)}>
                    <span style={{ fontSize: isMobile ? 16 : 19 }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
                      {s.title}
                    </div>
                    {!isMobile && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.helper}</div>
                    )}
                  </div>
                </Flex>
              </div>
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

        {/* ── Create / Broadcast Form ──────────────────────────────── */}
        {canCreateNotification && (
          <div style={{ ...sectionPanel, marginBottom: 20 }}>
            {/* Form header */}
            <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
              <div style={iconWell("var(--purple)", 38)}>
                <SendOutlined style={{ fontSize: 17 }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block" }}>
                  Create / Broadcast Notification
                </Text>
                <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Compose an announcement, choose audience, and send now or schedule.
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
              {/* Section: Audience */}
              <Divider orientation="left" orientationMargin={0}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Audience
                </Text>
              </Divider>
              <Row gutter={[14, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item label="Target type" name="level" rules={[{ required: true, message: "Select target type" }]}>
                    <Select options={LEVEL_OPTIONS} placeholder="Select audience type" />
                  </Form.Item>
                </Col>
                {renderConditionalTargetFields()}
              </Row>

              {/* Section: Content */}
              <Divider orientation="left" orientationMargin={0}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Content
                </Text>
              </Divider>
              <Row gutter={[14, 0]}>
                <Col xs={24}>
                  <Form.Item label="Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
                    <Input placeholder="e.g. Exam timetable published" maxLength={160} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Message" name="message" rules={[{ required: true, message: "Message is required" }]}>
                    <Input.TextArea rows={3} placeholder="Write a concise message with all important details…" maxLength={2000} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Section: Delivery */}
              <Divider orientation="left" orientationMargin={0}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Delivery
                </Text>
              </Divider>
              <Row gutter={[14, 0]}>
                <Col xs={24} md={14}>
                  <Form.Item
                    label="Channels"
                    name="channels"
                    rules={[{ required: true, validator: (_, v) => v?.length ? Promise.resolve() : Promise.reject("Select at least one channel") }]}
                  >
                    <ChannelToggle />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item label="Schedule (optional)" name="scheduledAt" extra="Leave empty to send immediately.">
                    <DatePicker showTime style={{ width: "100%" }} placeholder="Choose date & time" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Submit row */}
              <Flex
                align="center" justify="space-between" gap={12} wrap="wrap"
                style={{ paddingTop: 4, flexDirection: isMobile ? "column-reverse" : "row" }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                  <Form.Item name="saveAsDraft" valuePropName="checked" noStyle>
                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: "var(--purple)" }} />
                  </Form.Item>
                  Save as draft instead of publishing now
                </label>
                <Button
                  type="primary" htmlType="submit"
                  icon={<SendOutlined />} loading={submitting}
                  size="large" block={isMobile}
                >
                  Publish Notification
                </Button>
              </Flex>
            </Form>
          </div>
        )}

        {/* ── Notifications List ───────────────────────────────────── */}
        <div style={sectionPanel}>

          {/* List header */}
          <Flex
            vertical={isMobile} gap={10}
            align={isMobile ? "stretch" : "center"}
            justify="space-between"
            style={{ marginBottom: 16 }}
          >
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 15, color: "var(--text-primary)" }}>My Notifications</Text>
              {unreadCount > 0 && (
                <span style={{
                  background: "var(--primary)", color: "#fff", fontSize: 11, fontWeight: 700,
                  borderRadius: 99, padding: "1px 8px", lineHeight: "20px",
                }}>
                  {unreadCount}
                </span>
              )}
            </Flex>
            <Flex gap={8} wrap="wrap" align="center" justify={isMobile ? "flex-start" : "flex-end"}>
              <Input.Search
                allowClear
                placeholder="Search notifications…"
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

          {/* List body */}
          {loading ? (
            <NotifSkeleton />
          ) : filteredNotifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0 32px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                {search || filterLevel !== "all" ? "No matching notifications" : "You're all caught up!"}
              </Text>
              <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {search || filterLevel !== "all"
                  ? "Try adjusting your search or filter."
                  : "No notifications available for your account right now."}
              </Text>
              {unreadCount === 0 && filteredNotifications.length === 0 && (search || filterLevel !== "all") && (
                <Button size="small" style={{ marginTop: 12 }} onClick={() => { setSearch(""); setFilterLevel("all"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {groupedNotifications.map(([label, items]) => (
                <div key={label}>
                  {/* Date group header */}
                  <Flex align="center" gap={10} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {label}
                    </Text>
                    <div style={{ flex: 1, height: 1, background: "var(--border-muted)" }} />
                    <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{items.length}</Text>
                  </Flex>

                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    {items.map((item) => (
                      <NotifItem
                        key={item._id || item.id}
                        item={item}
                        isMobile={isMobile}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </Space>
                </div>
              ))}
            </Space>
          )}
        </div>
      </div>
    </>
  );
};

export default Notification;
