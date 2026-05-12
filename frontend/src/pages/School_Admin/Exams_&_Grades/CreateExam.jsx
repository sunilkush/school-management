import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Divider,
  message,
  Typography,
  TimePicker,
  Spin,
  Switch,
  Alert,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import { getClassData} from "../../../features/schoolClassSlice.js";
import { getQuestions } from "../../../features/questionSlice.js";
import {
  createExam,
  updateExam,
  getExamById,
} from "../../../features/examSlice.js";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getExamRouteConfig } from "../../../utils/examRoutes";


const { Title } = Typography;
const { Option } = Select;

const CreateExam = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
   const location = useLocation();
  const examRoutes = useMemo(() => getExamRouteConfig(location.pathname), [location.pathname]);
  const { id } = useParams();

  const isEditMode = id && id !== "undefined" && id !== "null";
  
  /* ================= LOCAL STATE ================= */
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjectList, setSubjectList] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examData, setExamData] = useState(null); // ⭐ important
  const {user=[],loading} = useSelector((state) => state.auth || {});
  const {selectedAcademicYear} = useSelector((state) => state.academicYear || {});
  /* ================= REDUX ================= */
  const { schoolClasses } = useSelector((state) => state.schoolClass || {});
  const { questions = [] } = useSelector((state) => state.questions || {});
  
  const academicYearId = selectedAcademicYear?._id;
  const schoolId = user?.school?._id;
  const userId = user?._id;
  /* ================= FETCH CLASSES ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(getClassData({ schoolId,academicYearId }));
      dispatch(getQuestions({ schoolId }));
    }
  }, [schoolId, dispatch,academicYearId]);

  /* ================= LOAD EXAM ================= */
  useEffect(() => {
    if (!isEditMode) return;
    if (!id) return;

    loadExam();
    // eslint-disable-next-line
  }, [id]);

  const loadExam = async () => {
    try {
      if (!id || id === "undefined" || id === "null") {
        console.error("Invalid exam id:", id);
        return;
      }

      const res = await dispatch(getExamById(id)).unwrap();
      setExamData(res); // ⭐ store first
    } catch (error) {
      message.error(error?.message || "Failed to load exam");
    }
  };

  /* ================= AFTER CLASSES + EXAM READY ================= */
    /* ================= CLASS CHANGE ================= */
 const handleClassChange = useCallback((schoolClassId, subjectIdFromEdit = null, sectionIdFromEdit = null) => {
  setSelectedClass(schoolClassId);

  const selected = schoolClasses.find((c) => c._id === schoolClassId);
  setSectionList(selected?.sections || []);

  // ✅ sections ke andar se subjects nikaalo
  let subjects = [];

  if (selected?.sections?.length) {
    selected.sections.forEach((section) => {
      if (section.subjects?.length) {
        section.subjects.forEach((sub) => {
          subjects.push({
            _id: sub._id,
            name: sub.name,
          });
        });
      }
    });
  }

  // ✅ duplicate remove (important)
  const uniqueSubjects = Array.from(
    new Map(subjects.map((item) => [item._id, item])).values()
  );

  setSubjectList(uniqueSubjects);

  // edit mode me reset na ho
  if (!subjectIdFromEdit) {
    form.setFieldsValue({ subjectId: undefined, sectionId: undefined });
  } else if (sectionIdFromEdit) {
    form.setFieldsValue({ sectionId: sectionIdFromEdit });
  }
}, [form, schoolClasses]);
  useEffect(() => {
    if (!examData) return;
    if (!schoolClasses.length) return;

    const schoolClassIdValue = examData.schoolClassId?._id || examData.schoolClassId;

    handleClassChange(
      schoolClassIdValue,
      examData.subjectId?._id || examData.subjectId,
      examData.sectionId?._id || examData.sectionId
    );

    form.setFieldsValue({
      title: examData.title,
      schoolClassId: schoolClassIdValue,
      subjectId: examData.subjectId?._id || examData.subjectId,
      sectionId: examData.sectionId?._id || examData.sectionId,
      examType: examData.examType,
      examDate: examData.examDate ? dayjs(examData.examDate) : null,
      startTime: examData.startTime ? dayjs(examData.startTime) : null,
      endTime: examData.endTime ? dayjs(examData.endTime) : null,
      durationMinutes: examData.durationMinutes,
      totalMarks: examData.totalMarks,
      passingMarks: examData.passingMarks,
      status: examData.status,
      examCode: examData.examCode,
      settings: {
        negativeMarking: examData.settings?.negativeMarking || 0,
        maxAttempts: examData.settings?.maxAttempts || 1,
        allowPartialScoring: Boolean(examData.settings?.allowPartialScoring),
      },
      questionOrder: examData.questionOrder || "random",
      shuffleOptions: examData.shuffleOptions ?? true,
    });

    setExamQuestions(
      (examData.questions || []).map((question) => ({
        questionId: question.questionId?._id || question.questionId,
        marks: Number(question.marks || 0),
      }))
    );
  }, [examData, schoolClasses, handleClassChange, form]);

  const filteredQuestions = questions.filter((question) => {
    const classId = question.schoolClassId?._id || question.schoolClassId;
    const subjectId = question.subjectId?._id || question.subjectId;
    const selectedSubject = form.getFieldValue("subjectId");
    return String(classId) === String(selectedClass) && String(subjectId) === String(selectedSubject);
  });



  /* ================= AUTO DURATION ================= */
  const calculateDuration = () => {
    const start = form.getFieldValue("startTime");
    const end = form.getFieldValue("endTime");

    if (start && end) {
      const diff = dayjs(end).diff(dayjs(start), "minute");
      if (diff > 0) {
        form.setFieldsValue({ durationMinutes: diff });
      }
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    try {
      if (dayjs(values.endTime).isBefore(dayjs(values.startTime))) {
        return message.error("End time must be after start time");
      }

      const startDateTime = dayjs(values.examDate)
        .hour(dayjs(values.startTime).hour())
        .minute(dayjs(values.startTime).minute());

      const endDateTime = dayjs(values.examDate)
        .hour(dayjs(values.endTime).hour())
        .minute(dayjs(values.endTime).minute());

      const payload = {
        academicYearId,
        schoolId,
        userId,
        title: values.title,
        examCode: values.examCode,
        schoolClassId: values.schoolClassId,
        subjectId: values.subjectId,
        sectionId: values.sectionId || null,
        examType: values.examType,
        examDate: values.examDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes: values.durationMinutes,
        totalMarks: values.totalMarks,
        passingMarks: values.passingMarks,
        status: values.status || "draft",
        questionOrder: values.questionOrder,
        shuffleOptions: values.shuffleOptions,
        settings: values.settings,
      };
      
      if (isEditMode) {
        const formattedQuestions = examQuestions
          .filter((question) => question.questionId)
          .map((question) => ({
            questionId: question.questionId,
            marks: Number(question.marks || 0),
          }));
      
        if (!id || id === "undefined" || id === "null") {
          return message.error("Invalid exam id 2");
        }

        await dispatch(updateExam({ Id: id, payload: { ...payload, questions: formattedQuestions } })).unwrap();
        message.success("Exam Updated Successfully");
      } else {
        await dispatch(createExam(payload)).unwrap();
        message.success("Exam Created Successfully");
      }

      navigate(examRoutes.listPath);
    } catch (err) {
      console.error(err);
      message.error("Failed to save exam");
    }
  };

  const addQuestion = () => {
    setExamQuestions((prev) => [...prev, { questionId: "", marks: 0 }]);
  };

  const removeQuestion = (index) => {
    setExamQuestions((prev) => prev.filter((_, questionIndex) => questionIndex !== index));
  };

  const handleQuestionSelect = (index, questionId) => {
    const selectedQuestion = filteredQuestions.find((question) => String(question._id) === String(questionId));
    setExamQuestions((prev) =>
      prev.map((question, questionIndex) =>
        questionIndex === index
          ? { questionId, marks: Number(selectedQuestion?.marks || 0) }
          : question
      )
    );
  };

  /* ================= UI ================= */
  return (
    <Spin spinning={loading}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Title level={4}>
          {isEditMode ? "Edit Exam" : "Create Exam"}
        </Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* BASIC INFO */}
          <Divider orientation="left">Basic Info</Divider>

          <Row gutter={16}>
            <Col span={24} >
              <Form.Item
                name="title"
                label="Exam Title"
                rules={[{ required: true, message: "Enter exam title" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12} md={6}>
              <Form.Item
                name="examCode"
                label="Exam Code"
                rules={[
                  { required: true, message: "Enter exam code" },
                  { pattern: /^[A-Za-z0-9-_]+$/, message: "Use only letters, numbers, - or _" },
                ]}
              >
                <Input placeholder="e.g. MIDTERM-10A-MATH" />
              </Form.Item>
            </Col>

            <Col span={12} md={6}>
              <Form.Item
                name="schoolClassId"
                label="Class"
                rules={[{ required: true, message: "Select class" }]}
              >
                <Select onChange={handleClassChange}>
                  {schoolClasses.map((cls) => (
                    <Option key={cls._id} value={cls._id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12} md={6}>
              <Form.Item
                name="sectionId"
                label="Section (Optional)"
              >
                <Select
                  allowClear
                  disabled={!selectedClass}
                  placeholder="All sections"
                  options={sectionList.map((sec) => ({ label: sec.name, value: sec._id }))}
                />
              </Form.Item>
            </Col>

            <Col span={12} md={6}>
              <Form.Item
                name="subjectId"
                label="Subject"
                rules={[{ required: true, message: "Select subject" }]}
              >
                <Select disabled={!selectedClass}>
                  {subjectList.map((sub) => (
                    <Option key={sub._id} value={sub._id}>
                      {sub.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* SCHEDULE */}
          <Divider orientation="left">Schedule</Divider>

          <Row gutter={16}>
            <Col md={6} span={12}>
              <Form.Item
                name="examType"
                label="Exam Type"
                initialValue="objective"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="objective">Objective</Option>
                  <Option value="subjective">Subjective</Option>
                  <Option value="mixed">Mixed</Option>
                  <Option value="unit_test">Unit Test</Option>
                  <Option value="class_test">Class Test</Option>
                  <Option value="Mid_term">Mid-term</Option>
                  <Option value="final_exam">Final Exam</Option>
                  <Option value="online_exam">Online Exam</Option>
                  <Option value="practical_exam">Practical Exam</Option>
                  <Option value="oral_exam">Oral Exam</Option>
                  <Option value="assignment">Assignment</Option>
                  <Option value="project">Project</Option>
                  <Option value="quiz">Quiz</Option>
                  <Option value="board_exam">Board Exam</Option>
                  <Option value="competitive_exam">Competitive Exam</Option>
                  <Option value="remedial_exam">Remedial Exam</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col md={6} span={12}>
              <Form.Item
                name="examDate"
                label="Exam Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col md={4} span={12}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true }]}
              >
                <TimePicker
                  style={{ width: "100%" }}
                  onChange={calculateDuration}
                />
              </Form.Item>
            </Col>

            <Col md={4} span={12}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true }]}
              >
                <TimePicker
                  style={{ width: "100%" }}
                  onChange={calculateDuration}
                />
              </Form.Item>
            </Col>
            <Col md={4} span={12}>
              <Form.Item
                name="durationMinutes"
                label="Duration (Minutes)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

       

          <Divider orientation="left">Exam Experience</Divider>
          <Row gutter={16}>
            <Col md={4} span={12}>
              <Form.Item name="questionOrder" label="Question Order" initialValue="random">
                <Select
                  options={[
                    { label: "Random", value: "random" },
                    { label: "Fixed", value: "fixed" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col md={4} span={12}>
              <Form.Item label="Shuffle Options" name="shuffleOptions" valuePropName="checked" initialValue>
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
            <Col md={4} span={12}>
              <Form.Item name={["settings", "negativeMarking"]} label="Negative Marking">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col md={4} span={12}>
              <Form.Item name={["settings", "maxAttempts"]} label="Max Attempts" initialValue={1}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col md={4} span={12}>
              <Form.Item label="Allow Partial Scoring" name={["settings", "allowPartialScoring"]} valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          {/* MARKS */}
          <Divider orientation="left">Marks</Divider>

          <Row gutter={16}>
            <Col md={6} span={12}>
              <Form.Item
                name="totalMarks"
                label="Total Marks"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col md={6} span={12}>
              <Form.Item
                name="passingMarks"
                label="Passing Marks"
                dependencies={["totalMarks"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const total = Number(getFieldValue("totalMarks") || 0);
                      if (value === undefined || Number(value) <= total) return Promise.resolve();
                      return Promise.reject(new Error("Passing marks cannot exceed total marks"));
                    },
                  }),
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {/* STATUS */}
          <Divider />
          {!isEditMode && (
            <Alert
              type="info"
              showIcon
              message="पहले exam save करें। उसके बाद Edit Exam स्क्रीन से questions add किए जा सकते हैं।"
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item name="status" label="Status">
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>

          {isEditMode && (
            <>
              <Divider orientation="left">Questions</Divider>

              <Button type="dashed" onClick={addQuestion} styles={{marginBottom:10}} block icon={<PlusOutlined />}>
                Add Question
              </Button>

              {examQuestions.map((question, index) => (
                <Row gutter={12} key={index} style={{ marginTop: 10,marginBottom:10 }}>
                  <Col span={16}>
                    <Select
                      value={question.questionId}
                      onChange={(value) => handleQuestionSelect(index, value)}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="children"
                      placeholder="Select question"
                    >
                      {filteredQuestions.map((availableQuestion) => (
                        <Option key={availableQuestion._id} value={availableQuestion._id}>
                          {availableQuestion.statement}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col span={4}>
                    <InputNumber value={question.marks} disabled style={{ width: "100%" }} />
                  </Col>

                  <Col span={4}>
                    <Button danger icon={<DeleteOutlined />} onClick={() => removeQuestion(index)} block />
                  </Col>
                </Row>
              ))}
            </>
          )}

          <Button type="primary" htmlType="submit" block>
            Save Exam
          </Button>
        </Form>
      </Card>
    </Spin>
  );
};

export default CreateExam;
