import { useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Button, Col, DatePicker, Empty, Flex, Input, Modal,
  Row, Segmented, Select, Space, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  DownloadOutlined, EyeOutlined, IdcardOutlined, StopOutlined,
  TeamOutlined, ThunderboltOutlined, UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../../features/studentSlice";
import { getEmployees } from "../../../features/employeeSlice";
import {
  generateIdCard,
  generateBulkIdCards,
  getIdCards,
  deactivateIdCard,
} from "../../../features/idCardSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  iconWell, pageWrapper, sectionPanel, tableHeadCss,
} from "../../../styles/pageStyles.js";

const { Text, Paragraph } = Typography;

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function IDCardsPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const { employees = [], loading: employeesLoading = false } = useSelector((s) => s.employee || {});
  const { cards = [], loading = false } = useSelector((s) => s.idCards || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  const [mode, setMode] = useState("Student"); // "Student" | "Employee"

  /* ── Student picker ─────────────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);

  /* ── Staff picker ───────────────────────────────────────── */
  const [department, setDepartment] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);

  /* ── Shared generate state ─────────────────────────────────── */
  const defaultValidUntil = selectedAcademicYear?.endDate
    ? dayjs(selectedAcademicYear.endDate)
    : dayjs().add(1, "year");
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  /* ── List filters ───────────────────────────────────────── */
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");

  /* ── Table / modal state ───────────────────────────────────── */
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(null);

  /* ── Load classes ───────────────────────────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(getClassData({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

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

  /* ── Load employees when switching to Staff mode ─────────── */
  useEffect(() => {
    if (mode === "Employee" && schoolId) {
      dispatch(getEmployees({ isActive: true }));
    }
  }, [mode, schoolId, dispatch]);

  /* ── Load card list ─────────────────────────────────────── */
  const refreshList = () => {
    dispatch(getIdCards({
      holderType: mode,
      status: filterStatus || undefined,
      search: searchText || undefined,
      page: 1,
      limit: 50,
    }));
  };

  useEffect(() => {
    refreshList();
    setSelectedRowKeys([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filterStatus]);

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
  const departmentOptions = useMemo(() => {
    const depts = new Set((employees || []).map((e) => e.department).filter(Boolean));
    return [...depts].map((d) => ({ value: d, label: d }));
  }, [employees]);
  const employeeOptions = useMemo(() => {
    const filtered = department ? employees.filter((e) => e.department === department) : employees;
    return filtered.map((e) => ({
      value: e._id,
      label: `${e.userId?.name || "—"} — ${e.designation || e.department || "Staff"}`,
    }));
  }, [employees, department]);

  const handleGenerateSingle = async () => {
    const holderId = mode === "Student" ? studentId : employeeId;
    if (!holderId) return message.warning(`Please select a ${mode === "Student" ? "student" : "staff member"}.`);

    setGenerating(true);
    const res = await dispatch(generateIdCard({
      holderType: mode,
      holderId,
      validUntil: validUntil ? validUntil.toISOString() : undefined,
    }));
    setGenerating(false);

    if (generateIdCard.fulfilled.match(res)) {
      message.success(`ID card ${res.payload.cardNumber} generated successfully`);
      if (mode === "Student") setStudentId(null); else setEmployeeId(null);
      refreshList();
    } else {
      message.error(res.payload || "Failed to generate ID card");
    }
  };

  const handleGenerateBulk = async () => {
    if (mode === "Student" && (!selectedClass || !selectedSection)) {
      return message.warning("Please select a class and section first.");
    }
    setBulkGenerating(true);
    const res = await dispatch(generateBulkIdCards({
      holderType: mode,
      schoolClassId: mode === "Student" ? selectedClass : undefined,
      sectionId: mode === "Student" ? selectedSection : undefined,
      department: mode === "Employee" ? department || undefined : undefined,
      validUntil: validUntil ? validUntil.toISOString() : undefined,
    }));
    setBulkGenerating(false);

    if (generateBulkIdCards.fulfilled.match(res)) {
      const { cards: created = [], skippedCount = 0 } = res.payload || {};
      message.success(`${created.length} ID card(s) generated${skippedCount ? `, ${skippedCount} skipped (already active)` : ""}`);
      refreshList();
    } else {
      message.error(res.payload || "Failed to bulk-generate ID cards");
    }
  };

  const downloadCardsPdf = async (ids, filename) => {
    const key = ids.length === 1 ? ids[0] : "bulk";
    setDownloadingKey(key);
    try {
      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/id-cards/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Download failed");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      message.success("ID card PDF downloaded");
    } catch (err) {
      message.error(err.message || "Failed to download ID card PDF");
    } finally {
      setDownloadingKey(null);
    }
  };

  const confirmDeactivate = async () => {
    setDeactivating(true);
    const res = await dispatch(deactivateIdCard({ id: deactivateTarget._id, reason: deactivateReason }));
    setDeactivating(false);
    if (deactivateIdCard.fulfilled.match(res)) {
      message.success("ID card deactivated");
      setDeactivateTarget(null);
      setDeactivateReason("");
    } else {
      message.error(res.payload || "Failed to deactivate ID card");
    }
  };

  const columns = [
    {
      title: "Photo",
      dataIndex: "photoUrl",
      width: 56,
      render: (v, row) => (
        v
          ? <Avatar src={v} size={38} />
          : <Avatar size={38} style={{ background: "#2563EB" }}>{(row.fullName || "?")[0]?.toUpperCase()}</Avatar>
      ),
    },
    {
      title: "Card No",
      dataIndex: "cardNumber",
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Name",
      dataIndex: "fullName",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {row.holderType === "Student"
              ? [row.className, row.sectionName].filter(Boolean).join(" - ") || "—"
              : (row.designation || row.department || "—")}
          </div>
        </div>
      ),
    },
    {
      title: "Valid Until",
      dataIndex: "validUntil",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => <Tag color={v === "Active" ? "success" : "error"} style={{ borderRadius: 99 }}>{v}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Preview">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewCard(row)} />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              size="small" icon={<DownloadOutlined />}
              loading={downloadingKey === row._id}
              onClick={() => downloadCardsPdf([row._id], `${row.cardNumber}.pdf`)}
            />
          </Tooltip>
          <Tooltip title={row.status === "Inactive" ? "Already inactive" : "Deactivate"}>
            <Button
              size="small" danger icon={<StopOutlined />}
              disabled={row.status === "Inactive"}
              onClick={() => setDeactivateTarget(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("idcard-tbl")}</style>

      <PageHeader
        title="ID Cards"
        subtitle="Generate print-ready photo ID cards for students and staff"
        icon={<IdcardOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert
            type="warning"
            showIcon
            message="Please select an active academic year to generate ID cards."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        <div style={{ marginBottom: 16 }}>
          <Segmented
            size="large"
            value={mode}
            onChange={setMode}
            options={[
              { label: "Student", value: "Student", icon: <UserOutlined /> },
              { label: "Staff", value: "Employee", icon: <TeamOutlined /> },
            ]}
          />
        </div>

        {/* ── Generate panel ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("#2563EB", 38)}>
              <IdcardOutlined style={{ fontSize: 17 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                Generate {mode === "Student" ? "Student" : "Staff"} ID Card
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Generate one card at a time, or bulk-generate for a whole {mode === "Student" ? "class/section" : "department"}
              </Text>
            </div>
          </Flex>

          {mode === "Student" ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Select Class"
                  style={{ width: "100%" }}
                  value={selectedClass}
                  onChange={setSelectedClass}
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
                  onChange={setSelectedSection}
                  options={sectionOptions}
                  showSearch optionFilterProp="label"
                  disabled={!selectedClass}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Select
                  placeholder="Select Student (for single card)"
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
              <Col xs={24} sm={12} md={5}>
                <DatePicker
                  placeholder="Valid Until"
                  style={{ width: "100%" }}
                  value={validUntil}
                  onChange={setValidUntil}
                  size="large"
                />
              </Col>
            </Row>
          ) : (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filter by Department (optional)"
                  allowClear
                  style={{ width: "100%" }}
                  value={department}
                  onChange={setDepartment}
                  options={departmentOptions}
                  showSearch optionFilterProp="label"
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Select
                  placeholder="Select Staff Member (for single card)"
                  style={{ width: "100%" }}
                  value={employeeId}
                  onChange={setEmployeeId}
                  options={employeeOptions}
                  showSearch optionFilterProp="label"
                  loading={employeesLoading}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <DatePicker
                  placeholder="Valid Until"
                  style={{ width: "100%" }}
                  value={validUntil}
                  onChange={setValidUntil}
                  size="large"
                />
              </Col>
            </Row>
          )}

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={24} md={12}>
              <Button
                type="primary" icon={<ThunderboltOutlined />}
                loading={generating}
                onClick={handleGenerateSingle}
                size="large"
                block
              >
                Generate Single Card
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <Button
                icon={<TeamOutlined />}
                loading={bulkGenerating}
                onClick={handleGenerateBulk}
                size="large"
                block
              >
                {mode === "Student" ? "Generate for Whole Section" : "Generate for All Staff (filtered)"}
              </Button>
            </Col>
          </Row>
        </div>

        {/* ── Filter row ─────────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: "100%" }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={12}>
              <Input.Search
                placeholder="Search by card no. or name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={refreshList}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Button
                icon={<DownloadOutlined />}
                disabled={!selectedRowKeys.length}
                loading={downloadingKey === "bulk"}
                onClick={() => downloadCardsPdf(selectedRowKeys, `id-cards-sheet-${Date.now()}.pdf`)}
                block
              >
                Download Selected ({selectedRowKeys.length})
              </Button>
            </Col>
          </Row>
        </div>

        {/* ── Table ──────────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Table
            className="idcard-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={cards}
            loading={loading}
            size="middle"
            scroll={{ x: 700 }}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} ID cards` }}
            locale={{
              emptyText: <Empty description="No ID cards generated yet" style={{ padding: "40px 0" }} />,
            }}
          />
        </div>
      </div>

      {/* ── Preview Modal ────────────────────────────────────── */}
      <Modal
        open={!!previewCard}
        onCancel={() => setPreviewCard(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewCard(null)}>Close</Button>,
          <Button
            key="download" type="primary" icon={<DownloadOutlined />}
            loading={downloadingKey === previewCard?._id}
            onClick={() => downloadCardsPdf([previewCard._id], `${previewCard.cardNumber}.pdf`)}
          >
            Download PDF
          </Button>,
        ]}
        title={previewCard ? `${previewCard.holderType} ID Card — ${previewCard.cardNumber}` : ""}
      >
        {previewCard && (
          <div>
            {previewCard.status === "Inactive" && (
              <Alert type="error" showIcon message={`Deactivated: ${previewCard.deactivateReason || "—"}`} style={{ marginBottom: 12, borderRadius: 10 }} />
            )}
            <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
              {previewCard.photoUrl
                ? <Avatar src={previewCard.photoUrl} size={56} />
                : <Avatar size={56} style={{ background: "#2563EB" }}>{(previewCard.fullName || "?")[0]?.toUpperCase()}</Avatar>}
              <div>
                <Text strong style={{ fontSize: 15 }}>{previewCard.fullName}</Text><br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {previewCard.holderType === "Student"
                    ? [previewCard.className, previewCard.sectionName].filter(Boolean).join(" - ")
                    : (previewCard.designation || previewCard.department)}
                </Text>
              </div>
            </Flex>
            <Row gutter={[12, 8]}>
              {previewCard.holderType === "Student" ? (
                <>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>ROLL NO.</Text><br /><Text strong>{previewCard.rollNumber || "—"}</Text></Col>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>REG. NO.</Text><br /><Text strong>{previewCard.registrationNumber || "—"}</Text></Col>
                </>
              ) : (
                <>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>EMPLOYEE CODE</Text><br /><Text strong>{previewCard.employeeCode || "—"}</Text></Col>
                  <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>DEPARTMENT</Text><br /><Text strong>{previewCard.department || "—"}</Text></Col>
                </>
              )}
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>BLOOD GROUP</Text><br /><Text strong>{previewCard.bloodGroup || "—"}</Text></Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>VALID UNTIL</Text><br /><Text strong>{fmt(previewCard.validUntil)}</Text></Col>
              <Col span={24}><Text type="secondary" style={{ fontSize: 11 }}>CONTACT</Text><br /><Text strong>{previewCard.contactPhone || "—"}</Text></Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* ── Deactivate Modal ─────────────────────────────────── */}
      <Modal
        open={!!deactivateTarget}
        onCancel={() => { setDeactivateTarget(null); setDeactivateReason(""); }}
        onOk={confirmDeactivate}
        confirmLoading={deactivating}
        okText="Deactivate Card"
        okButtonProps={{ danger: true }}
        title={`Deactivate ${deactivateTarget?.cardNumber || ""}`}
      >
        <Paragraph style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Use this for lost/damaged cards or when reissuing. The card will be marked inactive; generate a new one afterwards if needed.
        </Paragraph>
        <Input
          placeholder="Reason (optional)"
          value={deactivateReason}
          onChange={(e) => setDeactivateReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
