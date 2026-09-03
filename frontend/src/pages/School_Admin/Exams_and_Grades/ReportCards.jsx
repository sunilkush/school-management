import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Drawer, Empty, Form, Input, Modal, Popconfirm, Select, Space, Spin,
  Table, Tabs, Tag, Typography, message,
} from "antd";
import {
  DownloadOutlined, EditOutlined, FileTextOutlined, PlusOutlined, SendOutlined, ThunderboltOutlined,
} from "@ant-design/icons";

import PageHeader from "../../../components/layout/PageHeader";
import ReportCardView from "../../../components/reportCard/ReportCardView";
import { pageWrapper, sectionPanel, toolbarRow } from "../../../styles/pageStyles";
import httpClient from "../../../api/httpClient";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import {
  fetchReportCardTemplates, createReportCardTemplate, updateReportCardTemplate,
  deleteReportCardTemplate, generateReportCards, fetchReportCards, fetchReportCard,
  updateReportCard, publishReportCards, downloadReportCardPdf,
} from "../../../services/reportCardApi";

const { Text } = Typography;

const pct = (n) => `${Number(n || 0).toFixed(2)}%`;

export default function ReportCards() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id;
  // The login payload's `school` object carries only _id/name/isActive — there is no
  // activeAcademicYearId on it, so the previous `user?.school?.activeAcademicYearId` was always
  // undefined and every request on this page went out unscoped. The academicYear slice is where
  // the active session actually lives.
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;

  // The Topbar's year switcher normally fills `selectedAcademicYear`, but it is skipped entirely
  // on mobile widths and may mount after this page. Fetching the active year here makes the page
  // correct on its own; the shared reducer is idempotent, so repeating the fetch is harmless.
  useEffect(() => {
    if (schoolId && !activeYear && !selectedAcademicYear) dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId, activeYear, selectedAcademicYear]);

  const [templates, setTemplates] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  const [templateModal, setTemplateModal] = useState({ open: false, editing: null });
  const [templateForm] = Form.useForm();
  const [reviewCard, setReviewCard] = useState(null);
  const [reviewForm] = Form.useForm();
  const [busy, setBusy] = useState(false);

  /* ── Reference data ───────────────────────────────────────────── */
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await fetchReportCardTemplates(academicYearId ? { academicYearId } : {}));
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not load terms");
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  useEffect(() => {
    httpClient.get("/exams", { params: academicYearId ? { academicYearId } : {} })
      .then((res) => setExams(res.data?.data?.exams || res.data?.data || []))
      .catch(() => setExams([]));
    // The year filter matters here: without it the endpoint returns every class the school has
    // ever had, so the same grade appears once per academic year and the list reads as duplicates
    // ("Class 1", "Class 1"). SchoolClass is unique on {schoolId, academicYearId, boardClassId},
    // so scoped to one year each grade can only appear once.
    httpClient.get("/school-class", { params: academicYearId ? { academicYearId } : {} })
      .then((res) => setClasses(res.data?.data?.classes || res.data?.data || []))
      .catch(() => setClasses([]));
  }, [academicYearId]);

  /* ── Cards ────────────────────────────────────────────────────── */
  const loadCards = useCallback(async () => {
    if (!selectedTemplate) { setCards([]); return; }
    setCardsLoading(true);
    try {
      setCards(await fetchReportCards({
        templateId: selectedTemplate,
        ...(selectedClass ? { schoolClassId: selectedClass } : {}),
      }));
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not load report cards");
    } finally {
      setCardsLoading(false);
    }
  }, [selectedTemplate, selectedClass]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedClass) {
      message.warning("Pick a term and a class first");
      return;
    }
    setBusy(true);
    try {
      const result = await generateReportCards({ templateId: selectedTemplate, schoolClassId: selectedClass });
      message.success(
        result.skippedPublished
          ? `Generated ${result.generated}. Skipped ${result.skippedPublished} published card(s).`
          : `Generated ${result.generated} report card(s)`
      );
      loadCards();
    } catch (err) {
      message.error(err?.response?.data?.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (publish) => {
    setBusy(true);
    try {
      const result = await publishReportCards({
        templateId: selectedTemplate,
        ...(selectedClass ? { schoolClassId: selectedClass } : {}),
        publish,
      });
      message.success(`${result.modified} card(s) ${publish ? "published" : "unpublished"}`);
      loadCards();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not update publish state");
    } finally {
      setBusy(false);
    }
  };

  /* ── Template create / edit ───────────────────────────────────── */
  const openTemplateModal = (editing = null) => {
    setTemplateModal({ open: true, editing });
    templateForm.setFieldsValue(
      editing
        ? {
            name: editing.name,
            exams: editing.exams?.map((e) => ({ examId: e.examId, weightage: e.weightage })) || [],
            coScholastic: (editing.coScholasticAreas || []).map((a) => a.name).join(", "),
            status: editing.status,
          }
        : { name: "", exams: [], coScholastic: "", status: "active" }
    );
  };

  const saveTemplate = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name,
        academicYearId,
        exams: values.exams || [],
        coScholasticAreas: (values.coScholastic || "")
          .split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({ name })),
        status: values.status,
      };
      if (templateModal.editing) {
        await updateReportCardTemplate(templateModal.editing._id, payload);
        message.success("Term updated");
      } else {
        await createReportCardTemplate(payload);
        message.success("Term created");
      }
      setTemplateModal({ open: false, editing: null });
      loadTemplates();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not save the term");
    } finally {
      setBusy(false);
    }
  };

  /* ── Review drawer ────────────────────────────────────────────── */
  const openReview = async (id) => {
    try {
      const card = await fetchReportCard(id);
      setReviewCard(card);
      reviewForm.setFieldsValue({
        classTeacherRemarks: card.classTeacherRemarks || "",
        ...Object.fromEntries((card.coScholastic || []).map((c) => [`co_${c.area}`, c.grade])),
      });
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not open the report card");
    }
  };

  const saveReview = async (values) => {
    setBusy(true);
    try {
      const updated = await updateReportCard(reviewCard._id, {
        classTeacherRemarks: values.classTeacherRemarks || "",
        coScholastic: (reviewCard.coScholastic || []).map((c) => ({
          area: c.area,
          grade: values[`co_${c.area}`] || "",
        })),
      });
      message.success("Report card updated");
      setReviewCard(updated);
      loadCards();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  /* ── Tables ───────────────────────────────────────────────────── */
  const templateColumns = [
    { title: "Term", dataIndex: "name" },
    { title: "Exams", render: (_, r) => `${r.exams?.length || 0} exam(s)` },
    { title: "Co-scholastic", render: (_, r) => (r.coScholasticAreas || []).map((a) => a.name).join(", ") || "—" },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "active" ? "success" : "default"}>{v}</Tag> },
    {
      title: "",
      align: "right",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openTemplateModal(r)}>Edit</Button>
          <Popconfirm
            title="Delete this term?"
            description="Its unpublished report cards are deleted too."
            onConfirm={async () => {
              try {
                await deleteReportCardTemplate(r._id);
                message.success("Term deleted");
                loadTemplates();
              } catch (err) {
                message.error(err?.response?.data?.message || "Could not delete");
              }
            }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const cardColumns = [
    { title: "Student", render: (_, r) => r.studentId?.name || "—" },
    { title: "Percentage", dataIndex: ["totals", "percentage"], align: "right", render: pct },
    { title: "Grade", dataIndex: ["totals", "grade"], align: "right" },
    {
      title: "Result",
      dataIndex: ["totals", "resultStatus"],
      render: (v) => <Tag color={v === "FAIL" ? "error" : "success"}>{v}</Tag>,
    },
    { title: "Rank", dataIndex: "rank", align: "right", render: (v) => v || "—" },
    {
      title: "Published",
      dataIndex: "isPublished",
      render: (v) => (v ? <Tag color="success">Published</Tag> : <Tag color="warning">Provisional</Tag>),
    },
    {
      title: "",
      align: "right",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => openReview(r._id)}>Review</Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadReportCardPdf(r._id, `${r.studentId?.name || "report-card"}.pdf`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Report Cards"
        subtitle="Define a term, generate consolidated cards from its exams, then publish them to parents."
        icon={<FileTextOutlined />}
      />

      <Tabs
        defaultActiveKey="cards"
        items={[
          {
            key: "cards",
            label: "Report Cards",
            children: (
              <>
                <div style={{ ...sectionPanel }}>
                  <div style={toolbarRow}>
                    <Select
                      placeholder="Select term"
                      style={{ minWidth: 220 }}
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      options={templates.map((t) => ({ value: t._id, label: t.name }))}
                      loading={loading}
                    />
                    <Select
                      placeholder="Select class"
                      style={{ minWidth: 200 }}
                      value={selectedClass}
                      onChange={setSelectedClass}
                      allowClear
                      options={classes.map((c) => ({ value: c._id, label: c.name }))}
                    />
                    <Button type="primary" icon={<ThunderboltOutlined />} loading={busy} onClick={handleGenerate}>
                      Generate
                    </Button>
                    <Popconfirm
                      title="Publish these report cards?"
                      description="Parents and students will be able to see them."
                      onConfirm={() => handlePublish(true)}
                    >
                      <Button icon={<SendOutlined />} disabled={!selectedTemplate || !cards.length}>Publish</Button>
                    </Popconfirm>
                    <Button disabled={!selectedTemplate || !cards.length} onClick={() => handlePublish(false)}>
                      Unpublish
                    </Button>
                  </div>

                  {!selectedTemplate ? (
                    <Empty description="Pick a term to see its report cards" />
                  ) : (
                    <Table
                      size="small"
                      rowKey="_id"
                      loading={cardsLoading}
                      columns={cardColumns}
                      dataSource={cards}
                      pagination={{ pageSize: 20 }}
                      scroll={{ x: 800 }}
                    />
                  )}
                </div>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 12 }}
                  message="Regenerating keeps what you typed"
                  description="Re-running Generate refreshes the marks but preserves co-scholastic grades and remarks. Published cards are skipped — unpublish them first to change them."
                />
              </>
            ),
          },
          {
            key: "terms",
            label: "Terms",
            children: (
              <div style={sectionPanel}>
                <div style={toolbarRow}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openTemplateModal()}>
                    New term
                  </Button>
                </div>
                <Table
                  size="small"
                  rowKey="_id"
                  loading={loading}
                  columns={templateColumns}
                  dataSource={templates}
                  pagination={false}
                  scroll={{ x: 700 }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* ── Term editor ── */}
      <Modal
        open={templateModal.open}
        title={templateModal.editing ? "Edit term" : "New term"}
        onCancel={() => setTemplateModal({ open: false, editing: null })}
        onOk={() => templateForm.submit()}
        confirmLoading={busy}
        width={620}
        destroyOnClose
      >
        <Form form={templateForm} layout="vertical" onFinish={saveTemplate}>
          <Form.Item name="name" label="Term name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Term 1 — 2026-27" />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Exams and their weightage. A student is scored on the exams they actually sat, so a
            missed exam is not counted as zero.
          </Text>
          <Form.List name="exams">
            {(fields, { add, remove }) => (
              <div style={{ marginTop: 10 }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: "flex", marginBottom: 4 }}>
                    <Form.Item {...field} name={[field.name, "examId"]} rules={[{ required: true, message: "Pick an exam" }]}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 280 }}
                        placeholder="Exam"
                        options={exams.map((e) => ({ value: e._id, label: e.title || e.name }))}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, "weightage"]} rules={[{ required: true, message: "Weight" }]}>
                      <Input type="number" min={0} max={100} placeholder="Weight %" style={{ width: 110 }} />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(field.name)}>Remove</Button>
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ weightage: 50 })}>
                  Add exam
                </Button>
              </div>
            )}
          </Form.List>

          <Form.Item
            name="coScholastic"
            label="Co-scholastic areas"
            extra="Comma separated — e.g. Discipline, Sports, Art"
            style={{ marginTop: 16 }}
          >
            <Input placeholder="Discipline, Sports, Art" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Review drawer ── */}
      <Drawer
        open={Boolean(reviewCard)}
        onClose={() => setReviewCard(null)}
        width={720}
        title={reviewCard?.studentId?.name || "Report card"}
        extra={
          reviewCard && (
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadReportCardPdf(reviewCard._id, `${reviewCard.studentId?.name || "report-card"}.pdf`)}
            >
              PDF
            </Button>
          )
        }
      >
        {!reviewCard ? (
          <Spin />
        ) : (
          <>
            <ReportCardView card={reviewCard} />
            {reviewCard.isPublished ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                message="Published — unpublish it before editing"
              />
            ) : (
              <Form form={reviewForm} layout="vertical" onFinish={saveReview} style={{ marginTop: 16 }}>
                {(reviewCard.coScholastic || []).map((entry) => (
                  <Form.Item key={entry.area} name={`co_${entry.area}`} label={entry.area}>
                    <Input placeholder="A / B+ / Satisfactory" />
                  </Form.Item>
                ))}
                <Form.Item name="classTeacherRemarks" label="Class teacher's remarks">
                  <Input.TextArea rows={3} maxLength={1000} showCount />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={busy}>Save</Button>
              </Form>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
