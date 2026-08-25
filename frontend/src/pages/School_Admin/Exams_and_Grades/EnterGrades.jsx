import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { getExams, enterMarksBulk } from "../../../features/examSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  toolbarRow,
  tableHeadCss,
  pill,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { Option } = Select;

const DEFAULT_GRADE_CONFIG = [
  { key: "a-plus", grade: "A+", min: 90, max: 100, remark: "Outstanding", color: "green" },
  { key: "a", grade: "A", min: 80, max: 89, remark: "Excellent", color: "blue" },
  { key: "b", grade: "B", min: 70, max: 79, remark: "Good", color: "gold" },
  { key: "c", grade: "C", min: 60, max: 69, remark: "Average", color: "orange" },
  { key: "fail", grade: "Fail", min: 0, max: 59, remark: "Needs Improvement", color: "red" },
];

const normalizeGradeConfig = (config = []) => {
  return [...config]
    .map((item, index) => ({
      key: item?.key || `${item?.grade || "grade"}-${index}`,
      grade: String(item?.grade || "").trim(),
      min: Number(item?.min),
      max: Number(item?.max),
      remark: String(item?.remark || "").trim(),
      color: item?.color || "blue",
    }))
    .sort((a, b) => b.min - a.min);
};

const getConfigValidationErrors = (config = []) => {
  const errors = [];
  const normalized = normalizeGradeConfig(config);

  normalized.forEach((item) => {
    if (!item.grade) errors.push("Grade name is required in every row.");
    if (Number.isNaN(item.min) || Number.isNaN(item.max)) {
      errors.push(`Min/Max marks must be numeric for ${item.grade || "a row"}.`);
      return;
    }
    if (item.min < 0 || item.max > 100) errors.push(`${item.grade || "A row"}: marks must stay between 0 and 100.`);
    if (item.min > item.max) errors.push(`${item.grade || "A row"}: Min cannot be greater than Max.`);
  });

  const seen = new Set();
  normalized.forEach((item) => {
    for (let mark = item.min; mark <= item.max; mark += 1) {
      if (seen.has(mark)) {
        errors.push("Grade ranges cannot overlap. Please adjust Min/Max values.");
        return;
      }
      seen.add(mark);
    }
  });

  if (!seen.has(0) || !seen.has(100)) errors.push("Grade ranges should cover marks from 0 to 100.");
  return [...new Set(errors)];
};

const getGradeFromMarks = ({ marks, totalMarks, gradeConfig }) => {
  if (marks === undefined || marks === null || Number.isNaN(Number(marks))) return null;
  const safeTotal = Number(totalMarks) > 0 ? Number(totalMarks) : 100;
  const percentage = (Number(marks) / safeTotal) * 100;
  const normalized = normalizeGradeConfig(gradeConfig);
  const matched = normalized.find((item) => percentage >= item.min && percentage <= item.max);
  if (!matched) return { grade: "N/A", remark: "No matching range", color: "default", percentage };
  return { grade: matched.grade, remark: matched.remark, color: matched.color || "blue", percentage };
};

const EnterGrades = () => {
  const dispatch = useDispatch();

  const [selectedClass, setSelectedClass] = useState(undefined);
  const [selectedExam, setSelectedExam] = useState(undefined);
  const [selectedSubject, setSelectedSubject] = useState(undefined);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [gradeConfig, setGradeConfig] = useState(DEFAULT_GRADE_CONFIG);

  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const { exams = [], loading: examsLoading = false } = useSelector((state) => state.exams || {});
  const { schoolStudents = [], loading: studentsLoading = false } = useSelector((state) => state.students || {});

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const gradeConfigStorageKey = useMemo(() => `grade-config-${schoolId || "default"}`, [schoolId]);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(getClassData({ schoolId, academicYearId }));
    dispatch(getExams({ schoolId, academicYearId, limit: 100 }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!selectedClass || !schoolId || !academicYearId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, schoolClassId: selectedClass, limit: 200 }));
  }, [dispatch, selectedClass, schoolId, academicYearId]);

  useEffect(() => {
    if (!gradeConfigStorageKey) return;
    try {
      const stored = localStorage.getItem(gradeConfigStorageKey);
      if (!stored) { setGradeConfig(DEFAULT_GRADE_CONFIG); return; }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.length) { setGradeConfig(DEFAULT_GRADE_CONFIG); return; }
      setGradeConfig(normalizeGradeConfig(parsed));
    } catch {
      setGradeConfig(DEFAULT_GRADE_CONFIG);
    }
  }, [gradeConfigStorageKey]);

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

  const filteredExams = useMemo(() => {
    if (!selectedClass) return [];
    return exams.filter((item) => (item?.schoolClassId?._id || item?.schoolClassId) === selectedClass);
  }, [exams, selectedClass]);

  const selectedExamRecord = useMemo(() => exams.find((item) => item?._id === selectedExam), [exams, selectedExam]);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    filteredExams.forEach((exam) => {
      const subjectId = exam?.subjectId?._id || exam?.subjectId;
      const subjectName = exam?.subjectId?.name || exam?.subjectName || exam?.subject?.name || "Subject";
      if (subjectId && !map.has(subjectId)) map.set(subjectId, { value: subjectId, label: subjectName });
    });
    return Array.from(map.values());
  }, [filteredExams]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return schoolStudents.filter(
      (item) => (item?.schoolClass?._id || item?.schoolClassId || item?.schoolClass) === selectedClass
    );
  }, [schoolStudents, selectedClass]);

  const tableData = useMemo(() => {
    return filteredStudents.map((student, index) => ({
      id: student?.user?._id || student?.student?.userId || student?.student?._id || student?._id,
      rollNo: student?.registrationNumber || index + 1,
      name: student?.user?.name || student?.student?.name || student?.studentName || "N/A",
      sectionId: student?.section?._id || student?.sectionId?._id || student?.sectionId || null,
    }));
  }, [filteredStudents]);

  const gradeConfigErrors = useMemo(() => getConfigValidationErrors(gradeConfig), [gradeConfig]);

  const summary = useMemo(() => {
    const values = Object.values(grades).filter((v) => v !== undefined && v !== null && v !== "");
    if (!values.length) return null;
    const avg = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
    return { entered: values.length, average: avg.toFixed(2) };
  }, [grades]);

  const handleGradeChange = (studentId, value) => {
    setGrades((prev) => ({ ...prev, [studentId]: value }));
  };

  const addGradeBand = () => {
    setGradeConfig((prev) => [...prev, { key: `new-${Date.now()}`, grade: "", min: 0, max: 0, remark: "", color: "blue" }]);
  };

  const updateGradeBand = (key, field, value) => {
    setGradeConfig((prev) => prev.map((item) => item.key === key ? { ...item, [field]: value } : item));
  };

  const removeGradeBand = (key) => {
    setGradeConfig((prev) => prev.filter((item) => item.key !== key));
  };

  const resetGradeConfig = () => {
    setGradeConfig(DEFAULT_GRADE_CONFIG);
    localStorage.removeItem(gradeConfigStorageKey);
    message.success("Grade system reset to default");
  };

  const saveGradeConfig = () => {
    const errors = getConfigValidationErrors(gradeConfig);
    if (errors.length) { message.error("Please fix grade setup errors before saving."); return; }
    const normalized = normalizeGradeConfig(gradeConfig);
    setGradeConfig(normalized);
    localStorage.setItem(gradeConfigStorageKey, JSON.stringify(normalized));
    message.success("Grade system saved");
  };

  const isReady = Boolean(selectedClass && selectedExam && selectedSubject);

  const handleSubmit = async () => {
    if (!isReady) { message.warning("Please select class, exam & subject"); return; }
    const configErrors = getConfigValidationErrors(gradeConfig);
    if (configErrors.length) { message.warning("Please correct grade setup before saving marks"); return; }

    const marks = tableData
      .filter((student) => grades[student.id] !== undefined && grades[student.id] !== null)
      .map((student) => ({
        studentId: student.id,
        schoolClassId: selectedClass,
        sectionId: student.sectionId,
        subjectId: selectedSubject,
        totalMarks: selectedExamRecord?.totalMarks || 100,
        passingMarks: selectedExamRecord?.passingMarks || 33,
        obtainedMarks: Number(grades[student.id]),
      }));

    if (!marks.length) { message.warning("Please enter at least one student mark"); return; }

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

  const columns = [
    { title: "Roll No", dataIndex: "rollNo", width: 110 },
    { title: "Student Name", dataIndex: "name" },
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
        const gradeInfo = getGradeFromMarks({
          marks: grades[record.id],
          totalMarks: selectedExamRecord?.totalMarks || 100,
          gradeConfig,
        });
        if (!gradeInfo) return "-";
        return (
          <Space direction="vertical" size={0}>
            <Tag color={gradeInfo.color}>{gradeInfo.grade}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{gradeInfo.remark}</Text>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("grade-table")}</style>
      <style>{tableHeadCss("grade-config-table")}</style>
      <PageHeader
        title="Enter Student Grades"
        subtitle="Marks are auto-converted into grades using your configured grade system."
        icon={<EditOutlined />}
      />

      <div style={{ marginTop: 20 }}>
        <div style={sectionPanel}>
          <Divider orientation="left" style={{ marginTop: 0 }}>Grade System Setup</Divider>

          <Table
            className="grade-config-table"
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={gradeConfig}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: "Grade",
                render: (_, record) => (
                  <Input
                    value={record.grade}
                    placeholder="A+"
                    onChange={(e) => updateGradeBand(record.key, "grade", e.target.value)}
                  />
                ),
              },
              {
                title: "Min Marks",
                width: 120,
                render: (_, record) => (
                  <InputNumber
                    min={0} max={100}
                    style={{ width: "100%" }}
                    value={record.min}
                    onChange={(value) => updateGradeBand(record.key, "min", value)}
                  />
                ),
              },
              {
                title: "Max Marks",
                width: 120,
                render: (_, record) => (
                  <InputNumber
                    min={0} max={100}
                    style={{ width: "100%" }}
                    value={record.max}
                    onChange={(value) => updateGradeBand(record.key, "max", value)}
                  />
                ),
              },
              {
                title: "Remark",
                render: (_, record) => (
                  <Input
                    value={record.remark}
                    placeholder="Outstanding"
                    onChange={(e) => updateGradeBand(record.key, "remark", e.target.value)}
                  />
                ),
              },
              {
                title: "Action",
                width: 110,
                render: (_, record) => (
                  <Popconfirm title="Delete this grade row?" onConfirm={() => removeGradeBand(record.key)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ),
              },
            ]}
          />

          <Space style={{ marginTop: 12 }} wrap>
            <Button icon={<PlusOutlined />} onClick={addGradeBand}>Add Grade Row</Button>
            <Button type="primary" onClick={saveGradeConfig}>Save Grade System</Button>
            <Button onClick={resetGradeConfig}>Reset Default</Button>
          </Space>

          {gradeConfigErrors.length > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="Please fix grade setup"
              description={
                <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                  {gradeConfigErrors.map((err) => (<li key={err}>{err}</li>))}
                </ul>
              }
            />
          )}
        </div>

        <div style={sectionPanel}>
          <Divider orientation="left" style={{ marginTop: 0 }}>Enter Marks</Divider>

          <div className="page-toolbar" style={toolbarRow}>
            <Select
              placeholder="Select Class *"
              style={{ minWidth: 200 }}
              value={selectedClass}
              onChange={setSelectedClass}
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {schoolClasses.map((schoolClass) => (
                <Option key={schoolClass._id} value={schoolClass._id}>{schoolClass.name}</Option>
              ))}
            </Select>

            <Select
              placeholder="Select Exam *"
              style={{ minWidth: 200 }}
              value={selectedExam}
              onChange={setSelectedExam}
              disabled={!selectedClass}
              loading={examsLoading}
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {filteredExams.map((exam) => (
                <Option key={exam._id} value={exam._id}>
                  {exam?.title || exam?.name || exam?.examCode || "Unnamed Exam"}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Subject"
              style={{ minWidth: 200 }}
              value={selectedSubject}
              onChange={setSelectedSubject}
              disabled={!selectedExam}
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {subjectOptions.map((subject) => (
                <Option key={subject.value} value={subject.value}>{subject.label}</Option>
              ))}
            </Select>

            {selectedExamRecord && (
              <div style={{ padding: "8px 14px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border-muted)" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Total: </Text>
                <Text strong>{selectedExamRecord.totalMarks}</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>Pass: </Text>
                <Text strong>{selectedExamRecord.passingMarks}</Text>
              </div>
            )}
          </div>

          {summary && (
            <Space style={{ marginBottom: 12 }}>
              <span style={pill("var(--primary)")}>Marks Entered: {summary.entered}</span>
              <span style={pill("var(--success)")}>Average: {summary.average}</span>
            </Space>
          )}

          <Table
            className="grade-table"
            rowKey="id"
            loading={studentsLoading}
            columns={columns}
            dataSource={isReady ? tableData : []}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Please select class, exam & subject to enter grades" }}
          />

          <Row justify="end" style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={!isReady || gradeConfigErrors.length > 0}
              loading={saving}
            >
              Save Grades
            </Button>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default EnterGrades;
