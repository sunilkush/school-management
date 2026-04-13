import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  InputNumber,
  message,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { enterMarksBulk, getExams, submitFinalMarks } from "../../../features/examSlice";
import { fetchAllStudentByRole } from "../../../features/studentSlice";

const { Title, Text } = Typography;

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { studentList = [], loading: studentLoading } = useSelector((state) => state.students || {});
  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [rows, setRows] = useState([]);

  const selectedExam = useMemo(() => exams.find((exam) => exam._id === selectedExamId), [exams, selectedExamId]);
  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  useEffect(() => {
    const schoolClassId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!selectedExamId || !schoolClassId || !schoolId || !academicYearId) {
      setRows([]);
      return;
    }

    dispatch(fetchAllStudentByRole({ schoolId, academicYearId, schoolClassId }));
  }, [dispatch, selectedExamId, selectedExam, schoolId, academicYearId]);

  useEffect(() => {
    if (!selectedExamId) return;

    const selectedClassId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!studentList.length || !selectedClassId) {
      setRows([]);
      return;
    }

    const classMatchedStudents = studentList.filter((student) => {
      const studentClassId =
        student?.schoolClassId?._id ||
        student?.schoolClass?._id ||
        student?.studentInfo?.schoolClassId ||
        student?.enrollment?.schoolClassId;

      return `${studentClassId || ""}` === `${selectedClassId}`;
    });

    setRows(
      classMatchedStudents.map((student, index) => ({
        studentId: student?.student?._id || student?.studentInfo?._id,
        studentName: student?.user?.name || student?.userDetails?.name || `Student ${index + 1}`,
        sectionId: student?.section?._id || student?.sectionDetails?._id,
        obtainedMarks: 0,
        totalMarks: selectedExam?.totalMarks || 100,
        passingMarks: selectedExam?.passingMarks || 33,
      }))
    );
  }, [selectedExamId, selectedExam, studentList]);

  const onMarkChange = (studentId, value) => {
    setRows((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, obtainedMarks: value ?? 0 } : item))
    );
  };

  const saveBulk = async () => {
    if (!selectedExamId) return message.error("Select exam first");

    const payloadRows = rows
      .filter((row) => row.studentId)
      .map((row) => ({
        ...row,
        schoolClassId: selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId,
        sectionId: row.sectionId || selectedExam?.sectionId?._id || selectedExam?.sectionId,
      }));

    if (!payloadRows.length) return message.warning("No valid students found for this class");

    try {
      await dispatch(enterMarksBulk({ examId: selectedExamId, marks: payloadRows })).unwrap();
      message.success("Marks saved");
    } catch (error) {
      message.error(error || "Failed to save marks");
    }
  };

  const submitFinal = async () => {
    if (!selectedExam) return;
    try {
      await dispatch(
        submitFinalMarks({
          examId: selectedExam._id,
          schoolClassId: selectedExam.schoolClassId?._id || selectedExam.schoolClassId,
          sectionId: selectedExam.sectionId?._id || selectedExam.sectionId,
        })
      ).unwrap();
      message.success("Final marks submitted");
    } catch (error) {
      message.error(error || "Failed to submit final marks");
    }
  };

  const columns = [
    { title: "Student", dataIndex: "studentName" },
    { title: "Student ID", dataIndex: "studentId" },
    { title: "Total", dataIndex: "totalMarks", width: 90 },
    { title: "Passing", dataIndex: "passingMarks", width: 90 },
    {
      title: "Obtained",
      width: 170,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.totalMarks}
          value={record.obtainedMarks}
          onChange={(value) => onMarkChange(record.studentId, value)}
        />
      ),
    },
    {
      title: "Status",
      width: 120,
      render: (_, record) => (
        <Tag color={record.obtainedMarks >= record.passingMarks ? "green" : "red"}>
          {record.obtainedMarks >= record.passingMarks ? "PASS" : "FAIL"}
        </Tag>
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

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const entered = rows.filter((row) => row.obtainedMarks !== undefined).length;
    const passCount = rows.filter((row) => row.obtainedMarks >= row.passingMarks).length;
    return {
      entered,
      passCount,
      total: rows.length,
    };
  }, [rows]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card>
        <Title level={4}>Teacher Exam & Marks Entry</Title>
        <Text type="secondary">Exam select karo, class students auto-load honge, marks enter karke direct save/final submit karo.</Text>
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
        <Card loading={loading || studentLoading} title="Marks Entry Table">
          <Space wrap style={{ marginBottom: 12 }}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Bulk Upload (JSON)</Button>
            </Upload>
            <Button type="primary" onClick={saveBulk}>Save Marks</Button>
            <Button onClick={submitFinal}>Submit Final Marks</Button>
          </Space>

          {summary && (
            <Space wrap size="large" style={{ marginBottom: 12 }}>
              <Statistic title="Students" value={summary.total} />
              <Statistic title="Marks Entered" value={summary.entered} />
              <Statistic title="Pass Count" value={summary.passCount} />
            </Space>
          )}

          <Table
            rowKey={(row, i) => `${row.studentId || "row"}-${i}`}
            dataSource={rows}
            columns={columns}
            pagination={false}
            locale={{ emptyText: "No students found for selected exam class" }}
          />
        </Card>
      )}
    </Space>
  );
};

export default TeacherExamsPage;
