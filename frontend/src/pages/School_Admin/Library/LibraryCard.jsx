import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Form, Input, Select, DatePicker, Button, Table, Space, Tag, Modal, Radio, Segmented, message,
} from "antd";
import {
  PlusOutlined, StopOutlined, CreditCardOutlined, ReloadOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageHeader from "../../../components/layout/PageHeader";
import apiClient from "../../../api/httpClient";
import { getRoleName } from "../../../utils/roles";
import { statGrid, statCard, statLabel, statValue, modalTitle } from "../../../styles/pageStyles";

// Issuing and revoking belongs to the library; Principal / Vice Principal only look.
const CARD_MANAGERS = ["School Admin", "Librarian"];

const STATUS_TAG = {
  Active: { color: "success", label: "Active" },
  Expired: { color: "warning", label: "Expired" },
  Revoked: { color: "default", label: "Revoked" },
};

const STATS = [
  { key: "active", label: "Active", color: "var(--success)", bar: "var(--success-light)" },
  { key: "expired", label: "Expired", color: "var(--warning)", bar: "var(--warning-light)" },
  { key: "revoked", label: "Revoked", color: "var(--text-secondary)", bar: "var(--surface-soft)" },
  { key: "total", label: "Total issued", color: "var(--primary)", bar: "var(--primary-light)" },
];

const errorText = (err, fallback) => err?.response?.data?.message || fallback;
const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

const LibraryCard = () => {
  const { user } = useSelector((s) => s.auth || {});
  const canManage = CARD_MANAGERS.includes(getRoleName(user));

  const [cards, setCards] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, expired: 0, revoked: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [form] = Form.useForm();
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [holderType, setHolderType] = useState("Student");
  const [renewing, setRenewing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const searchTimer = useRef(null);

  const [revoking, setRevoking] = useState(null); // the card being revoked
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeSaving, setRevokeSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== "all") params.status = status;
      if (search.trim()) params.search = search.trim();
      const { data } = await apiClient.get("/library-cards", { params });
      setCards(data?.data?.cards || []);
      setSummary(data?.data?.summary || { total: 0, active: 0, expired: 0, revoked: 0 });
    } catch (err) {
      message.error(errorText(err, "Could not load library cards"));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  // Search is typed, so wait for a pause before asking the server.
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const loadCandidates = useCallback((type, term = "") => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setCandidatesLoading(true);
      try {
        const { data } = await apiClient.get("/library-cards/candidates", {
          params: { holderType: type, search: term || undefined },
        });
        setCandidates(data?.data || []);
      } catch (err) {
        message.error(errorText(err, "Could not load students / staff"));
      } finally {
        setCandidatesLoading(false);
      }
    }, term ? 300 : 0);
  }, []);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const openIssue = (renewCard = null) => {
    const type = renewCard?.holderType || "Student";
    setHolderType(type);
    setRenewing(Boolean(renewCard));
    form.resetFields();
    form.setFieldsValue({
      holderType: type,
      holderId: renewCard ? renewCard.holderId : undefined,
      expiryDate: dayjs().add(1, "year"),
    });
    // Renewing: the holder is already known — show just them instead of searching.
    if (renewCard) {
      setCandidates([{ holderId: renewCard.holderId, fullName: renewCard.fullName, detail: "renewal" }]);
    } else {
      setCandidates([]);
      loadCandidates(type);
    }
    setIssueOpen(true);
  };

  const handleIssue = async (values) => {
    if (issuing) return;
    setIssuing(true);
    try {
      await apiClient.post("/library-cards", {
        holderType: values.holderType,
        holderId: values.holderId,
        // A calendar day, not a timestamp — see the attendance date fix.
        expiryDate: values.expiryDate.format("YYYY-MM-DD"),
      });
      message.success("Library card issued");
      setIssueOpen(false);
      load();
    } catch (err) {
      message.error(errorText(err, "Could not issue the card"));
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revoking || revokeSaving) return;
    setRevokeSaving(true);
    try {
      await apiClient.patch(`/library-cards/${revoking._id}/revoke`, { reason: revokeReason });
      message.success(`Card ${revoking.cardNumber} revoked`);
      setRevoking(null);
      setRevokeReason("");
      load();
    } catch (err) {
      message.error(errorText(err, "Could not revoke the card"));
    } finally {
      setRevokeSaving(false);
    }
  };

  const columns = useMemo(() => {
    const cols = [
      { title: "Card No.", dataIndex: "cardNumber", key: "cardNumber", render: (v) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
      { title: "Name", dataIndex: "fullName", key: "fullName", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
      { title: "Type", dataIndex: "holderType", key: "holderType", render: (v) => (v === "Employee" ? "Staff" : "Student") },
      {
        title: "Class / Designation",
        key: "detail",
        render: (_, r) =>
          r.holderType === "Student"
            ? [r.className, r.sectionName].filter(Boolean).join(" - ") || "—"
            : r.designation || "—",
      },
      { title: "Issued", dataIndex: "issueDate", key: "issueDate", render: fmt },
      { title: "Valid till", dataIndex: "expiryDate", key: "expiryDate", render: fmt },
      {
        title: "Status",
        dataIndex: "displayStatus",
        key: "displayStatus",
        render: (v, r) => (
          <Tag color={STATUS_TAG[v]?.color} title={r.revokeReason || undefined}>
            {STATUS_TAG[v]?.label || v}
          </Tag>
        ),
      },
    ];
    if (canManage) {
      cols.push({
        title: "Action",
        key: "actions",
        render: (_, r) =>
          r.displayStatus === "Revoked" ? null : (
            <Space>
              {r.displayStatus === "Expired" && (
                <Button size="small" icon={<ReloadOutlined />} onClick={() => openIssue(r)}>
                  Renew
                </Button>
              )}
              <Button size="small" danger icon={<StopOutlined />} onClick={() => setRevoking(r)}>
                Revoke
              </Button>
            </Space>
          ),
      });
    }
    return cols;
    // openIssue only reads setters and the form instance, which never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Library Cards"
        subtitle={canManage ? "Issue and manage library membership cards" : "Library membership cards issued by the library"}
        icon={<CreditCardOutlined />}
        extra={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openIssue()}>
              Issue Library Card
            </Button>
          )
        }
      />

      <div className="stat-grid" style={{ ...statGrid(160), marginTop: 20 }}>
        {STATS.map(({ key, label, color, bar }) => (
          <div key={key} style={statCard({ color, bg: "var(--surface)", accentBar: bar })}>
            <div>
              <div style={statLabel(color)}>{label}</div>
              <div style={statValue(color)}>{summary[key] ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-card" style={{ margin: "20px 0", padding: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 16 }}>
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Expired", value: "expired" },
              { label: "Revoked", value: "revoked" },
            ]}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search name, card no., reg. no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280, maxWidth: "100%" }}
          />
        </div>
        <Table
          className="lib-card-tbl data-table"
          columns={columns}
          dataSource={cards}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: canManage && status === "all" && !search
              ? "No library cards issued yet. Click 'Issue Library Card' to get started."
              : "No library cards match this view.",
          }}
        />
      </div>

      {/* ── Issue / renew ── */}
      <Modal
        title={modalTitle(<CreditCardOutlined />, renewing ? "Renew Library Card" : "Issue Library Card", "The name and class come from the school's records")}
        open={issueOpen}
        onCancel={() => setIssueOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={issuing}
        okText="Issue Card"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleIssue} className="u-mt-2">
          <Form.Item label="Card for" name="holderType" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={renewing}
              options={[{ label: "Student", value: "Student" }, { label: "Staff", value: "Employee" }]}
              onChange={(e) => {
                setHolderType(e.target.value);
                form.setFieldsValue({ holderId: undefined });
                loadCandidates(e.target.value);
              }}
            />
          </Form.Item>

          <Form.Item
            label={holderType === "Employee" ? "Staff member" : "Student"}
            name="holderId"
            rules={[{ required: true, message: `Choose a ${holderType === "Employee" ? "staff member" : "student"}` }]}
            extra={renewing ? "The expired card is closed off when the new one is issued." : "Only people without a valid library card are listed."}
          >
            <Select
              disabled={renewing}
              showSearch
              filterOption={false}
              onSearch={(term) => loadCandidates(holderType, term)}
              loading={candidatesLoading}
              placeholder="Type a name to search"
              notFoundContent={candidatesLoading ? "Searching…" : "No one found"}
              options={candidates.map((c) => ({
                value: c.holderId,
                label: `${c.fullName} — ${c.detail}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Valid till"
            name="expiryDate"
            rules={[{ required: true, message: "Choose an expiry date" }]}
          >
            <DatePicker
              className="u-full"
              format="DD MMM YYYY"
              disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Revoke ── */}
      <Modal
        title={modalTitle(<StopOutlined />, `Revoke ${revoking?.cardNumber || ""}`, revoking?.fullName)}
        open={Boolean(revoking)}
        onCancel={() => { setRevoking(null); setRevokeReason(""); }}
        onOk={handleRevoke}
        confirmLoading={revokeSaving}
        okText="Revoke card"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <p style={{ color: "var(--text-secondary)" }}>
          The card stops being valid straight away. It stays on file, and a new card can be issued later.
        </p>
        <Input.TextArea
          rows={3}
          maxLength={300}
          placeholder="Reason (optional) — e.g. lost card, left the school"
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default LibraryCard;
