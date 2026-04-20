import { Button, Card, Col, List, Row, Space, Tag, Typography, message } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentOnlineExams, startOnlineAttempt, submitOnlineAttempt } from "../../features/examManagementSlice";

export default function StudentOnlineExamPage() {
  const dispatch = useDispatch();
  const { studentOnlineExams, activeAttempt } = useSelector((state) => state.examManagement);

  useEffect(() => { dispatch(fetchStudentOnlineExams({ params: {} })); }, [dispatch]);

  const start = async (examId) => {
    const res = await dispatch(startOnlineAttempt({ body: { examId } }));
    if (!res.error) message.success("Attempt started");
  };

  const submit = async () => {
    if (!activeAttempt?.attempt?._id && !activeAttempt?._id) return;
    const attemptId = activeAttempt?.attempt?._id || activeAttempt?._id;
    const res = await dispatch(submitOnlineAttempt({ body: { attemptId } }));
    if (!res.error) message.success("Attempt submitted");
  };

  return (
    <Row gutter={16}>
      {Object.entries(studentOnlineExams || {}).map(([status, exams]) => (
        <Col key={status} xs={24} md={12} lg={6}>
          <Card title={status.toUpperCase()}>
            <List
              dataSource={exams}
              renderItem={(exam) => (
                <List.Item actions={[<Button key="start" onClick={() => start(exam._id)}>Start</Button>]}> 
                  <Space direction="vertical">
                    <Typography.Text strong>{exam.title}</Typography.Text>
                    <Tag>{exam.settings?.mode || "online"}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      ))}
      <Col span={24} style={{ marginTop: 16 }}>
        <Button type="primary" onClick={submit}>Submit Active Attempt</Button>
      </Col>
    </Row>
  );
}
