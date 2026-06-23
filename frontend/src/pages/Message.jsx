import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  List,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AlertTriangle,
  Archive,
  Inbox,
  Mail,
  MailOpen,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  archiveMessage,
  clearMessageThread,
  createMessage,
  deleteMessage,
  fetchMessageRecipients,
  fetchMessageThread,
  fetchMessages,
  markMessageRead,
} from "../features/messageSlice";
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../styles/pageStyles";

const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const MESSAGE_ROLES = [
  "Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher",
  "Student", "Parent", "Accountant", "Receptionist", "Librarian", "Staff",
  "Support Staff", "Subject Coordinator", "Hostel Warden", "Transport Manager",
  "Exam Coordinator", "IT Support", "Counselor", "Security",
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const PRIORITY_COLOR = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red",
};

const PRIORITY_HEX = {
  low: "#94A3B8",
  normal: "#2563EB",
  high: "#F59E0B",
  urgent: "#EF4444",
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const getRoleName = (user) => {
  if (typeof user?.role === "string") return user.role;
  return user?.role?.name || user?.roleId?.name || "";
};

const getCurrentUserId = (user) => user?._id || user?.id;

const toText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((entry) => toText(entry, "")).filter(Boolean).join(", ");
    return joined || fallback;
  }
  if (typeof value === "object") {
    return value.name || value.fullName || value.email || value.title || value._id || value.id || fallback;
  }
  return fallback;
};

const normalizeNames = (value, fallback = "-") => {
  if (!Array.isArray(value)) return toText(value, fallback);
  const names = value.map((entry) => toText(entry, "")).filter(Boolean);
  return names.length ? names.join(", ") : fallback;
};

const getMessageSubject = (item) => toText(item?.subject, "Untitled message");
const getMessageBody = (item) => toText(item?.body, "No message content available.");
const getSenderName = (item) => toText(item?.senderName || item?.senderId, "Unknown sender");
const getSenderRole = (item) => toText(item?.senderRole || item?.senderId?.role, "Member");
const getRecipientNames = (item) => normalizeNames(item?.recipientNames || item?.recipientIds, "No recipients");
const getPriority = (item) => toText(item?.priority, "normal").toLowerCase();

const MessageSkeleton = () => (
  <Space direction="vertical" size={10} style={{ width: "100%" }}>
    {[1, 2, 3].map((item) => (
      <div key={item} style={{ ...sectionPanel, padding: 16, marginBottom: 0 }}>
        <Skeleton active avatar paragraph={{ rows: 2 }} title={{ width: "55%" }} />
      </div>
    ))}
  </Space>
);

const MessagePage = () => {
  const [form] = Form.useForm();
  const [replyForm] = Form.useForm();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const { user } = useSelector((state) => state.auth);
  const {
    rows,
    recipients,
    thread,
    loading,
    recipientsLoading,
    threadLoading,
    saving,
  } = useSelector((state) => state.messages);
  const roleName = getRoleName(user);
  const currentUserId = getCurrentUserId(user);

  const [mailbox, setMailbox] = useState("inbox");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.xl;
  const composeDrawerWidth = isMobile ? "100%" : isTablet ? 560 : 640;
  const detailDrawerWidth = isMobile ? "100%" : isTablet ? 640 : 780;
  const canUseMessages = MESSAGE_ROLES.includes(roleName);

  const recipientOptions = useMemo(
    () =>
      recipients.map((recipient) => ({
        value: recipient._id,
        label: `${toText(recipient.name, "Unnamed user")} (${toText(recipient.role, "Role")}${recipient.email ? ` • ${toText(recipient.email)}` : ""})`,
      })),
    [recipients]
  );

  const stats = useMemo(() => {
    const unread = rows.filter((row) => !row.isRead && mailbox === "inbox").length;
    const urgent = rows.filter((row) => ["urgent", "high"].includes(getPriority(row))).length;
    return { total: rows.length, unread, urgent };
  }, [mailbox, rows]);

  const statCards = [
    { title: "Total Messages", value: stats.total, icon: <Mail size={20} />, color: "#2563EB" },
    { title: "Unread", value: stats.unread, icon: <MailOpen size={20} />, color: "#22C55E" },
    { title: "High Priority", value: stats.urgent, icon: <AlertTriangle size={20} />, color: "#EF4444" },
  ];

  const loadRecipients = useCallback(async () => {
    await dispatch(fetchMessageRecipients()).unwrap();
  }, [dispatch]);

  const loadMessages = useCallback(async () => {
    if (!canUseMessages) return;
    try {
      await dispatch(fetchMessages({ mailbox, search })).unwrap();
    } catch (error) {
      message.error(error || "Failed to load messages");
    }
  }, [canUseMessages, dispatch, mailbox, search]);

  const loadThread = useCallback(async (messageRow) => {
    if (!messageRow?._id) return;
    try {
      await dispatch(fetchMessageThread(messageRow._id)).unwrap();
    } catch (error) {
      message.error(error || "Failed to load conversation");
    }
  }, [dispatch]);

  useEffect(() => {
    if (!canUseMessages) return;
    loadRecipients().catch((error) => {
      message.error(error || "Failed to load recipients");
    });
  }, [canUseMessages, loadRecipients]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const openMessage = async (row) => {
    setSelected(row);
    dispatch(clearMessageThread());
    loadThread(row);
    if (!row.isRead && mailbox === "inbox") {
      dispatch(markMessageRead(row._id));
    }
  };

  const sendMessage = async (values) => {
    try {
      await dispatch(createMessage(values)).unwrap();
      message.success("Message sent successfully");
      form.resetFields();
      setComposeOpen(false);
      if (mailbox === "sent") loadMessages();
    } catch (error) {
      message.error(error || "Failed to send message");
    }
  };

  const sendReply = async (values) => {
    if (!selected) return;
    const recipientIds = [selected.senderId?._id, ...(selected.recipientIds || []).map((r) => r?._id)]
      .filter(Boolean)
      .filter((id) => String(id) !== String(currentUserId));
    if (!recipientIds.length) {
      message.warning("No recipient available for reply");
      return;
    }
    const selectedSubject = getMessageSubject(selected);
    try {
      await dispatch(createMessage({
        subject: selectedSubject.startsWith("Re:") ? selectedSubject : `Re: ${selectedSubject}`,
        body: values.body,
        priority: selected.priority || "normal",
        recipientIds: [...new Set(recipientIds.map(String))],
        parentMessageId: selected._id,
      })).unwrap();
      replyForm.resetFields();
      message.success("Reply sent successfully");
      loadThread(selected);
      if (mailbox === "sent") loadMessages();
    } catch (error) {
      message.error(error || "Failed to send reply");
    }
  };

  const archiveSelected = async (row) => {
    try {
      await dispatch(archiveMessage(row._id)).unwrap();
      message.success("Message archived");
      if (selected?._id === row._id) setSelected(null);
    } catch (error) {
      message.error(error || "Failed to archive message");
    }
  };

  const deleteSelected = async (row) => {
    try {
      await dispatch(deleteMessage(row._id)).unwrap();
      message.success("Message removed");
      if (selected?._id === row._id) setSelected(null);
    } catch (error) {
      message.error(error || "Failed to remove message");
    }
  };

  const renderMessageActions = (item) => (
    <Flex gap={8} wrap="wrap" justify={isMobile ? "flex-start" : "flex-end"}>
      {mailbox !== "archive" && (
        <Button
          size="small"
          icon={<Archive size={14} />}
          onClick={(e) => { e.stopPropagation(); archiveSelected(item); }}
        >
          Archive
        </Button>
      )}
      <Popconfirm
        title="Remove this message from your mailbox?"
        okText="Remove"
        okButtonProps={{ danger: true }}
        onConfirm={(e) => { e?.stopPropagation?.(); deleteSelected(item); }}
      >
        <Button
          size="small"
          danger
          icon={<Trash2 size={14} />}
          onClick={(e) => e.stopPropagation()}
        >
          Remove
        </Button>
      </Popconfirm>
    </Flex>
  );

  if (!canUseMessages) {
    return (
      <>
        <PageHeader
          title="Message Center"
          subtitle="Secure role-wise inbox, sent mail, replies, and archive."
          icon={<MessageSquareText size={18} />}
        />
        <div style={pageWrapper}>
          <Alert
            type="warning"
            showIcon
            message="Message access not available for your role"
            description="Please contact the administrator to enable the communication module for your role."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Message Center"
        subtitle="Secure role-wise inbox, sent mail, replies, and archive for every role."
        icon={<MessageSquareText size={18} />}
        extra={
          <Space wrap>
            <Button icon={<RefreshCw size={15} />} onClick={loadMessages} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<Send size={15} />} onClick={() => setComposeOpen(true)}>
              Compose
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* Stat Cards */}
        <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
          {statCards.map((stat) => (
            <Col xs={24} sm={8} key={stat.title}>
              <Card
                style={{
                  borderRadius: 14,
                  border: "1px solid var(--border-muted)",
                  borderTop: `4px solid ${stat.color}`,
                }}
                styles={{ body: { padding: "16px 20px" } }}
              >
                <Flex align="center" gap={14}>
                  <div style={iconWell(stat.color, 44)}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                      {stat.title}
                    </div>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Mailbox Toolbar */}
        <div style={{ ...sectionPanel, marginBottom: 16, padding: "10px 16px" }}>
          <Flex vertical={isMobile} gap={12} align={isMobile ? "stretch" : "center"} justify="space-between">
            <Tabs
              activeKey={mailbox}
              onChange={setMailbox}
              style={{ margin: 0 }}
              tabBarStyle={{ margin: 0, borderBottom: "none" }}
              tabBarGutter={isMobile ? 12 : 28}
              items={[
                { key: "inbox", label: <span style={{ fontWeight: 600 }}>Inbox</span>, icon: <Inbox size={14} /> },
                { key: "sent", label: <span style={{ fontWeight: 600 }}>Sent</span>, icon: <Send size={14} /> },
                { key: "archive", label: <span style={{ fontWeight: 600 }}>Archive</span>, icon: <Archive size={14} /> },
              ]}
            />
            <Input.Search
              allowClear
              enterButton={isMobile ? <Search size={16} /> : "Search"}
              placeholder="Search subject or message"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={loadMessages}
              style={{ width: isMobile ? "100%" : isTablet ? 300 : 380 }}
            />
          </Flex>
        </div>

        {/* Messages List */}
        <div style={sectionPanel}>
          <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 15, color: "var(--text-primary)", textTransform: "capitalize" }}>
                {mailbox}
              </Text>
              <Tag color="blue" style={{ borderRadius: 99 }}>
                {stats.total}
              </Tag>
            </Flex>
          </Flex>

          {loading ? (
            <MessageSkeleton />
          ) : rows.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No messages found"
              style={{ padding: isMobile ? "32px 0" : "56px 0" }}
            />
          ) : (
            <List
              itemLayout="vertical"
              split={false}
              dataSource={rows}
              rowKey={(item) => item._id}
              renderItem={(item) => {
                const priority = getPriority(item);
                const isUnread = !item.isRead && mailbox === "inbox";
                const accentColor = PRIORITY_HEX[priority] || "#2563EB";

                return (
                  <List.Item style={{ padding: 0, marginBottom: 10 }}>
                    <Card
                      hoverable
                      onClick={() => openMessage(item)}
                      style={{
                        borderRadius: 14,
                        cursor: "pointer",
                        border: "1px solid var(--border-muted)",
                        borderLeft: isUnread ? `4px solid ${accentColor}` : "1px solid var(--border-muted)",
                        background: isUnread
                          ? "linear-gradient(90deg, rgba(37,99,235,0.04) 0%, var(--surface) 60%)"
                          : "var(--surface)",
                        boxShadow: isUnread
                          ? "0 4px 16px rgba(37,99,235,0.08)"
                          : "0 1px 4px rgba(0,0,0,0.03)",
                      }}
                      styles={{ body: { padding: isMobile ? 14 : 16 } }}
                    >
                      <Flex vertical gap={10}>
                        <Flex vertical={isMobile} gap={10} justify="space-between" align={isMobile ? "stretch" : "flex-start"}>
                          <Space direction="vertical" size={6} style={{ minWidth: 0, flex: 1 }}>
                            <Flex gap={8} align="center" wrap="wrap">
                              {isUnread && <Badge status="processing" />}
                              <Text
                                strong={isUnread}
                                style={{ fontSize: 15, color: "var(--text-primary)" }}
                                ellipsis
                              >
                                {getMessageSubject(item)}
                              </Text>
                            </Flex>
                            <Paragraph
                              type="secondary"
                              ellipsis={{ rows: 2 }}
                              style={{ margin: 0, fontSize: 13 }}
                            >
                              {getMessageBody(item)}
                            </Paragraph>
                          </Space>
                          {renderMessageActions(item)}
                        </Flex>

                        <Flex gap={6} wrap="wrap" align="center">
                          <Tag
                            color={PRIORITY_COLOR[priority] || "blue"}
                            style={{ borderRadius: 99, fontSize: 11, fontWeight: 600 }}
                          >
                            {priority.toUpperCase()}
                          </Tag>
                          <Tag
                            color={mailbox === "sent" ? "purple" : "geekblue"}
                            style={{ borderRadius: 99 }}
                          >
                            {mailbox === "sent"
                              ? `To: ${getRecipientNames(item)}`
                              : `From: ${getSenderName(item)}`}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: "auto" }}>
                            {formatTime(item.createdAt)}
                          </Text>
                        </Flex>
                      </Flex>
                    </Card>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Compose Drawer */}
      <Drawer
        title={
          <Flex align="center" gap={10}>
            <div style={iconWell("#2563EB", 32)}>
              <Send size={15} />
            </div>
            <Text strong style={{ fontSize: 15 }}>Compose Message</Text>
          </Flex>
        }
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        width={composeDrawerWidth}
        destroyOnClose
        styles={{ body: { padding: isMobile ? 16 : 24 }, footer: { padding: 16 } }}
        footer={
          <Flex gap={10} justify="flex-end" style={{ flexDirection: isMobile ? "column-reverse" : "row" }}>
            <Button block={isMobile} onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button block={isMobile} type="primary" htmlType="submit" form="compose-message-form" loading={saving} icon={<Send size={15} />}>
              Send Message
            </Button>
          </Flex>
        }
      >
        <Form id="compose-message-form" form={form} layout="vertical" onFinish={sendMessage} initialValues={{ priority: "normal" }}>
          <Form.Item name="recipientIds" label="Recipients" rules={[{ required: true, message: "Please select at least one recipient" }]}>
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Select users" options={recipientOptions} loading={recipientsLoading} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Please enter subject" }]}>
            <Input maxLength={180} placeholder="Message subject" />
          </Form.Item>
          <Form.Item name="body" label="Message" rules={[{ required: true, message: "Please enter message" }]}>
            <Input.TextArea rows={isMobile ? 6 : 8} maxLength={5000} showCount placeholder="Write your message..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail / Thread Drawer */}
      <Drawer
        title={
          selected ? (
            <Flex align="center" gap={10}>
              <div style={iconWell("#7C3AED", 32)}>
                <MessageSquareText size={15} />
              </div>
              <Text strong style={{ fontSize: 14, maxWidth: 300 }} ellipsis>
                {getMessageSubject(selected)}
              </Text>
            </Flex>
          ) : "Message"
        }
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={detailDrawerWidth}
        styles={{ body: { padding: isMobile ? 14 : 20 } }}
      >
        {selected && (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {/* Message meta */}
            <div style={{ ...sectionPanel, padding: 14, marginBottom: 0, background: "var(--surface-soft)" }}>
              <Flex gap={6} wrap="wrap" align="center">
                <Tag color={PRIORITY_COLOR[getPriority(selected)] || "blue"} style={{ borderRadius: 99 }}>
                  {getPriority(selected).toUpperCase()}
                </Tag>
                <Tag color="geekblue" style={{ borderRadius: 99 }}>From: {getSenderName(selected)}</Tag>
                <Tag color="purple" style={{ borderRadius: 99 }}>To: {getRecipientNames(selected)}</Tag>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: "auto" }}>{formatTime(selected.createdAt)}</Text>
              </Flex>
            </div>

            {/* Thread */}
            {threadLoading ? (
              <MessageSkeleton />
            ) : (
              <List
                split={false}
                dataSource={thread.length ? thread : [selected]}
                rowKey={(item) => item._id}
                renderItem={(item) => (
                  <List.Item style={{ padding: 0, marginBottom: 10 }}>
                    <div style={{ ...sectionPanel, padding: 14, marginBottom: 0, width: "100%" }}>
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Flex vertical={isMobile} gap={8} justify="space-between" align={isMobile ? "flex-start" : "center"}>
                          <Space wrap>
                            <MessageSquareText size={15} color="#2563EB" />
                            <Text strong>{getSenderName(item)}</Text>
                            <Tag style={{ borderRadius: 99 }}>{getSenderRole(item)}</Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.createdAt)}</Text>
                        </Flex>
                        <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0, color: "var(--text-primary)" }}>
                          {getMessageBody(item)}
                        </Paragraph>
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            )}

            {/* Reply */}
            <div style={{ ...sectionPanel, marginBottom: 0 }}>
              <Text strong style={{ display: "block", marginBottom: 10, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Reply
              </Text>
              <Form form={replyForm} layout="vertical" onFinish={sendReply}>
                <Form.Item name="body" rules={[{ required: true, message: "Please enter reply" }]}>
                  <Input.TextArea rows={isMobile ? 4 : 5} maxLength={5000} showCount placeholder="Write a reply..." />
                </Form.Item>
                <Flex justify="flex-end">
                  <Button type="primary" htmlType="submit" loading={saving} icon={<Send size={15} />}>
                    Send Reply
                  </Button>
                </Flex>
              </Form>
            </div>
          </Space>
        )}
      </Drawer>
    </>
  );
};

export default MessagePage;
