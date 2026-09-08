import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Drawer, Empty, Form, Input, Modal, Popconfirm,
  Progress, Select, Spin, Switch, Table, Tabs, Tag, Tooltip, message,
} from "antd";
import {
  BarChartOutlined, DeleteOutlined, EyeInvisibleOutlined, PlusOutlined,
  ReloadOutlined, SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  clearResults, closeSurvey, createSurvey, deleteSurvey, fetchPendingRespondents,
  fetchResponses, fetchResults, fetchSurveys, openSurvey, updateSurvey,
} from "../../features/surveySlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { TextArea } = Input;

const QUESTION_TYPES = [
  { value: "rating", label: "Rating (1–5)" },
  { value: "yes_no", label: "Yes / No" },
  { value: "single_choice", label: "Pick one" },
  { value: "multi_choice", label: "Pick any" },
  { value: "short_text", label: "Short answer" },
  { value: "long_text", label: "Long answer" },
  { value: "number", label: "Number" },
];

const CHOICE_TYPES = ["single_choice", "multi_choice"];

const ROLES = [
  "Teacher", "Class Teacher", "Parent", "Student", "Accountant", "Librarian",
  "Transport Manager", "Hostel Warden", "Receptionist", "Support Staff",
];

const STATUS_COLOR = { draft: "var(--text-muted)", open: "var(--success)", closed: "var(--text-secondary)" };

let keySeq = 0;
const newQuestion = () => {
  keySeq += 1;
  return { key: `q${Date.now().toString(36)}${keySeq}`, text: "", type: "rating", options: [], required: false };
};

/** A rating's spread, drawn as five bars. Half the room saying 5 and half saying 1 averages the
 *  same as everybody saying 3, and those are not the same school. */
const RatingSpread = ({ distribution = {} }) => {
  const counts = [1, 2, 3, 4, 5].map((n) => distribution[n] || 0);
  const max = Math.max(1, ...counts);
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 70, marginTop: 10 }}>
      {counts.map((n, i) => (
        <div key={i} style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{n || ""}</div>
          <div
            style={{
              height: Math.round((n / max) * 44) + 2,
              background: n ? "var(--primary)" : "var(--border-muted)",
              borderRadius: 5,
            }}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{i + 1}</div>
        </div>
      ))}
    </div>
  );
};

const QuestionResult = ({ question }) => {
  const head = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
      <div style={{ fontWeight: 600 }}>{question.text}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {question.answered} answered
      </div>
    </div>
  );

  if (question.type === "rating" || question.type === "number") {
    return (
      <div style={sectionPanel}>
        {head}
        {question.average === null ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>No answers yet</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 13 }}>
              <span><b style={{ fontSize: 20 }}>{question.average}</b> average</span>
              <span style={{ color: "var(--text-muted)" }}>lowest {question.min} · highest {question.max}</span>
            </div>
            {question.type === "rating" && <RatingSpread distribution={question.distribution} />}
          </>
        )}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div style={sectionPanel}>
        {head}
        <Progress percent={question.percentYes} strokeColor="var(--success)" style={{ marginTop: 8 }} />
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {question.yes} said yes · {question.no} said no
        </div>
      </div>
    );
  }

  if (question.counts) {
    const total = Object.values(question.counts).reduce((s, n) => s + n, 0) || 1;
    return (
      <div style={sectionPanel}>
        {head}
        <div style={{ marginTop: 10 }}>
          {Object.entries(question.counts).map(([option, n]) => (
            <div key={option} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{option}</span>
                <span style={{ color: "var(--text-muted)" }}>{n}</span>
              </div>
              <Progress percent={Math.round((n / total) * 100)} size="small" showInfo={false} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={sectionPanel}>
      {head}
      {question.texts?.length ? (
        <div style={{ marginTop: 10, maxHeight: 260, overflowY: "auto" }}>
          {question.texts.map((t, i) => (
            <div
              key={i}
              style={{
                fontSize: 13, color: "var(--text-secondary)", padding: "8px 12px", marginBottom: 6,
                background: "var(--surface-muted, rgba(0,0,0,0.03))", borderRadius: 10,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>No comments yet</div>
      )}
    </div>
  );
};

/**
 * Building and running surveys.
 *
 * The one thing this screen keeps saying out loud: a survey's questions freeze the moment it opens,
 * because every answer is stored against a question key and changing the questions afterwards would
 * make every summary quietly wrong.
 */
const SurveysPage = () => {
  const dispatch = useDispatch();
  const {
    surveys, loading, results, resultsLoading, pending, responses, responsesError, actionLoading,
  } = useSelector((s) => s.survey || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [drawerTab, setDrawerTab] = useState("summary");
  const [statusFilter, setStatusFilter] = useState();

  const load = () => dispatch(fetchSurveys(statusFilter ? { status: statusFilter } : {}));

  useEffect(() => {
    load();
    dispatch(fetchSchoolClasses({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter]);

  const openEditor = (survey = null) => {
    setEditing(survey);
    form.resetFields();
    if (survey) {
      form.setFieldsValue({
        title: survey.title,
        description: survey.description,
        isAnonymous: survey.isAnonymous,
        roles: survey.audience?.roles || [],
        schoolClassIds: survey.audience?.schoolClassIds || [],
        closesAt: survey.closesAt ? dayjs(survey.closesAt) : null,
      });
      setQuestions((survey.questions || []).map((q) => ({ ...q, options: q.options || [] })));
    } else {
      form.setFieldsValue({ isAnonymous: false });
      setQuestions([newQuestion()]);
    }
    setModalOpen(true);
  };

  const setQuestion = (index, patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const save = async () => {
    const values = await form.validateFields();

    const blank = questions.findIndex((q) => !q.text.trim());
    if (blank >= 0) return message.error(`Question ${blank + 1} has no wording`);
    const thin = questions.findIndex((q) => CHOICE_TYPES.includes(q.type) && q.options.filter(Boolean).length < 2);
    if (thin >= 0) return message.error(`Question ${thin + 1} is a choice question and needs at least two options`);

    const payload = {
      title: values.title,
      description: values.description || "",
      isAnonymous: values.isAnonymous,
      closesAt: values.closesAt ? values.closesAt.endOf("day").toISOString() : null,
      questions: questions.map((q) => ({
        key: q.key,
        text: q.text.trim(),
        type: q.type,
        options: CHOICE_TYPES.includes(q.type) ? q.options.filter(Boolean) : [],
        required: !!q.required,
      })),
      audience: {
        roles: values.roles || [],
        schoolClassIds: values.schoolClassIds || [],
        sectionIds: [],
        userIds: [],
      },
    };

    const res = await dispatch(editing ? updateSurvey({ id: editing._id, ...payload }) : createSurvey(payload));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editing ? "Draft updated" : "Saved as a draft");
      setModalOpen(false);
      load();
    } else {
      message.error(res.payload || "Could not save");
    }
    return undefined;
  };

  const run = async (survey) => {
    const res = await dispatch(openSurvey(survey._id));
    if (openSurvey.fulfilled.match(res)) {
      message.success(`Open to ${res.payload?.recipientCount} recipient(s)`);
      load();
    } else {
      message.error(res.payload || "Could not open the survey");
    }
  };

  const stop = async (survey) => {
    const res = await dispatch(closeSurvey(survey._id));
    if (closeSurvey.fulfilled.match(res)) { message.success("Closed"); load(); }
    else message.error(res.payload || "Could not close the survey");
  };

  const remove = async (survey) => {
    const res = await dispatch(deleteSurvey(survey._id));
    if (deleteSurvey.fulfilled.match(res)) { message.success("Draft deleted"); load(); }
    else message.error(res.payload || "Could not delete");
  };

  const openDrawer = (survey) => {
    setOpenId(survey._id);
    setDrawerTab("summary");
    dispatch(fetchResults(survey._id));
    dispatch(fetchPendingRespondents(survey._id));
    dispatch(fetchResponses(survey._id));
  };

  const columns = useMemo(() => [
    {
      title: "Survey", dataIndex: "title",
      render: (title, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {title}
            {r.isAnonymous && (
              <Tooltip title="Answers carry nothing that points back at a person">
                <Tag icon={<EyeInvisibleOutlined />} style={{ marginLeft: 8 }}>anonymous</Tag>
              </Tooltip>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.questions?.length || 0} question(s)
            {r.openedAt ? ` · opened ${dayjs(r.openedAt).format("D MMM YYYY")}` : ""}
            {r.closesAt ? ` · closes ${dayjs(r.closesAt).format("D MMM")}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Replies", width: 200,
      render: (_, r) => (r.status === "draft" ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>not sent yet</span>
      ) : (
        <div>
          <Progress percent={r.responseRate} size="small" />
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.responded} of {r.recipientCount}
          </div>
        </div>
      )),
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (s) => <span style={pill(STATUS_COLOR[s])}>{s}</span>,
    },
    {
      title: "", width: 260, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {r.status === "draft" && (
            <>
              <Button size="small" onClick={() => openEditor(r)}>Edit</Button>
              <Popconfirm
                title="Send this survey out?"
                description="The questions and the recipient list are fixed from this point — every answer is stored against a question, so they cannot change underneath it."
                onConfirm={() => run(r)}
              >
                <Button size="small" type="primary" icon={<SendOutlined />}>Open</Button>
              </Popconfirm>
              <Popconfirm title="Delete this draft?" onConfirm={() => remove(r)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {r.status === "open" && (
            <>
              <Button size="small" icon={<BarChartOutlined />} onClick={() => openDrawer(r)}>Results</Button>
              <Popconfirm title="Close this survey?" description="Nobody will be able to answer after this." onConfirm={() => stop(r)}>
                <Button size="small">Close</Button>
              </Popconfirm>
            </>
          )}
          {r.status === "closed" && (
            <Button size="small" icon={<BarChartOutlined />} onClick={() => openDrawer(r)}>Results</Button>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [schoolClasses]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("srv-table")}</style>

      <PageHeader
        title="Surveys & Feedback"
        subtitle="Ask the school a question, and see what came back"
        icon={<BarChartOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              allowClear placeholder="All statuses" style={{ width: 150 }}
              value={statusFilter} onChange={setStatusFilter}
              options={["draft", "open", "closed"].map((s) => ({ value: s, label: s }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>New survey</Button>
          </div>
        }
      />

      <div style={sectionPanel}>
        {loading && !surveys?.length ? (
          <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
        ) : !surveys?.length ? (
          <div style={emptyState}>
            <Empty description="No surveys yet" />
            <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "12px auto" }}>
              A survey goes to a chosen group — the parents of Class 8, all teachers, the whole
              school — and the answers stay in the school&rsquo;s own database rather than a form
              service somewhere else.
            </p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>Write the first one</Button>
          </div>
        ) : (
          <div style={tableContainer}>
            <Table
              className="srv-table" rowKey="_id" size="middle"
              columns={columns} dataSource={surveys}
              pagination={{ pageSize: 20, showSizeChanger: false }}
            />
          </div>
        )}
      </div>

      {/* ── Build ── */}
      <Modal
        open={modalOpen} width={820}
        title={editing ? "Edit draft" : "New survey"}
        onCancel={() => setModalOpen(false)} onOk={save}
        confirmLoading={actionLoading} okText="Save draft"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Parent–teacher meeting feedback" />
          </Form.Item>
          <Form.Item name="description" label="Introduction" extra="Shown above the questions.">
            <TextArea rows={2} />
          </Form.Item>

          <div style={{ fontWeight: 700, marginBottom: 8 }}>Questions</div>
          {questions.map((q, index) => (
            <div key={q.key} style={{ ...sectionPanel, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, color: "var(--text-muted)", paddingTop: 6 }}>{index + 1}.</div>
                <Input
                  placeholder="What would you like to ask?"
                  value={q.text}
                  onChange={(e) => setQuestion(index, { text: e.target.value })}
                  style={{ flex: 1 }}
                />
                <Select
                  value={q.type} style={{ width: 160 }} options={QUESTION_TYPES}
                  onChange={(type) => setQuestion(index, { type, options: CHOICE_TYPES.includes(type) ? q.options : [] })}
                />
                <Button
                  danger icon={<DeleteOutlined />}
                  disabled={questions.length === 1}
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))}
                />
              </div>

              {CHOICE_TYPES.includes(q.type) && (
                <Select
                  mode="tags" style={{ width: "100%", marginTop: 10 }}
                  placeholder="Type an option and press Enter — at least two"
                  value={q.options}
                  onChange={(options) => setQuestion(index, { options })}
                />
              )}

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <Switch size="small" checked={q.required} onChange={(required) => setQuestion(index, { required })} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Must be answered</span>
              </div>
            </div>
          ))}
          <Button
            icon={<PlusOutlined />} block style={{ marginBottom: 20 }}
            onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
          >
            Add a question
          </Button>

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
            <Form.Item name="closesAt" label="Closes on" style={{ width: 180 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            name="isAnonymous" label="Collect the answers anonymously" valuePropName="checked"
            extra="Answers are stored with no respondent on them, and cannot be changed afterwards. The school still sees who has and has not replied — kept separately, with no way to join the two."
          >
            <Switch />
          </Form.Item>

          <Alert
            type="info" showIcon
            message="Anonymity protects a respondent in a crowd, not one in a group of three"
            description="If a survey goes to three people and two have replied, it is not hard to work out whose the third answer is. Worth keeping in mind when choosing a small audience."
          />
        </Form>
      </Modal>

      {/* ── Results ── */}
      <Drawer
        width={720} open={!!openId}
        onClose={() => { setOpenId(null); dispatch(clearResults()); }}
        title={results?.title || "Results"}
      >
        {resultsLoading && !results ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : results ? (
          <>
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{results.responseRate}%</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {results.responded} of {results.sentTo} replied
                  </div>
                </div>
                {results.isAnonymous && (
                  <Tag icon={<EyeInvisibleOutlined />}>anonymous</Tag>
                )}
                <Tag>{results.status}</Tag>
              </div>
            </div>

            <Tabs
              activeKey={drawerTab}
              onChange={setDrawerTab}
              items={[
                {
                  key: "summary",
                  label: "Summary",
                  children: results.questions?.length
                    ? results.questions.map((q) => <QuestionResult key={q.key} question={q} />)
                    : <Empty description="No questions" />,
                },
                {
                  key: "pending",
                  label: `Still to reply (${pending?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey="userId" size="small" pagination={{ pageSize: 15 }}
                      dataSource={pending || []}
                      locale={{ emptyText: "Everybody has replied" }}
                      columns={[
                        { title: "Name", dataIndex: "name" },
                        { title: "Role", dataIndex: "role", width: 150 },
                        { title: "Email", dataIndex: "email" },
                      ]}
                    />
                  ),
                },
                {
                  key: "individual",
                  label: "Individual answers",
                  children: responsesError ? (
                    <Alert
                      type="info" showIcon
                      message="Not available for this survey"
                      description={responsesError}
                    />
                  ) : (
                    <Table
                      rowKey="_id" size="small" pagination={{ pageSize: 10 }}
                      dataSource={responses || []}
                      locale={{ emptyText: "No responses yet" }}
                      columns={[
                        { title: "Name", render: (_, r) => r.respondentId?.name || "—" },
                        {
                          title: "When", dataIndex: "submittedAt", width: 170,
                          render: (d) => (d ? dayjs(d).format("D MMM YYYY, h:mm A") : "—"),
                        },
                        {
                          title: "Answers",
                          render: (_, r) => (
                            <div style={{ fontSize: 12 }}>
                              {(r.answers || []).map((a) => {
                                const q = results.questions?.find((x) => x.key === a.questionKey);
                                const shown = Array.isArray(a.value) ? a.value.join(", ")
                                  : typeof a.value === "boolean" ? (a.value ? "Yes" : "No")
                                    : String(a.value);
                                return (
                                  <div key={a.questionKey}>
                                    <span style={{ color: "var(--text-muted)" }}>{q?.text || a.questionKey}: </span>
                                    {shown}
                                  </div>
                                );
                              })}
                            </div>
                          ),
                        },
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

export default SurveysPage;
