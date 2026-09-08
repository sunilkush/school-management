import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Drawer, Empty, Form, Input, Modal, Popconfirm,
  Progress, Select, Spin, Switch, Table, Tabs, Tag, Tooltip, message,
} from "antd";
import {
  FileTextOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined, SendOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  archiveCircular, clearCurrent, createCircular, deleteCircular,
  fetchAcknowledgements, fetchCircular, fetchCirculars, fetchPending, publishCircular, updateCircular,
} from "../../features/circularSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { TextArea } = Input;

const CATEGORIES = ["Academic", "Fee", "Event", "Policy", "Holiday", "Safety", "Examination", "General"];
const ROLES = ["Teacher", "Class Teacher", "Parent", "Student", "Accountant", "Librarian", "Transport Manager", "Hostel Warden", "Receptionist", "Support Staff"];

const STATUS_COLOR = { draft: "var(--text-muted)", published: "var(--success)", archived: "var(--text-secondary)" };

const CircularsPage = () => {
  const dispatch = useDispatch();
  const { circulars, loading, current, currentLoading, pending, acknowledgements, actionLoading } =
    useSelector((s) => s.circular || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [drawerTab, setDrawerTab] = useState("done");
  const [statusFilter, setStatusFilter] = useState();
  const [search, setSearch] = useState("");

  const load = () => {
    dispatch(fetchCirculars({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }));
  };

  useEffect(() => {
    load();
    dispatch(fetchSchoolClasses({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter]);

  const openEditor = (circular = null) => {
    setEditing(circular);
    form.resetFields();
    if (circular) {
      form.setFieldsValue({
        ...circular,
        roles: circular.audience?.roles || [],
        schoolClassIds: circular.audience?.schoolClassIds || [],
        acknowledgementDeadline: circular.acknowledgementDeadline ? dayjs(circular.acknowledgementDeadline) : null,
      });
    } else {
      form.setFieldsValue({
        category: "General",
        requiresAcknowledgement: false,
        acknowledgementText: "I have read and understood this circular.",
      });
    }
    setModalOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    const payload = {
      title: values.title,
      body: values.body,
      category: values.category,
      requiresAcknowledgement: values.requiresAcknowledgement,
      acknowledgementText: values.acknowledgementText,
      acknowledgementDeadline: values.acknowledgementDeadline ? values.acknowledgementDeadline.toISOString() : null,
      audience: { roles: values.roles || [], schoolClassIds: values.schoolClassIds || [], sectionIds: [], userIds: [] },
    };
    const res = await dispatch(editing ? updateCircular({ id: editing._id, ...payload }) : createCircular(payload));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editing ? "Draft updated" : "Saved as a draft");
      setModalOpen(false);
      load();
    } else {
      message.error(res.payload || "Could not save");
    }
  };

  const publish = async (circular) => {
    const res = await dispatch(publishCircular(circular._id));
    if (publishCircular.fulfilled.match(res)) {
      message.success(`Published as ${res.payload?.circularNumber} to ${res.payload?.recipientCount} recipient(s)`);
      load();
    } else {
      message.error(res.payload || "Could not publish");
    }
  };

  const archive = async (circular) => {
    const res = await dispatch(archiveCircular(circular._id));
    if (archiveCircular.fulfilled.match(res)) { message.success("Archived"); load(); }
    else message.error(res.payload || "Could not archive");
  };

  const remove = async (circular) => {
    const res = await dispatch(deleteCircular(circular._id));
    if (deleteCircular.fulfilled.match(res)) { message.success("Draft deleted"); load(); }
    else message.error(res.payload || "Could not delete");
  };

  const openDrawer = (circular) => {
    setOpenId(circular._id);
    setDrawerTab("done");
    dispatch(fetchCircular(circular._id));
    dispatch(fetchAcknowledgements(circular._id));
    dispatch(fetchPending(circular._id));
  };

  const columns = [
    {
      title: "Circular", dataIndex: "title",
      render: (title, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {r.isPinned && <PushpinOutlined style={{ marginRight: 6, color: "var(--warning)" }} />}
            {title}
            {r.supersededById && <Tag color="orange" style={{ marginLeft: 8 }}>superseded</Tag>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.circularNumber ? `${r.circularNumber} · ` : ""}{r.category}
            {r.publishedAt ? ` · ${dayjs(r.publishedAt).format("D MMM YYYY")}` : ""}
            {r.recipientCount ? ` · ${r.recipientCount} recipients` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Acknowledgement", width: 210,
      render: (_, r) => {
        if (!r.requiresAcknowledgement) {
          return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>not required</span>;
        }
        if (!r.ack) return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>;
        return (
          <div>
            <Progress
              percent={r.ack.percentAcknowledged}
              size="small"
              status={r.ack.isOverdue ? "exception" : r.ack.percentAcknowledged === 100 ? "success" : "active"}
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {r.ack.acknowledged} of {r.ack.total}
              {r.ack.viewed > r.ack.acknowledged ? ` · ${r.ack.viewed} opened` : ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (s) => <span style={pill(STATUS_COLOR[s])}>{s}</span>,
    },
    {
      title: "", width: 250, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {r.status === "draft" && (
            <>
              <Button size="small" onClick={() => openEditor(r)}>Edit</Button>
              <Popconfirm
                title="Publish this circular?"
                description="Once published the wording cannot be changed — a correction has to be a new circular."
                onConfirm={() => publish(r)}
              >
                <Button size="small" type="primary" icon={<SendOutlined />}>Publish</Button>
              </Popconfirm>
              <Popconfirm title="Delete this draft?" onConfirm={() => remove(r)}>
                <Button size="small" danger>Delete</Button>
              </Popconfirm>
            </>
          )}
          {r.status === "published" && (
            <>
              <Button size="small" onClick={() => openDrawer(r)}>Who has read it</Button>
              <Button size="small" onClick={() => archive(r)}>Archive</Button>
            </>
          )}
          {r.status === "archived" && (
            <Button size="small" onClick={() => openDrawer(r)}>View</Button>
          )}
        </div>
      ),
    },
  ];

  const overdue = (circulars || []).filter((c) => c.ack?.isOverdue);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("cir-table")}</style>

      <PageHeader
        title="Circulars"
        subtitle="Numbered notices, and the record of who has read them"
        icon={<FileTextOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Input.Search
              allowClear placeholder="Search title, number or text" style={{ width: 260 }}
              value={search} onChange={(e) => setSearch(e.target.value)} onSearch={load}
            />
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>New circular</Button>
          </div>
        }
      />

      {overdue.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16, borderRadius: 14 }}
          message={`${overdue.length} circular(s) are past their acknowledgement deadline`}
          description={overdue.map((c) => `${c.circularNumber || c.title} — ${c.ack.pending} still to acknowledge`).join("; ")}
        />
      )}

      <div style={{ ...sectionPanel, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Select
          allowClear placeholder="All statuses" style={{ width: 170 }}
          value={statusFilter} onChange={setStatusFilter}
          options={["draft", "published", "archived"].map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div style={sectionPanel}>
        {loading && !circulars?.length ? (
          <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
        ) : !circulars?.length ? (
          <div style={emptyState}>
            <Empty description="No circulars yet" />
            <p style={{ color: "var(--text-muted)", maxWidth: 500, margin: "12px auto" }}>
              A circular gets a number when it is published, goes to a fixed list of people, and can
              ask each of them to confirm they have read it.
            </p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>Write the first one</Button>
          </div>
        ) : (
          <div style={tableContainer}>
            <Table
              className="cir-table" rowKey="_id" size="middle"
              columns={columns} dataSource={circulars}
              pagination={{ pageSize: 20, showSizeChanger: false }}
            />
          </div>
        )}
      </div>

      {/* ── Write / edit ── */}
      <Modal
        open={modalOpen} width={720}
        title={editing ? "Edit draft" : "New circular"}
        onCancel={() => setModalOpen(false)} onOk={save}
        confirmLoading={actionLoading} okText={editing ? "Save draft" : "Save as draft"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="Revised transport timings" />
            </Form.Item>
            <Form.Item name="category" label="Category" style={{ width: 170 }}>
              <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
          </div>

          <Form.Item name="body" label="Text" rules={[{ required: true }]}>
            <TextArea rows={6} />
          </Form.Item>

          <div style={{ fontWeight: 700, marginBottom: 4 }}>Who it goes to</div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 0 }}>
            Leave both blank to reach the whole school. Picking classes alone reaches those children
            <b> and their parents</b>; adding roles narrows it — &ldquo;Parent&rdquo; plus a class means the
            parents of that class only.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="roles" label="Roles" style={{ flex: 1 }}>
              <Select mode="multiple" allowClear placeholder="Everyone"
                      options={ROLES.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
            <Form.Item name="schoolClassIds" label="Classes" style={{ flex: 1 }}>
              <Select mode="multiple" allowClear placeholder="All classes" optionFilterProp="label"
                      options={schoolClasses.map((c) => ({ value: c._id, label: c.name }))} />
            </Form.Item>
          </div>

          <Form.Item
            name="requiresAcknowledgement" label="Ask each person to confirm they have read it"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(a, b) => a.requiresAcknowledgement !== b.requiresAcknowledgement}>
            {({ getFieldValue }) => getFieldValue("requiresAcknowledgement") ? (
              <>
                <Form.Item
                  name="acknowledgementText" label="What they are confirming"
                  extra="Copied onto each person's record, so it stays exactly as written here."
                >
                  <Input />
                </Form.Item>
                <Form.Item name="acknowledgementDeadline" label="By when">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </>
            ) : null}
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Who has read it ── */}
      <Drawer
        width={620} open={!!openId}
        onClose={() => { setOpenId(null); dispatch(clearCurrent()); }}
        title={current?.circularNumber || current?.title || "Circular"}
      >
        {currentLoading && !current ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : current ? (
          <>
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{current.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{current.body}</div>
            </div>

            {current.requiresAcknowledgement && (
              <Alert
                type="info" showIcon style={{ marginBottom: 16 }}
                message="Opened is not the same as acknowledged"
                description={`Everyone here was sent the circular. "Opened" means they looked at it; "acknowledged" means they pressed the button confirming: "${current.acknowledgementText}"`}
              />
            )}

            <Tabs
              activeKey={drawerTab}
              onChange={setDrawerTab}
              items={[
                {
                  key: "done",
                  label: `Acknowledged (${acknowledgements?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey="_id" size="small" pagination={{ pageSize: 15 }}
                      dataSource={acknowledgements || []}
                      locale={{ emptyText: "Nobody yet" }}
                      columns={[
                        { title: "Name", render: (_, r) => r.userId?.name || "—" },
                        { title: "When", dataIndex: "acknowledgedAt", width: 170, render: (d) => dayjs(d).format("D MMM YYYY, h:mm A") },
                        { title: "Note", dataIndex: "note" },
                      ]}
                    />
                  ),
                },
                {
                  key: "pending",
                  label: `Still to acknowledge (${pending?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey="userId" size="small" pagination={{ pageSize: 15 }}
                      dataSource={pending || []}
                      locale={{ emptyText: "Everybody has acknowledged" }}
                      columns={[
                        { title: "Name", dataIndex: "name" },
                        { title: "Role", dataIndex: "role", width: 150 },
                        { title: "Email", dataIndex: "email" },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </>
        ) : null}
      </Drawer>
    </div>
  );
};

export default CircularsPage;
