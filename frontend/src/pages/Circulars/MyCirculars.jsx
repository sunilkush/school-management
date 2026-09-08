import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Badge, Button, Empty, Input, Modal, Spin, Tag, message } from "antd";
import { FileTextOutlined, PushpinOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { acknowledgeCircular, fetchCircular, fetchMyCirculars, clearCurrent } from "../../features/circularSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel } from "../../styles/pageStyles";

const { TextArea } = Input;

/**
 * The circulars addressed to whoever is signed in.
 *
 * Anything still needing an acknowledgement is pulled to the top and marked, because that is the
 * only thing on this page that asks the reader to do something.
 */
const MyCirculars = () => {
  const dispatch = useDispatch();
  const { mine, mineLoading, current, currentLoading, actionLoading } = useSelector((s) => s.circular || {});
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState("");

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

  const needsAction = (mine || []).filter((c) => c.needsAcknowledgement);
  const rest = (mine || []).filter((c) => !c.needsAcknowledgement);

  const card = (c) => (
    <div
      key={c._id}
      style={{ ...sectionPanel, cursor: "pointer", borderColor: c.needsAcknowledgement ? "var(--warning)" : "var(--border-muted)" }}
      onClick={() => open(c)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {c.isPinned && <PushpinOutlined style={{ marginRight: 6, color: "var(--warning)" }} />}
            {c.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {c.circularNumber} · {c.category} · {dayjs(c.publishedAt).format("D MMM YYYY")}
            {c.issuedBy?.name ? ` · ${c.issuedBy.name}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
            {String(c.body || "").slice(0, 160)}{String(c.body || "").length > 160 ? "…" : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {c.needsAcknowledgement ? (
            <span style={pill("var(--warning)")}>Needs your confirmation</span>
          ) : c.acknowledgedAt ? (
            <span style={pill("var(--success)")}>Acknowledged</span>
          ) : null}
          {c.acknowledgementDeadline && c.needsAcknowledgement && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              by {dayjs(c.acknowledgementDeadline).format("D MMM")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Circulars"
        subtitle="Notices from the school"
        icon={
          <Badge count={needsAction.length} size="small">
            <FileTextOutlined />
          </Badge>
        }
      />

      {mineLoading && !mine?.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !mine?.length ? (
        <div style={emptyState}>
          <Empty description="Nothing from the school yet" />
        </div>
      ) : (
        <>
          {needsAction.length > 0 && (
            <>
              <Alert
                type="warning" showIcon style={{ marginBottom: 16, borderRadius: 14 }}
                message={`${needsAction.length} circular(s) need you to confirm you have read them`}
              />
              {needsAction.map(card)}
            </>
          )}
          {rest.length > 0 && (
            <>
              {needsAction.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "20px 0 10px" }}>
                  Earlier
                </div>
              )}
              {rest.map(card)}
            </>
          )}
        </>
      )}

      <Modal
        open={!!openId} width={640}
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
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              {current.circularNumber} · {current.category}
              {current.publishedAt ? ` · ${dayjs(current.publishedAt).format("D MMM YYYY")}` : ""}
            </div>

            {current.supersededById && (
              <Alert
                type="warning" showIcon style={{ marginBottom: 12 }}
                message="A later circular has replaced this one"
              />
            )}

            <div style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
              {current.body}
            </div>

            {current.attachments?.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {current.attachments.map((a) => (
                  <Button key={a.url} size="small" href={a.url} target="_blank" rel="noreferrer">{a.name}</Button>
                ))}
              </div>
            )}

            {current.requiresAcknowledgement && !current.acknowledgedAt && (
              <div style={{ ...sectionPanel, marginTop: 20, marginBottom: 0, borderColor: "var(--warning)" }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Pressing the button below records: &ldquo;{current.acknowledgementText}&rdquo;
                </div>
                <TextArea
                  rows={2}
                  placeholder="Anything you want to add (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}

            {current.acknowledgedAt && (
              <Tag color="green" style={{ marginTop: 16 }}>
                You acknowledged this on {dayjs(current.acknowledgedAt).format("D MMM YYYY, h:mm A")}
              </Tag>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default MyCirculars;
