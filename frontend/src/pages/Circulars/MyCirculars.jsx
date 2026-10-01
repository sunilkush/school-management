import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Badge, Button, Empty, Input, Modal, Segmented, Spin, Tag, message } from "antd";
import { FileTextOutlined, PushpinOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { acknowledgeCircular, fetchCircular, fetchMyCirculars, clearCurrent } from "../../features/circularSlice";
import PageHeader from "../../components/layout/PageHeader";
import { safeHref } from "../../utils/safeUrl";

const { TextArea } = Input;

/**
 * The circulars addressed to whoever is signed in, as one compact list.
 *
 * Anything still needing an acknowledgement sorts to the top and is marked, because that is the
 * only thing on this page that asks the reader to do something.
 */
const MyCirculars = () => {
  const dispatch = useDispatch();
  const { mine, mineLoading, current, currentLoading, actionLoading } = useSelector((s) => s.circular || {});
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchMyCirculars()); }, [dispatch]);

  const open = (circular) => {
    setOpenId(circular._id);
    setNote("");
    dispatch(fetchCircular(circular._id));
  };

  const close = () => {
    setOpenId(null);
    dispatch(clearCurrent());
    dispatch(fetchMyCirculars());
  };

  const acknowledge = async () => {
    const res = await dispatch(acknowledgeCircular({ id: openId, note }));
    if (acknowledgeCircular.fulfilled.match(res)) {
      message.success("Thank you — your acknowledgement is recorded");
      close();
    } else {
      message.error(res.payload || "Could not record your acknowledgement");
    }
  };

  const all = useMemo(() => mine || [], [mine]);
  const toConfirm = all.filter((c) => c.needsAcknowledgement);
  const confirmed = all.filter((c) => c.acknowledgedAt);

  const shown = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return all
      .filter((c) => (filter === "todo" ? c.needsAcknowledgement : filter === "done" ? c.acknowledgedAt : true))
      .filter((c) => !kw || `${c.title} ${c.circularNumber} ${c.category} ${c.body}`.toLowerCase().includes(kw))
      // What needs the reader first, then pinned, then newest.
      .sort((a, b) => Number(b.needsAcknowledgement || 0) - Number(a.needsAcknowledgement || 0)
        || Number(b.isPinned || 0) - Number(a.isPinned || 0)
        || new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [all, filter, search]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Circulars"
        subtitle="Notices from the school office. Open one to read it; confirm where asked."
        icon={<Badge count={toConfirm.length} size="small"><FileTextOutlined /></Badge>}
      />

      {mineLoading && !all.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !all.length ? (
        <div className="empty-state">
          <Empty description="No circulars yet. When the office publishes a notice for you (holiday, meeting, rule change), it appears here, and the ones that need your confirmation are marked." />
        </div>
      ) : (
        <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Segmented
              size="small" value={filter} onChange={setFilter}
              options={[
                { value: "all", label: `All ${all.length}` },
                { value: "todo", label: `To confirm ${toConfirm.length}` },
                { value: "done", label: `Confirmed ${confirmed.length}` },
              ]}
            />
            <Input size="small" allowClear placeholder="Search" prefix={<SearchOutlined className="u-muted" />}
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
          </div>

          {!shown.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing here" />
          ) : shown.map((c, i) => (
            <button
              type="button" key={c._id} onClick={() => open(c)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
                background: "transparent", border: "none", borderTop: i ? "1px solid var(--border-muted)" : "none",
                padding: "9px 6px", borderLeft: `3px solid ${c.needsAcknowledgement ? "var(--warning)" : "transparent"}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.isPinned && <PushpinOutlined style={{ marginRight: 6, color: "var(--warning)" }} />}
                  {c.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.circularNumber} · {c.category} · {dayjs(c.publishedAt).format("D MMM")}
                  {c.editedAt ? ` · edited ${dayjs(c.editedAt).format("D MMM")}` : ""}
                  {c.issuedBy?.name ? ` · ${c.issuedBy.name}` : ""}
                  {c.body ? ` — ${String(c.body).replace(/\s+/g, " ").slice(0, 90)}` : ""}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {c.needsAcknowledgement ? (
                  <Tag color="orange" style={{ margin: 0 }}>
                    Confirm{c.acknowledgementDeadline ? ` by ${dayjs(c.acknowledgementDeadline).format("D MMM")}` : ""}
                  </Tag>
                ) : c.acknowledgedAt ? (
                  <Tag color="green" style={{ margin: 0 }}>Confirmed</Tag>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!openId} width={600}
        title={current?.title || "Circular"}
        onCancel={close}
        footer={
          current?.requiresAcknowledgement && !current?.acknowledgedAt ? [
            <Button key="close" onClick={close}>Close</Button>,
            <Button key="ack" type="primary" loading={actionLoading} onClick={acknowledge}>
              I have read and understood
            </Button>,
          ] : [<Button key="close" type="primary" onClick={close}>Close</Button>]
        }
      >
        {currentLoading && !current ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : current ? (
          <>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              {current.circularNumber} · {current.category}
              {current.publishedAt ? ` · ${dayjs(current.publishedAt).format("D MMM YYYY")}` : ""}
              {current.editedAt ? ` · edited ${dayjs(current.editedAt).format("D MMM YYYY")}` : ""}
            </div>

            {current.supersededById && (
              <Alert type="warning" showIcon style={{ marginBottom: 10 }} message="A later circular has replaced this one" />
            )}

            <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
              {current.body}
            </div>

            {current.attachments?.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {current.attachments.map((a) => (
                  <Button key={a.url} size="small" href={safeHref(a.url)} target="_blank" rel="noreferrer">{a.name}</Button>
                ))}
              </div>
            )}

            {current.requiresAcknowledgement && !current.acknowledgedAt && (
              <div style={{ marginTop: 14, border: "1px solid var(--warning)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  Confirming records: &ldquo;{current.acknowledgementText}&rdquo;
                </div>
                <TextArea rows={1} autoSize={{ minRows: 1, maxRows: 3 }} placeholder="Add a note (optional)"
                  value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            )}

            {current.acknowledgedAt && (
              <Tag color="green" style={{ marginTop: 12 }}>
                You confirmed this on {dayjs(current.acknowledgedAt).format("D MMM YYYY, h:mm A")}
              </Tag>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default MyCirculars;
