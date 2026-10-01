import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Badge, Button, Checkbox, Empty, Input, InputNumber, Modal, Progress, Radio, Rate, Segmented, Spin, Tag, message,
} from "antd";
import { EyeInvisibleOutlined, FormOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  clearMyResponse, fetchMyResponse, fetchMySurveys, submitResponse,
} from "../../features/surveySlice";
import PageHeader from "../../components/layout/PageHeader";

const { TextArea } = Input;

const isBlank = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * The surveys addressed to whoever is signed in, as one compact list.
 *
 * An anonymous survey says so before a single answer is typed, and says that the answers cannot be
 * changed once sent — both are things somebody would want to know beforehand, not afterwards.
 */
const MySurveys = () => {
  const dispatch = useDispatch();
  const { mine, mineLoading, myResponse, actionLoading } = useSelector((s) => s.survey || {});
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [filter, setFilter] = useState("waiting");

  useEffect(() => { dispatch(fetchMySurveys()); }, [dispatch]);

  const open = async (survey) => {
    setActive(survey);
    setAnswers({});
    const res = await dispatch(fetchMyResponse(survey._id));
    if (fetchMyResponse.fulfilled.match(res) && res.payload?.answers) {
      setAnswers(Object.fromEntries(res.payload.answers.map((a) => [a.questionKey, a.value])));
    }
  };

  const close = () => {
    setActive(null);
    setAnswers({});
    dispatch(clearMyResponse());
    dispatch(fetchMySurveys());
  };

  const send = async () => {
    const payload = Object.entries(answers)
      .filter(([, value]) => !isBlank(value))
      .map(([questionKey, value]) => ({ questionKey, value }));

    const res = await dispatch(submitResponse({ id: active._id, answers: payload }));
    if (submitResponse.fulfilled.match(res)) {
      message.success("Thank you — your answers have been sent");
      close();
    } else {
      message.error(res.payload || "Could not send your answers");
    }
  };

  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const field = (question) => {
    const value = answers[question.key];
    switch (question.type) {
      case "rating":
        return <Rate value={value} onChange={(v) => set(question.key, v)} />;
      case "yes_no":
        return (
          <Radio.Group size="small" optionType="button" buttonStyle="solid" value={value} onChange={(e) => set(question.key, e.target.value)}
            options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
        );
      case "single_choice":
        return (
          <Radio.Group value={value} onChange={(e) => set(question.key, e.target.value)}
            style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
            {question.options.map((o) => <Radio key={o} value={o}>{o}</Radio>)}
          </Radio.Group>
        );
      case "multi_choice":
        return (
          <Checkbox.Group
            value={value || []} onChange={(v) => set(question.key, v)}
            options={question.options.map((o) => ({ value: o, label: o }))}
            style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}
          />
        );
      case "number":
        return <InputNumber size="small" value={value} onChange={(v) => set(question.key, v)} style={{ width: 160 }} />;
      case "long_text":
        return <TextArea autoSize={{ minRows: 2, maxRows: 5 }} value={value} onChange={(e) => set(question.key, e.target.value)} />;
      default:
        return <Input size="small" value={value} onChange={(e) => set(question.key, e.target.value)} />;
    }
  };

  const all = useMemo(() => mine || [], [mine]);
  const waiting = all.filter((s) => !s.hasResponded && !s.closedReason);
  const done = all.filter((s) => s.hasResponded || s.closedReason);
  // Start on what needs answering; if nothing does, show the rest.
  const view = filter === "waiting" && !waiting.length && done.length ? "done" : filter;
  const shown = view === "waiting" ? waiting : view === "done" ? done : all;

  const answered = active && myResponse?.hasResponded;
  const locked = answered && active?.isAnonymous;
  const questions = active?.questions || [];
  const filled = questions.filter((q) => !isBlank(answers[q.key])).length;
  const missingRequired = questions.filter((q) => q.required && isBlank(answers[q.key])).length;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Surveys"
        subtitle="Short questionnaires from the school. Anonymous ones never show your name."
        icon={<Badge count={waiting.length} size="small"><FormOutlined /></Badge>}
      />

      {mineLoading && !all.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !all.length ? (
        <div className="empty-state">
          <Empty description="No survey to answer right now. When the school sends a questionnaire to staff, it appears here until you answer it or it closes." />
        </div>
      ) : (
        <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
          <Segmented
            size="small" value={view} onChange={setFilter} style={{ marginBottom: 10 }}
            options={[
              { value: "waiting", label: `Waiting for you ${waiting.length}` },
              { value: "done", label: `Done ${done.length}` },
              { value: "all", label: `All ${all.length}` },
            ]}
          />
          {!shown.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing waiting for you" />
          ) : shown.map((s, i) => {
            const canOpen = !(s.hasResponded && s.isAnonymous) && !s.closedReason;
            const todo = !s.hasResponded && !s.closedReason;
            return (
              <button
                type="button" key={s._id} onClick={() => { if (canOpen) open(s); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  cursor: canOpen ? "pointer" : "default", background: "transparent", border: "none",
                  borderTop: i ? "1px solid var(--border-muted)" : "none", padding: "9px 6px",
                  borderLeft: `3px solid ${todo ? "var(--primary)" : "transparent"}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.title}
                    {s.isAnonymous && <Tag icon={<EyeInvisibleOutlined />} style={{ marginLeft: 8, fontWeight: 400 }}>anonymous</Tag>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.questions?.length || 0} question(s)
                    {s.closesAt ? ` · closes ${dayjs(s.closesAt).format("D MMM")}` : ""}
                    {s.description ? ` — ${s.description}` : ""}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {s.closedReason ? <Tag style={{ margin: 0 }}>{s.closedReason}</Tag>
                    : s.hasResponded ? <Tag color="green" style={{ margin: 0 }}>Answered</Tag>
                      : <Tag color="blue" style={{ margin: 0 }}>Answer →</Tag>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!active} width={580} title={active?.title}
        onCancel={close}
        footer={locked ? [<Button key="close" type="primary" onClick={close}>Close</Button>] : [
          <span key="hint" className="u-muted" style={{ fontSize: 12, marginRight: "auto", float: "left", lineHeight: "32px" }}>
            {missingRequired ? `${missingRequired} required question(s) left` : "Ready to send"}
          </span>,
          <Button key="close" onClick={close}>Cancel</Button>,
          <Button key="send" type="primary" loading={actionLoading} disabled={missingRequired > 0} onClick={send}>
            {answered ? "Update my answers" : "Send"}
          </Button>,
        ]}
      >
        {active && (
          <>
            {active.description && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>{active.description}</div>
            )}

            {active.isAnonymous && (
              <div style={{ fontSize: 12, border: "1px solid var(--border-muted)", borderRadius: 8, padding: "6px 10px", marginBottom: 12, color: "var(--text-secondary)" }}>
                <EyeInvisibleOutlined style={{ marginRight: 6 }} />
                {locked
                  ? "Your answers were sent with no name on them, so they cannot be found again to change."
                  : "Anonymous: the school sees that you replied, not what you said. Answers cannot be changed once sent."}
              </div>
            )}

            {!locked && questions.length > 0 && (
              <Progress percent={Math.round((filled / questions.length) * 100)} size="small"
                format={() => `${filled}/${questions.length}`} style={{ marginBottom: 12 }} />
            )}

            {locked ? null : questions.map((q, i) => (
              <div key={q.key} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {i + 1}. {q.text}
                  {q.required && <span style={{ color: "var(--danger, #d4380d)" }}> *</span>}
                </div>
                {q.helpText && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{q.helpText}</div>
                )}
                {field(q)}
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
};

export default MySurveys;
