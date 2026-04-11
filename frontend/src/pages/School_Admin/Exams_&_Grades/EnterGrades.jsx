import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { getExams, enterMarksBulk } from "../../../features/examSlice";
import { fetchAllStudent } from "../../../features/studentSlice";


const { Title, Text } = Typography;
const { Option } = Select;

const EnterGrades = () => {
  const dispatch = useDispatch();

  const [selectedClass, setSelectedClass] = useState(undefined);
  const [selectedExam, setSelectedExam] = useState(undefined);
  const [selectedSubject, setSelectedSubject] = useState(undefined);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);

  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const { exams = [], loading: examsLoading = false } = useSelector(
    (state) => state.exams || {}
  );
  const { studentList = [], loading: studentsLoading = false } = useSelector(
    (state) => state.students || {}
  );

  

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id ;

  useEffect(() => {
    if (!schoolId || !academicYearId) return;

    dispatch(getClassData({ schoolId, academicYearId }));
    dispatch(getExams({ schoolId, academicYearId, limit: 100 }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    dispatch(fetchAllStudent({ schoolId, academicYearId, schoolClassId: selectedClass }));
  }, [dispatch, selectedClass, schoolId, academicYearId]);

  useEffect(() => {
    setSelectedExam(undefined);
    setSelectedSubject(undefined);
    setGrades({});
  }, [selectedClass]);

  useEffect(() => {
    const exam = exams.find((item) => item?._id === selectedExam);
    setSelectedSubject(exam?.subjectId?._id || exam?.subjectId || undefined);
    setGrades({});
  }, [selectedExam, exams]);

  const filteredExams = useMemo(
    () => exams.filter((item) => (item?.schoolClassId?._id || item?.schoolClassId) === selectedClass),
    [exams, selectedClass]
  );

  const selectedExamRecord = useMemo(
    () => exams.find((item) => item._id === selectedExam),
    [exams, selectedExam]
  );

  const subjectOptions = useMemo(() => {
    if (!selectedClass) return [];

    const selectedClassData = schoolClasses.find((item) => item._id === selectedClass);
    const allSubjects = (selectedClassData?.sections || []).flatMap(
      (section) => section?.subjects || []
    );

    return Array.from(new Map(allSubjects.map((item) => [item._id, item])).values());
  }, [selectedClass, schoolClasses]);

  const tableData = useMemo(
    () =>
      studentList.map((student, index) => ({
        id: student?.studentInfo?._id,
        rollNo: student?.registrationNumber || index + 1,
        name: student?.userDetails?.name || "N/A",
        sectionId: student?.sectionDetails?._id,
      })),
    [studentList]
  );

  const handleGradeChange = (studentId, value) => {
    setGrades((prev) => ({ ...prev, [studentId]: value }));
  };

  const summary = useMemo(() => {
    const values = Object.values(grades).filter((value) => value !== undefined);
    if (!values.length) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      entered: values.length,
      average: avg.toFixed(2),
    };
  }, [grades]);

  const columns = [
    {
      title: "Roll No",
      dataIndex: "rollNo",
      width: 110,
    },
    {
      title: "Student Name",
      dataIndex: "name",
    },
    {
      title: `Marks (out of ${selectedExamRecord?.totalMarks || 100})`,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={selectedExamRecord?.totalMarks || 100}
          value={grades[record.id]}
          style={{ width: 140 }}
          placeholder="Enter"
          onChange={(value) => handleGradeChange(record.id, value)}
        />
      ),
    },
    {
      title: "Grade",
      render: (_, record) => {
        const mark = grades[record.id];
        if (mark === undefined) return "-";

        if (mark >= 90) return <Tag color="green">A+</Tag>;
        if (mark >= 75) return <Tag color="blue">A</Tag>;
        if (mark >= 60) return <Tag color="orange">B</Tag>;
        return <Tag color="red">C</Tag>;
      },
    },
  ];

  const isReady = Boolean(selectedClass && selectedExam && selectedSubject);

  const handleSubmit = async () => {
    if (!isReady) {
      message.warning("Please select class, exam & subject");
      return;
    }

    const marks = tableData
      .filter((student) => grades[student.id] !== undefined)
      .map((student) => ({
        studentId: student.id,
        schoolClassId: selectedClass,
        sectionId: student.sectionId,
        subjectId: selectedSubject,
        totalMarks: selectedExamRecord?.totalMarks || 100,
        passingMarks: selectedExamRecord?.passingMarks || 33,
        obtainedMarks: Number(grades[student.id]),
      }));

    if (!marks.length) {
      message.warning("Please enter at least one student mark");
      return;
    }

    try {
      setSaving(true);
      await dispatch(enterMarksBulk({ examId: selectedExam, marks })).unwrap();
      message.success("Grades saved successfully");
    } catch (error) {
      message.error(error || "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card bordered={false}>
      <Title level={4}>📝 Enter Student Grades</Title>
      <Text type="secondary">Select class, exam & subject to enter marks</Text>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={6}>
          <Select
            placeholder="Select Class *"
            style={{ width: "100%" }}
            value={selectedClass}
            onChange={setSelectedClass}
            showSearch
            optionFilterProp="children"
          >
            {schoolClasses.map((schoolClass) => (
              <Option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Select Exam *"
            style={{ width: "100%" }}
            value={selectedExam}
            onChange={setSelectedExam}
            disabled={!selectedClass}
            loading={examsLoading}
          >
            {filteredExams.map((exam) => (
              <Option key={exam._id} value={exam._id}>
                {exam.title}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Select Subject *"
            style={{ width: "100%" }}
            value={selectedSubject}
            onChange={setSelectedSubject}
            disabled={!selectedClass}
          >
            {subjectOptions.map((subject) => (
              <Option key={subject._id} value={subject._id}>
                {subject.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {summary && (
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">Marks Entered: {summary.entered}</Tag>
          <Tag color="green">Average: {summary.average}</Tag>
        </Space>
      )}

      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={studentsLoading}
        columns={columns}
        dataSource={isReady ? tableData : []}
        pagination={false}
        locale={{
          emptyText: "Please select class, exam & subject to enter grades",
        }}
      />

      <Row justify="end" style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSubmit} disabled={!isReady} loading={saving}>
          Save Grades
        </Button>
      </Row>
    </Card>
  );
};

export default EnterGrades;