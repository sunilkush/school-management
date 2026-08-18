import { useEffect, useMemo, useState } from "react";
import {
  Button, Col, Divider, Drawer,
  Empty, Flex, Form, Input, Popconfirm, Row, Select,
  Space, Spin, Table, Timeline, Typography, message,
} from "antd";
import {
  BookOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CustomerServiceOutlined, DollarOutlined, ExclamationCircleOutlined,
  HistoryOutlined, HomeOutlined, MinusCircleOutlined, PlusOutlined,
  QuestionCircleOutlined, ReadOutlined, ReloadOutlined, SearchOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import httpClient from "../../api/httpClient";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss, avatarStyle } from "../../styles/pageStyles.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const SUPPORT_PATH = "/support-tickets";

const STATUS_OPTIONS   = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const CATEGORY_OPTIONS = ["General", "Technical", "Academic", "Finance", "Transport", "Hostel", "Library", "Other"];

const STATUS_META = {
  "Open":        { color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning-light)", timeline: "orange",  icon: <ExclamationCircleOutlined /> },
  "In Progress": { color: "var(--primary)", bg: "var(--primary-light)", border: "var(--primary-light)", timeline: "blue",    icon: <ClockCircleOutlined /> },
  "Resolved":    { color: "var(--success)", bg: "var(--success-light)", border: "var(--success-light)", timeline: "green",   icon: <CheckCircleOutlined /> },
  "Closed":      { color: "var(--text-muted)", bg: "var(--background)", border: "var(--border)", timeline: "gray",    icon: <MinusCircleOutlined /> },
};

const PRIORITY_META = {
  "Low":    { color: "var(--text-secondary)", bg: "var(--surface-soft)" },
  "Medium": { color: "var(--warning-hover)", bg: "var(--warning-light)" },
  "High":   { color: "var(--orange)", bg: "rgba(var(--warning-rgb), 0.08)" },
  "Urgent": { color: "var(--danger-hover)", bg: "var(--danger-light)" },
};

const CATEGORY_META = {
  General:   { icon: <QuestionCircleOutlined />, color: "var(--purple)" },
  Technical: { icon: <ToolOutlined />,           color: "var(--info)" },
  Academic:  { icon: <BookOutlined />,            color: "var(--purple)" },
  Finance:   { icon: <DollarOutlined />,          color: "var(--success)" },
  Transport: { icon: <CarOutlined />,             color: "var(--warning)" },
  Hostel:    { icon: <HomeOutlined />,            color: "var(--pink)" },
  Library:   { icon: <ReadOutlined />,            color: "var(--accent)" },
  Other:     { icon: <CustomerServiceOutlined />, color: "var(--text-muted)" },
};

/* ─── Pill components ───────────────────────────────────────────── */
const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META["Open"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color: m.color,
      background: m.bg, border: `1px solid ${m.border}`,
      padding: "3px 10px", borderRadius: 99,
    }}>
      {m.icon} {status}
    </span>
  );
};

const PriorityPill = ({ priority }) => {
  const m = PRIORITY_META[priority] || PRIORITY_META["Medium"];
  return (
    <span style={{
      display: "inline-flex", fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg,
      padding: "3px 10px", borderRadius: 99,
    }}>
      {priority}
    </span>
  );
};

const CategoryChip = ({ category }) => {
  const m = CATEGORY_META[category] || CATEGORY_META["Other"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, color: m.color,
      background: `color-mix(in srgb, ${m.color} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${m.color} 19%, transparent)`,
      padding: "3px 10px", borderRadius: 99,
    }}>
      {m.icon} {category}
    </span>
  );
};

const STAT_LIST = [
  { key: "Open",        label: "Open",        emoji: "🔓" },
  { key: "In Progress", label: "In Progress",  emoji: "⚡" },
  { key: "Resolved",    label: "Resolved",     emoji: "✅" },
  { key: "Closed",      label: "Closed",       emoji: "🔒" },
];

/* ─── Main Component ─────────────────────────────────────────────── */
export default function SupportTicketsPage() {
  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState("");
  const [pagination,    setPagination]    = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters,       setFilters]       = useState({ status: undefined, priority: undefined, category: undefined });

  /* Drawer state */
  const [drawerTicket,   setDrawerTicket]   = useState(null);
  const [drawerLoading,  setDrawerLoading]  = useState(false);
  const [drawerDetail,   setDrawerDetail]   = useState(null);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const roleName = useSelector((s) => s.auth.user?.role?.name || "");

  /* ── Data fetching ─────────────────────────────────────────────── */
  const fetchTickets = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = {
        page, limit: pageSize,
        ...(filters.status   ? { status:   filters.status   } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      };
      const res = await httpClient.get(SUPPORT_PATH, { params });
      const payload = res.data || {};
      setTickets(payload.data || []);
      const meta = payload.meta || {};
      setPagination((p) => ({
        ...p,
        current:  Number(meta.page  || page),
        pageSize: Number(meta.limit || pageSize),
        total:    Number(meta.total || 0),
      }));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.category]);

  const openDrawer = async (ticket) => {
    setDrawerTicket(ticket);
    setDrawerDetail(null);
    setDrawerLoading(true);
    try {
      const res = await httpClient.get(`${SUPPORT_PATH}/${ticket._id}`);
      setDrawerDetail(res.data?.data || ticket);
    } catch {
      setDrawerDetail(ticket);
    } finally {
      setDrawerLoading(false);
    }
  };

  /* ── Create ────────────────────────────────────────────────────── */
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setSaving(true);
      await httpClient.post(SUPPORT_PATH, values);
      message.success("Ticket created successfully");
      setCreateOpen(false);
      createForm.resetFields();
      fetchTickets(1, pagination.pageSize);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  /* ── Update ────────────────────────────────────────────────────── */
  const openUpdateModal = (ticket) => {
    setEditingTicket(ticket);
    updateForm.setFieldsValue({
      title: ticket.title, description: ticket.description,
      category: ticket.category, priority: ticket.priority,
      status: ticket.status, note: "",
    });
  };

  const handleUpdate = async () => {
    if (!editingTicket?._id) return;
    try {
      const values = await updateForm.validateFields();
      setSaving(true);
      const { status, note, ...rest } = values;
      await httpClient.patch(`${SUPPORT_PATH}/${editingTicket._id}`, rest);
      if (status && status !== editingTicket.status) {
        await httpClient.patch(`${SUPPORT_PATH}/${editingTicket._id}/status`, { status, note: note || "" });
      }
      message.success("Ticket updated");
      setEditingTicket(null);
      fetchTickets(pagination.current, pagination.pageSize);
      if (drawerTicket?._id === editingTicket._id) openDrawer({ ...editingTicket, status });
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── Resolve ───────────────────────────────────────────────────── */
  const handleResolve = async (ticketId) => {
    try {
      await httpClient.patch(`${SUPPORT_PATH}/${ticketId}/resolve`, { note: "Resolved" });
      message.success("Ticket resolved");
      fetchTickets(pagination.current, pagination.pageSize);
      if (drawerTicket?._id === ticketId) {
        openDrawer({ ...drawerTicket, status: "Resolved" });
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Resolve failed");
    }
  };

  /* ── Counts ────────────────────────────────────────────────────── */
  const counts = useMemo(() => {
    const c = {};
    tickets.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tickets]);

  /* ── Search filter (client-side on current page) ───────────────── */
  const visibleTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      t.title?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.createdBy?.name?.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  /* ── Columns ───────────────────────────────────────────────────── */
  const columns = [
    {
      title: "Ticket",
      dataIndex: "title",
      key: "title",
      render: (title, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            #{r._id?.slice(-6)} · {dayjs(r.createdAt).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (v) => <CategoryChip category={v} />,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (v) => <PriorityPill priority={v} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (v) => <StatusPill status={v} />,
    },
    {
      title: "Raised By",
      dataIndex: ["createdBy", "name"],
      key: "raisedBy",
      width: 140,
      render: (_, r) => {
        const name = r?.createdBy?.name || "Unknown";
        const av = avatarStyle(name, 28);
        return (
          <Flex align="center" gap={7}>
            <div style={av}>{name[0]?.toUpperCase()}</div>
            <Text style={{ fontSize: 12 }}>{name}</Text>
          </Flex>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" onClick={() => openDrawer(r)}>View</Button>
          <Button size="small" onClick={() => openUpdateModal(r)}>Edit</Button>
        </Space>
      ),
    },
  ];

  /* ── Ticket Detail Drawer ──────────────────────────────────────── */
  const detail   = drawerDetail || drawerTicket;
  const statMeta = STATUS_META[detail?.status] || STATUS_META["Open"];
  const catMeta  = CATEGORY_META[detail?.category] || CATEGORY_META["Other"];

  const timelineItems = useMemo(() => {
    if (!detail?.updates?.length) return [];
    return [...detail.updates].reverse().map((u) => ({
      color: "blue",
      children: (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            {u.note || "Status updated"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {u.updatedBy?.name ? `by ${u.updatedBy.name} · ` : ""}{dayjs(u.updatedAt).format("DD MMM YYYY, HH:mm")}
          </div>
        </div>
      ),
    }));
  }, [detail]);

  return (
    <>
      <style>{tableHeadCss("support-tbl")}</style>

      <PageHeader
        title="Support Tickets"
        subtitle={`${roleName || "User"} — create, track and resolve support tickets`}
        icon={<CustomerServiceOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => fetchTickets(pagination.current, pagination.pageSize)} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              New Ticket
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {STAT_LIST.map((s) => {
            const m = STATUS_META[s.key];
            const active = filters.status === s.key;
            return (
              <Col xs={12} sm={6} key={s.key}>
                <div
                  onClick={() => setFilters((f) => ({ ...f, status: f.status === s.key ? undefined : s.key }))}
                  style={{
                    background: active ? m.bg : "var(--surface)",
                    border: `1px solid ${active ? m.border : "var(--border-muted)"}`,
                    borderTop: `4px solid ${m.color}`,
                    borderRadius: 14, padding: "14px 18px",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    boxShadow: active ? `0 4px 16px ${m.color}22` : "none",
                  }}
                >
                  <Flex align="center" gap={12}>
                    <div style={{ fontSize: 26 }}>{s.emoji}</div>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>
                        {counts[s.key] || 0}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
                        {s.label}
                      </div>
                    </div>
                  </Flex>
                </div>
              </Col>
            );
          })}
        </Row>

        {/* ── Filter + Search bar ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, padding: "12px 16px", marginBottom: 16 }}>
          <Flex gap={8} wrap="wrap" align="center" justify="space-between">
            <Flex gap={8} wrap="wrap" align="center">
              <Input
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                placeholder="Search tickets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 200 }}
              />
              <Select
                allowClear placeholder="Status"
                style={{ width: 140 }}
                options={STATUS_OPTIONS.map((v) => ({ label: v, value: v }))}
                value={filters.status}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              />
              <Select
                allowClear placeholder="Priority"
                style={{ width: 130 }}
                options={PRIORITY_OPTIONS.map((v) => ({ label: v, value: v }))}
                value={filters.priority}
                onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
              />
              <Select
                allowClear placeholder="Category"
                style={{ width: 140 }}
                options={CATEGORY_OPTIONS.map((v) => ({ label: v, value: v }))}
                value={filters.category}
                onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              />
              {(filters.status || filters.priority || filters.category || search) && (
                <Button size="small" onClick={() => { setFilters({ status: undefined, priority: undefined, category: undefined }); setSearch(""); }}>
                  Clear All
                </Button>
              )}
            </Flex>
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {visibleTickets.length} of {pagination.total} tickets
            </Text>
          </Flex>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Table
            className="support-tbl"
            rowKey="_id"
            columns={columns}
            loading={loading}
            dataSource={visibleTickets}
            scroll={{ x: 760 }}
            onRow={(r) => ({ onClick: () => openDrawer(r), style: { cursor: "pointer" } })}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: (t) => `${t} tickets`,
              onChange: (page, ps) => fetchTickets(page, ps),
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No tickets found"
                  style={{ padding: "40px 0" }}
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ── Ticket Detail Drawer ────────────────────────────────── */}
      <Drawer
        open={Boolean(drawerTicket)}
        onClose={() => { setDrawerTicket(null); setDrawerDetail(null); }}
        width={480}
        title={
          <Flex align="center" gap={10}>
            <div style={iconWell(catMeta?.color || "var(--purple)", 36)}>
              {catMeta?.icon || <CustomerServiceOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3, maxWidth: 340, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {detail?.title || "Ticket"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                #{detail?._id?.slice(-6)} · {dayjs(detail?.createdAt).format("DD MMM YYYY")}
              </div>
            </div>
          </Flex>
        }
        footer={
          detail?.status !== "Resolved" && detail?.status !== "Closed" ? (
            <Flex gap={8} justify="flex-end">
              <Button onClick={() => { setDrawerTicket(null); openUpdateModal(detail); }}>
                Edit Ticket
              </Button>
              <Popconfirm title="Mark as resolved?" onConfirm={() => handleResolve(detail._id)}>
                <Button type="primary" icon={<CheckCircleOutlined />}>
                  Mark Resolved
                </Button>
              </Popconfirm>
            </Flex>
          ) : null
        }
      >
        {drawerLoading ? (
          <Flex justify="center" align="center" style={{ height: 200 }}>
            <Spin />
          </Flex>
        ) : detail ? (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>

            {/* Status + Priority + Category pills */}
            <Flex gap={8} wrap="wrap">
              <StatusPill status={detail.status} />
              <PriorityPill priority={detail.priority} />
              <CategoryChip category={detail.category} />
            </Flex>

            {/* Created by */}
            {detail.createdBy && (
              <Flex align="center" gap={8}>
                <div style={avatarStyle(detail.createdBy.name || "U", 32)}>
                  {detail.createdBy.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                    {detail.createdBy.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {detail.createdBy.email || ""}
                  </div>
                </div>
              </Flex>
            )}

            <Divider style={{ margin: 0 }} />

            {/* Description */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Description
              </div>
              <Paragraph style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>
                {detail.description || "No description provided."}
              </Paragraph>
            </div>

            {/* Resolved info */}
            {detail.status === "Resolved" && detail.resolvedBy && (
              <div style={{ background: "var(--success-light)", border: "1px solid var(--success-light)", borderRadius: 10, padding: "10px 14px" }}>
                <Flex align="center" gap={6}>
                  <CheckCircleOutlined style={{ color: "var(--success)" }} />
                  <Text style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                    Resolved by {detail.resolvedBy?.name || "Admin"} · {dayjs(detail.resolvedAt).format("DD MMM YYYY")}
                  </Text>
                </Flex>
              </div>
            )}

            {/* Timeline */}
            {timelineItems.length > 0 && (
              <>
                <Divider style={{ margin: 0 }} />
                <div>
                  <Flex align="center" gap={6} style={{ marginBottom: 12 }}>
                    <HistoryOutlined style={{ color: "var(--text-muted)" }} />
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Activity
                    </Text>
                  </Flex>
                  <Timeline items={timelineItems} />
                </div>
              </>
            )}
          </Space>
        ) : null}
      </Drawer>

      {/* ── Create Modal ─────────────────────────────────────────── */}
      {createOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1050,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setCreateOpen(false); }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 16,
            width: "100%", maxWidth: 540,
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-muted)" }}>
              <Flex align="center" gap={12}>
                <div style={iconWell("var(--primary)", 38)}>
                  <PlusOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Create Support Ticket</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Describe your issue and we'll help you resolve it</div>
                </div>
              </Flex>
            </div>

            {/* Form */}
            <div style={{ padding: "20px 24px" }}>
              <Form layout="vertical" form={createForm}>
                <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
                  <Input placeholder="Brief summary of the issue" maxLength={180} size="large" />
                </Form.Item>
                <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
                  <TextArea rows={4} placeholder="Describe the issue in detail…" maxLength={5000} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={12}>
                    <Form.Item name="category" label="Category" initialValue="General">
                      <Select options={CATEGORY_OPTIONS.map((v) => ({
                        label: (
                          <Flex align="center" gap={6}>
                            <span style={{ color: CATEGORY_META[v]?.color }}>{CATEGORY_META[v]?.icon}</span>
                            {v}
                          </Flex>
                        ), value: v,
                      }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item name="priority" label="Priority" initialValue="Medium">
                      <Select options={PRIORITY_OPTIONS.map((v) => ({
                        label: <span style={{ color: PRIORITY_META[v]?.color, fontWeight: 600 }}>{v}</span>,
                        value: v,
                      }))} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border-muted)" }}>
              <Flex gap={8} justify="flex-end">
                <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="primary" loading={saving} onClick={handleCreate} icon={<PlusOutlined />}>
                  Submit Ticket
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────── */}
      {Boolean(editingTicket) && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1050,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTicket(null); }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 16,
            width: "100%", maxWidth: 560,
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-muted)" }}>
              <Flex align="center" gap={12}>
                <div style={iconWell("var(--purple)", 38)}>
                  <CustomerServiceOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Update Ticket</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    #{editingTicket._id?.slice(-6)} · {editingTicket.title?.slice(0, 40)}
                  </div>
                </div>
              </Flex>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <Form layout="vertical" form={updateForm}>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                  <Input maxLength={180} />
                </Form.Item>
                <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                  <TextArea rows={3} maxLength={5000} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={8}>
                    <Form.Item name="category" label="Category">
                      <Select options={CATEGORY_OPTIONS.map((v) => ({ label: v, value: v }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="priority" label="Priority">
                      <Select options={PRIORITY_OPTIONS.map((v) => ({
                        label: <span style={{ color: PRIORITY_META[v]?.color, fontWeight: 600 }}>{v}</span>,
                        value: v,
                      }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={8}>
                    <Form.Item name="status" label="Status">
                      <Select options={STATUS_OPTIONS.map((v) => ({
                        label: <StatusPill status={v} />, value: v,
                      }))} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="note" label="Update Note (Optional)">
                  <TextArea rows={2} maxLength={1000} placeholder="Describe this update…" />
                </Form.Item>
              </Form>
            </div>

            <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border-muted)" }}>
              <Flex gap={8} justify="flex-end">
                <Button onClick={() => setEditingTicket(null)}>Cancel</Button>
                <Button type="primary" loading={saving} onClick={handleUpdate}>
                  Save Changes
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
