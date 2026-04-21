import React, { useState } from "react";
import { Button, Card, Select, Space, Table, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import apiClient from "../../../api/httpClient";
import { getExams } from "../../../features/examSlice";

const { Title } = Typography;

const AdmitCardPage = () => {
  const dispatch = useDispatch();
  const { exams = [] } = useSelector((state) => state.exams || {});
  const [examId, setExamId] = useState();
  const [rows, setRows] = useState([]);

  React.useEffect(() => { dispatch(getExams()); }, [dispatch]);

  const loadCards = async () => {
    if (!examId) return message.warning("Select exam first");
    const res = await apiClient.get(`/exams/${examId}/admit-cards`);
    setRows(res?.data?.data || []);
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>Admit Card</Title>
        <Space wrap>
          <Select value={examId} onChange={setExamId} placeholder="Select exam" style={{ width: 300 }}
            options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
          />
          <Button type="primary" onClick={loadCards}>Generate</Button>
        </Space>
        <Table rowKey={(r) => `${r.studentId}-${r.seatNumber}`} dataSource={rows} pagination={{ pageSize: 10 }}
          columns={[
            { title: "Student", dataIndex: "studentName" },
            { title: "Roll No", dataIndex: "rollNumber" },
            { title: "Seat No", dataIndex: "seatNumber" },
            { title: "Exam", dataIndex: "examTitle" },
          ]}
        />
      </Space>
    </Card>
  );
};

export default AdmitCardPage;
