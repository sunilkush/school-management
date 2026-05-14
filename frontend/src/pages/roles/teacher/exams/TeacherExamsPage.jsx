import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { enterMarksBulk, getExams, submitFinalMarks } from "../../../../features/examSlice";
import { fetchStudentsBySchoolId } from "../../../../features/studentSlice";

const { Title, Text } = Typography;

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
   const { schoolStudents = [] } = useSelector(
      (state) => state.students || {}
    );
  
  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [examFilter, setExamFilter] = useState("all");

  const selectedExam = useMemo(() => exams.find((exam) => exam._id === selectedExamId), [exams, selectedExamId]);
  const schoolId = user?.schoolId?._id || user?.schoolId || user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedExamId && exams.length) {
      setSelectedExamId(exams[0]._id);
    }
  }, [exams, selectedExamId]);

  useEffect(() => {
    const schoolClassId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!selectedExamId || !schoolClassId || !schoolId || !academicYearId) {
      setRows([]);
      return;
    }

    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, schoolClassId }));
  }, [dispatch, selectedExamId, selectedExam, schoolId, academicYearId]);

  useEffect(() => {
    if (!selectedExamId) return;

    const selectedClassId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!schoolStudents.length || !selectedClassId) {
      setRows([]);
      return;
    }

    const classMatchedStudents = schoolStudents.filter((student) => {
      const studentClassId =
        student?.schoolClassId?._id ||
        student?.schoolClass?._id ||
        student?.schoolClassId ||
        student?.studentInfo?.schoolClassId ||
        student?.enrollment?.schoolClassId;

      return `${studentClassId || ""}` === `${selectedClassId}`;
    });

    setRows(
      classMatchedStudents.map((student, index) => ({
        studentId:
          student?.student?._id ||
          student?.studentInfo?._id ||
          student?.studentId ||
          student?._id,
        studentName:
          student?.user?.name ||
          student?.userDetails?.name ||
          student?.studentName ||
          `Student ${index + 1}`,
        sectionId: student?.section?._id || student?.sectionDetails?._id,
        obtainedMarks: 0,
        totalMarks: selectedExam?.totalMarks || 100,
        passingMarks: selectedExam?.passingMarks || 33,
      }))
    );
  }, [selectedExamId, selectedExam, schoolStudents]);

  const onMarkChange = (studentId, value) => {
    setRows((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, obtainedMarks: value ?? 0 } : item))
    );
  };

  const saveBulk = async () => {
    if (!selectedExamId) {
      message.error("Select exam first");
      return false;
    }

    const payloadRows = rows
      .filter((row) => row.studentId)
      .map((row) => ({
        ...row,
        schoolClassId: selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId,
        sectionId: row.sectionId || selectedExam?.sectionId?._id || selectedExam?.sectionId,
      }));

    if (!payloadRows.length) {
      message.warning("No valid students found for this class");
      return false;
    }

    try {
      await dispatch(enterMarksBulk({ examId: selectedExamId, marks: payloadRows })).unwrap();
      message.success("Marks saved");
      return true;
    } catch (error) {
      message.error(error || "Failed to save marks");
      return false;
    }
  };

  const saveAndSubmitFinal = async () => {
    if (!selectedExamId) {
      message.error("Select exam first");
      return;
    }

    const saved = await saveBulk();
    if (!saved) return;
    await submitFinal();
  };

  const submitFinal = async () => {
    if (!selectedExam) return false;
    try {
      await dispatch(
        submitFinalMarks({
          examId: selectedExam._id,
          schoolClassId: selectedExam.schoolClassId?._id || selectedExam.schoolClassId,
          sectionId: selectedExam.sectionId?._id || selectedExam.sectionId,
        })
      ).unwrap();
      message.success("Final marks submitted");
      return true;
    } catch (error) {
      message.error(error || "Failed to submit final marks");
      return false;
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

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const status = row.obtainedMarks >= row.passingMarks ? "pass" : "fail";
      const matchesFilter = examFilter === "all" ? true : status === examFilter;
      const matchesSearch = normalizedSearch
        ? `${row.studentName || ""} ${row.studentId || ""}`.toLowerCase().includes(normalizedSearch)
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [rows, searchText, examFilter]);

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
    const averageMarks = Math.round(
      rows.reduce((acc, row) => acc + Number(row.obtainedMarks || 0), 0) / rows.length
    );
    const passCount = rows.filter((row) => row.obtainedMarks >= row.passingMarks).length;
    const failCount = rows.length - passCount;
    const passPercentage = rows.length ? Math.round((passCount / rows.length) * 100) : 0;
    return {
      averageMarks,
      passCount,
      failCount,
      passPercentage,
      total: rows.length,
    };
  }, [rows]);

  const examOptions = useMemo(
    () =>
      exams.map((exam) => {
        const examDate = exam?.examDate ? dayjs(exam.examDate).format("DD MMM YYYY") : "No date";
        return {
          label: `${exam?.title || "Untitled Exam"} • ${exam?.schoolClassId?.name || "Class"} • ${examDate}`,
          value: exam?._id,
        };
      }),
    [exams]
  );

  const selectedExamStatus = useMemo(() => {
    if (!selectedExam?.examDate) return { color: "default", text: "Date N/A" };
    const examDay = dayjs(selectedExam.examDate);
    if (examDay.isBefore(dayjs(), "day")) return { color: "green", text: "Completed" };
    if (examDay.isSame(dayjs(), "day")) return { color: "blue", text: "Today" };
    return { color: "gold", text: "Upcoming" };
  }, [selectedExam]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle" onLoad={loading}>
      <Card style={{ borderRadius: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ marginBottom: 2 }}>Teacher Exam & Marks Entry</Title>
            <Text type="secondary">Dynamic exam selector, searchable marks table, and quick pass/fail analytics.</Text>
          </Col>
          <Col>
            <Badge status="processing" text={selectedAcademicYear?.name || "Academic year not selected"} />
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={16}>
            <Text strong>Select Exam</Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Choose an exam"
              options={examOptions}
              value={selectedExamId}
              onChange={setSelectedExamId}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={8}>
            {selectedExam ? (
              <Card size="small" style={{ borderRadius: 12, background: "#fafafa" }}>
                <Space direction="vertical" size={2}>
                  <Text strong>{selectedExam?.subjectId?.name || "Subject not assigned"}</Text>
                  <Text type="secondary">{selectedExam?.examType || "Exam type N/A"}</Text>
                  <Tag color={selectedExamStatus.color}>{selectedExamStatus.text}</Tag>
                </Space>
              </Card>
            ) : (
              <Empty description="No assigned exams found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Col>
        </Row>
      </Card>

      {selectedExamId && (
        <Card
        
          title="Marks Entry Table"
          style={{ borderRadius: 16 }}
          extra={
            <Segmented
              value={examFilter}
              onChange={setExamFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Pass", value: "pass" },
                { label: "Fail", value: "fail" },
              ]}
            />
          }
        >
          <Space wrap style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Bulk Upload (JSON)</Button>
            </Upload>
            <Button type="primary" onClick={saveBulk}>Save Marks</Button>
            <Button onClick={submitFinal}>Submit Final Marks</Button>
            <Button type="dashed" onClick={saveAndSubmitFinal}>
              Save & Final Submit
            </Button>
          </Space>

          <Input
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search student by name or ID"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 360, marginBottom: 16 }}
          />

          <Space wrap size="large" style={{ marginBottom: 12 }}>
            <Statistic title="Total Students" value={summary?.total || 0} />
            <Statistic title="Class Avg Marks" value={summary?.averageMarks || 0} suffix={`/${selectedExam?.totalMarks || 100}`} />
            <Statistic title="Pass" value={summary?.passCount || 0} valueStyle={{ color: "#3f8600" }} />
            <Statistic title="Fail" value={summary?.failCount || 0} valueStyle={{ color: "#cf1322" }} />
            <Tooltip title={`${summary?.passPercentage || 0}% students passed`}>
              <Progress type="circle" size={64} percent={summary?.passPercentage || 0} />
            </Tooltip>
          </Space>

          <Table
            rowKey={(row, i) => `${row.studentId || "row"}-${i}`}
            dataSource={visibleRows}
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
