import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Space,
  InputNumber,
  Switch,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { getClassData } from "../../../features/schoolClassSlice";
import { createQuestions } from "../../../features/questionSlice";
import { fetchAllChapters } from "../../../features/chapterSlice";

const { Option } = Select;
const { TextArea } = Input;

const CreateQuestion = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const { chapters = [] } = useSelector((state) => state.chapter || {});
  const { user = {} } = useSelector((state) => state.auth || {});
  const schoolId = user?.schoolId?._id || user?.schoolId || user?.school?._id;

  const [options, setOptions] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [questionType, setQuestionType] = useState("mcq_single");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(getClassData({ schoolId }));
    dispatch(fetchAllChapters());
  }, [dispatch, schoolId]);

  const shortClass = useMemo(() => {
    return [...schoolClasses].sort((a, b) => {
      const numA = parseInt(String(a?.name || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b?.name || "").replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
  }, [schoolClasses]);

  const selectedClassData = useMemo(() => {
    if (!selectedClassId) return null;
    return (
      schoolClasses.find((cls) => String(cls?._id) === String(selectedClassId)) || null
    );
  }, [schoolClasses, selectedClassId]);

  const selectedBoardClassId = useMemo(() => {
    return selectedClassData?.boardClass?._id || null;
  }, [selectedClassData]);

  const subjectOptions = useMemo(() => {
    if (!selectedClassData?.sections?.length) return [];

    const subjects = selectedClassData.sections.flatMap((section) =>
      (section?.subjects || []).map((subject) => ({
        _id: subject?._id,
        name: subject?.name,
      }))
    );

    return Array.from(
      new Map(
        subjects
          .filter((subject) => subject?._id && subject?.name)
          .map((subject) => [String(subject._id), subject])
      ).values()
    );
  }, [selectedClassData]);

  const filteredChapters = useMemo(() => {
    if (!selectedBoardClassId || !selectedSubjectId) return [];

    return chapters.filter((chapter) => {
      const chapterBoardClassId =
        chapter?.boardClassId?._id || chapter?.boardClassId || null;
      const chapterSubjectId =
        chapter?.subjectId?._id || chapter?.subjectId || null;

      return (
        String(chapterBoardClassId) === String(selectedBoardClassId) &&
        String(chapterSubjectId) === String(selectedSubjectId)
      );
    });
  }, [chapters, selectedBoardClassId, selectedSubjectId]);

  const addOption = () => {
    setOptions((prev) => [...prev, { key: "", text: "" }]);
  };

  const addCorrectAnswer = () => {
    setCorrectAnswers((prev) => [...prev, ""]);
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId || null);
    setSelectedSubjectId(null);

    form.setFieldsValue({
      subjectId: undefined,
      chapterId: undefined,
    });
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId || null);

    form.setFieldsValue({
      chapterId: undefined,
    });
  };

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        schoolId,
        chapterId: values.chapterId || null,
        options,
        correctAnswers,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
          : [],
      };

      await dispatch(createQuestions(payload)).unwrap();
      message.success("Question created successfully");

      form.resetFields();
      setOptions([]);
      setCorrectAnswers([]);
      setQuestionType("mcq_single");
      setSelectedClassId(null);
      setSelectedSubjectId(null);
    } catch (error) {
      message.error(error?.message || error || "Failed to create question");
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          questionType: "mcq_single",
          difficulty: "medium",
          marks: 1,
          negativeMarks: 0,
          isActive: true,
        }}
        onFinish={onFinish}
      >
        <Divider orientation="left">Class & Subject</Divider>

        <Row gutter={16}>
          <Col md={12} xs={24}>
            <Form.Item
              name="schoolClassId"
              label="Class"
              rules={[{ required: true, message: "Please select class" }]}
            >
              <Select
                placeholder="Select Class"
                onChange={handleClassChange}
                allowClear
              >
                {shortClass.map((cls) => (
                  <Option key={cls._id} value={cls._id}>
                    {cls.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={12} xs={24}>
            <Form.Item
              name="subjectId"
              label="Subject"
              rules={[{ required: true, message: "Please select subject" }]}
            >
              <Select
                placeholder="Select Subject"
                disabled={!selectedClassId}
                allowClear
                onChange={handleSubjectChange}
              >
                {subjectOptions.map((subject) => (
                  <Option key={subject._id} value={subject._id}>
                    {subject.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col md={12} xs={24}>
            <Form.Item name="chapterId" label="Chapter">
              <Select
                placeholder="Select Chapter"
                allowClear
                disabled={!selectedClassId || !selectedSubjectId}
              >
                {filteredChapters.map((ch) => (
                  <Option key={ch._id} value={ch._id}>
                    {ch.chapterNo ? `${ch.chapterNo}. ${ch.name}` : ch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={12} xs={24}>
            <Form.Item name="topic" label="Topic">
              <Input placeholder="Topic name" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="questionType" label="Question Type">
          <Select
            onChange={(val) => {
              setQuestionType(val);
              setOptions([]);
              setCorrectAnswers([]);
            }}
          >
            <Option value="mcq_single">MCQ (Single)</Option>
            <Option value="mcq_multi">MCQ (Multiple)</Option>
            <Option value="true_false">True / False</Option>
            <Option value="fill_blank">Fill in the Blank</Option>
            <Option value="match">Match the Following</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="statement"
          label="Question Statement"
          rules={[{ required: true, message: "Please enter question statement" }]}
        >
          <TextArea rows={4} placeholder="Enter question statement" />
        </Form.Item>

        {(questionType === "mcq_single" ||
          questionType === "mcq_multi" ||
          questionType === "match") && (
          <>
            <Divider orientation="left">Options</Divider>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addOption}
              block
            >
              Add Option
            </Button>

            <Space direction="vertical" style={{ width: "100%", marginTop: 12 }}>
              {options.map((opt, index) => (
                <Row gutter={12} key={index}>
                  <Col span={6}>
                    <Input
                      placeholder="Key"
                      value={opt.key}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[index].key = e.target.value;
                        setOptions(updated);
                      }}
                    />
                  </Col>
                  <Col span={18}>
                    <Input
                      placeholder="Option Text"
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[index].text = e.target.value;
                        setOptions(updated);
                      }}
                    />
                  </Col>
                </Row>
              ))}
            </Space>
          </>
        )}

        <Divider orientation="left">Correct Answers</Divider>

        <Button type="dashed" onClick={addCorrectAnswer} block>
          Add Correct Answer
        </Button>

        <Space direction="vertical" style={{ width: "100%", marginTop: 12 }}>
          {correctAnswers.map((ans, index) => (
            <Input
              key={index}
              placeholder="Correct Answer"
              value={ans}
              onChange={(e) => {
                const updated = [...correctAnswers];
                updated[index] = e.target.value;
                setCorrectAnswers(updated);
              }}
            />
          ))}
        </Space>

        <Divider orientation="left">Evaluation</Divider>

        <Row gutter={16}>
          <Col md={8} xs={24}>
            <Form.Item name="difficulty" label="Difficulty">
              <Select>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="marks" label="Marks">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="negativeMarks" label="Negative Marks">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="tags" label="Tags (comma separated)">
          <Input placeholder="mcq, algebra, class-10" />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large">
          Save Question
        </Button>
      </Form>
    </Card>
  );
};

export default CreateQuestion;
