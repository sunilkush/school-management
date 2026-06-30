/**
 * CommunicationHub — unified School-Admin communication centre.
 * Three tabs: Broadcast  |  Messages  |  History
 */
import React, {
  useCallback, useEffect, useMemo, useState,
} from "react";
import {
  Badge, Button, DatePicker, Drawer, Empty, Flex, Form,
  Grid, Input, List, Popconfirm, Select, Skeleton, Space,
  Table, Tabs, Tag, Tooltip, Typography, message,
} from "antd";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  BellFilled, BellOutlined, CalendarOutlined, CheckCircleOutlined,
  EyeOutlined, GlobalOutlined,
  HistoryOutlined, MailOutlined, MessageOutlined, MobileOutlined,
  NotificationOutlined, SendOutlined, SolutionOutlined,
  UserOutlined, UserSwitchOutlined,
} from "@ant-design/icons";
import { Archive, Inbox, Mail, MailOpen, RefreshCw, Send, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, pill, sectionPanel,
  statGrid, tableContainer, tableHeadCss,
} from "../../../styles/pageStyles";
import { useTheme } from "../../../context/ThemeContext";
import { getRoleName, ALL_ROLE_NAMES } from "../../../utils/roles";
import {
  createNotificationPayload, getNotificationAnalytics, getNotifications,
  getVisibleNotificationsForUser, markAllNotificationsAsRead,
  markNotificationAsRead, saveNotifications,
} from "../../../utils/notifications";
import {
  archiveMessage, clearMessageThread, createMessage, deleteMessage,
  fetchMessageRecipients, fetchMessageThread, fetchMessages, markMessageRead,
} from "../../../features/messageSlice";
import { fetchNotifications } from "../../../features/notificationSlice";

dayjs.extend(relativeTime);
const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

/* ── Constants ──────────────────────────────────────────────────────── */
const CREATOR_ROLES = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Exam Coordinator", "Receptionist", "IT Support",
];

const LEVEL_OPTIONS = [
  { label: "All Roles & Users", value: "all" },
  { label: "Role-wise",         value: "role" },
  { label: "User Level-wise",   value: "user-level" },
  { label: "Specific Users",    value: "user" },
];
const ROLE_OPTIONS = ALL_ROLE_NAMES.map((r) => ({ label: r, value: r }));

const LEVEL_META = {
  all:          { icon: <GlobalOutlined />,    color: "#2563EB", label: "Broadcast" },
  role:         { icon: <SolutionOutlined />,  color: "#7C3AED", label: "Role"      },
  "user-level": { icon: <UserSwitchOutlined />,color: "#D97706", label: "Level"     },
  user:         { icon: <UserOutlined />,      color: "#16A34A", label: "User"      },
};

const STATUS_COLOR = { scheduled: "#D97706", draft: "#94A3B8", failed: "#DC2626", sent: "#16A34A" };

const CHANNEL_LIST = [
  { key: "inApp",    label: "In-App",   icon: <BellFilled />,    color: "#2563EB" },
  { key: "email",    label: "Email",    icon: <MailOutlined />,   color: "#16A34A" },
  { key: "sms",      label: "SMS",      icon: <MobileOutlined />, color: "#D97706" },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageOutlined />,color: "#25D366" },
];

const PRIORITY_HEX = { low: "#94A3B8", normal: "#2563EB", high: "#F59E0B", urgent: "#EF4444" };
const PRIORITY_COLOR = { low: "default", normal: "blue", high: "orange", urgent: "red" };

/* ── Small helpers ──────────────────────────────────────────────────── */
const safeText = (v, fb = "—") => {
  if (v == null || v === "") return fb;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map((e) => safeText(e, "")).filter(Boolean).join(", ") || fb;
  return v.name || v.fullName || v.email || v._id || fb;
};
const fmtDate  = (v) => v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—";
const fmtShort = (v) => v ? dayjs(v).fromNow() : "—";

/* ── Channel toggle ─────────────────────────────────────────────────── */
const ChannelToggle = ({ value = [], onChange }) => {
  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  return (
    <Flex gap={8} wrap="wrap">
      {CHANNEL_LIST.map((ch) => {
        const active = value.includes(ch.key);
        return (
          <div
            key={ch.key}
            role="button"
            onClick={() => toggle(ch.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              border: `1.5px solid ${active ? ch.color : "var(--border-muted)"}`,
              background: active ? `${ch.color}14` : "var(--surface)",
              transition: "all 0.18s", minWidth: 68, userSelect: "none",
            }}
          >
            <span style={{ fontSize: 18, color: active ? ch.color : "var(--text-muted)" }}>{ch.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: active ? ch.color : "var(--text-muted)" }}>{ch.label}</span>
          </div>
        );
      })}
    </Flex>
  );
};

/* ── Level avatar ───────────────────────────────────────────────────── */
const LevelAvatar = ({ level, size = 36 }) => {
  const m = LEVEL_META[level] || LEVEL_META.all;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${m.color}18`, border: `1.5px solid ${m.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: m.color, fontSize: size * 0.42, flexShrink: 0,
    }}>
      {m.icon}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   TAB 1 — BROADCAST PANEL
══════════════════════════════════════════════════════════════════════ */
const BroadcastPanel = ({ user }) => {
  const [form]      = Form.useForm();
  const [notifs,    setNotifs]    = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterLvl, setFilterLvl] = useState("all");
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const selectedLevel = Form.useWatch("level", form);
  const canCreate = CREATOR_ROLES.includes(getRoleName(user));

  const visible = useMemo(
    () => getVisibleNotificationsForUser(notifs, user),
    [notifs, user],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter((n) => {
      const lv = safeText(n?.level, "all");
      return (filterLvl === "all" || lv === filterLvl) &&
        (!q || [safeText(n.title, ""), safeText(n.message, ""), safeText(n.createdBy, "")]
          .join(" ").toLowerCase().includes(q));
    });
  }, [visible, filterLvl, search]);

  const unread = visible.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, stats] = await Promise.all([getNotifications(), getNotificationAnalytics()]);
      setNotifs(rows); setAnalytics(stats);
    } catch (err) { message.error("Failed to load notifications"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onSend = async (vals) => {
    const payload = createNotificationPayload({
      title: vals.title, message: vals.message, level: vals.level,
      targetRoles: vals.targetRoles || [], targetLevels: vals.targetLevels || [],
      targetUserIds: vals.targetUserIds || [],
      channels: {
        inApp:    vals.channels?.includes("inApp") ?? true,
        email:    vals.channels?.includes("email"),
        sms:      vals.channels?.includes("sms"),
        whatsapp: vals.channels?.includes("whatsapp"),
      },
      scheduledAt: vals.scheduledAt?.toISOString?.() || null,
      status: vals.saveAsDraft ? "draft" : undefined,
    });
    setSending(true);
    try {
      const created = await saveNotifications(payload);
      setNotifs((prev) => [created, ...prev]);
      form.resetFields();
      message.success("Notification published!");
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed");
    } finally { setSending(false); }
  };

  const handleMarkRead = async (n) => {
    if (!n?._id || n.isRead) return;
    try {
      const updated = await markNotificationAsRead(n._id);
      setNotifs((prev) => prev.map((x) => (x._id === n._id ? updated : x)));
    } catch (err) { message.error("Failed to mark as read"); }
  };

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsAsRead(); await load(); message.success("All marked as read"); }
    catch (err) { message.error("Failed"); }
  };

  /* Conditional target fields */
  const renderTargetFields = () => {
    if (selectedLevel === "role") return (
      <Form.Item label="Target Roles" name="targetRoles" rules={[{ required: true, message: "Select a role" }]}>
        <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Choose roles" maxTagCount="responsive" />
      </Form.Item>
    );
    if (selectedLevel === "user-level") return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Form.Item label="Target Roles" name="targetRoles" rules={[{ required: true }]}>
          <Select mode="multiple" options={ROLE_OPTIONS} placeholder="Roles" maxTagCount="responsive" />
        </Form.Item>
        <Form.Item label="User Levels" name="targetLevels" rules={[{ required: true }]}>
          <Select mode="tags" tokenSeparators={[","]} placeholder="e.g. Class 10, Section A" />
        </Form.Item>
      </div>
    );
    if (selectedLevel === "user") return (
      <Form.Item label="Specific Users" name="targetUserIds" rules={[{ required: true }]}>
        <Select mode="tags" tokenSeparators={[","]} placeholder="Enter email / user-ID / reg-ID" />
      </Form.Item>
    );
    return (
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <GlobalOutlined style={{ color: "#2563EB", fontSize: 15 }} />
        <div>
          <Text strong style={{ fontSize: 12, color: "#1D4ED8" }}>Broadcasting to everyone</Text>
          <Text style={{ fontSize: 11, color: "#3B82F6", display: "block" }}>All roles and users in the portal.</Text>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Compose section */}
      {canCreate && (
        <div style={{ ...sectionPanel, marginBottom: 20 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 18 }}>
            <div style={iconWell("#7C3AED", 38)}><SendOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Create Broadcast</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Send announcement to specific roles, levels, or all users.</Text>
            </div>
            {unread > 0 && (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={handleMarkAllRead} style={{ marginLeft: "auto" }}>
                Mark all read
              </Button>
            )}
          </Flex>

          <Form
            form={form}
            layout="vertical"
            onFinish={onSend}
            initialValues={{ level: "all", channels: ["inApp"] }}
            requiredMark="optional"
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
              <Form.Item label="Audience Type" name="level" rules={[{ required: true }]}>
                <Select options={LEVEL_OPTIONS} />
              </Form.Item>
              <div>{renderTargetFields()}</div>
            </div>

            <Form.Item label="Title" name="title" rules={[{ required: true, message: "Title required" }]}>
              <Input placeholder="e.g. Exam timetable published" maxLength={160} size="large" />
            </Form.Item>
            <Form.Item label="Message" name="message" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="Write a concise announcement…" maxLength={2000} />
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "0 16px" }}>
              <Form.Item
                label="Delivery Channels"
                name="channels"
                rules={[{ required: true, validator: (_, v) => v?.length ? Promise.resolve() : Promise.reject("Select at least one channel") }]}
              >
                <ChannelToggle />
              </Form.Item>
              <Form.Item label="Schedule (optional)" name="scheduledAt" extra="Empty = send now">
                <DatePicker showTime style={{ width: "100%" }} placeholder="Pick date & time" />
              </Form.Item>
            </div>

            <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>
                <Form.Item name="saveAsDraft" valuePropName="checked" noStyle>
                  <input type="checkbox" style={{ width: 14, height: 14, accentColor: "#7C3AED" }} />
                </Form.Item>
                Save as draft
              </label>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} block={isMobile} size="large">
                Publish Notification
              </Button>
            </Flex>
          </Form>
        </div>
      )}

      {/* Notifications inbox */}
      <div style={sectionPanel}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={10} style={{ marginBottom: 14 }}>
          <Flex align="center" gap={8}>
            <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>My Notifications</Text>
            {unread > 0 && (
              <span style={{ background: "#2563EB", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "1px 8px" }}>
                {unread}
              </span>
            )}
          </Flex>
          <Flex gap={8} wrap="wrap">
            <Input.Search allowClear placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
            <Select value={filterLvl} onChange={setFilterLvl} style={{ width: 150 }} options={[{ label: "All Types", value: "all" }, ...LEVEL_OPTIONS.slice(1)]} />
            <Button icon={<ArrowPathIcon style={{ width: 15, height: 15 }} />} onClick={load} loading={loading} />
          </Flex>
        </Flex>

        {loading ? (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ ...sectionPanel, padding: 14, marginBottom: 0, borderRadius: 12 }}><Skeleton active avatar paragraph={{ rows: 2 }} /></div>)}
          </Space>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <BellOutlined style={{ fontSize: 40, color: "var(--text-muted)" }} />
            <Text style={{ display: "block", marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>
              {search || filterLvl !== "all" ? "No matching notifications" : "You're all caught up!"}
            </Text>
          </div>
        ) : (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {filtered.map((n) => {
              const lm = LEVEL_META[n.level] || LEVEL_META.all;
              const st = STATUS_COLOR[n.status] || "#94A3B8";
              return (
                <div
                  key={n._id}
                  onClick={() => handleMarkRead(n)}
                  style={{
                    display: "flex", gap: 12, padding: "12px 16px", borderRadius: 12, cursor: n.isRead ? "default" : "pointer",
                    border: `1px solid ${n.isRead ? "var(--border-muted)" : `${lm.color}30`}`,
                    borderLeft: `4px solid ${n.isRead ? "var(--border-muted)" : lm.color}`,
                    background: n.isRead ? "var(--surface)" : `${lm.color}05`,
                    transition: "box-shadow 0.18s",
                  }}
                >
                  <LevelAvatar level={n.level} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" justify="space-between" gap={6} wrap="wrap">
                      <Flex align="center" gap={6}>
                        {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: lm.color, flexShrink: 0, display: "inline-block" }} />}
                        <Text strong style={{ fontSize: 13, color: "var(--text-primary)" }}>{safeText(n.title, "Notification")}</Text>
                      </Flex>
                      <Flex gap={4}>
                        <span style={pill(lm.color)}>{lm.label}</span>
                        <span style={pill(st)}>{safeText(n.status)}</span>
                      </Flex>
                    </Flex>
                    <Paragraph style={{ margin: "4px 0 6px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }} ellipsis={{ rows: 2 }}>
                      {safeText(n.message)}
                    </Paragraph>
                    <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      By {safeText(n.createdBy)} · {fmtShort(n.createdAt)}
                    </Text>
                  </div>
                </div>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   TAB 2 — MESSAGES PANEL
══════════════════════════════════════════════════════════════════════ */
const MessagesPanel = ({ user }) => {
  const dispatch  = useDispatch();
  const [form]    = Form.useForm();
  const [replyForm] = Form.useForm();
  const { rows, recipients, thread, loading, recipientsLoading, threadLoading, saving } =
    useSelector((s) => s.messages);

  const screens   = useBreakpoint();
  const isMobile  = !screens.md;
  const [mailbox, setMailbox]     = useState("inbox");
  const [search,  setSearch]      = useState("");
  const [compose, setCompose]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const currentUserId = user?._id || user?.id;

  const recipientOptions = useMemo(
    () => recipients.map((r) => ({
      value: r._id,
      label: `${safeText(r.name)} (${safeText(r.role)}${r.email ? ` · ${r.email}` : ""})`,
    })),
    [recipients],
  );

  const load = useCallback(() => {
    dispatch(fetchMessages({ mailbox, search }));
  }, [dispatch, mailbox, search]);

  useEffect(() => {
    dispatch(fetchMessageRecipients()).catch(() => {});
  }, [dispatch]);
  useEffect(() => { load(); }, [load]);

  const openMsg = async (row) => {
    setSelected(row);
    dispatch(clearMessageThread());
    dispatch(fetchMessageThread(row._id));
    if (!row.isRead && mailbox === "inbox") dispatch(markMessageRead(row._id));
  };

  const sendMsg = async (vals) => {
    try {
      await dispatch(createMessage(vals)).unwrap();
      message.success("Message sent!"); form.resetFields(); setCompose(false);
      if (mailbox === "sent") load();
    } catch (e) { message.error(e || "Failed"); }
  };

  const sendReply = async (vals) => {
    if (!selected) return;
    const rIds = [selected.senderId?._id, ...(selected.recipientIds || []).map((r) => r?._id)]
      .filter(Boolean).filter((id) => String(id) !== String(currentUserId));
    if (!rIds.length) { message.warning("No recipient for reply"); return; }
    const subj = safeText(selected.subject, "Re: Message");
    try {
      await dispatch(createMessage({
        subject: subj.startsWith("Re:") ? subj : `Re: ${subj}`,
        body: vals.body, priority: selected.priority || "normal",
        recipientIds: [...new Set(rIds.map(String))],
        parentMessageId: selected._id,
      })).unwrap();
      replyForm.resetFields(); message.success("Reply sent!");
      dispatch(fetchMessageThread(selected._id));
    } catch (e) { message.error(e || "Failed"); }
  };

  const unreadCount = rows.filter((r) => !r.isRead && mailbox === "inbox").length;

  const MAILBOX_TABS = [
    { key: "inbox",   label: "Inbox",   icon: <Inbox size={14} /> },
    { key: "sent",    label: "Sent",    icon: <Send size={14} /> },
    { key: "archive", label: "Archive", icon: <Archive size={14} /> },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ ...sectionPanel, padding: "10px 16px", marginBottom: 16 }}>
        <Flex align="center" justify="space-between" gap={12} wrap="wrap">
          <Tabs
            activeKey={mailbox}
            onChange={setMailbox}
            style={{ margin: 0 }}
            tabBarStyle={{ margin: 0, borderBottom: "none" }}
            items={MAILBOX_TABS.map(({ key, label, icon }) => ({
              key,
              label: (
                <Flex align="center" gap={4}>
                  {icon}
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  {key === "inbox" && unreadCount > 0 && (
                    <Badge count={unreadCount} size="small" />
                  )}
                </Flex>
              ),
            }))}
          />
          <Flex gap={8}>
            <Input.Search
              allowClear
              placeholder="Search messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={load}
              style={{ width: isMobile ? 160 : 240 }}
            />
            <Button icon={<RefreshCw size={14} />} onClick={load} loading={loading} />
            <Button type="primary" icon={<Send size={14} />} onClick={() => setCompose(true)}>
              {isMobile ? "" : "Compose"}
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* List */}
      <div style={sectionPanel}>
        {loading ? (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ ...sectionPanel, padding: 14, marginBottom: 0 }}><Skeleton active avatar paragraph={{ rows: 2 }} /></div>)}
          </Space>
        ) : rows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No messages" style={{ padding: "48px 0" }} />
        ) : (
          <List
            split={false}
            dataSource={rows}
            rowKey={(r) => r._id}
            renderItem={(item) => {
              const isUnread = !item.isRead && mailbox === "inbox";
              const pri = (item.priority || "normal").toLowerCase();
              const accent = PRIORITY_HEX[pri] || "#2563EB";
              return (
                <List.Item style={{ padding: 0, marginBottom: 8 }}>
                  <div
                    onClick={() => openMsg(item)}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 14, cursor: "pointer",
                      border: "1px solid var(--border-muted)",
                      borderLeft: isUnread ? `4px solid ${accent}` : "1px solid var(--border-muted)",
                      background: isUnread ? `linear-gradient(90deg, ${accent}06, var(--surface) 60%)` : "var(--surface)",
                      transition: "box-shadow 0.18s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(37,99,235,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <Flex gap={10} align="flex-start">
                      <div style={iconWell(accent, 38, { flexShrink: 0 })}>
                        {isUnread ? <MailOpen size={16} /> : <Mail size={16} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex justify="space-between" align="center" gap={6} wrap="wrap">
                          <Flex align="center" gap={6}>
                            {isUnread && <Badge status="processing" />}
                            <Text strong={isUnread} style={{ fontSize: 13, color: "var(--text-primary)" }} ellipsis>
                              {safeText(item.subject, "Untitled")}
                            </Text>
                          </Flex>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {fmtShort(item.createdAt)}
                          </Text>
                        </Flex>
                        <Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ margin: "4px 0", fontSize: 12 }}>
                          {safeText(item.body)}
                        </Paragraph>
                        <Flex gap={6} align="center" wrap="wrap">
                          <Tag color={PRIORITY_COLOR[pri]} style={{ borderRadius: 99, fontSize: 10, margin: 0 }}>
                            {pri.toUpperCase()}
                          </Tag>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {mailbox === "sent"
                              ? `To: ${safeText(item.recipientIds?.map?.((r) => r?.name || r))}`
                              : `From: ${safeText(item.senderId?.name || item.senderId)}`}
                          </Text>
                          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                            {mailbox !== "archive" && (
                              <Tooltip title="Archive">
                                <Button
                                  size="small" icon={<Archive size={12} />}
                                  onClick={(e) => { e.stopPropagation(); dispatch(archiveMessage(item._id)); }}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Remove">
                              <Popconfirm title="Remove from mailbox?" okText="Remove" okButtonProps={{ danger: true }}
                                onConfirm={(e) => { e?.stopPropagation?.(); dispatch(deleteMessage(item._id)); }}
                              >
                                <Button size="small" danger icon={<Trash2 size={12} />} onClick={(e) => e.stopPropagation()} />
                              </Popconfirm>
                            </Tooltip>
                          </div>
                        </Flex>
                      </div>
                    </Flex>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* Compose Drawer */}
      <Drawer
        title={<Flex align="center" gap={10}><div style={iconWell("#2563EB", 32)}><Send size={14} /></div><Text strong>Compose Message</Text></Flex>}
        open={compose} onClose={() => setCompose(false)} width={isMobile ? "100%" : 600}
        destroyOnClose
        footer={
          <Flex gap={10} justify="flex-end">
            <Button onClick={() => setCompose(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" form="compose-form" loading={saving} icon={<Send size={14} />}>Send</Button>
          </Flex>
        }
      >
        <Form id="compose-form" form={form} layout="vertical" onFinish={sendMsg} initialValues={{ priority: "normal" }}>
          <Form.Item name="recipientIds" label="Recipients" rules={[{ required: true }]}>
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Select recipients" options={recipientOptions} loading={recipientsLoading} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select options={[{ label: "Low", value: "low" }, { label: "Normal", value: "normal" }, { label: "High", value: "high" }, { label: "Urgent", value: "urgent" }]} />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input maxLength={180} placeholder="Message subject" />
          </Form.Item>
          <Form.Item name="body" label="Message" rules={[{ required: true }]}>
            <Input.TextArea rows={8} maxLength={5000} showCount placeholder="Write your message…" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Thread Drawer */}
      <Drawer
        title={selected
          ? <Flex align="center" gap={10}><div style={iconWell("#7C3AED", 32)}><MailOutlined /></div><Text strong ellipsis style={{ maxWidth: 260 }}>{safeText(selected.subject)}</Text></Flex>
          : "Message"
        }
        open={Boolean(selected)} onClose={() => setSelected(null)} width={isMobile ? "100%" : 700}
      >
        {selected && (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <div style={{ ...sectionPanel, padding: 12, background: "var(--surface-soft)" }}>
              <Flex gap={6} wrap="wrap" align="center">
                <Tag color={PRIORITY_COLOR[selected.priority] || "blue"} style={{ borderRadius: 99 }}>
                  {(selected.priority || "NORMAL").toUpperCase()}
                </Tag>
                <Tag color="geekblue" style={{ borderRadius: 99 }}>From: {safeText(selected.senderId?.name || selected.senderId)}</Tag>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: "auto" }}>{fmtDate(selected.createdAt)}</Text>
              </Flex>
            </div>

            {threadLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <List
                split={false}
                dataSource={thread.length ? thread : [selected]}
                rowKey={(r) => r._id}
                renderItem={(msg) => (
                  <List.Item style={{ padding: 0, marginBottom: 10 }}>
                    <div style={{ ...sectionPanel, padding: 14, width: "100%" }}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <Flex align="center" gap={8}>
                          <div style={iconWell("#2563EB", 28)}><MailOutlined style={{ fontSize: 12 }} /></div>
                          <Text strong style={{ fontSize: 13 }}>{safeText(msg.senderId?.name || msg.senderId)}</Text>
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(msg.createdAt)}</Text>
                      </Flex>
                      <Paragraph style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)", marginBottom: 0, fontSize: 13 }}>
                        {safeText(msg.body)}
                      </Paragraph>
                    </div>
                  </List.Item>
                )}
              />
            )}

            <div style={sectionPanel}>
              <Text strong style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>Reply</Text>
              <Form form={replyForm} layout="vertical" onFinish={sendReply}>
                <Form.Item name="body" rules={[{ required: true }]}>
                  <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Write reply…" />
                </Form.Item>
                <Flex justify="flex-end">
                  <Button type="primary" htmlType="submit" loading={saving} icon={<Send size={14} />}>Send Reply</Button>
                </Flex>
              </Form>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   TAB 3 — HISTORY PANEL
══════════════════════════════════════════════════════════════════════ */
const HistoryPanel = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.notification);
  const [filters, setFilters] = useState({ type: null, search: "", dateRange: null });

  useEffect(() => { dispatch(fetchNotifications({ status: "sent" })); }, [dispatch]);

  const history = items
    .filter((n) => n.channels?.sms || n.channels?.email || n.channels?.inApp)
    .map((n) => ({
      ...n,
      channelType: [n.channels?.inApp && "App", n.channels?.email && "Email", n.channels?.sms && "SMS"].filter(Boolean).join("+"),
    }));

  const filteredData = history.filter((item) => {
    const matchType   = !filters.type || item.channelType.includes(filters.type);
    const matchSearch = !filters.search || [item.title, item.message].join(" ").toLowerCase().includes(filters.search.toLowerCase());
    const matchDate   = !filters.dateRange || (dayjs(item.createdAt).isAfter(filters.dateRange[0], "day") && dayjs(item.createdAt).isBefore(filters.dateRange[1], "day"));
    return matchType && matchSearch && matchDate;
  });

  const totalApp   = history.filter((h) => h.channels?.inApp).length;
  const totalSMS   = history.filter((h) => h.channels?.sms).length;
  const totalEmail = history.filter((h) => h.channels?.email).length;

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (v) => <Text strong style={{ color: "var(--text-primary)", fontSize: 13 }}>{v}</Text> },
    { title: "Message", dataIndex: "message", key: "message", ellipsis: true, render: (v) => <Text style={{ color: "var(--text-muted)", fontSize: 12 }}>{v}</Text> },
    {
      title: "Audience", key: "audience",
      render: (_, r) => {
        const lm = LEVEL_META[r.level] || LEVEL_META.all;
        return <span style={pill(lm.color)}>{lm.label}</span>;
      },
    },
    {
      title: "Channels", key: "channels",
      render: (_, r) => (
        <Flex gap={4}>
          {r.channels?.inApp  && <Tag color="blue"   style={{ borderRadius: 99, fontSize: 11 }}>App</Tag>}
          {r.channels?.email  && <Tag color="green"  style={{ borderRadius: 99, fontSize: 11 }}>Email</Tag>}
          {r.channels?.sms    && <Tag color="orange" style={{ borderRadius: 99, fontSize: 11 }}>SMS</Tag>}
        </Flex>
      ),
    },
    { title: "Sent By", dataIndex: "createdBy", key: "createdBy", render: (v) => <Text style={{ fontSize: 12 }}>{v || "—"}</Text> },
    { title: "Date", dataIndex: "createdAt", key: "createdAt", render: (v) => fmtDate(v), sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt), defaultSortOrder: "descend" },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (v) => <span style={pill(STATUS_COLOR[v] || "#94A3B8")}>{v}</span>,
    },
  ];

  return (
    <div>
      {/* Mini-stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "In-App", value: totalApp,   color: "#2563EB", icon: <BellFilled /> },
          { label: "SMS",    value: totalSMS,   color: "#D97706", icon: <MobileOutlined /> },
          { label: "Email",  value: totalEmail, color: "#16A34A", icon: <MailOutlined /> },
          { label: "Total",  value: history.length, color: "#7C3AED", icon: <HistoryOutlined /> },
        ].map((s) => (
          <div key={s.label} style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border-muted)", borderLeft: `4px solid ${s.color}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell(s.color, 34)}>{React.cloneElement(s.icon, { style: { fontSize: 14 } })}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...sectionPanel, padding: "12px 16px", marginBottom: 16 }}>
        <Flex gap={10} wrap="wrap" align="center">
          <Select placeholder="All Channels" allowClear style={{ width: 150 }} onChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
            <Select.Option value="SMS">SMS</Select.Option>
            <Select.Option value="Email">Email</Select.Option>
            <Select.Option value="App">In-App</Select.Option>
          </Select>
          <Input placeholder="Search title or message" prefix={<EyeOutlined />} style={{ width: 240 }} allowClear onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
          <RangePicker onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates }))} />
          <Button onClick={() => setFilters({ type: null, search: "", dateRange: null })}>Reset</Button>
          <Text type="secondary" style={{ marginLeft: "auto", fontSize: 12 }}>{filteredData.length} records</Text>
        </Flex>
      </div>

      {/* Table */}
      <style>{tableHeadCss("hist-tbl")}</style>
      <div className="hist-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} records` }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No history found" }}
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN HUB
══════════════════════════════════════════════════════════════════════ */
export default function CommunicationHub() {
  const { isDark } = useTheme();
  const { user }   = useSelector((s) => s.auth);
  const messages   = useSelector((s) => s.messages);
  const notifs     = useSelector((s) => s.notification);

  const unreadMsgs  = (messages?.rows  || []).filter((r) => !r.isRead).length;
  const unreadNotif = (notifs?.items   || []).filter((n) => !n.isRead).length;
  const scheduled   = (notifs?.items   || []).filter((n) => n.status === "scheduled").length;
  const drafts      = (notifs?.items   || []).filter((n) => n.status === "draft").length;

  const KPI = [
    { label: "Unread Messages",      value: unreadMsgs,  color: "#2563EB", icon: <MailOutlined /> },
    { label: "Unread Notifications", value: unreadNotif, color: "#F59E0B", icon: <BellOutlined /> },
    { label: "Scheduled",            value: scheduled,   color: "#7C3AED", icon: <CalendarOutlined /> },
    { label: "Drafts",               value: drafts,      color: "#94A3B8", icon: <EyeOutlined /> },
  ];

  const TABS = [
    {
      key: "broadcast",
      label: <Flex align="center" gap={6}><NotificationOutlined />Broadcast</Flex>,
      children: <BroadcastPanel user={user} />,
    },
    {
      key: "messages",
      label: (
        <Flex align="center" gap={6}>
          <MessageOutlined />
          Messages
          {unreadMsgs > 0 && <Badge count={unreadMsgs} size="small" />}
        </Flex>
      ),
      children: <MessagesPanel user={user} />,
    },
    {
      key: "history",
      label: <Flex align="center" gap={6}><HistoryOutlined />History</Flex>,
      children: <HistoryPanel />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Communication Centre"
        subtitle="Broadcast notifications, send messages, and track delivery history"
        icon={<NotificationOutlined />}
      />

      <div style={pageWrapper}>
        <style>{`
          .comm-hub-tabs .ant-tabs-tab { font-size: 13px !important; padding: 8px 16px !important; color: var(--text-muted) !important; }
          .comm-hub-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--primary) !important; font-weight: 600 !important; }
          .comm-hub-tabs .ant-tabs-ink-bar { background: var(--primary) !important; }
          .comm-hub-tabs .ant-tabs-nav::before { border-color: var(--border-muted) !important; }
          .comm-hub-tabs .ant-tabs-nav { margin-bottom: 20px !important; }
          @keyframes commFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .comm-panel { animation: commFadeUp 0.25s ease both; }
        `}</style>

        {/* KPI */}
        <div style={statGrid(150)}>
          {KPI.map((k) => (
            <div key={k.label} style={{ padding: "16px 18px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border-muted)", borderLeft: `4px solid ${k.color}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconWell(k.color, 40)}>{React.cloneElement(k.icon, { style: { fontSize: 17 } })}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs
          className="comm-hub-tabs"
          defaultActiveKey="broadcast"
          items={TABS.map(({ key, label, children }) => ({
            key, label,
            children: <div className="comm-panel">{children}</div>,
          }))}
        />
      </div>
    </>
  );
}
