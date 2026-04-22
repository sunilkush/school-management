import React, { useState } from "react";
import { Button, Card, InputNumber, Select, Space, Table, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { getExams, getSeatPlan } from "../../../features/examSlice";

const { Title } = Typography;

const SeatPlanPage = () => {
  const dispatch = useDispatch();
  const { exams = [], seatPlan, loading } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const [examId, setExamId] = useState();
  const [capacity, setCapacity] = useState(30);
  const [data, setData] = useState({ seatPlan: [] });

  const effectiveAcademicYear = React.useMemo(() => {
    if (selectedAcademicYear?._id) return selectedAcademicYear;
    
  }, [selectedAcademicYear]);

  React.useEffect(() => {
    if (!effectiveAcademicYear?._id) return;
    dispatch(getExams({
      schoolId: effectiveAcademicYear.schoolId,
      academicYearId: effectiveAcademicYear._id,
      limit: 100,
    }));
  }, [dispatch, effectiveAcademicYear]);

  React.useEffect(() => {
    if (seatPlan?.seatPlan) {
      setData(seatPlan);
    }
  }, [seatPlan]);

  const loadSeatPlan = async () => {
    if (!examId) return message.warning("Select exam first");
    const res = await dispatch(getSeatPlan({ examId, roomCapacity: capacity }));
    if (res.meta.requestStatus === "rejected") {
      return message.error(res.payload || "Unable to generate seat plan");
    }
    setData(res.payload || { seatPlan: [] });
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
        <Table rowKey={(r) => `${r.studentId}-${r.seatNumber}`} dataSource={data.seatPlan || []} loading={loading}
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
