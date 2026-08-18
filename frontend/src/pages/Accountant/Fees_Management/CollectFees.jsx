import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, Empty, Form, Input,
  InputNumber, Modal, Row, Select, Skeleton,
  Space, Table, Tag, Typography,
} from "antd";
import {
  BankOutlined, CalendarOutlined, CheckCircleOutlined,
  ClearOutlined, LoadingOutlined, ReloadOutlined,
  SearchOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchMyFees, payStudentFee } from "../../../features/studentFeeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, modalTitle, pageWrapper, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";
import { categoricalColorFor } from "../../../utils/colorPalette";

const { Text } = Typography;

/* ── Helpers ─────────────────────────────────────────────────────── */
const getId = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v?._id || v?.id || "";
};

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const getApiMessage = (err, fallback = "Something went wrong") => {
  const msg =
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.payload?.message ||
    err?.message ||
    err?.error;
  return typeof msg === "string" ? msg : fallback;
};

const avatarBg  = (name = "") => categoricalColorFor(name);
const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
};

/* ── KPI stat card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: "var(--surface)", borderRadius: 14,
    border: "1px solid var(--border-muted)",
    borderLeft: `4px solid ${color}`,
    padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Fee status badge ──────────────────────────────────────────── */
const FeeStatusBadge = ({ loading, due }) => {
  if (loading) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
        background: "var(--surface-soft)", color: "var(--text-muted)",
        border: "1px solid var(--border-muted)",
        display: "inline-flex", alignItems: "center", gap: 5,
      }}>
        <LoadingOutlined spin style={{ fontSize: 10 }} /> Checking…
      </span>
    );
  }
  if (due > 0) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
        background: "var(--warning-light)", color: "var(--warning-hover)",
        border: "1px solid var(--warning-light)",
      }}>
        Due {money(due)}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: "var(--success-light)", color: "var(--success-hover)",
      border: "1px solid var(--success-light)",
    }}>
      ✓ No Due
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const CollectFees = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [modalVisible, setModalVisible]               = useState(false);
  const [selectedStudent, setSelectedStudent]         = useState(null);
  const [searchName, setSearchName]                   = useState("");
  const [filterClass, setFilterClass]                 = useState("");
  const [loadingFees, setLoadingFees]                 = useState(false);
  const [studentFees, setStudentFees]                 = useState([]);
  const [submitting, setSubmitting]                   = useState(false);
  const [pendingFeesByStudent, setPendingFeesByStudent]       = useState({});
  const [loadingPendingByStudent, setLoadingPendingByStudent] = useState({});
  const [selectedFeeDueAmount, setSelectedFeeDueAmount]       = useState(0);
  const [alertInfo, setAlertInfo]                     = useState(null);

  const { user }                  = useSelector((s) => s.auth || {});
  const { schoolStudents = [] }   = useSelector((s) => s.students || {});
  const { schoolClasses = [] }    = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear }  = useSelector((s) => s.academicYear || {});

  const schoolId       = user?.school?._id || user?.schoolId || "";
  const academicYearId = selectedAcademicYear?._id || "";

  const showAlert = (type, message, description = "") => {
    setAlertInfo({ type, message, description });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const students = useMemo(() => schoolStudents.map((s) => {
    const studentId = getId(s.student) || getId(s.studentId) || getId(s.user) || getId(s);
    const classObj  = s.class || s.schoolClass || s.schoolClassId || {};
    const classId   = getId(classObj) || getId(s.classId) || getId(s.schoolClassId);
    return {
      key: s._id || studentId,
      studentId,
      enrollmentId: s._id,
      name:      s.user?.name  || s.name  || "—",
      email:     s.user?.email || s.email || "—",
      regNo:     s.registrationNumber || s.regId || "—",
      className: classObj?.name || s.className || "—",
      classId,
      section:   s.section?.name || s.sectionName || "—",
    };
  }), [schoolStudents]);

  const filteredStudents = useMemo(() => students.filter((s) => {
    const q = searchName.toLowerCase();
    const matchSearch = !q || `${s.name} ${s.email} ${s.regNo}`.toLowerCase().includes(q);
    const matchClass  = filterClass ? s.classId === filterClass : true;
    return matchSearch && matchClass;
  }), [students, searchName, filterClass]);

  const totalPendingAmount = useMemo(() =>
    filteredStudents.reduce((sum, s) => sum + Number(pendingFeesByStudent[s.studentId] || 0), 0),
  [filteredStudents, pendingFeesByStudent]);

  const dueStudentsCount = useMemo(() =>
    filteredStudents.filter((s) => Number(pendingFeesByStudent[s.studentId] || 0) > 0).length,
  [filteredStudents, pendingFeesByStudent]);

  const fetchPendingTotalForStudent = useCallback(async (studentId) => {
    if (!studentId) return 0;
    setLoadingPendingByStudent((prev) => ({ ...prev, [studentId]: true }));
    try {
      const response = await dispatch(fetchMyFees({ studentId, academicYearId })).unwrap();
      const fees = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      const totalPending = fees.reduce((sum, fee) => (fee.status === "paid" ? sum : sum + Number(fee.dueAmount || 0)), 0);
      setPendingFeesByStudent((prev) => ({ ...prev, [studentId]: totalPending }));
      return totalPending;
    } catch {
      setPendingFeesByStudent((prev) => ({ ...prev, [studentId]: 0 }));
      return 0;
    } finally {
      setLoadingPendingByStudent((prev) => ({ ...prev, [studentId]: false }));
    }
  }, [dispatch, academicYearId]);

  const refreshData = useCallback(() => {
    if (!schoolId || !academicYearId) {
      showAlert("warning", "Academic Year Required", "Please select an active academic year first.");
      return;
    }
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchStudentsBySchoolId({
      schoolId, academicYearId,
      ...(filterClass && { schoolClassId: filterClass }),
    }));
  }, [dispatch, schoolId, academicYearId, filterClass]);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (!students.length) return;
    const ids = students.map((s) => s.studentId).filter(Boolean);
    Promise.all(ids.map(fetchPendingTotalForStudent));
  }, [students, fetchPendingTotalForStudent]);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudent(null);
    setStudentFees([]);
    setSelectedFeeDueAmount(0);
    form.resetFields();
  };

  const handleOpenCollectModal = async (record) => {
    if (!record?.studentId) {
      showAlert("error", "Student Not Found", "Student ID not found.");
      return;
    }
    const due = Number(pendingFeesByStudent[record.studentId] || 0);
    if (due <= 0) {
      showAlert("info", "No Pending Fee", `${record.name} has no pending fees.`);
      return;
    }
    setSelectedStudent(record);
    setModalVisible(true);
    setLoadingFees(true);
    setSelectedFeeDueAmount(0);
    setStudentFees([]);
    form.resetFields();
    form.setFieldsValue({ paymentMode: "cash" });
    try {
      const response = await dispatch(fetchMyFees({ studentId: record.studentId, academicYearId })).unwrap();
      const fees = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      const unpaid = fees.filter((f) => f.status !== "paid" && Number(f.dueAmount || 0) > 0);
      setStudentFees(unpaid);
      if (!unpaid.length) showAlert("info", "No Pending Fee", "No pending fee found for this student.");
    } catch (err) {
      showAlert("error", "Failed to Fetch Fees", getApiMessage(err));
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleCollectFee = async (values) => {
    try {
      setSubmitting(true);
      await dispatch(payStudentFee({
        id: values.studentFeeId,
        payload: {
          paidAmount:  Number(values.amount),
          paymentMode: values.paymentMode,
          referenceNo: values.referenceNo || "",
          remarks:     values.remarks     || "",
        },
      })).unwrap();

      showAlert(
        "success",
        "Payment Collected",
        `${money(values.amount)} collected from ${selectedStudent?.name || "student"} successfully.`,
      );

      if (selectedStudent?.studentId) await fetchPendingTotalForStudent(selectedStudent.studentId);

      closeModal();
      refreshData();
    } catch (err) {
      showAlert("error", "Collection Failed", getApiMessage(err, "Fee collection failed."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Table columns ─────────────────────────────────────────────── */
  const columns = useMemo(() => [
    {
      title: "Student",
      key: "student",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: avatarBg(r.name), color: "#fff",
            fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {r.regNo} • {r.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Class / Section",
      key: "class",
      width: 150,
      render: (_, r) => (
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
          background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)",
        }}>
          {r.className} — {r.section}
        </span>
      ),
    },
    {
      title: "Fee Status",
      key: "feeStatus",
      width: 160,
      render: (_, r) => (
        <FeeStatusBadge
          loading={Boolean(loadingPendingByStudent[r.studentId])}
          due={Number(pendingFeesByStudent[r.studentId] || 0)}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, r) => {
        const due      = Number(pendingFeesByStudent[r.studentId] || 0);
        const isLoading = Boolean(loadingPendingByStudent[r.studentId]);
        return (
          <Button
            icon={<RupeeIcon />}
            onClick={() => handleOpenCollectModal(r)}
            disabled={isLoading || due <= 0}
            style={{
              borderRadius: 8, fontWeight: 600, fontSize: 12,
              background: due > 0 && !isLoading ? "var(--primary)" : undefined,
              borderColor: due > 0 && !isLoading ? "var(--primary)" : undefined,
              color: due > 0 && !isLoading ? "#fff" : undefined,
            }}
          >
            Collect Fee
          </Button>
        );
      },
    },
  ], [loadingPendingByStudent, pendingFeesByStudent]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("fee-tbl")}</style>

      <PageHeader
        title="Fee Collection"
        subtitle="Collect pending student fees and record payments"
        icon={<WalletOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refreshData} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        }
      />

      {/* ── Alert ──────────────────────────────────────────────────── */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          showIcon
          closable
          message={alertInfo.message}
          description={alertInfo.description}
          onClose={() => setAlertInfo(null)}
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div style={{ ...statGrid(160), marginBottom: 20 }}>
        <StatCard
          label="Total Students"
          value={filteredStudents.length}
          icon={<TeamOutlined />}
          color="var(--primary)"
          sub="In current filter"
        />
        <StatCard
          label="Due Students"
          value={dueStudentsCount}
          icon={<WalletOutlined />}
          color="var(--warning)"
          sub={dueStudentsCount > 0 ? "Need to collect" : "All clear"}
        />
        <StatCard
          label="Total Pending"
          value={money(totalPendingAmount)}
          icon={<BankOutlined />}
          color="var(--danger)"
          sub="Across filtered list"
        />
        <StatCard
          label="Academic Year"
          value={selectedAcademicYear?.name || "—"}
          icon={<CalendarOutlined />}
          color="var(--purple)"
          sub="Current session"
        />
      </div>

      {/* ── Student List ────────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        {/* Section header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-muted)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell("var(--primary)", 32)}><TeamOutlined style={{ fontSize: 14 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                Student Fee List
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Search and collect fees from students
              </Text>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)",
          }}>
            {filteredStudents.length} students
          </span>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-muted)",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <Input
            placeholder="Search by name, email or registration no."
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            allowClear
            style={{ borderRadius: 8, width: 300, maxWidth: "100%" }}
          />
          <Select
            placeholder="Filter by class"
            allowClear
            value={filterClass || undefined}
            onChange={(v) => setFilterClass(v || "")}
            style={{ width: 200, borderRadius: 8 }}
          >
            {schoolClasses.map((c) => (
              <Select.Option key={c._id} value={c._id}>
                {c.name || c.boardClassId?.name || "Unnamed"}
              </Select.Option>
            ))}
          </Select>
          {(searchName || filterClass) && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setSearchName(""); setFilterClass(""); }}
              style={{ borderRadius: 8 }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <Table
          className="fee-tbl"
          columns={columns}
          dataSource={filteredStudents}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} students` }}
          rowKey="key"
          scroll={{ x: 720 }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No students found for the selected filters
                    </span>
                  }
                />
              </div>
            ),
          }}
        />
      </div>

      {/* ── Collect Fee Modal ───────────────────────────────────────── */}
      <Modal
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={520}
        title={modalTitle(
          <WalletOutlined />,
          "Collect Fee",
          `${selectedStudent?.name || "—"} · ${selectedStudent?.className || "—"} — ${selectedStudent?.section || "—"}`,
        )}
      >
        {loadingFees ? (
          <div style={{ padding: "32px 0" }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : !studentFees.length ? (
          <div style={{ padding: "32px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pending fees found for this student" />
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleCollectFee} style={{ marginTop: 16 }}>

            {/* Due amount preview */}
            {selectedFeeDueAmount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--primary-light)", border: "1px solid var(--primary-light)",
                borderRadius: 10, padding: "10px 16px", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 12, color: "var(--primary-hover)", fontWeight: 600 }}>
                  Total Due for selected fee
                </Text>
                <Text style={{ fontSize: 18, fontWeight: 800, color: "var(--primary-hover)" }}>
                  {money(selectedFeeDueAmount)}
                </Text>
              </div>
            )}

            <Form.Item
              label="Select Pending Fee"
              name="studentFeeId"
              rules={[{ required: true, message: "Please select a fee" }]}
            >
              <Select
                placeholder="Choose fee head to pay…"
                size="large"
                onChange={(value) => {
                  const fee = studentFees.find((f) => String(f._id || f.id) === String(value));
                  const due = Number(fee?.dueAmount || 0);
                  setSelectedFeeDueAmount(due);
                  form.setFieldsValue({ amount: due });
                }}
              >
                {studentFees.map((fee) => {
                  const feeId = fee?._id || fee?.id;
                  return (
                    <Select.Option key={feeId} value={feeId}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>
                          {fee.feeStructureId?.feeHeadId?.name || fee.feeStructureId?.name || "Fee"}
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--warning-hover)", marginLeft: 8 }}>
                          Due {money(fee.dueAmount)}
                        </span>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <Form.Item
                label="Amount to Collect (₹)"
                name="amount"
                rules={[
                  { required: true, message: "Enter amount" },
                  {
                    validator: (_, value) => {
                      if (!value || Number(value) <= 0)
                        return Promise.reject(new Error("Amount must be > 0"));
                      if (selectedFeeDueAmount && Number(value) > selectedFeeDueAmount)
                        return Promise.reject(new Error(`Cannot exceed due amount ${money(selectedFeeDueAmount)}`));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  size="large"
                  min={1}
                  max={selectedFeeDueAmount || undefined}
                  placeholder="e.g. 5000"
                  addonBefore="₹"
                />
              </Form.Item>

              <Form.Item
                label="Payment Mode"
                name="paymentMode"
                initialValue="cash"
                rules={[{ required: true, message: "Select payment mode" }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: "💵 Cash",          value: "cash" },
                    { label: "🌐 Online",        value: "online" },
                    { label: "🏦 Bank Transfer", value: "bank_transfer" },
                    { label: "📱 UPI",           value: "upi" },
                    { label: "🗒️ Cheque",       value: "cheque" },
                  ]}
                />
              </Form.Item>
            </div>

            <Form.Item label="Reference / UTR / Cheque No." name="referenceNo">
              <Input placeholder="Optional — Txn ID, UTR, or Cheque number" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} placeholder="Optional remarks for this payment" style={{ borderRadius: 8 }} />
            </Form.Item>

            {/* Footer */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 10,
              paddingTop: 12, borderTop: "1px solid var(--border-muted)", marginTop: 4,
            }}>
              <Button onClick={closeModal} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: 8, fontWeight: 600, background: "var(--primary)", borderColor: "var(--primary)" }}
              >
                Collect Payment
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default CollectFees;
