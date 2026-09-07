import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Drawer, Empty, Form, Input, InputNumber, Modal,
  Progress, Rate, Select, Spin, Table, Tag, message,
} from "antd";
import {
  CheckCircleOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined, TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  clearReview, createCycle, fetchCycles, fetchReview, fetchReviews,
  startCycle, submitReview, updateCycle,
} from "../../features/hrSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const STATUS_COLOR = {
  pending: "var(--text-muted)",
  self_submitted: "var(--accent)",
  reviewed: "var(--warning)",
  finalised: "var(--success)",
};
const STATUS_LABEL = {
  pending: "Not started", self_submitted: "Self-assessed", reviewed: "Reviewed", finalised: "Finalised",
};

const AppraisalPage = () => {
  const dispatch = useDispatch();
  const { cycles, cyclesLoading, reviews, reviewsLoading, review, actionLoading } =
    useSelector((s) => s.hr || {});

  const [cycleForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [cycleModal, setCycleModal] = useState(false);
  const [activeCycle, setActiveCycle] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => { dispatch(fetchCycles()); }, [dispatch]);

  useEffect(() => {
    if (activeCycle) dispatch(fetchReviews({ cycleId: activeCycle }));
  }, [dispatch, activeCycle]);

  const openCycleModal = () => {
    cycleForm.resetFields();
    cycleForm.setFieldsValue({
      selfAssessmentRequired: true,
      criteria: [
        { name: "Teaching quality", weight: 40 },
        { name: "Punctuality & discipline", weight: 20 },
        { name: "Student outcomes", weight: 25 },
        { name: "Contribution beyond class", weight: 15 },
      ],
    });
    setCycleModal(true);
  };

  const saveCycle = async () => {
    const values = await cycleForm.validateFields();
    const [start, end] = values.period || [];
    const res = await dispatch(createCycle({
      name: values.name,
      periodStart: start?.toISOString(),
      periodEnd: end?.toISOString(),
      criteria: values.criteria,
      selfAssessmentRequired: values.selfAssessmentRequired,
    }));
    if (createCycle.fulfilled.match(res)) {
      message.success("Cycle created as a draft");
      setCycleModal(false);
      dispatch(fetchCycles());
    } else {
      message.error(res.payload || "Could not create the cycle");
    }
  };

  const start = async (cycle) => {
    const res = await dispatch(startCycle({ id: cycle._id }));
    if (startCycle.fulfilled.match(res)) {
      message.success(res.payload?.created ? `${res.payload.created} review(s) opened` : "Everyone already has a review");
      dispatch(fetchCycles());
      setActiveCycle(cycle._id);
    } else {
      message.error(res.payload || "Could not start the reviews");
    }
  };

  const close = async (cycle) => {
    const res = await dispatch(updateCycle({ id: cycle._id, status: "closed" }));
    if (updateCycle.fulfilled.match(res)) { message.success("Cycle closed"); dispatch(fetchCycles()); }
    else message.error(res.payload || "Could not close the cycle");
  };

  const openReview = async (row) => {
    setReviewingId(row._id);
    const res = await dispatch(fetchReview(row._id));
    if (fetchReview.fulfilled.match(res)) {
      const criteria = res.payload?.cycleId?.criteria || [];
      const existing = new Map((res.payload?.reviewerScores || []).map((s) => [s.criterion, s]));
      reviewForm.setFieldsValue({
        scores: criteria.map((c) => ({
          criterion: c.name,
          score: existing.get(c.name)?.score ?? 3,
          comment: existing.get(c.name)?.comment ?? "",
        })),
        comment: res.payload?.reviewerComment || "",
        goals: (res.payload?.goals || []).join("\n"),
      });
    }
  };

  const saveReview = async (finalise) => {
    const values = await reviewForm.validateFields();
    const res = await dispatch(submitReview({
      id: reviewingId,
      scores: values.scores,
      comment: values.comment,
      goals: (values.goals || "").split("\n").map((g) => g.trim()).filter(Boolean),
      finalise,
    }));
    if (submitReview.fulfilled.match(res)) {
      message.success(finalise ? "Appraisal finalised" : "Review saved");
      setReviewingId(null);
      dispatch(clearReview());
      dispatch(fetchReviews({ cycleId: activeCycle }));
      dispatch(fetchCycles());
    } else {
      message.error(res.payload || "Could not save the review");
    }
  };

  const cycleColumns = [
    {
      title: "Cycle", dataIndex: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {dayjs(r.periodStart).format("MMM YYYY")} – {dayjs(r.periodEnd).format("MMM YYYY")} · {r.criteria?.length || 0} criteria
          </div>
        </div>
      ),
    },
    {
      title: "Progress", width: 220,
      render: (_, r) => {
        const total = r.progress?.total || 0;
        const done = r.progress?.finalised || 0;
        return total ? (
          <div>
            <Progress percent={Math.round((done / total) * 100)} size="small" />
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{done} of {total} finalised</div>
          </div>
        ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>not started</span>;
      },
    },
    {
      title: "Average", width: 110, align: "right",
      render: (_, r) => (r.progress?.averageScore != null
        ? <b>{r.progress.averageScore} / 5</b>
        : <span style={{ color: "var(--text-muted)" }}>—</span>),
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (s) => <span style={pill(s === "open" ? "var(--success)" : s === "draft" ? "var(--text-muted)" : "var(--text-secondary)")}>{s}</span>,
    },
    {
      title: "", width: 240, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {r.status !== "closed" && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} loading={actionLoading} onClick={() => start(r)}>
              {r.status === "draft" ? "Open & create reviews" : "Create missing reviews"}
            </Button>
          )}
          <Button size="small" onClick={() => setActiveCycle(r._id)}>Reviews</Button>
          {r.status === "open" && <Button size="small" onClick={() => close(r)}>Close</Button>}
        </div>
      ),
    },
  ];

  const reviewColumns = [
    {
      title: "Staff member",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.employeeId?.userId?.name || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.employeeId?.userId?.email || ""}</div>
        </div>
      ),
    },
    {
      title: "Status", dataIndex: "status", width: 140,
      render: (s) => <span style={pill(STATUS_COLOR[s])}>{STATUS_LABEL[s]}</span>,
    },
    {
      title: "Score", width: 170, align: "right",
      render: (_, r) => (r.overallScore != null
        ? <div><b>{r.overallScore} / 5</b><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.overallBand}</div></div>
        : <span style={{ color: "var(--text-muted)" }}>—</span>),
    },
    {
      title: "", width: 110, align: "right",
      render: (_, r) => (
        <Button size="small" type={r.status === "finalised" ? "default" : "primary"} onClick={() => openReview(r)}>
          {r.status === "finalised" ? "View" : "Review"}
        </Button>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("appraisal-table")}</style>

      <PageHeader
        title="Staff Appraisal"
        subtitle="Review rounds, self-assessments and ratings"
        icon={<TrophyOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchCycles())} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCycleModal}>New cycle</Button>
          </div>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 14 }}
        message="Appraisals are not linked to payroll"
        description="A rating here does not change anybody's salary. Increments stay a decision somebody makes, with this as the evidence for it."
      />

      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Review cycles</div>
        {cyclesLoading && !cycles?.length ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : !cycles?.length ? (
          <div style={emptyState}>
            <Empty description="No appraisal cycle yet" />
            <p style={{ color: "var(--text-muted)", maxWidth: 460, margin: "12px auto" }}>
              A cycle sets the period and the criteria everyone is scored against. Criteria are
              fixed once it opens, so everyone in a round is measured against the same things.
            </p>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCycleModal}>Create one</Button>
          </div>
        ) : (
          <div style={tableContainer}>
            <Table className="appraisal-table" rowKey="_id" size="middle" pagination={false}
                   columns={cycleColumns} dataSource={cycles} />
          </div>
        )}
      </div>

      {activeCycle && (
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Reviews in this cycle</div>
          <div style={tableContainer}>
            <Table
              className="appraisal-table" rowKey="_id" size="middle" loading={reviewsLoading}
              columns={reviewColumns} dataSource={reviews}
              pagination={{ pageSize: 20, showSizeChanger: false }}
            />
          </div>
        </div>
      )}

      {/* ── New cycle ── */}
      <Modal
        open={cycleModal} width={640} title="New appraisal cycle"
        onCancel={() => setCycleModal(false)} onOk={saveCycle}
        confirmLoading={actionLoading} okText="Create draft"
      >
        <Form form={cycleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Give the cycle a name" }]}>
            <Input placeholder="Annual Review 2025-26" />
          </Form.Item>
          <Form.Item name="period" label="Period under review" rules={[{ required: true, message: "Pick the period" }]}>
            <RangePicker style={{ width: "100%" }} picker="date" />
          </Form.Item>
          <Form.Item name="selfAssessmentRequired" label="Ask staff to score themselves first" valuePropName="checked">
            <Select options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
          </Form.Item>

          <div style={{ fontWeight: 700, marginBottom: 4 }}>Criteria</div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 0 }}>
            Weights must add up to 100 before the cycle can be opened — otherwise scores cannot be
            compared between staff, which is the whole point of running a round.
          </p>
          <Form.List name="criteria">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: "flex", gap: 8 }}>
                    <Form.Item {...rest} name={[name, "name"]} style={{ flex: 1 }} rules={[{ required: true, message: "Name it" }]}>
                      <Input placeholder="Teaching quality" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "weight"]} style={{ width: 110 }} rules={[{ required: true }]}>
                      <InputNumber min={1} max={100} addonAfter="%" style={{ width: "100%" }} />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>×</Button>
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ weight: 10 })}>
                  Add criterion
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* ── Review drawer ── */}
      <Drawer
        width={620} open={!!reviewingId}
        onClose={() => { setReviewingId(null); dispatch(clearReview()); }}
        title={review?.employeeId?.userId?.name || "Review"}
        extra={
          review?.status !== "finalised" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Button loading={actionLoading} onClick={() => saveReview(false)}>Save</Button>
              <Button type="primary" loading={actionLoading} onClick={() => saveReview(true)}>Finalise</Button>
            </div>
          ) : <Tag color="green">Finalised</Tag>
        }
      >
        {!review ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : (
          <>
            {review.status === "finalised" && (
              <Alert type="success" showIcon style={{ marginBottom: 16 }}
                     message={`${review.overallScore} / 5 — ${review.overallBand}`}
                     description="A finalised appraisal cannot be changed. Reopen the cycle if it is wrong." />
            )}

            {review.selfScores?.length > 0 && (
              <div style={{ ...sectionPanel, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>What they said about themselves</div>
                {review.selfScores.map((s) => (
                  <div key={s.criterion} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{s.criterion}</span>
                    <b>{s.score} / 5</b>
                  </div>
                ))}
                {review.selfComment && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontStyle: "italic" }}>
                    “{review.selfComment}”
                  </div>
                )}
              </div>
            )}

            {review.gaps?.length > 0 && (
              <Alert
                type="warning" showIcon style={{ marginBottom: 16 }}
                message="Where you and they see it differently"
                description={
                  <div style={{ fontSize: 13 }}>
                    {review.gaps.slice(0, 3).map((g) => (
                      <div key={g.criterion}>
                        <b>{g.criterion}</b> — they said {g.self}, you said {g.reviewer}
                      </div>
                    ))}
                    <div style={{ marginTop: 6, color: "var(--text-muted)" }}>
                      This is usually the conversation worth having.
                    </div>
                  </div>
                }
              />
            )}

            <Form form={reviewForm} layout="vertical" disabled={review.status === "finalised"}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Your scores</div>
              <Form.List name="scores">
                {(fields) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} style={{ marginBottom: 14 }}>
                        <Form.Item {...rest} name={[name, "criterion"]} hidden><Input /></Form.Item>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          {reviewForm.getFieldValue(["scores", name, "criterion"])}
                        </div>
                        <Form.Item {...rest} name={[name, "score"]} style={{ marginBottom: 6 }}>
                          <Rate count={5} />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "comment"]} style={{ marginBottom: 0 }}>
                          <Input placeholder="Optional note" size="small" />
                        </Form.Item>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>

              <Form.Item name="comment" label="Overall comment">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item name="goals" label="Agreed goals" extra="One per line. The part staff actually remember.">
                <TextArea rows={3} />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default AppraisalPage;
