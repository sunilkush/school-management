import React from "react";
import { Button, Card, InputNumber, Space, Table, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { evaluateAttempt, getAttempts } from "../../../features/attemptSlice";

const { Title } = Typography;

const TeacherEvaluationPage = () => {
  const dispatch = useDispatch();
  const { attempts = [], loading } = useSelector((state) => state.attempts || {});
  const [marksByAttempt, setMarksByAttempt] = React.useState({});

  React.useEffect(() => {
    dispatch(getAttempts({ status: "submitted", limit: 100 }));
  }, [dispatch]);

  const updateMarks = (attemptId, value) => setMarksByAttempt((prev) => ({ ...prev, [attemptId]: value || 0 }));

  const finalize = async (attempt) => {
    const maxMarks = Number(attempt?.examId?.totalMarks || 100);
    const marks = Math.min(Math.max(Number(marksByAttempt[attempt._id] || 0), 0), maxMarks);
    await dispatch(evaluateAttempt({ attemptId: attempt._id, evaluations: [], grade: marks >= maxMarks * 0.35 ? "PASS" : "FAIL" })).unwrap();
    message.success("Evaluation finalized");
    dispatch(getAttempts({ status: "submitted", limit: 100 }));
  };

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>Teacher Evaluation</Title>
        <Table rowKey="_id" dataSource={attempts}
          columns={[
            { title: "Exam", render: (_, row) => row?.examId?.title || "-" },
            { title: "Student", render: (_, row) => row?.studentId?.name || row?.studentId || "-" },
            { title: "Score", render: (_, row) => <InputNumber min={0} value={marksByAttempt[row._id]} onChange={(v) => updateMarks(row._id, v)} /> },
            { title: "Action", render: (_, row) => <Button type="primary" onClick={() => finalize(row)}>Finalize</Button> },
          ]}
        />
      </Space>
    </Card>
  );
};

export default TeacherEvaluationPage;