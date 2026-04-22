import React, { useState } from "react";
import { Button, Card, Select, Space, Table, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { getExams,getAdmitCards } from "../../../features/examSlice";

const { Title } = Typography;

const AdmitCardPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const [examId, setExamId] = useState();
  const [rows, setRows] = useState([]);

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

  const loadCards = async () => {
    if (!examId) return message.warning("Select exam first");
    const res = await dispatch(getAdmitCards(examId));
    if (res.payload) {
      setRows(res.payload);
    }
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
        <Table rowKey={(r) => `${r.studentId}-${r.seatNumber}`} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }}
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