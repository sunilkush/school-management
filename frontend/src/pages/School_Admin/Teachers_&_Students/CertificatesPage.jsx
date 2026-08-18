import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, DatePicker, Empty, Flex, Input, Modal,
  Row, Select, Space, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  DownloadOutlined, EyeOutlined, SafetyCertificateOutlined,
  StopOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../../features/studentSlice";
import {
  generateCertificate,
  getCertificates,
  revokeCertificate,
} from "../../../features/certificateSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  iconWell, pageWrapper, pill, sectionPanel, tableHeadCss,
} from "../../../styles/pageStyles.js";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const CERT_TYPES = [
  { value: "Transfer Certificate", short: "TC", color: "var(--danger-hover)" },
  { value: "Bonafide Certificate", short: "BC", color: "var(--primary)" },
  { value: "Character Certificate", short: "CC", color: "var(--purple)" },
  { value: "Study Certificate", short: "SC", color: "var(--accent-hover)" },
];

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function CertificatesPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const { certificates = [], loading = false } = useSelector((s) => s.certificates || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Generate panel state ───────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [certificateType, setCertificateType] = useState(null);
  const [issueDate, setIssueDate] = useState(dayjs());
  const [conduct, setConduct] = useState(null);
  const [dateOfLeaving, setDateOfLeaving] = useState(null);
  const [reasonForLeaving, setReasonForLeaving] = useState("");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryDesignation, setSignatoryDesignation] = useState("Principal");
  const [generating, setGenerating] = useState(false);

  /* ── Filter state ───────────────────────────────────────── */
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");

  /* ── Modal state ────────────────────────────────────────── */
  const [previewCert, setPreviewCert] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  /* ── Load classes ───────────────────────────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(getClassData({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  /* ── Load sections when class changes ────────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  /* ── Load students when class+section selected ───────────── */
  useEffect(() => {
    if (schoolId && academicYearId && selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({
        schoolId, academicYearId,
        schoolClassId: selectedClass,
        sectionId: selectedSection,
      }));
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, selectedSection, dispatch]);

  /* ── Load certificate list ─────────────────────────────────── */
  const refreshList = () => {
    dispatch(getCertificates({
      certificateType: filterType || undefined,
      status: filterStatus || undefined,
      search: searchText || undefined,
      page: 1,
      limit: 50,
    }));
  };

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus]);

  const sectionOptions = useMemo(
    () => (allSections || []).map((s) => ({ value: s._id, label: s.name })),
    [allSections]
  );
  const studentOptions = useMemo(
    () => (rollNumberList || []).map((s) => ({
      value: s.studentId,
      label: `${s.studentName || "—"} (Roll ${s.rollNumber ?? "—"})`,
    })),
    [rollNumberList]
  );

  const resetGenerateForm = () => {
    setStudentId(null);
    setCertificateType(null);
    setConduct(null);
    setDateOfLeaving(null);
    setReasonForLeaving("");
    setPurpose("");
    setRemarks("");
  };

  const handleGenerate = async () => {
    if (!studentId) return message.warning("Please select a student.");
    if (!certificateType) return message.warning("Please select a certificate type.");
    if (certificateType === "Transfer Certificate" && (!dateOfLeaving || !reasonForLeaving.trim())) {
      return message.warning("Date of leaving and reason are required for a Transfer Certificate.");
    }

    setGenerating(true);
    const res = await dispatch(generateCertificate({
      studentId,
      certificateType,
      issueDate: issueDate ? issueDate.toISOString() : undefined,
      conduct: conduct || undefined,
      dateOfLeaving: dateOfLeaving ? dateOfLeaving.toISOString() : undefined,
      reasonForLeaving: reasonForLeaving || undefined,
      purpose: purpose || undefined,
      remarks: remarks || undefined,
      signatoryName: signatoryName || undefined,
      signatoryDesignation: signatoryDesignation || undefined,
    }));
    setGenerating(false);

    if (generateCertificate.fulfilled.match(res)) {
      message.success(`Certificate ${res.payload.certificateNumber} generated successfully`);
      resetGenerateForm();
      refreshList();
    } else {
      message.error(res.payload || "Failed to generate certificate");
    }
  };

  const handleDownloadPdf = async (cert) => {
    setDownloadingId(cert._id);
    try {
      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/certificates/${cert._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Download failed");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${cert.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      message.success("Certificate downloaded");
    } catch (err) {
      message.error(err.message || "Failed to download certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeReason.trim()) return message.warning("Please provide a reason for revocation.");
    setRevoking(true);
    const res = await dispatch(revokeCertificate({ id: revokeTarget._id, revokeReason }));
    setRevoking(false);
    if (revokeCertificate.fulfilled.match(res)) {
      message.success("Certificate revoked");
      setRevokeTarget(null);
      setRevokeReason("");
    } else {
      message.error(res.payload || "Failed to revoke certificate");
    }
  };

  const columns = [
    {
      title: "Certificate No",
      dataIndex: "certificateNumber",
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Type",
      dataIndex: "certificateType",
      render: (v) => {
        const t = CERT_TYPES.find((c) => c.value === v);
        return <span style={pill(t?.color || "var(--text-secondary)")}>{t?.short || v}</span>;
      },
    },
    {
      title: "Student",
      dataIndex: "studentName",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {[row.className, row.sectionName].filter(Boolean).join(" - ") || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => (
        <Tag color={v === "Issued" ? "success" : "error"} style={{ borderRadius: 99 }}>{v}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Preview">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewCert(row)} />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              size="small" icon={<DownloadOutlined />}
              loading={downloadingId === row._id}
              onClick={() => handleDownloadPdf(row)}
            />
          </Tooltip>
          <Tooltip title={row.status === "Revoked" ? "Already revoked" : "Revoke certificate"}>
            <Button
              size="small" danger icon={<StopOutlined />}
              disabled={row.status === "Revoked"}
              onClick={() => setRevokeTarget(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("cert-tbl")}</style>

      <PageHeader
        title="Certificates"
        subtitle="Generate and manage Transfer, Bonafide, Character and Study certificates"
        icon={<SafetyCertificateOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert
            type="warning"
            showIcon
            message="Please select an active academic year to generate certificates."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        {/* ── Generate panel ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}>
              <SafetyCertificateOutlined style={{ fontSize: 17 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                Generate Certificate
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Select a class and section to find the student, then choose a certificate type
              </Text>
            </div>
          </Flex>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Class"
                style={{ width: "100%" }}
                value={selectedClass}
                onChange={(v) => setSelectedClass(v)}
                options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))}
                showSearch optionFilterProp="label"
                disabled={!canFilter}
                size="large"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Section"
                style={{ width: "100%" }}
                value={selectedSection}
                onChange={(v) => setSelectedSection(v)}
                options={sectionOptions}
                showSearch optionFilterProp="label"
                disabled={!selectedClass}
                size="large"
              />
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Select
                placeholder="Select Student"
                style={{ width: "100%" }}
                value={studentId}
                onChange={setStudentId}
                options={studentOptions}
                showSearch optionFilterProp="label"
                disabled={!selectedSection}
                loading={rollLoading}
                size="large"
              />
            </Col>
          </Row>

          {studentId && (
            <>
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="Certificate Type"
                    style={{ width: "100%" }}
                    value={certificateType}
                    onChange={setCertificateType}
                    options={CERT_TYPES.map((t) => ({ value: t.value, label: t.value }))}
                    size="large"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <DatePicker
                    placeholder="Issue Date"
                    style={{ width: "100%" }}
                    value={issueDate}
                    onChange={setIssueDate}
                    size="large"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Signatory Name (optional)"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    size="large"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Signatory Designation"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                    size="large"
                  />
                </Col>
              </Row>

              {(certificateType === "Transfer Certificate" || certificateType === "Character Certificate") && (
                <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      placeholder="Conduct"
                      style={{ width: "100%" }}
                      value={conduct}
                      onChange={setConduct}
                      options={["Excellent", "Very Good", "Good", "Satisfactory"].map((c) => ({ value: c, label: c }))}
                      size="large"
                    />
                  </Col>
                  {certificateType === "Transfer Certificate" && (
                    <>
                      <Col xs={24} sm={12} md={6}>
                        <DatePicker
                          placeholder="Date of Leaving"
                          style={{ width: "100%" }}
                          value={dateOfLeaving}
                          onChange={setDateOfLeaving}
                          size="large"
                        />
                      </Col>
                      <Col xs={24} sm={24} md={12}>
                        <Input
                          placeholder="Reason for Leaving"
                          value={reasonForLeaving}
                          onChange={(e) => setReasonForLeaving(e.target.value)}
                          size="large"
                        />
                      </Col>
                    </>
                  )}
                </Row>
              )}

              {(certificateType === "Bonafide Certificate" || certificateType === "Study Certificate") && (
                <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                  <Col xs={24} md={12}>
                    <Input
                      placeholder="Purpose (e.g. for passport application)"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      size="large"
                    />
                  </Col>
                </Row>
              )}

              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} md={18}>
                  <Input
                    placeholder="Remarks (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    size="large"
                  />
                </Col>
                <Col xs={24} md={6}>
                  <Button
                    type="primary" icon={<ThunderboltOutlined />}
                    loading={generating}
                    onClick={handleGenerate}
                    size="large"
                    block
                  >
                    Generate Certificate
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </div>

        {/* ── Filter row ─────────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Type"
                allowClear
                style={{ width: "100%" }}
                value={filterType}
                onChange={setFilterType}
                options={CERT_TYPES.map((t) => ({ value: t.value, label: t.value }))}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: "100%" }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[{ value: "Issued", label: "Issued" }, { value: "Revoked", label: "Revoked" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={12}>
              <Input.Search
                placeholder="Search by certificate no. or student name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={refreshList}
                allowClear
              />
            </Col>
          </Row>
        </div>

        {/* ── Table ──────────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Table
            className="cert-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={certificates}
            loading={loading}
            size="middle"
            scroll={{ x: 700 }}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} certificates` }}
            locale={{
              emptyText: <Empty description="No certificates generated yet" style={{ padding: "40px 0" }} />,
            }}
          />
        </div>
      </div>

      {/* ── Preview Modal ────────────────────────────────────── */}
      <Modal
        open={!!previewCert}
        onCancel={() => setPreviewCert(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewCert(null)}>Close</Button>,
          <Button
            key="download" type="primary" icon={<DownloadOutlined />}
            loading={downloadingId === previewCert?._id}
            onClick={() => handleDownloadPdf(previewCert)}
          >
            Download PDF
          </Button>,
        ]}
        title={previewCert ? `${previewCert.certificateType} — ${previewCert.certificateNumber}` : ""}
      >
        {previewCert && (
          <div>
            {previewCert.status === "Revoked" && (
              <Alert type="error" showIcon message={`Revoked: ${previewCert.revokeReason || "—"}`} style={{ marginBottom: 12, borderRadius: 10 }} />
            )}
            <Row gutter={[12, 8]}>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>STUDENT NAME</Text><br /><Text strong>{previewCert.studentName || "—"}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>FATHER'S NAME</Text><br /><Text strong>{previewCert.fatherName || "—"}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>CLASS / SECTION</Text><br /><Text strong>{[previewCert.className, previewCert.sectionName].filter(Boolean).join(" - ") || "—"}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>ROLL NO.</Text><br /><Text strong>{previewCert.rollNumber || "—"}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>ISSUE DATE</Text><br /><Text strong>{fmt(previewCert.issueDate)}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>ADMISSION DATE</Text><br /><Text strong>{fmt(previewCert.admissionDate)}</Text></Col>
              {previewCert.certificateType === "Transfer Certificate" && (
                <>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>DATE OF LEAVING</Text><br /><Text strong>{fmt(previewCert.dateOfLeaving)}</Text></Col>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>REASON</Text><br /><Text strong>{previewCert.reasonForLeaving || "—"}</Text></Col>
                </>
              )}
              {(previewCert.certificateType === "Bonafide Certificate" || previewCert.certificateType === "Study Certificate") && (
                <Col span={24}><Text type="secondary" style={{ fontSize: 11 }}>PURPOSE</Text><br /><Text strong>{previewCert.purpose || "—"}</Text></Col>
              )}
              {previewCert.conduct && (
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>CONDUCT</Text><br /><Text strong>{previewCert.conduct}</Text></Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* ── Revoke Modal ─────────────────────────────────────── */}
      <Modal
        open={!!revokeTarget}
        onCancel={() => { setRevokeTarget(null); setRevokeReason(""); }}
        onOk={confirmRevoke}
        confirmLoading={revoking}
        okText="Revoke Certificate"
        okButtonProps={{ danger: true }}
        title={`Revoke ${revokeTarget?.certificateNumber || ""}`}
      >
        <Paragraph style={{ fontSize: 13, color: "var(--text-muted)" }}>
          This action is permanent and cannot be undone. Please provide a reason for revoking this certificate.
        </Paragraph>
        <TextArea
          rows={3}
          placeholder="Reason for revocation"
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
