import React, { useState } from "react";
import { Button, Card, InputNumber, Select, Space, Table, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import apiClient from "../../../api/httpClient";
import { getExams } from "../../../features/examSlice";

const { Title } = Typography;

const SeatPlanPage = () => {
  const dispatch = useDispatch();
  const { exams = [] } = useSelector((state) => state.exams || {});
  const [examId, setExamId] = useState();
  const [capacity, setCapacity] = useState(30);
  const [data, setData] = useState({ seatPlan: [] });

  React.useEffect(() => { dispatch(getExams()); }, [dispatch]);

  const loadSeatPlan = async () => {
    if (!examId) return message.warning("Select exam first");
    const res = await apiClient.get(`/exams/${examId}/seat-plan?roomCapacity=${capacity}`);
    setData(res?.data?.data || { seatPlan: [] });
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>Seat Plan</Title>
        <Space wrap>
          <Select value={examId} onChange={setExamId} placeholder="Select exam" style={{ width: 260 }}
            options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
          />
          <InputNumber min={1} value={capacity} onChange={setCapacity} addonBefore="Capacity" />
          <Button type="primary" onClick={loadSeatPlan}>Generate</Button>
        </Space>
        <Table rowKey={(r) => `${r.studentId}-${r.seatNumber}`} dataSource={data.seatPlan || []}
          columns={[
            { title: "Room", dataIndex: "roomNumber" },
            { title: "Seat", dataIndex: "seatNumber" },
            { title: "Student", dataIndex: "studentName" },
            { title: "Roll", dataIndex: "rollNumber" },
          ]}
        />
      </Space>
    </Card>
  );
};

export default SeatPlanPage;
