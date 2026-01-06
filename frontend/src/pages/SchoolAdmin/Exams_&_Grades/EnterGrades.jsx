import React, { useState, useMemo } from "react";
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

const { Title, Text } = Typography;
const { Option } = Select;

const mockStudents = [
  { id: 1, name: "Rahul Sharma", rollNo: 1 },
  { id: 2, name: "Anita Verma", rollNo: 2 },
  { id: 3, name: "Aman Gupta", rollNo: 3 },
];

const EnterGrades = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [grades, setGrades] = useState({});

  const handleGradeChange = (studentId, value) => {
    setGrades((prev) => ({ ...prev, [studentId]: value }));
  };

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    const values = Object.values(grades).filter((v) => v !== undefined);
    if (!values.length) return null;

    const avg =
      values.reduce((a, b) => a + b, 0) / values.length;

    return {
      entered: values.length,
      average: avg.toFixed(2),
    };
  }, [grades]);

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      title: "Roll No",
      dataIndex: "rollNo",
      width: 90,
    },
    {
      title: "Student Name",
      dataIndex: "name",
    },
    {
      title: "Marks (out of 100)",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={grades[record.id]}
          style={{ width: 120 }}
          placeholder="Enter"
          onChange={(value) =>
            handleGradeChange(record.id, value)
          }
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

  /* ---------------- SAVE ---------------- */
  const handleSubmit = () => {
    if (!selectedClass || !selectedExam || !selectedSubject) {
      message.warning("Please select class, exam & subject");
      return;
    }

    message.success("Grades saved successfully");
    console.log("Grades Data:", grades);
  };

  return (
    <Card bordered={false}>
      {/* 🔹 HEADER */}
      <Title level={4}>📝 Enter Student Grades</Title>
      <Text type="secondary">
        Select class, exam & subject to enter marks
      </Text>

      {/* 🔹 FILTERS */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={6}>
          <Select
            placeholder="Select Class *"
            style={{ width: "100%" }}
            onChange={setSelectedClass}
          >
            <Option value="10-A">Class 10 - A</Option>
            <Option value="10-B">Class 10 - B</Option>
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Select Exam *"
            style={{ width: "100%" }}
            onChange={setSelectedExam}
          >
            <Option value="Midterm">Midterm</Option>
            <Option value="Final">Final</Option>
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Select Subject *"
            style={{ width: "100%" }}
            onChange={setSelectedSubject}
          >
            <Option value="Maths">Mathematics</Option>
            <Option value="Science">Science</Option>
            <Option value="English">English</Option>
          </Select>
        </Col>
      </Row>

      {/* 🔹 SUMMARY */}
      {summary && (
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">Marks Entered: {summary.entered}</Tag>
          <Tag color="green">Average: {summary.average}</Tag>
        </Space>
      )}

      {/* 🔹 TABLE */}
      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        columns={columns}
        dataSource={
          selectedClass && selectedExam && selectedSubject
            ? mockStudents
            : []
        }
        pagination={false}
        locale={{
          emptyText:
            "Please select class, exam & subject to enter grades",
        }}
      />

      {/* 🔹 ACTIONS */}
      <Row justify="end" style={{ marginTop: 16 }}>
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={
            !selectedClass ||
            !selectedExam ||
            !selectedSubject
          }
        >
          Save Grades
        </Button>
      </Row>
    </Card>
  );
};

export default EnterGrades;
