import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Badge, Button, Checkbox, Empty, Input, InputNumber, Modal, Radio, Rate, Spin, Tag, message,
} from "antd";
import { EyeInvisibleOutlined, FormOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  clearMyResponse, fetchMyResponse, fetchMySurveys, submitResponse,
} from "../../features/surveySlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel } from "../../styles/pageStyles";

const { TextArea } = Input;

const isBlank = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * The surveys addressed to whoever is signed in.
 *
 * An anonymous survey says so before a single answer is typed, and says that the answers cannot be
 * changed once sent — both are things somebody would want to know beforehand, not afterwards.
 */
const MySurveys = () => {
  const dispatch = useDispatch();
  const { mine, mineLoading, myResponse, actionLoading } = useSelector((s) => s.survey || {});
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});

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
          <Radio.Group value={value} onChange={(e) => set(question.key, e.target.value)}>
            <Radio value>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        );
      case "single_choice":
        return (
          <Radio.Group value={value} onChange={(e) => set(question.key, e.target.value)}>
            {question.options.map((o) => <Radio key={o} value={o} style={{ display: "block", marginBottom: 6 }}>{o}</Radio>)}
          </Radio.Group>
        );
      case "multi_choice":
        return (
          <Checkbox.Group
            value={value || []} onChange={(v) => set(question.key, v)}
            options={question.options.map((o) => ({ value: o, label: o }))}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          />
        );
      case "number":
        return <InputNumber value={value} onChange={(v) => set(question.key, v)} style={{ width: 200 }} />;
      case "long_text":
        return <TextArea rows={3} value={value} onChange={(e) => set(question.key, e.target.value)} />;
      default:
        return <Input value={value} onChange={(e) => set(question.key, e.target.value)} />;
    }
  };

  const waiting = (mine || []).filter((s) => !s.hasResponded && !s.closedReason);
  const done = (mine || []).filter((s) => s.hasResponded || s.closedReason);

  const card = (s) => (
    <div
      key={s._id}
      style={{
        ...sectionPanel,
        cursor: s.hasResponded && s.isAnonymous ? "default" : "pointer",
        borderColor: s.hasResponded || s.closedReason ? "var(--border-muted)" : "var(--primary)",
      }}
      onClick={() => { if (!(s.hasResponded && s.isAnonymous) && !s.closedReason) open(s); }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {s.title}
            {s.isAnonymous && <Tag icon={<EyeInvisibleOutlined />} style={{ marginLeft: 8 }}>anonymous</Tag>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {s.questions?.length || 0} question(s)
            {s.closesAt ? ` · closes ${dayjs(s.closesAt).format("D MMM YYYY")}` : ""}
          </div>
          {s.description && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>{s.description}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {s.closedReason ? <span style={pill("var(--text-muted)")}>{s.closedReason}</span>
            : s.hasResponded ? <span style={pill("var(--success)")}>Answered</span>
              : <span style={pill("var(--primary)")}>Waiting for you</span>}
        </div>
      </div>
    </div>
  );

  const answered = active && myResponse?.hasResponded;
  const locked = answered && active?.isAnonymous;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Surveys"
        subtitle="Questions the school has asked you"
        icon={<Badge count={waiting.length} size="small"><FormOutlined /></Badge>}
      />

      {mineLoading && !mine?.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !mine?.length ? (
        <div style={emptyState}>
          <Empty description="Nothing to answer at the moment" />
        </div>
      ) : (
        <>
          {waiting.map(card)}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "20px 0 10px" }}>
                Done
              </div>
              {done.map(card)}
            </>
          )}
        </>
      )}

      <Modal
        open={!!active} width={640} title={active?.title}
        onCancel={close}
        footer={locked ? [<Button key="close" type="primary" onClick={close}>Close</Button>] : [
          <Button key="close" onClick={close}>Cancel</Button>,
          <Button key="send" type="primary" loading={actionLoading} onClick={send}>
            {answered ? "Update my answers" : "Send"}
          </Button>,
        ]}
      >
        {active && (
          <>
            {active.description && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{active.description}</div>
            )}

            {active.isAnonymous && (
              <Alert
                type="info" showIcon icon={<EyeInvisibleOutlined />} style={{ marginBottom: 16 }}
                message="This survey is anonymous"
                description={
                  locked
                    ? "Your answers were sent with nothing attached that points back to you — which also means they cannot be found again to change."
                    : "Your answers are stored with no name on them. The school will know that you replied, but not what you said. For the same reason, they cannot be changed once sent."
                }
              />
            )}

            {locked ? null : active.questions?.map((q, i) => (
              <div key={q.key} style={{ marginBottom: 22 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {i + 1}. {q.text}
                  {q.required && <span style={{ color: "var(--danger, #d4380d)" }}> *</span>}
                </div>
                {q.helpText && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{q.helpText}</div>
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
