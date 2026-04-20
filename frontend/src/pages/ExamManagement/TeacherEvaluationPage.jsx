import { Button, Card, Input, InputNumber, Space, Table, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { evaluateAnswer, fetchPendingEvaluations, finalizeEvaluation } from "../../features/examManagementSlice";

export default function TeacherEvaluationPage() {
  const dispatch = useDispatch();
  const { pendingEvaluations } = useSelector((state) => state.examManagement);
  const [answerId, setAnswerId] = useState("");
  const [marks, setMarks] = useState(0);

  useEffect(() => { dispatch(fetchPendingEvaluations({ params: {} })); }, [dispatch]);

  const markAnswer = async () => {
    const res = await dispatch(evaluateAnswer({ answerId, body: { obtainedMarks: marks } }));
    if (!res.error) message.success("Answer evaluated");
  };

  const finalize = async (attemptId) => {
    const res = await dispatch(finalizeEvaluation({ body: { attemptId } }));
    if (!res.error) message.success("Evaluation finalized");
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Evaluate Subjective Answer">
        <Space>
          <Input value={answerId} onChange={(e) => setAnswerId(e.target.value)} placeholder="Answer ID" />
          <InputNumber value={marks} onChange={(v) => setMarks(v || 0)} min={0} />
          <Button type="primary" onClick={markAnswer}>Save Marks</Button>
        </Space>
      </Card>
      <Card title="Pending Evaluations">
        <Table rowKey="_id" dataSource={pendingEvaluations} columns={[{ title: "Exam", render: (_, row) => row.examId?.title }, { title: "Student", render: (_, row) => row.studentId?.name }, { title: "Action", render: (_, row) => <Button onClick={() => finalize(row._id)}>Finalize</Button> }]} />
      </Card>
    </Space>
  );
}
