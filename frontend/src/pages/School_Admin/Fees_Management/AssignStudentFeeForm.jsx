import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
  CalendarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../../context/ThemeContext";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { currentUser } from "../../../features/authSlice";
import { fetchFeeStructures } from "../../../features/feeStructureSlice";
import {
  assignFeesToStudents,
  fetchMyFees,
} from "../../../features/studentFeeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  tableHeadCss,
  iconWell,
  avatarStyle,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const TABLE_CLS = "assign-fee-tbl";

/* ── helpers ── */
const safeId = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  if (typeof v === "object" && v.studentId)
    return typeof v.studentId === "object"
      ? String(v.studentId?._id)
      : String(v.studentId);
  return String(v);
};

const getStudentUserId = (student) => safeId(student?.studentId);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getApiMessage = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const msg =
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.payload?.message ||
    err?.message ||
    err?.error;
  return typeof msg === "string" ? msg : fallback;
};

/* ── Fee card (mobile) ── */
const FeeMobileCard = ({ fee, isSelected, onToggle, customAmount, onCustomChange, isDark }) => {
  const borderColor = isDark ? "#2a3550" : "#e2e8f0";
  const bg = isDark ? "#1a2235" : "#fff";
  const accentColor = isSelected ? "var(--primary)" : borderColor;

  return (
    <div
      onClick={() => onToggle(fee._id)}
      style={{
        background: bg,
        border: `1.5px solid ${accentColor}`,
        borderRadius: 14,
        padding: "14px 16px",
        borderLeft: `4px solid ${accentColor}`,
        cursor: "pointer",
        transition: "border-color 0.15s",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {fee.feeHeadId?.name || fee.name || "—"}
          </div>
          {fee.description && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{fee.description}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
          <Tag color="blue" style={{ margin: 0 }}>
            {fee.frequency ? String(fee.frequency).toUpperCase() : "—"}
          </Tag>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: `2px solid ${isSelected ? "var(--primary)" : borderColor}`,
            background: isSelected ? "var(--primary)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {isSelected && <CheckCircleOutlined style={{ color: "#fff", fontSize: 11 }} />}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: isSelected ? 12 : 0 }}>
        <div style={{
          flex: 1, textAlign: "center",
          background: isDark ? "#0f172a" : "#f8fafc",
          borderRadius: 10, padding: "8px 4px",
          border: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Default</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>{money(fee.amount)}</div>
        </div>
        <div style={{
          flex: 1, textAlign: "center",
          background: isDark ? "#0f172a" : "#f0fdf4",
          borderRadius: 10, padding: "8px 4px",
          border: `1px solid ${isDark ? "#2a3550" : "#bbf7d0"}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Final</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#22C55E", marginTop: 2 }}>
            {money(customAmount ?? fee.amount)}
          </div>
        </div>
      </div>

      {isSelected && (
        <div onClick={(e) => e.stopPropagation()}>
          <InputNumber
            placeholder="Custom amount (optional)"
            style={{ width: "100%", borderRadius: 10 }}
            value={customAmount ?? null}
            formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
            parser={(v) => v?.replace(/[₹,\s]/g, "")}
            onChange={(val) => onCustomChange(fee._id, val)}
            min={0}
          />
        </div>
      )}
    </div>
  );
};

/* ── KPI stat card ── */
const StatCard = ({ icon, label, value, color, isDark }) => (
  <div style={{
    background: isDark ? "#1a2235" : "#fff",
    borderRadius: 14,
    padding: "16px 18px",
    border: "1px solid var(--border-muted)",
    borderLeft: `4px solid ${color}`,
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  }}>
    <div style={iconWell(color, 42)}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginTop: 2 }}>
        {value}
      </div>
    </div>
  </div>
);

/* ── Main component ── */
const AssignStudentFee = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { isDark } = useTheme();

  const [mode, setMode] = useState("bulk");
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (type, msg, description = "") => {
    setAlertInfo({ type, message: msg, description });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Redux selectors ── */
  const { schoolStudents: rawSchoolStudents } = useSelector((s) => s.students || {});
  const { schoolClasses: rawSchoolClasses } = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((s) => s.auth || {});
  const { feeStructures: rawFeeStructures, loading } = useSelector((s) => s.feeStructure || {});

  const schoolStudents = useMemo(
    () => (Array.isArray(rawSchoolStudents) ? rawSchoolStudents : []),
    [rawSchoolStudents]
  );
  const schoolClasses = useMemo(
    () => (Array.isArray(rawSchoolClasses) ? rawSchoolClasses : []),
    [rawSchoolClasses]
  );
  const feeStructures = useMemo(
    () => (Array.isArray(rawFeeStructures) ? rawFeeStructures : []),
    [rawFeeStructures]
  );

  const schoolId = user?.school?._id || user?.schoolId || "";

  const selectedStudentId = Form.useWatch("studentId", form);
  const selectedClassId = Form.useWatch("schoolClassId", form);
  const academicYearId = Form.useWatch("academicYearId", form);

  const selectedStudent = useMemo(
    () => schoolStudents.find((s) => getStudentUserId(s) === safeId(selectedStudentId)),
    [schoolStudents, selectedStudentId]
  );

  const effectiveClassId =
    mode === "single"
      ? selectedStudent?.class?._id ||
        selectedStudent?.schoolClass?._id ||
        selectedStudent?.classId ||
        selectedStudent?.schoolClassId ||
        null
      : selectedClassId;

  const selectedClass = useMemo(
    () => schoolClasses.find((c) => safeId(c._id) === safeId(effectiveClassId)),
    [schoolClasses, effectiveClassId]
  );

  const filteredStudentsForClass = useMemo(() => {
    return schoolStudents.filter((s) => {
      const studentClassId = s.class?._id || s.schoolClass?._id || s.classId || s.schoolClassId;
      const matchClass = !effectiveClassId || safeId(studentClassId) === safeId(effectiveClassId);
      const name = s.user?.name || s.name || "";
      const email = s.user?.email || s.email || "";
      const regNo = s.registrationNumber || s.regId || "";
      const matchSearch =
        !studentSearch ||
        `${name} ${email} ${regNo}`.toLowerCase().includes(studentSearch.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [schoolStudents, effectiveClassId, studentSearch]);

  const selectedFees = useMemo(
    () => feeStructures.filter((fee) => selectedFeeIds.includes(fee._id)),
    [feeStructures, selectedFeeIds]
  );

  const totalDefaultAmount = useMemo(
    () => selectedFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
    [selectedFees]
  );

  const totalFinalAmount = useMemo(
    () =>
      selectedFees.reduce((sum, fee) => {
        const custom = customAmounts[fee._id];
        return sum + Number(custom ?? fee.amount ?? 0);
      }, 0),
    [selectedFees, customAmounts]
  );

  const targetStudentCount =
    mode === "single" && selectedStudentId ? 1 : filteredStudentsForClass.length;

  /* ── Effects ── */
  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    form.setFieldsValue({ academicYearId: selectedAcademicYear._id });
  }, [selectedAcademicYear?._id, form]);

  useEffect(() => {
    if (!schoolId) return;
    const params = {
      schoolId,
      ...(selectedAcademicYear?._id && { academicYearId: selectedAcademicYear._id }),
      ...(selectedClassId && { schoolClassId: selectedClassId }),
    };
    dispatch(fetchStudentsBySchoolId(params));
    dispatch(fetchSchoolClasses({
      schoolId,
      ...(selectedAcademicYear?._id && { academicYearId: selectedAcademicYear._id }),
    }));
  }, [dispatch, schoolId, selectedAcademicYear?._id, selectedClassId]);

  useEffect(() => {
    if (!schoolId || !academicYearId || !effectiveClassId) return;
    dispatch(fetchFeeStructures({ schoolId, academicYearId, schoolClassId: effectiveClassId }));
  }, [dispatch, schoolId, academicYearId, effectiveClassId]);

  useEffect(() => {
    setSelectedFeeIds((prev) =>
      prev.filter((id) => feeStructures.some((fee) => fee._id === id))
    );
  }, [feeStructures]);

  useEffect(() => {
    setSelectedFeeIds([]);
    setCustomAmounts({});
    setAlertInfo(null);
  }, [mode, effectiveClassId, academicYearId]);

  /* ── Refresh ── */
  const refreshData = () => {
    if (!schoolId) return;
    const params = {
      schoolId,
      ...(selectedAcademicYear?._id && { academicYearId: selectedAcademicYear._id }),
      ...(selectedClassId && { schoolClassId: selectedClassId }),
    };
    dispatch(fetchStudentsBySchoolId(params));
    dispatch(fetchSchoolClasses(params));
    if (academicYearId && effectiveClassId) {
      dispatch(fetchFeeStructures({ schoolId, academicYearId, schoolClassId: effectiveClassId }));
    }
  };

  /* ── Duplicate check ── */
  const checkAlreadyAssignedFees = async ({ studentIds, feeIds }) => {
    const duplicateMap = {};
    try {
      const responses = await Promise.all(
        studentIds.map((sid) =>
          dispatch(fetchMyFees({ studentId: sid, academicYearId: selectedAcademicYear?._id })).unwrap()
        )
      );
      responses.forEach((feesResponse, index) => {
        const studentId = studentIds[index];
        const fees = Array.isArray(feesResponse)
          ? feesResponse
          : Array.isArray(feesResponse?.data) ? feesResponse.data : [];
        const assignedFeeIds = fees.map((fee) =>
          safeId(fee?.feeStructureId?._id || fee?.feeStructureId)
        );
        duplicateMap[safeId(studentId)] = feeIds.filter((feeId) =>
          assignedFeeIds.includes(safeId(feeId))
        );
      });
      return duplicateMap;
    } catch (err) {
      console.error("Duplicate check failed:", err);
      return {};
    }
  };

  /* ── Submit ── */
  const onFinish = async (values) => {
    setAlertInfo(null);
    try {
      if (!schoolId) { showAlert("error", "School Not Found", "Please login again."); return; }
      if (!values.academicYearId) { showAlert("warning", "Academic Year Required"); return; }
      if (!selectedFeeIds.length) { showAlert("warning", "Select at least one fee"); return; }

      const payloadBase = { schoolId, academicYearId: selectedAcademicYear._id };
      let studentIdsToAssign = [];

      if (mode === "single") {
        const studentId = safeId(values.studentId);
        if (!studentId) { showAlert("warning", "Student Required"); return; }
        payloadBase.studentId = studentId;
        studentIdsToAssign = [studentId];
      }

      if (mode === "bulk") {
        studentIdsToAssign = filteredStudentsForClass.map((s) => getStudentUserId(s)).filter(Boolean);
        if (!studentIdsToAssign.length) { showAlert("warning", "No students found"); return; }
        payloadBase.studentIds = studentIdsToAssign;
      }

      setAssigning(true);

      const duplicateMap = await checkAlreadyAssignedFees({ studentIds: studentIdsToAssign, feeIds: selectedFeeIds });
      const assignPromises = [];
      let skipped = 0;

      for (const feeStructureId of selectedFeeIds) {
        const pendingStudents = studentIdsToAssign.filter(
          (sid) => !(duplicateMap[safeId(sid)] || []).includes(safeId(feeStructureId))
        );
        skipped += studentIdsToAssign.length - pendingStudents.length;
        if (!pendingStudents.length) continue;
        assignPromises.push(
          dispatch(assignFeesToStudents({
            ...payloadBase,
            feeStructureId,
            ...(mode === "single" ? { studentId: pendingStudents[0] } : { studentIds: pendingStudents }),
            customAmount: customAmounts[feeStructureId] ?? null,
          })).unwrap()
        );
      }

      if (!assignPromises.length) { showAlert("warning", "Fees already assigned"); return; }

      await Promise.all(assignPromises);
      showAlert(
        skipped > 0 ? "warning" : "success",
        skipped > 0 ? `Skipped ${skipped} duplicates` : "Fees assigned successfully"
      );

      form.resetFields();
      setSelectedFeeIds([]);
      setCustomAmounts({});
      setPreviewOpen(false);
      setMode("bulk");
    } catch (err) {
      showAlert("error", "Failed", getApiMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const toggleFee = (id) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ── Desktop table columns ── */
  const feeColumns = [
    {
      title: "Fee Head",
      key: "feeHead",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "var(--text-primary)" }}>
            {record.feeHeadId?.name || record.name || "—"}
          </Text>
          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {record.description || "Fee structure"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      width: 140,
      render: (value) => (
        <Tag color="blue">{value ? String(value).toUpperCase() : "—"}</Tag>
      ),
    },
    {
      title: "Default Amount",
      dataIndex: "amount",
      width: 160,
      render: (value) => (
        <Text strong style={{ color: "var(--text-primary)" }}>{money(value)}</Text>
      ),
    },
    {
      title: "Custom Amount",
      width: 190,
      render: (_, record) => (
        <InputNumber
          min={0}
          placeholder="Optional"
          style={{ width: "100%", borderRadius: 8 }}
          value={customAmounts[record._id] ?? null}
          formatter={(value) => value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
          parser={(value) => value?.replace(/[₹,\s]/g, "")}
          onChange={(val) => setCustomAmounts((prev) => ({ ...prev, [record._id]: val }))}
        />
      ),
    },
    {
      title: "Final",
      width: 140,
      render: (_, record) => (
        <Text strong style={{ color: "#22C55E" }}>
          {money(customAmounts[record._id] ?? record.amount)}
        </Text>
      ),
    },
  ];

  const previewStudentColumns = [
    {
      title: "Student",
      render: (_, s) => (
        <Space>
          <div style={avatarStyle(s.user?.name || s.name || "S", 32)}>
            {(s.user?.name || s.name || "S")[0].toUpperCase()}
          </div>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {s.user?.name || s.name || "—"}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {s.registrationNumber || s.regId || "No Reg. No."}
            </Text>
          </Space>
        </Space>
      ),
    },
    { title: "Class", render: (_, s) => s.class?.name || s.schoolClass?.name || "—" },
    { title: "Section", render: (_, s) => s.section?.name || "—" },
  ];

  const cardBg = isDark ? "#141c2e" : "#fff";

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      {/* ── Header ── */}
      <PageHeader
        title="Assign Student Fees"
        subtitle="Assign fee structures class-wise or to a single student"
        extra={
          <Space wrap>
            <Tooltip title="Refresh data">
              <Button icon={<ReloadOutlined />} onClick={refreshData} style={{ borderRadius: 10 }}>
                {!isMobile && "Refresh"}
              </Button>
            </Tooltip>
            <Button
              icon={<EyeOutlined />}
              disabled={!selectedFeeIds.length}
              onClick={() => setPreviewOpen(true)}
              style={{ borderRadius: 10 }}
            >
              {!isMobile && "Preview"}
            </Button>
            <Button
              type="primary"
              loading={assigning}
              disabled={!selectedFeeIds.length || !targetStudentCount}
              icon={<CheckCircleOutlined />}
              onClick={() => form.submit()}
              style={{ borderRadius: 10 }}
            >
              {isMobile ? "Assign" : "Assign Fees"}
            </Button>
          </Space>
        }
      />

      {/* ── Alert ── */}
      {alertInfo && (
        <Alert
          style={{ marginBottom: 16, borderRadius: 12 }}
          type={alertInfo.type}
          showIcon
          closable
          message={alertInfo.message}
          description={alertInfo.description}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* ── KPI stat cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 180}px, 1fr))`,
        gap: 14,
        marginBottom: 20,
      }}>
        <StatCard icon={<TeamOutlined />} label="Target Students" value={targetStudentCount} color="#6D28D9" isDark={isDark} />
        <StatCard icon={<WalletOutlined />} label="Selected Fees" value={selectedFeeIds.length} color="#0891B2" isDark={isDark} />
        <StatCard icon={<TagOutlined />} label="Default Total" value={money(totalDefaultAmount)} color="#D97706" isDark={isDark} />
        <StatCard icon={<RupeeIcon />} label="Final Total" value={money(totalFinalAmount)} color="#16A34A" isDark={isDark} />
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[18, 18]}>

          {/* ── Filters ── */}
          <Col xs={24} lg={8}>
            <div style={{
              ...sectionPanel,
              background: cardBg,
              position: isMobile ? "static" : "sticky",
              top: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={iconWell("#6D28D9", 36)}>
                  <FilterOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Filters</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Select mode &amp; class</div>
                </div>
              </div>

              <Form.Item label={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Assignment Mode</span>}>
                <Radio.Group
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    form.setFieldsValue({ studentId: undefined, schoolClassId: undefined });
                  }}
                  buttonStyle="solid"
                  style={{ width: "100%" }}
                >
                  <Radio.Button value="bulk" style={{ width: "50%", textAlign: "center" }}>Bulk</Radio.Button>
                  <Radio.Button value="single" style={{ width: "50%", textAlign: "center" }}>Single</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="academicYearId"
                label={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Academic Year</span>}
                rules={[{ required: true, message: "Please select academic year" }]}
              >
                <Select
                  placeholder="Select Academic Year"
                  suffixIcon={<CalendarOutlined style={{ color: "var(--text-muted)" }} />}
                >
                  {selectedAcademicYear?._id && (
                    <Select.Option key={selectedAcademicYear._id} value={selectedAcademicYear._id}>
                      {selectedAcademicYear.name || selectedAcademicYear.year}
                    </Select.Option>
                  )}
                </Select>
              </Form.Item>

              {mode === "bulk" && (
                <Form.Item
                  name="schoolClassId"
                  label={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Class</span>}
                  rules={[{ required: true, message: "Please select class" }]}
                >
                  <Select placeholder="Select Class" showSearch allowClear optionFilterProp="children">
                    {schoolClasses.map((c) => (
                      <Select.Option key={c._id} value={c._id}>
                        {c.name || c.boardClassId?.name || "Unnamed Class"}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {mode === "single" && (
                <Form.Item
                  name="studentId"
                  label={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Student</span>}
                  rules={[{ required: true, message: "Please select student" }]}
                >
                  <Select
                    placeholder="Select Student"
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    options={schoolStudents.map((s) => ({
                      value: getStudentUserId(s),
                      label: `${s.user?.name || s.name || "—"} ${s.registrationNumber || ""} (${s.class?.name || s.schoolClass?.name || "—"} - ${s.section?.name || "—"})`,
                    }))}
                  />
                </Form.Item>
              )}

              {mode === "bulk" && (
                <Form.Item label={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Search Students</span>}>
                  <Input
                    allowClear
                    placeholder="Name, email, reg no."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    prefix={<UserOutlined style={{ color: "var(--text-muted)" }} />}
                  />
                </Form.Item>
              )}

              {/* Class indicator */}
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: effectiveClassId
                  ? (isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4")
                  : (isDark ? "rgba(99,102,241,0.08)" : "#EEF2FF"),
                border: `1px solid ${effectiveClassId
                  ? (isDark ? "rgba(34,197,94,0.25)" : "#bbf7d0")
                  : (isDark ? "rgba(99,102,241,0.25)" : "#C7D2FE")}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: effectiveClassId ? "#16A34A" : "#6D28D9" }}>
                  {effectiveClassId
                    ? `Selected: ${selectedClass?.name || "Class selected"}`
                    : "Select class or student to load fee structures"}
                </div>
              </div>

              {mode === "bulk" && effectiveClassId && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={iconWell("#0891B2", 28)}>
                    <TeamOutlined style={{ fontSize: 13 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {filteredStudentsForClass.length} student{filteredStudentsForClass.length !== 1 ? "s" : ""} in class
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* ── Fee structures ── */}
          <Col xs={24} lg={16}>
            <div style={{ ...sectionPanel, background: cardBg }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={iconWell("#0891B2", 36)}>
                    <WalletOutlined />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Fee Structures</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {feeStructures.length} available · {selectedFeeIds.length} selected
                    </div>
                  </div>
                </div>
                {feeStructures.length > 0 && (
                  <Button
                    size="small"
                    type="link"
                    style={{ color: "var(--primary)" }}
                    onClick={() =>
                      setSelectedFeeIds(
                        selectedFeeIds.length === feeStructures.length
                          ? []
                          : feeStructures.map((f) => f._id)
                      )
                    }
                  >
                    {selectedFeeIds.length === feeStructures.length ? "Deselect all" : "Select all"}
                  </Button>
                )}
              </div>

              {!effectiveClassId ? (
                <Empty
                  description={
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      Select a class or student above to load fee structures
                    </span>
                  }
                  style={{ padding: "40px 0" }}
                />
              ) : isMobile ? (
                <div>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                      Loading fee structures…
                    </div>
                  ) : feeStructures.length === 0 ? (
                    <Empty
                      description={<span style={{ color: "var(--text-muted)", fontSize: 13 }}>No fee structures found for selected class and year</span>}
                      style={{ padding: "40px 0" }}
                    />
                  ) : (
                    feeStructures.map((fee) => (
                      <FeeMobileCard
                        key={fee._id}
                        fee={fee}
                        isSelected={selectedFeeIds.includes(fee._id)}
                        onToggle={toggleFee}
                        customAmount={customAmounts[fee._id]}
                        onCustomChange={(id, val) => setCustomAmounts((prev) => ({ ...prev, [id]: val }))}
                        isDark={isDark}
                      />
                    ))
                  )}
                </div>
              ) : (
                <Table
                  className={TABLE_CLS}
                  rowKey="_id"
                  columns={feeColumns}
                  dataSource={feeStructures}
                  loading={loading}
                  scroll={{ x: 700 }}
                  rowSelection={{
                    selectedRowKeys: selectedFeeIds,
                    onChange: (keys) => setSelectedFeeIds(keys),
                  }}
                  pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 15, 30] }}
                  locale={{ emptyText: "No fee structure found for selected class and academic year" }}
                  style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-muted)" }}
                />
              )}
            </div>
          </Col>
        </Row>
      </Form>

      {/* ── Preview Drawer ── */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell("#6D28D9", 34)}>
              <EyeOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Assignment Preview</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Review before assigning</div>
            </div>
          </div>
        }
        width={isMobile ? "100%" : 640}
        placement={isMobile ? "bottom" : "right"}
        height={isMobile ? "85vh" : undefined}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        styles={{ body: { padding: 20, background: isDark ? "#0f172a" : "#f8fafc" } }}
        extra={
          <Button
            type="primary"
            loading={assigning}
            disabled={!selectedFeeIds.length || !targetStudentCount}
            onClick={() => form.submit()}
            style={{ borderRadius: 10 }}
          >
            Confirm Assign
          </Button>
        }
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {/* Summary banner */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: isDark ? "rgba(99,102,241,0.1)" : "#EEF2FF",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#6D28D9", marginBottom: 4 }}>Assignment Summary</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
              Assigning <strong>{selectedFeeIds.length}</strong> fee structure{selectedFeeIds.length !== 1 ? "s" : ""} to{" "}
              <strong>{targetStudentCount}</strong> student{targetStudentCount !== 1 ? "s" : ""} ·{" "}
              Total: <strong style={{ color: "#16A34A" }}>{money(totalFinalAmount)}</strong>
            </div>
          </div>

          {/* Selected fees list */}
          <div style={{ ...sectionPanel, marginBottom: 0, background: cardBg, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>
              Selected Fees
            </div>
            {selectedFees.map((fee) => (
              <div key={fee._id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10,
                background: isDark ? "#1a2235" : "var(--surface-soft)",
                border: "1px solid var(--border-muted)",
                marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                    {fee.feeHeadId?.name || fee.name || "—"}
                  </div>
                  <Tag color="blue" style={{ marginTop: 4 }}>
                    {fee.frequency ? String(fee.frequency).toUpperCase() : "—"}
                  </Tag>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#16A34A" }}>
                    {money(customAmounts[fee._id] ?? fee.amount)}
                  </div>
                  {customAmounts[fee._id] && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Default: {money(fee.amount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Target students */}
          <div style={{ ...sectionPanel, marginBottom: 0, background: cardBg, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>
              Target Students
            </div>
            {mode === "single" ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 14px", borderRadius: 10,
                background: isDark ? "#1a2235" : "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}>
                <div style={avatarStyle(selectedStudent?.user?.name || selectedStudent?.name || "S", 40)}>
                  {(selectedStudent?.user?.name || selectedStudent?.name || "S")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    {selectedStudent?.user?.name || selectedStudent?.name || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {selectedStudent?.class?.name || selectedStudent?.schoolClass?.name || "—"} ·{" "}
                    {selectedStudent?.section?.name || "—"}
                  </div>
                </div>
              </div>
            ) : (
              <Table
                className={TABLE_CLS}
                rowKey="_id"
                size="small"
                columns={previewStudentColumns}
                dataSource={filteredStudentsForClass}
                pagination={{ pageSize: 6 }}
                style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-muted)" }}
              />
            )}
          </div>
        </Space>
      </Drawer>
    </div>
  );
};

export default AssignStudentFee;
