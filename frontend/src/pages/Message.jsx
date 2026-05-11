import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { Archive, Mail, MailOpen, RefreshCw, Send, Trash2 } from "lucide-react";
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

const MessagePage = () => {
  const [form] = Form.useForm();
  const [replyForm] = Form.useForm();
  const dispatch = useDispatch();
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
  const dispatch = useDispatch();

  const canUseMessages = MESSAGE_ROLES.includes(roleName);

  const recipientOptions = useMemo(
    () =>
      recipients.map((recipient) => ({
        value: recipient._id,
        label: `${recipient.name} (${recipient.role}${recipient.email ? ` • ${recipient.email}` : ""})`,
      })),
    [recipients]
  );

  const stats = useMemo(() => {
    const unread = rows.filter((row) => !row.isRead && mailbox === "inbox").length;
    const urgent = rows.filter((row) => row.priority === "urgent" || row.priority === "high").length;
    return { total: rows.length, unread, urgent };
  }, [mailbox, rows]);

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

    try {
      await dispatch(createMessage({
        subject: selected.subject?.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
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
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={12}>
            <Space direction="vertical" size={2}>
              <Title level={3} style={{ margin: 0 }}>Message Center</Title>
              <Text type="secondary">Secure role-wise inbox, sent mail, replies, and archive for every application role.</Text>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Button icon={<RefreshCw size={16} />} onClick={loadMessages}>Refresh</Button>
              <Button type="primary" icon={<Send size={16} />} onClick={() => setComposeOpen(true)}>Compose</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Messages" value={stats.total} prefix={<Mail size={18} />} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Unread" value={stats.unread} prefix={<MailOpen size={18} />} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="High Priority" value={stats.urgent} /></Card></Col>
      </Row>

      <Card>
        <Row gutter={[12, 12]} justify="space-between">
          <Col xs={24} lg={14}>
            <Tabs
              activeKey={mailbox}
              onChange={setMailbox}
              items={[
                { key: "inbox", label: "Inbox" },
                { key: "sent", label: "Sent" },
                { key: "archive", label: "Archive" },
              ]}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Input.Search
              allowClear
              enterButton
              placeholder="Search subject or message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onSearch={loadMessages}
            />
          </Col>
        </Row>
      </Card>

      <Card title={`${mailbox.charAt(0).toUpperCase()}${mailbox.slice(1)} Messages`}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
        ) : rows.length === 0 ? (
          <Empty description="No messages found" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={rows}
            renderItem={(item) => (
              <List.Item
                key={item._id}
                onClick={() => openMessage(item)}
                style={{ cursor: "pointer", background: item.isRead ? "transparent" : "#f6ffed", paddingInline: 12, borderRadius: 8 }}
                actions={[
                  mailbox !== "archive" ? (
                    <Button key="archive" type="link" icon={<Archive size={14} />} onClick={(event) => { event.stopPropagation(); archiveSelected(item); }}>Archive</Button>
                  ) : null,
                  <Popconfirm key="delete" title="Remove this message from your mailbox?" onConfirm={(event) => { event?.stopPropagation?.(); deleteSelected(item); }}>
                    <Button type="link" danger icon={<Trash2 size={14} />} onClick={(event) => event.stopPropagation()}>Remove</Button>
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Space wrap>
                    {!item.isRead && mailbox === "inbox" ? <Badge status="processing" /> : null}
                    <Text strong={!item.isRead}>{item.subject}</Text>
                    <Tag color={priorityColor[item.priority] || "blue"}>{item.priority}</Tag>
                    <Tag>{mailbox === "sent" ? `To: ${item.recipientNames.join(", ")}` : `From: ${item.senderName}`}</Tag>
                  </Space>
                  <Text type="secondary" ellipsis>{item.body}</Text>
                  <Text type="secondary">{formatTime(item.createdAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Drawer title="Compose Message" open={composeOpen} onClose={() => setComposeOpen(false)} width={620} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={sendMessage} initialValues={{ priority: "normal" }}>
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
            <Input.TextArea rows={7} maxLength={5000} showCount placeholder="Write your message..." />
          </Form.Item>
          <Space style={{ justifyContent: "flex-end", width: "100%" }}>
            <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={<Send size={16} />}>Send Message</Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer title={selected?.subject || "Message"} open={Boolean(selected)} onClose={() => setSelected(null)} width={720}>
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color={priorityColor[selected.priority] || "blue"}>{selected.priority}</Tag>
              <Tag>From: {selected.senderName}</Tag>
              <Tag>To: {selected.recipientNames.join(", ")}</Tag>
              <Text type="secondary">{formatTime(selected.createdAt)}</Text>
            </Space>

            {threadLoading ? <Spin /> : (
              <List
                dataSource={thread.length ? thread : [selected]}
                renderItem={(item) => (
                  <List.Item key={item._id}>
                    <Space direction="vertical" size={6} style={{ width: "100%" }}>
                      <Space wrap>
                        <Text strong>{item.senderName}</Text>
                        <Tag>{item.senderRole}</Tag>
                        <Text type="secondary">{formatTime(item.createdAt)}</Text>
                      </Space>
                      <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{item.body}</Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            )}

            <Card title="Reply">
              <Form form={replyForm} layout="vertical" onFinish={sendReply}>
                <Form.Item name="body" rules={[{ required: true, message: "Please enter reply" }]}>
                  <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Write a reply..." />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={saving} icon={<Send size={16} />}>Send Reply</Button>
              </Form>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
};

export default MessagePage;