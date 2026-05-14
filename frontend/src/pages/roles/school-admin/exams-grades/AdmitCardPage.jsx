import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { generateAdmitCards, getAdmitCards, getExams } from "../../../../features/examSlice";

const { Paragraph, Text, Title } = Typography;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
}[char]));

const buildAdmitCardHtml = (card) => `
  <html>
    <head>
      <title>Admit Card - ${escapeHtml(card.studentName)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; max-width: 760px; margin: auto; }
        h1 { text-align: center; margin: 0 0 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
        .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
        ul { margin-top: 8px; }
        .footer { display: flex; justify-content: space-between; margin-top: 48px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Admit Card</h1>
        <div class="grid">
          <div><div class="label">Student</div><div class="value">${escapeHtml(card.studentName)}</div></div>
          <div><div class="label">Roll No</div><div class="value">${escapeHtml(card.rollNumber)}</div></div>
          <div><div class="label">Seat No</div><div class="value">${escapeHtml(card.seatNumber)}</div></div>
          <div><div class="label">Exam</div><div class="value">${escapeHtml(card.examTitle)}</div></div>
          <div><div class="label">Subject</div><div class="value">${escapeHtml(card.subjectName || "-")}</div></div>
          <div><div class="label">Class / Section</div><div class="value">${escapeHtml([card.className, card.sectionName].filter(Boolean).join(" - ") || "-")}</div></div>
          <div><div class="label">Date</div><div class="value">${escapeHtml(formatDateTime(card.examDate))}</div></div>
          <div><div class="label">Time</div><div class="value">${escapeHtml(formatDateTime(card.startTime))} - ${escapeHtml(formatDateTime(card.endTime))}</div></div>
        </div>
        <h3>Instructions</h3>
        <ul>${(card.instructions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <div class="footer"><span>Student Signature</span><span>Controller Signature</span></div>
      </div>
    </body>
  </html>
`;

const AdmitCardPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const [examId, setExamId] = useState();
  const [rows, setRows] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const effectiveAcademicYear = useMemo(() => {
    if (selectedAcademicYear?._id) return selectedAcademicYear;
    return null;
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (!effectiveAcademicYear?._id) return;
    dispatch(getExams({
      schoolId: effectiveAcademicYear.schoolId,
      academicYearId: effectiveAcademicYear._id,
      limit: 100,
    }));
  }, [dispatch, effectiveAcademicYear]);

  const loadExistingCards = async (selectedExamId) => {
    if (!selectedExamId) {
      setRows([]);
      setIsGenerated(false);
      return;
    }
    const res = await dispatch(getAdmitCards(selectedExamId));
    if (getAdmitCards.fulfilled.match(res)) {
      setRows(res.payload.cards || []);
      setIsGenerated(Boolean(res.payload.meta?.isGenerated));
    }
  };

  const handleExamChange = (value) => {
    setExamId(value);
    loadExistingCards(value);
  };

  const handleGenerate = async () => {
    if (!examId) return message.warning("Select exam first");
    const res = await dispatch(generateAdmitCards(examId));
    if (generateAdmitCards.fulfilled.match(res)) {
      setRows(res.payload.cards || []);
      setIsGenerated(Boolean(res.payload.meta?.isGenerated));
      return message.success(res.payload.message || "Admit cards generated successfully");
    }
    return message.error(res.payload || "Unable to generate admit cards");
  };

  const handleDownload = (card) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      message.error("Popup blocked. Please allow popups to download admit card.");
      return;
    }
    printWindow.document.write(buildAdmitCardHtml(card));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>Admit Card</Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Admin ek baar admit cards generate karega. Generate hone ke baad same cards ko view ya download karein.
          </Paragraph>
        </Space>
        <Space wrap>
          <Select
            value={examId}
            onChange={handleExamChange}
            placeholder="Select exam"
            style={{ width: 300 }}
            options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
          />
          <Button type="primary" onClick={handleGenerate} disabled={isGenerated} loading={loading}>
            {isGenerated ? "Already Generated" : "Generate"}
          </Button>
          {isGenerated ? <Tag color="green">Generated</Tag> : <Tag color="orange">Not Generated</Tag>}
        </Space>
        <Table
          rowKey={(record) => record._id || `${record.studentId}-${record.seatNumber}`}
          dataSource={rows}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="Select an exam and generate admit cards" /> }}
          columns={[
            { title: "Student", dataIndex: "studentName" },
            { title: "Roll No", dataIndex: "rollNumber" },
            { title: "Seat No", dataIndex: "seatNumber" },
            { title: "Exam", dataIndex: "examTitle" },
            {
              title: "Action",
              render: (_, record) => (
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => setSelectedCard(record)}>View</Button>
                  <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>Download</Button>
                </Space>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title="Admit Card Preview"
        open={Boolean(selectedCard)}
        onCancel={() => setSelectedCard(null)}
        footer={selectedCard ? [
          <Button key="close" onClick={() => setSelectedCard(null)}>Close</Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(selectedCard)}>
            Download
          </Button>,
        ] : null}
        width={760}
      >
        {selectedCard ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Student">{selectedCard.studentName}</Descriptions.Item>
              <Descriptions.Item label="Roll No">{selectedCard.rollNumber}</Descriptions.Item>
              <Descriptions.Item label="Seat No">{selectedCard.seatNumber}</Descriptions.Item>
              <Descriptions.Item label="Exam">{selectedCard.examTitle}</Descriptions.Item>
              <Descriptions.Item label="Subject">{selectedCard.subjectName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Class / Section">
                {[selectedCard.className, selectedCard.sectionName].filter(Boolean).join(" - ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Date">{formatDateTime(selectedCard.examDate)}</Descriptions.Item>
              <Descriptions.Item label="Time">
                {formatDateTime(selectedCard.startTime)} - {formatDateTime(selectedCard.endTime)}
              </Descriptions.Item>
            </Descriptions>
            <Text strong>Instructions</Text>
            <ul style={{ marginTop: 0 }}>
              {(selectedCard.instructions || []).map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ul>
          </Space>
        ) : null}
      </Modal>
    </Card>
  );
};

export default AdmitCardPage;