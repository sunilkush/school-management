import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Form, Input, Rate, Spin, Tag, message } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyReview, submitSelfAssessment } from "../../features/hrSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, sectionPanel } from "../../styles/pageStyles";

const { TextArea } = Input;

/**
 * A member of staff's own appraisal.
 *
 * Deliberately shows nothing of the reviewer's side until the appraisal is finalised — a
 * half-filled reviewer form seen early is worse than no form at all.
 */
const MyAppraisal = () => {
  const dispatch = useDispatch();
  const { myReview, myReviewLoading, actionLoading } = useSelector((s) => s.hr || {});
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchMyReview()); }, [dispatch]);

  useEffect(() => {
    if (!myReview) return;
    const criteria = myReview.cycleId?.criteria || [];
    const existing = new Map((myReview.selfScores || []).map((s) => [s.criterion, s]));
    form.setFieldsValue({
      scores: criteria.map((c) => ({
        criterion: c.name,
        score: existing.get(c.name)?.score ?? 3,
        comment: existing.get(c.name)?.comment ?? "",
      })),
      comment: myReview.selfComment || "",
    });
  }, [myReview, form]);

  const submit = async () => {
    const values = await form.validateFields();
    const res = await dispatch(submitSelfAssessment({
      id: myReview._id,
      scores: values.scores,
      comment: values.comment,
    }));
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

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Appraisal"
        subtitle={myReview?.cycleId?.name || "Your review"}
        icon={<TrophyOutlined />}
      />

      {!myReview ? (
        <div style={emptyState}>
          <Empty description="You have no appraisal open" />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
            One will appear here when the school starts its next review round.
          </p>
        </div>
      ) : (
        <>
          <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{myReview.cycleId?.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {myReview.cycleId?.periodStart && dayjs(myReview.cycleId.periodStart).format("MMM YYYY")}
                {" – "}
                {myReview.cycleId?.periodEnd && dayjs(myReview.cycleId.periodEnd).format("MMM YYYY")}
              </div>
            </div>
            <Tag color={myReview.status === "finalised" ? "green" : myReview.selfSubmittedAt ? "blue" : "default"}>
              {myReview.status === "finalised" ? "Finalised" : myReview.selfSubmittedAt ? "Self-assessment submitted" : "Not started"}
            </Tag>
          </div>

          {myReview.status === "finalised" ? (
            <>
              <Alert
                type="success" showIcon style={{ marginBottom: 16, borderRadius: 14 }}
                message={`${myReview.overallScore} / 5 — ${myReview.overallBand}`}
                description={myReview.reviewerComment || "Your appraisal has been finalised."}
              />
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>How you were scored</div>
                {(myReview.reviewerScores || []).map((s) => (
                  <div key={s.criterion} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{s.criterion}</span>
                      <b>{s.score} / 5</b>
                    </div>
                    {s.comment && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.comment}</div>}
                  </div>
                ))}
              </div>
              {myReview.goals?.length > 0 && (
                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Agreed goals</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                    {myReview.goals.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <Alert
                type="info" showIcon style={{ marginBottom: 16, borderRadius: 14 }}
                message="Score yourself honestly"
                description="Your reviewer scores the same criteria separately. Where the two differ is what the appraisal conversation is actually about — so this is not a form to talk yourself up on."
              />

              <div style={sectionPanel}>
                <Form form={form} layout="vertical">
                  <Form.List name="scores">
                    {(fields) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <div key={key} style={{ marginBottom: 18 }}>
                            <Form.Item {...rest} name={[name, "criterion"]} hidden><Input /></Form.Item>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                              {form.getFieldValue(["scores", name, "criterion"])}
                            </div>
                            <Form.Item {...rest} name={[name, "score"]} style={{ marginBottom: 6 }}>
                              <Rate count={5} />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, "comment"]} style={{ marginBottom: 0 }}>
                              <Input placeholder="Anything you want your reviewer to know" size="small" />
                            </Form.Item>
                          </div>
                        ))}
                      </>
                    )}
                  </Form.List>

                  <Form.Item name="comment" label="Anything else about your year">
                    <TextArea rows={4} />
                  </Form.Item>

                  <Button type="primary" loading={actionLoading} onClick={submit}>
                    {myReview.selfSubmittedAt ? "Update my self-assessment" : "Submit self-assessment"}
                  </Button>
                </Form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyAppraisal;
