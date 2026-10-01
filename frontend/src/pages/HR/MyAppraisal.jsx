import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Empty, Form, Input, Rate, Spin, Steps, Tag, message } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyReview, submitSelfAssessment } from "../../features/hrSlice";
import PageHeader from "../../components/layout/PageHeader";

const { TextArea } = Input;

const cell = { padding: "8px 10px", borderTop: "1px solid var(--border-muted)", verticalAlign: "middle" };
const head = { padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" };

/**
 * A member of staff's own appraisal, on one compact page: where the round is (self-assessment →
 * review → final), the criteria in one table, and the result once it is final.
 *
 * Deliberately shows nothing of the reviewer's side until the appraisal is finalised — a
 * half-filled reviewer form seen early is worse than no form at all.
 */
const MyAppraisal = () => {
  const dispatch = useDispatch();
  const { myReview, myReviewLoading, actionLoading } = useSelector((s) => s.hr || {});
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchMyReview()); }, [dispatch]);

  const criteria = myReview?.cycleId?.criteria || [];

  useEffect(() => {
    if (!myReview) return;
    const existing = new Map((myReview.selfScores || []).map((s) => [s.criterion, s]));
    form.setFieldsValue({
      scores: (myReview.cycleId?.criteria || []).map((c) => ({
        criterion: c.name,
        // No default: a pre-filled 3 is an answer nobody gave.
        score: existing.get(c.name)?.score,
        comment: existing.get(c.name)?.comment ?? "",
      })),
      comment: myReview.selfComment || "",
    });
  }, [myReview, form]);

  const submit = async () => {
    const values = await form.validateFields();
    if ((values.scores || []).some((s) => !s.score)) {
      message.warning("Give yourself a rating on every criterion");
      return;
    }
    const res = await dispatch(submitSelfAssessment({ id: myReview._id, scores: values.scores, comment: values.comment }));
    if (submitSelfAssessment.fulfilled.match(res)) {
      message.success("Self-assessment submitted");
      dispatch(fetchMyReview());
    } else {
      message.error(res.payload || "Could not submit");
    }
  };

  if (myReviewLoading && !myReview) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  const finalised = myReview?.status === "finalised";
  const selfDone = Boolean(myReview?.selfSubmittedAt);
  const step = finalised ? 3 : selfDone ? 1 : 0;
  const selfByName = new Map((myReview?.selfScores || []).map((s) => [s.criterion, s]));
  const reviewerByName = new Map((myReview?.reviewerScores || []).map((s) => [s.criterion, s]));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Appraisal"
        subtitle={myReview?.cycleId?.name
          ? `${myReview.cycleId.name} · ${myReview.cycleId.periodStart ? dayjs(myReview.cycleId.periodStart).format("MMM YYYY") : ""} – ${myReview.cycleId.periodEnd ? dayjs(myReview.cycleId.periodEnd).format("MMM YYYY") : ""}`
          : "Your yearly performance review"}
        icon={<TrophyOutlined />}
      />

      {!myReview ? (
        <div className="empty-state">
          <Empty description="No appraisal open. When the school starts a staff appraisal cycle, you score yourself on each criterion here, your reviewer scores you separately, and the final result is shown on this page." />
        </div>
      ) : (
        <>
          <div className="section-panel" style={{ marginTop: 16, padding: "12px 14px" }}>
            <Steps
              size="small" current={step}
              items={[
                { title: "Self-assessment", description: selfDone ? `Sent ${dayjs(myReview.selfSubmittedAt).format("D MMM")}` : "Rate yourself" },
                { title: "Review", description: myReview.reviewerId?.name ? `By ${myReview.reviewerId.name}` : "By your reviewer" },
                { title: "Final", description: finalised ? "Result below" : "After the review" },
              ]}
            />
          </div>

          {finalised && (
            <div className="section-panel" style={{ marginTop: 12, padding: 14, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", minWidth: 96 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "var(--success)", lineHeight: 1 }}>{myReview.overallScore}<span style={{ fontSize: 14, color: "var(--text-muted)" }}> / 5</span></div>
                <Tag color="green" style={{ margin: "6px 0 0" }}>{myReview.overallBand}</Tag>
              </div>
              <div style={{ flex: 1, minWidth: 220, fontSize: 13 }}>
                <div className="u-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Reviewer&apos;s comment</div>
                {myReview.reviewerComment || "Your appraisal has been finalised."}
              </div>
            </div>
          )}

          <div className="section-panel" style={{ marginTop: 12, padding: 14 }}>
            {!finalised && (
              <div className="u-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Score yourself honestly: your reviewer scores the same criteria separately, and where the two differ is what the appraisal conversation is about.
              </div>
            )}
            <Form form={form} component={false}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={head}>Criterion</th>
                      <th style={{ ...head, width: 60 }}>Weight</th>
                      <th style={{ ...head, width: 150 }}>{finalised ? "You" : "Your rating"}</th>
                      {finalised
                        ? <th style={{ ...head, width: 150 }}>Reviewer</th>
                        : <th style={head}>Note for your reviewer</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((c, i) => {
                      const mine = selfByName.get(c.name);
                      const theirs = reviewerByName.get(c.name);
                      return (
                        <tr key={c.name}>
                          <td style={cell}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                            {c.description ? <div className="u-muted" style={{ fontSize: 11 }}>{c.description}</div> : null}
                            {finalised && theirs?.comment ? <div style={{ fontSize: 12, marginTop: 2 }}>{theirs.comment}</div> : null}
                          </td>
                          <td style={{ ...cell, fontSize: 12 }} className="u-muted">{c.weight}%</td>
                          {finalised ? (
                            <>
                              <td style={cell}>{mine ? <Rate disabled value={mine.score} style={{ fontSize: 14 }} /> : <span className="u-muted">—</span>}</td>
                              <td style={cell}>
                                {theirs ? <Rate disabled value={theirs.score} style={{ fontSize: 14 }} /> : <span className="u-muted">—</span>}
                                {mine && theirs && mine.score !== theirs.score && (
                                  <div style={{ fontSize: 11, color: theirs.score > mine.score ? "var(--success)" : "var(--warning)" }}>
                                    {theirs.score > mine.score ? "+" : ""}{theirs.score - mine.score} vs yours
                                  </div>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={cell}>
                                <Form.Item name={["scores", i, "criterion"]} hidden><Input /></Form.Item>
                                <Form.Item name={["scores", i, "score"]} noStyle><Rate count={5} style={{ fontSize: 18 }} /></Form.Item>
                              </td>
                              <td style={cell}>
                                <Form.Item name={["scores", i, "comment"]} noStyle>
                                  <Input size="small" placeholder="Optional" />
                                </Form.Item>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!finalised && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Anything else about your year</div>
                    <Form.Item name="comment" noStyle>
                      <TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Achievements, difficulties, what you want to work on" />
                    </Form.Item>
                  </div>
                  <Button type="primary" loading={actionLoading} onClick={submit}>
                    {selfDone ? "Update self-assessment" : "Submit self-assessment"}
                  </Button>
                </div>
              )}
            </Form>

            {finalised && myReview.selfComment ? (
              <div style={{ fontSize: 12, marginTop: 10 }} className="u-muted">Your note: {myReview.selfComment}</div>
            ) : null}
          </div>

          {finalised && myReview.goals?.length > 0 && (
            <div className="section-panel" style={{ marginTop: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Agreed goals</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                {myReview.goals.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAppraisal;
