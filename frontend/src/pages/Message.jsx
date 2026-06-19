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
  Statistic,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
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

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const MESSAGE_ROLES = [
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
  "Support Staff",
  "Subject Coordinator",
  "Hostel Warden",
  "Transport Manager",
  "Exam Coordinator",
  "IT Support",
  "Counselor",
  "Security",
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const priorityColor = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red",
};

const pageStyles = {
  card: {
    borderRadius: 20,
    border: "1px solid #edf1f7",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
  },
  mutedCard: {
    borderRadius: 20,
    border: "1px solid #edf1f7",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
  },
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
  <Space direction="vertical" size={12} style={{ width: "100%" }}>
    {[1, 2, 3].map((item) => (
      <Card key={item} style={{ borderRadius: 16 }}>
        <Skeleton active avatar paragraph={{ rows: 2 }} title={{ width: "55%" }} />
      </Card>
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

  const statCards = useMemo(
    () => [
      {
        title: "Messages",
        value: stats.total,
        icon: <Mail size={22} />,
        color: "#5B9EC9",
        background: "#eaf3ff",
      },
      {
        title: "Unread",
        value: stats.unread,
        icon: <MailOpen size={22} />,
        color: "#5BA89A",
        background: "#eefbea",
      },
      {
        title: "High Priority",
        value: stats.urgent,
        icon: <Badge status="error" />,
        color: "#fa541c",
        background: "#fff1e8",
      },
    ],
    [stats]
  );

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

    const recipientIds = [selected.senderId?._id, ...(selected.recipientIds || []).map((recipient) => recipient?._id)]
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
    <Flex gap={8} wrap="wrap" justify={isMobile ? "space-between" : "flex-end"} style={{ width: isMobile ? "100%" : undefined }}>
      {mailbox !== "archive" ? (
        <Button
          block={isMobile}
          icon={<Archive size={15} />}
          onClick={(event) => {
            event.stopPropagation();
            archiveSelected(item);
          }}
        >
          Archive
        </Button>
      ) : null}
      <Popconfirm
        title="Remove this message from your mailbox?"
        okText="Remove"
        okButtonProps={{ danger: true }}
        onConfirm={(event) => {
          event?.stopPropagation?.();
          deleteSelected(item);
        }}
      >
        <Button
          block={isMobile}
          danger
          icon={<Trash2 size={15} />}
          onClick={(event) => event.stopPropagation()}
        >
          Remove
        </Button>
      </Popconfirm>
    </Flex>
  );

  if (!canUseMessages) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Message access not available for your role"
        description="Please contact the administrator to enable the communication module for your role."
      />
    );
  }

  return (
    <Space direction="vertical" size={18} style={{ width: "100%", padding: "24px" }}>
      <Card style={pageStyles.mutedCard} styles={{ body: { padding: isMobile ? 18 : 24 } }}>
        <Flex vertical={isMobile} gap={16} align={isMobile ? "stretch" : "center"} justify="space-between">
          <Space direction="vertical" size={4} style={{ maxWidth: 720 }}>
            <Text type="secondary" style={{ fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Communication Hub
            </Text>
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              Message Center
            </Title>
            <Text type="secondary">
              Secure role-wise inbox, sent mail, replies, and archive for every application role.
            </Text>
          </Space>
          <Flex vertical={isMobile} gap={10} style={{ width: isMobile ? "100%" : undefined }}>
            <Button block={isMobile} icon={<RefreshCw size={16} />} onClick={loadMessages} loading={loading}>
              Refresh
            </Button>
            <Button block={isMobile} type="primary" icon={<Send size={16} />} onClick={() => setComposeOpen(true)}>
              Compose
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map((stat) => (
          <Col xs={24} md={8} key={stat.title}>
            <Card style={pageStyles.card} styles={{ body: { padding: 20 } }}>
              <Flex align="center" gap={16}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 48,
                    height: 48,
                    color: stat.color,
                    background: stat.background,
                    borderRadius: 16,
                  }}
                >
                  {stat.icon}
                </Flex>
                <Statistic title={stat.title} value={stat.value} valueStyle={{ fontWeight: 800 }} />
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={pageStyles.card} styles={{ body: { padding: isMobile ? 14 : 18 } }}>
        <Flex vertical={isMobile} gap={12} align={isMobile ? "stretch" : "center"} justify="space-between">
          <Tabs
            activeKey={mailbox}
            onChange={setMailbox}
            style={{ width: isMobile ? "100%" : "auto",display: "flex", flexWrap: "wrap", gap: isMobile ? 12 : 24 }}
            tabBarGutter={isMobile ? 12 : 24}
            items={[
              { key: "inbox", label: "Inbox", icon: <Inbox size={15} /> },
              { key: "sent", label: "Sent", icon: <Send size={15} /> },
              { key: "archive", label: "Archive", icon: <Archive size={15} /> },
            ]}
          />
          <Input.Search
            allowClear
            enterButton={isMobile ? <Search size={16} /> : "Search"}
            placeholder="Search subject or message"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={loadMessages}
            style={{ width: isMobile ? "100%" : isTablet ? 320 : 420 }}
          />
        </Flex>
      </Card>

      <Card
        title={`${mailbox.charAt(0).toUpperCase()}${mailbox.slice(1)} Messages`}
        extra={<Text type="secondary">{stats.total} total</Text>}
        style={pageStyles.card}
        styles={{ body: { padding: isMobile ? 12 : 18 } }}
      >
        {loading ? (
          <MessageSkeleton />
        ) : rows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No messages found"
            style={{ padding: isMobile ? "36px 12px" : "56px 16px" }}
          />
        ) : (
          <List
            itemLayout="vertical"
            split={false}
            dataSource={rows}
            rowKey={(item) => item._id}
            renderItem={(item) => {
              const priority = getPriority(item);
              const isUnreadInbox = !item.isRead && mailbox === "inbox";

              return (
                <List.Item style={{ padding: 0, marginBottom: 14 }}>
                  <Card
                    hoverable
                    onClick={() => openMessage(item)}
                    style={{
                      borderRadius: 18,
                      cursor: "pointer",
                      border: isUnreadInbox ? "1px solid rgba(184,224,210,0.5)" : "1px solid #eef2f7",
                      borderLeft: isUnreadInbox ? "5px solid #5BA89A" : "1px solid #eef2f7",
                      background: isUnreadInbox ? "linear-gradient(135deg, rgba(184,224,210,0.15) 0%, #ffffff 72%)" : "#ffffff",
                    }}
                    styles={{ body: { padding: isMobile ? 14 : 18 } }}
                  >
                    <Flex vertical gap={14}>
                      <Flex vertical={isMobile} gap={12} justify="space-between" align={isMobile ? "stretch" : "flex-start"}>
                        <Space direction="vertical" size={8} style={{ minWidth: 0, flex: 1 }}>
                          <Flex gap={8} align="center" wrap="wrap">
                            {isUnreadInbox ? <Badge status="processing" /> : null}
                            <Text strong={isUnreadInbox} style={{ fontSize: 16 }} ellipsis>
                              {getMessageSubject(item)}
                            </Text>
                          </Flex>
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                            {getMessageBody(item)}
                          </Paragraph>
                        </Space>
                        {renderMessageActions(item)}
                      </Flex>
                      <Flex gap={8} wrap="wrap" align="center">
                        <Tag color={priorityColor[priority] || "blue"}>{priority.toUpperCase()}</Tag>
                        <Tag color={mailbox === "sent" ? "purple" : "geekblue"}>
                          {mailbox === "sent" ? `To: ${getRecipientNames(item)}` : `From: ${getSenderName(item)}`}
                        </Tag>
                        <Text type="secondary">{formatTime(item.createdAt)}</Text>
                      </Flex>
                    </Flex>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Drawer
        title="Compose Message"
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        width={composeDrawerWidth}
        destroyOnClose
        styles={{ body: { padding: isMobile ? 16 : 24 }, footer: { padding: 16 } }}
        footer={
          <Flex vertical={isMobile} gap={10} justify="flex-end">
            <Button block={isMobile} onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button block={isMobile} type="primary" htmlType="submit" form="compose-message-form" loading={saving} icon={<Send size={16} />}>
              Send Message
            </Button>
          </Flex>
        }
      >
        <Form id="compose-message-form" form={form} layout="vertical" onFinish={sendMessage} initialValues={{ priority: "normal" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
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
          </Space>
        </Form>
      </Drawer>

      <Drawer
        title={selected ? getMessageSubject(selected) : "Message"}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={detailDrawerWidth}
        styles={{ body: { padding: isMobile ? 16 : 24 } }}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card style={pageStyles.mutedCard} styles={{ body: { padding: 16 } }}>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Flex gap={8} wrap="wrap" align="center">
                  <Tag color={priorityColor[getPriority(selected)] || "blue"}>{getPriority(selected).toUpperCase()}</Tag>
                  <Tag color="geekblue">From: {getSenderName(selected)}</Tag>
                  <Tag color="purple">To: {getRecipientNames(selected)}</Tag>
                </Flex>
                <Text type="secondary">{formatTime(selected.createdAt)}</Text>
              </Space>
            </Card>

            {threadLoading ? (
              <MessageSkeleton />
            ) : (
              <List
                split={false}
                dataSource={thread.length ? thread : [selected]}
                rowKey={(item) => item._id}
                renderItem={(item) => (
                  <List.Item style={{ padding: 0, marginBottom: 12 }}>
                    <Card style={{ borderRadius: 18, border: "1px solid #eef2f7" }} styles={{ body: { padding: 16 } }}>
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <Flex vertical={isMobile} gap={8} justify="space-between" align={isMobile ? "flex-start" : "center"}>
                          <Space wrap>
                            <MessageSquareText size={16} color="#5B9EC9" />
                            <Text strong>{getSenderName(item)}</Text>
                            <Tag>{getSenderRole(item)}</Tag>
                          </Space>
                          <Text type="secondary">{formatTime(item.createdAt)}</Text>
                        </Flex>
                        <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                          {getMessageBody(item)}
                        </Paragraph>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            )}

            <Card title="Reply" style={pageStyles.card} styles={{ body: { padding: isMobile ? 14 : 18 } }}>
              <Form form={replyForm} layout="vertical" onFinish={sendReply}>
                <Form.Item name="body" rules={[{ required: true, message: "Please enter reply" }]}>
                  <Input.TextArea rows={isMobile ? 4 : 5} maxLength={5000} showCount placeholder="Write a reply..." />
                </Form.Item>
                <Flex justify="flex-end">
                  <Button block={isMobile} type="primary" htmlType="submit" loading={saving} icon={<Send size={16} />}>
                    Send Reply
                  </Button>
                </Flex>
              </Form>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
};

export default MessagePage;
