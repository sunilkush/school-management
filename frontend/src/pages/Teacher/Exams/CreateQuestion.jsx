import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form, Input, Select, Button, Row, Col, Divider,
  Space, InputNumber, Switch, Tag, Tooltip,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { getClassData } from "../../../features/schoolClassSlice";
import { createQuestions, updateQuestion } from "../../../features/questionSlice";
import { fetchAllChapters } from "../../../features/chapterSlice";

const { Option } = Select;
const { TextArea } = Input;

const QUESTION_TYPES = [
  { value: "mcq_single", label: "MCQ — Single Correct"   },
  { value: "mcq_multi",  label: "MCQ — Multiple Correct" },
  { value: "true_false", label: "True / False"            },
  { value: "fill_blank", label: "Fill in the Blank"       },
  { value: "match",      label: "Match the Following"     },
];

const DIFFICULTY = [
  { value: "easy",   label: "Easy",   color: "var(--success-hover)" },
  { value: "medium", label: "Medium", color: "var(--warning-hover)" },
  { value: "hard",   label: "Hard",   color: "var(--danger-hover)" },
];

/**
 * Props:
 *  initialData  — existing question object (edit mode)
 *  onSuccess    — callback after save (close modal / refresh list)
 *  schoolId     — override the school this question belongs to. Needed for Super Admin, who has
 *                 no schoolId of their own (not tied to one school) — the parent page resolves
 *                 which school is currently selected and passes it down. Omit for every other role,
 *                 which falls back to the logged-in user's own school as before.
 */
const CreateQuestion = ({ initialData = null, onSuccess, schoolId: schoolIdProp }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const isEditMode = !!initialData?._id;

  const { schoolClasses = [] }  = useSelector((s) => s.schoolClass || {});
  const { chapters = [] }        = useSelector((s) => s.chapter   || {});
  const { user = {} }            = useSelector((s) => s.auth      || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId       = schoolIdProp || user?.schoolId?._id || user?.schoolId || user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || null;

  const [saving,          setSaving]          = useState(false);
  const [options,         setOptions]         = useState([]);
  const [correctAnswers,  setCorrectAnswers]  = useState([]);
  const [questionType,    setQuestionType]    = useState("mcq_single");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  /* ── Load classes & chapters ── */
  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(getClassData({ schoolId, academicYearId }));
    dispatch(fetchAllChapters());
  }, [dispatch, schoolId, academicYearId]);

  /* ── Seed form in edit mode ── */
  useEffect(() => {
    if (!initialData) return;
    const classId   = initialData.schoolClassId?._id || initialData.schoolClassId;
    const subjectId = initialData.subjectId?._id      || initialData.subjectId;
    const chapterId = initialData.chapterId?._id      || initialData.chapterId;
    const qType     = initialData.questionType || "mcq_single";

    setSelectedClassId(classId   || null);
    setSelectedSubjectId(subjectId || null);
    setQuestionType(qType);
    setOptions(Array.isArray(initialData.options) ? initialData.options : []);
    setCorrectAnswers(Array.isArray(initialData.correctAnswers) ? initialData.correctAnswers : []);

    form.setFieldsValue({
      schoolClassId: classId,
      subjectId,
      chapterId,
      questionType:  qType,
      statement:     initialData.statement,
      topic:         initialData.topic,
      difficulty:    initialData.difficulty  || "medium",
      marks:         initialData.marks       ?? 1,
      negativeMarks: initialData.negativeMarks ?? 0,
      isActive:      initialData.isActive    ?? true,
      tags:          Array.isArray(initialData.tags) ? initialData.tags.join(", ") : (initialData.tags || ""),
    });
  }, [initialData, form]);

  /* ── Sorted class list ── */
  const sortedClasses = useMemo(() =>
    [...schoolClasses].sort((a, b) => {
      const nA = parseInt(String(a?.name || "").replace(/\D/g, ""), 10) || 0;
      const nB = parseInt(String(b?.name || "").replace(/\D/g, ""), 10) || 0;
      return nA - nB;
    }),
    [schoolClasses]
  );

  const selectedClassData = useMemo(() =>
    schoolClasses.find((c) => String(c?._id) === String(selectedClassId)) || null,
    [schoolClasses, selectedClassId]
  );

  /* ── Subject options from class sections ── */
  const subjectOptions = useMemo(() => {
    if (!selectedClassData?.sections?.length) return [];
    const map = new Map();
    selectedClassData.sections.forEach((sec) => {
      (sec?.subjects || []).forEach((sub) => {
        if (sub?._id && sub?.name) map.set(String(sub._id), sub);
      });
    });
    return Array.from(map.values());
  }, [selectedClassData]);

  /* ── Chapter options filtered by boardClass + subject ── */
  const boardClassId = selectedClassData?.boardClass?._id || null;
  const filteredChapters = useMemo(() => {
    if (!boardClassId || !selectedSubjectId) return [];
    return chapters.filter((ch) => {
      const cBoard   = ch?.boardClassId?._id || ch?.boardClassId;
      const cSubject = ch?.subjectId?._id    || ch?.subjectId;
      return String(cBoard) === String(boardClassId) &&
             String(cSubject) === String(selectedSubjectId);
    });
  }, [chapters, boardClassId, selectedSubjectId]);

  /* ── Handlers ── */
  const handleClassChange = (id) => {
    setSelectedClassId(id || null);
    setSelectedSubjectId(null);
    form.setFieldsValue({ subjectId: undefined, chapterId: undefined });
  };

  const handleSubjectChange = (id) => {
    setSelectedSubjectId(id || null);
    form.setFieldsValue({ chapterId: undefined });
  };

  const addOption = () => setOptions((p) => [...p, { key: String.fromCharCode(65 + p.length), text: "" }]);
  const removeOption = (i) => setOptions((p) => p.filter((_, idx) => idx !== i));
  const updateOption = (i, field, value) =>
    setOptions((p) => { const a = [...p]; a[i] = { ...a[i], [field]: value }; return a; });

  const addCorrectAnswer = () => setCorrectAnswers((p) => [...p, ""]);
  const removeCorrectAnswer = (i) => setCorrectAnswers((p) => p.filter((_, idx) => idx !== i));
  const updateCorrectAnswer = (i, value) =>
    setCorrectAnswers((p) => { const a = [...p]; a[i] = value; return a; });

  const onFinish = async (values) => {
    if (["mcq_single", "mcq_multi", "match"].includes(questionType) && options.length < 2) {
      form.setFields([{ name: "statement", errors: ["MCQ ke liye kam se kam 2 options add karein"] }]);
      return;
    }
    if (correctAnswers.filter(Boolean).length === 0) {
      form.setFields([{ name: "statement", errors: ["Kam se kam 1 correct answer add karein"] }]);
      return;
    }

    const payload = {
      ...values,
      schoolId,
      chapterId:      values.chapterId      || null,
      options,
      correctAnswers: correctAnswers.filter(Boolean),
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
    };

    setSaving(true);
    try {
      if (isEditMode) {
        await dispatch(updateQuestion({ id: initialData._id, payload })).unwrap();
      } else {
        await dispatch(createQuestions(payload)).unwrap();
        form.resetFields();
        setOptions([]);
        setCorrectAnswers([]);
        setQuestionType("mcq_single");
        setSelectedClassId(null);
        setSelectedSubjectId(null);
      }
      onSuccess?.();
    } catch {
      // toast already shown by slice
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = ["mcq_single", "mcq_multi", "match"].includes(questionType);

  /* ── No academic year guard ── */
  if (!academicYearId) {
    return (
      <div style={{
        padding: "32px 24px", textAlign: "center",
        background: "var(--warning-light)", borderRadius: 12,
        border: "1px solid rgba(var(--warning-rgb),0.25)", color: "var(--warning-hover)",
      }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 700 }}>Academic Year select karein</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Classes tabhi load hongi jab academic year select ho.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Academic year badge */}
      <div style={{
        marginBottom: 16, padding: "7px 14px", borderRadius: 8,
        background: isEditMode ? "rgba(var(--purple-rgb),0.12)" : "var(--primary-light)",
        border: `1px solid ${isEditMode ? "rgba(var(--purple-rgb),0.13)" : "rgba(var(--primary-rgb),0.13)"}`,
        color: isEditMode ? "var(--purple-hover)" : "var(--primary-hover)",
        fontSize: 12, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {isEditMode ? <EditOutlined /> : <PlusOutlined />}
        <span>{isEditMode ? "Edit Mode" : "New Question"}</span>
        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          {selectedAcademicYear?.name || academicYearId}
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ questionType: "mcq_single", difficulty: "medium", marks: 1, negativeMarks: 0, isActive: true }}
        onFinish={onFinish}
        size="middle"
      >
        {/* ── Class & Subject ── */}
        <Divider orientation="left" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Class & Subject
        </Divider>

        <Row gutter={12}>
          <Col md={8} xs={24}>
            <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Class select karein" }]}>
              <Select placeholder="Class select karein" onChange={handleClassChange} allowClear showSearch optionFilterProp="children">
                {sortedClasses.map((c) => (
                  <Option key={c._id} value={c._id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="subjectId" label="Subject" rules={[{ required: true, message: "Subject select karein" }]}>
              <Select placeholder="Subject select karein" disabled={!selectedClassId} onChange={handleSubjectChange} allowClear showSearch optionFilterProp="children">
                {subjectOptions.map((s) => (
                  <Option key={s._id} value={s._id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item name="chapterId" label="Chapter">
              <Select placeholder="Chapter (optional)" allowClear disabled={!selectedSubjectId} showSearch optionFilterProp="children">
                {filteredChapters.map((ch) => (
                  <Option key={ch._id} value={ch._id}>
                    {ch.chapterNo ? `${ch.chapterNo}. ${ch.name}` : ch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* ── Question ── */}
        <Divider orientation="left" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Question
        </Divider>

        <Row gutter={12}>
          <Col md={12} xs={24}>
            <Form.Item name="questionType" label="Type">
              <Select onChange={(v) => { setQuestionType(v); setOptions([]); setCorrectAnswers([]); }}>
                {QUESTION_TYPES.map((t) => <Option key={t.value} value={t.value}>{t.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="topic" label="Topic">
              <Input placeholder="e.g. Algebra, Photosynthesis" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="statement"
          label="Question Statement"
          rules={[{ required: true, message: "Question likhein" }]}
        >
          <TextArea rows={3} placeholder="Question statement yahan likhein..." />
        </Form.Item>

        {/* ── Options (MCQ / Match) ── */}
        {needsOptions && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Options ({options.length})
            </Divider>

            <Space direction="vertical" style={{ width: "100%", marginBottom: 8 }}>
              {options.map((opt, i) => (
                <Row gutter={8} key={i} align="middle">
                  <Col flex="60px">
                    <Input
                      value={opt.key}
                      onChange={(e) => updateOption(i, "key", e.target.value)}
                      placeholder="Key"
                      maxLength={3}
                      style={{ textAlign: "center", fontWeight: 700 }}
                    />
                  </Col>
                  <Col flex="1">
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(i, "text", e.target.value)}
                      placeholder={`Option ${i + 1} text`}
                    />
                  </Col>
                  <Col flex="36px">
                    <Tooltip title="Remove option">
                      <Button
                        type="text" danger size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeOption(i)}
                      />
                    </Tooltip>
                  </Col>
                </Row>
              ))}
            </Space>

            <Button type="dashed" icon={<PlusOutlined />} onClick={addOption} block>
              Add Option
            </Button>
          </>
        )}

        {/* ── Correct Answers ── */}
        <Divider orientation="left" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Correct Answers
        </Divider>

        <Space direction="vertical" style={{ width: "100%", marginBottom: 8 }}>
          {correctAnswers.map((ans, i) => (
            <Row gutter={8} key={i} align="middle">
              <Col flex="1">
                <Input
                  value={ans}
                  onChange={(e) => updateCorrectAnswer(i, e.target.value)}
                  placeholder={
                    needsOptions
                      ? "Option key likhein (e.g. A, B)"
                      : "Correct answer likhein"
                  }
                />
              </Col>
              <Col flex="36px">
                <Tooltip title="Remove">
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCorrectAnswer(i)} />
                </Tooltip>
              </Col>
            </Row>
          ))}
        </Space>

        <Button type="dashed" onClick={addCorrectAnswer} block style={{ marginBottom: 4 }}>
          Add Correct Answer
        </Button>

        {needsOptions && correctAnswers.length > 0 && (
          <div style={{ marginTop: 6, marginBottom: 12 }}>
            {correctAnswers.filter(Boolean).map((a) => (
              <Tag key={a} color="green">{a}</Tag>
            ))}
          </div>
        )}

        {/* ── Evaluation ── */}
        <Divider orientation="left" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Evaluation
        </Divider>

        <Row gutter={12}>
          <Col md={6} xs={12}>
            <Form.Item name="difficulty" label="Difficulty">
              <Select>
                {DIFFICULTY.map((d) => (
                  <Option key={d.value} value={d.value}>
                    <Tag color={d.color === "var(--success-hover)" ? "green" : d.color === "var(--warning-hover)" ? "gold" : "red"} style={{ margin: 0 }}>
                      {d.label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col md={6} xs={12}>
            <Form.Item name="marks" label="Marks">
              <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col md={6} xs={12}>
            <Form.Item name="negativeMarks" label="Negative Marks">
              <InputNumber min={0} step={0.25} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col md={6} xs={12}>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="tags" label="Tags (comma separated)">
          <Input placeholder="e.g. algebra, class-10, important" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={saving}
          icon={isEditMode ? <EditOutlined /> : <PlusOutlined />}
          style={{ marginTop: 4 }}
        >
          {isEditMode ? "Update Question" : "Save Question"}
        </Button>
      </Form>
    </div>
  );
};

export default CreateQuestion;
