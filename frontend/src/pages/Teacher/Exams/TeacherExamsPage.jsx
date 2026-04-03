import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, InputNumber, message, Space, Table, Tag, Typography, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { enterMarksBulk, getExams, submitFinalMarks } from "../../../features/examSlice";

const { Title, Text } = Typography;

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  const selectedExam = useMemo(() => exams.find((exam) => exam._id === selectedExamId), [exams, selectedExamId]);

  const onMarkChange = (index, value) => {
    setRows((prev) => prev.map((item, idx) => (idx === index ? { ...item, obtainedMarks: value ?? 0 } : item)));
  };

  const addMockRows = () => {
    setRows([
      { studentId: "", studentName: "Student 1", obtainedMarks: 0, totalMarks: selectedExam?.totalMarks || 100, passingMarks: selectedExam?.passingMarks || 33 },
      { studentId: "", studentName: "Student 2", obtainedMarks: 0, totalMarks: selectedExam?.totalMarks || 100, passingMarks: selectedExam?.passingMarks || 33 },
    ]);
  };

  const saveBulk = async () => {
    if (!selectedExamId) return message.error("Select exam first");
    const payloadRows = rows.filter((r) => r.studentId).map((row) => ({ ...row, schoolClassId: selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId, sectionId: selectedExam?.sectionId?._id || selectedExam?.sectionId }));
    if (!payloadRows.length) return message.warning("Please provide valid student IDs before save");

    await dispatch(enterMarksBulk({ examId: selectedExamId, marks: payloadRows })).unwrap();
    message.success("Marks saved");
  };

  const submitFinal = async () => {
    if (!selectedExam) return;
    await dispatch(
      submitFinalMarks({ examId: selectedExam._id, schoolClassId: selectedExam.schoolClassId?._id || selectedExam.schoolClassId, sectionId: selectedExam.sectionId?._id || selectedExam.sectionId })
    ).unwrap();
    message.success("Final marks submitted");
  };

  const columns = [
    { title: "Student", dataIndex: "studentName" },
    { title: "Student ID", dataIndex: "studentId" },
    { title: "Total", dataIndex: "totalMarks" },
    { title: "Passing", dataIndex: "passingMarks" },
    {
      title: "Obtained",
      render: (_, record, index) => (
        <InputNumber min={0} max={record.totalMarks} value={record.obtainedMarks} onChange={(value) => onMarkChange(index, value)} />
      ),
    },
  ];

  const uploadProps = {
    accept: ".json",
    showUploadList: false,
    beforeUpload: async (file) => {
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setRows(parsed);
          message.success("Bulk marks loaded from JSON");
        } else {
          message.error("Invalid JSON format. Expected array.");
        }
      } catch {
        message.error("Unable to parse JSON file");
      }
      return false;
    },
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Title level={4}>Teacher Exam & Marks Entry</Title>
        <Text type="secondary">Select assigned exam, enter marks in editable grid, or bulk upload using JSON.</Text>
      </Card>

      <Card>
        <Space wrap>
          {exams.map((exam) => (
            <Button key={exam._id} type={selectedExamId === exam._id ? "primary" : "default"} onClick={() => setSelectedExamId(exam._id)}>
              {exam.title} <Tag style={{ marginLeft: 8 }}>{exam.schoolClassId?.name || "Class"}</Tag>
            </Button>
          ))}
          {!exams.length && <Empty description="No assigned exams found" />}
        </Space>
      </Card>

      {selectedExamId && (
        <Card loading={loading} title="Marks Entry Table">
          <Space style={{ marginBottom: 12 }}>
            <Button onClick={addMockRows}>Load Grid Template</Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Bulk Upload (JSON)</Button>
            </Upload>
            <Button type="primary" onClick={saveBulk}>Save Marks</Button>
            <Button onClick={submitFinal}>Submit Final Marks</Button>
          </Space>
          <Table rowKey={(row, i) => `${row.studentId || "row"}-${i}`} dataSource={rows} columns={columns} pagination={false} locale={{ emptyText: "Load template or upload file" }} />
        </Card>
      )}
    </Space>
  );
};

export default TeacherExamsPage;
