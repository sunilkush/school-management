import React, { useEffect, useState } from "react";
import { Button, Card, InputNumber, Space, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvaluationDetail, fetchPendingEvaluations, finalizeSubjectiveEvaluation, gradeSubjectiveAnswers } from "../../features/exam/subjectiveEvaluationSlice";
import { useParams } from "react-router-dom";

export const SubjectiveEvaluationListPage = () => {
  const dispatch = useDispatch();
  const { pending, loading } = useSelector((s) => s.subjectiveEvaluation || {});
  useEffect(() => { dispatch(fetchPendingEvaluations()); }, [dispatch]);
  return (
    <Card title="Pending Subjective Evaluations">
      <Table rowKey="_id" loading={loading} dataSource={pending || []} columns={[{ title: "Attempt", dataIndex: "_id" }, { title: "Exam", dataIndex: "examId" }, { title: "Student", dataIndex: "studentId" }, { title: "Status", dataIndex: "evaluationStatus" }]} />
    </Card>
  );
};

export const SubjectiveEvaluationDetailPage = () => {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const { detail } = useSelector((s) => s.subjectiveEvaluation || {});
  const [grades, setGrades] = useState({});

  useEffect(() => { dispatch(fetchEvaluationDetail(attemptId)); }, [dispatch, attemptId]);
  const pending = (detail?.responses || []).filter((row) => ["Short Answer", "Long Answer", "Subjective", "Case Study"].includes(row?.questionId?.questionType));
  const saveGrades = async () => {
    const evaluations = pending
      .filter((p) => p?.questionId?._id)
      .map((p) => ({ questionId: p.questionId._id, marksObtained: Number(grades[p.questionId._id] || 0) }));
    await dispatch(gradeSubjectiveAnswers({ attemptId, evaluations }));
    dispatch(fetchEvaluationDetail(attemptId));
  };
  return (
    <Card title="Grade Subjective Responses">
      <Space direction="vertical" style={{ width: "100%" }}>
        {pending.map((row) => (
          <Card key={row._id} type="inner" title={row?.questionId?.questionText || "Question"}>
            <p><strong>Answer:</strong> {row.answerText || "N/A"}</p>
            <InputNumber
              min={0}
              value={grades[row?.questionId?._id]}
              onChange={(value) => {
                if (!row?.questionId?._id) return;
                setGrades((prev) => ({ ...prev, [row.questionId._id]: value }));
              }}
            />
          </Card>
        ))}
        <Space>
          <Button type="primary" onClick={saveGrades}>Save Grading</Button>
          <Button onClick={() => dispatch(finalizeSubjectiveEvaluation(attemptId))}>Finalize Evaluation</Button>
        </Space>
      </Space>
    </Card>
  );
};
