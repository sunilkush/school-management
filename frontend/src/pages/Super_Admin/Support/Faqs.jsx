import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Input,
  Tabs,
  Collapse,
  Modal,
  Form,
  Select,
  Spin,
  Empty,
  Popconfirm,
  message,
  Skeleton,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from "../../../features/faqSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  iconWell,
  modalTitle,
} from "../../../styles/pageStyles";

const { Search } = Input;
const { Option } = Select;

const CATEGORIES = [
  { key: "all",      label: "All" },
  { key: "general",  label: "General" },
  { key: "billing",  label: "Billing" },
  { key: "technical", label: "Technical" },
  { key: "academic", label: "Academic" },
  { key: "other",    label: "Other" },
];

const Faqs = () => {
  const dispatch = useDispatch();
  const { faqs = [], loading, error } = useSelector((s) => s.faqs || {});

  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState("all");

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchFaqs());
  }, [dispatch]);

  /* ── Filtered FAQ list ── */
  const filtered = useMemo(() => {
    return (faqs || []).filter((f) => {
      const matchCat = activeTab === "all" || f.category === activeTab;
      const matchSearch = !search ||
        (f.question || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqs, activeTab, search]);

  /* ── Group by category for Collapse items ── */
  const grouped = useMemo(() => {
    if (activeTab !== "all") {
      return filtered.map((f, i) => ({
        key: f._id || String(i),
        label: (
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
            {f.question}
          </span>
        ),
        children: (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14, flex: 1 }}>{f.answer}</span>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <Button
                icon={<EditOutlined />}
                size="small"
                style={{ borderColor: "var(--border-muted)" }}
                onClick={(e) => { e.stopPropagation(); openEdit(f); }}
              />
              <Popconfirm
                title="Delete this FAQ?"
                description="This action cannot be undone."
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={(e) => { e?.stopPropagation(); handleDelete(f._id); }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </div>
          </div>
        ),
      }));
    }

    // Group by category
    const groups = {};
    filtered.forEach((f) => {
      const cat = f.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });

    return Object.entries(groups).map(([cat, items]) => ({
      key: cat,
      label: (
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14, textTransform: "capitalize" }}>
          {cat} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>({items.length})</span>
        </span>
      ),
      children: (
        <Collapse
          accordion
          bordered={false}
          style={{ background: "transparent" }}
          items={items.map((f, i) => ({
            key: f._id || String(i),
            label: (
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
                {f.question}
              </span>
            ),
            children: (
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13, flex: 1 }}>{f.answer}</span>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    style={{ borderColor: "var(--border-muted)" }}
                    onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                  />
                  <Popconfirm
                    title="Delete this FAQ?"
                    description="This action cannot be undone."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={(e) => { e?.stopPropagation(); handleDelete(f._id); }}
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </div>
            ),
          }))}
        />
      ),
    }));
  }, [filtered, activeTab]);

  /* ── Handlers ── */
  const openEdit = (faq) => {
    setEditTarget(faq);
    form.setFieldsValue({
      question: faq.question,
      answer:   faq.answer,
      category: faq.category,
      order:    faq.order,
    });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteFaq(id)).unwrap();
      message.success("FAQ deleted");
    } catch (err) {
      message.error(err || "Failed to delete FAQ");
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editTarget) {
        await dispatch(updateFaq({ id: editTarget._id, data: values })).unwrap();
        message.success("FAQ updated");
      } else {
        await dispatch(createFaq(values)).unwrap();
        message.success("FAQ created");
      }
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(err || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Help & FAQs"
        subtitle="Manage frequently asked questions for school users"
        icon={<QuestionCircleOutlined />}
        extra={
          <>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchFaqs())}
              style={{ borderColor: "var(--border-muted)" }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openNew}
            >
              Add FAQ
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Search
          placeholder="Search FAQs by question..."
          allowClear
          style={{ width: 320 }}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={CATEGORIES.map((c) => ({
          key: c.key,
          label: (
            <span>
              {c.label}
              {c.key !== "all" && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "var(--surface-soft)",
                  padding: "1px 7px",
                  borderRadius: 99,
                  border: "1px solid var(--border-muted)",
                }}>
                  {(faqs || []).filter((f) => f.category === c.key).length}
                </span>
              )}
            </span>
          ),
        }))}
      />

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px",
          background: "var(--danger)10",
          border: "1px solid var(--danger)30",
          borderRadius: 10,
          color: "var(--danger)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={() => dispatch(fetchFaqs())}>Retry</Button>
        </div>
      )}

      {/* FAQ Content */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border-muted)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  {search ? `No FAQs found matching "${search}"` : "No FAQs in this category yet"}
                </span>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
                Add First FAQ
              </Button>
            </Empty>
          </div>
        ) : (
          <Collapse
            accordion={activeTab !== "all"}
            bordered={false}
            style={{ background: "transparent" }}
            items={grouped}
          />
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        title={modalTitle(
          <QuestionCircleOutlined />,
          editTarget ? "Edit FAQ" : "New FAQ",
          editTarget ? "Update the FAQ details" : "Add a new frequently asked question"
        )}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: "Question is required" }]}
          >
            <Input placeholder="Enter the question..." />
          </Form.Item>
          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: true, message: "Answer is required" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter the answer..." />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="category"
              label="Category"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select placeholder="Select category">
                <Option value="general">General</Option>
                <Option value="billing">Billing</Option>
                <Option value="technical">Technical</Option>
                <Option value="academic">Academic</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="order" label="Display Order" style={{ width: 140 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={editTarget ? <EditOutlined /> : <PlusOutlined />}>
              {editTarget ? "Save Changes" : "Create FAQ"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Faqs;
