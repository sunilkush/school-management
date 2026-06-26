import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, InputNumber, message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastRegisteredStudent, createStudent, fetchClassRollNumbers } from "../../features/studentSlice";
import { getClassData } from "../../features/schoolClassSlice";
import {
  UserOutlined, ProfileOutlined, ManOutlined, WomanOutlined,
  CheckOutlined, LeftOutlined, RightOutlined, InfoCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const TABS = [
  { key: "student", label: "Student",  icon: <UserOutlined />,    step: 1 },
  { key: "other",   label: "Details",  icon: <ProfileOutlined />, step: 2 },
  { key: "father",  label: "Father",   icon: <ManOutlined />,     step: 3 },
  { key: "mother",  label: "Mother",   icon: <WomanOutlined />,   step: 4 },
];

const TAB_KEYS = TABS.map(t => t.key);

// Fields to validate before leaving each step
const STEP_RULES = {
  student: ["studentName", "email", "mobileNumber", "schoolClassId", "sectionId", "admissionDate"],
  other:   ["dateOfBirth", "gender"],
  father:  ["fatherName", "fatherMobile"],
  mother:  [],
};

const CredentialBlock = ({ label, creds }) => {
  if (!creds) return null;
  return (
    <div style={{
      marginBottom: 12, padding: "12px 14px",
      background: "rgba(124,58,237,0.06)",
      borderRadius: 10, borderLeft: "3px solid #7c3aed",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#374151", marginBottom: 2 }}>
        Login ID: <span style={{ fontWeight: 600 }}>{creds.loginId || "—"}</span>
      </div>
      <div style={{ fontSize: 13, color: "#374151" }}>
        Password: <span style={{ fontWeight: 600 }}>{creds.password || "Already exists (unchanged)"}</span>
      </div>
    </div>
  );
};

const SectionHeading = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: 18, marginTop: 6,
    paddingBottom: 8, borderBottom: "1px solid var(--border-muted)",
  }}>
    {children}
  </div>
);

const InfoHint = ({ children }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 16px",
    background: "rgba(124,58,237,0.05)",
    border: "1px solid rgba(124,58,237,0.15)",
    borderRadius: 10, marginTop: 12,
  }}>
    <InfoCircleOutlined style={{ color: "#7c3aed", fontSize: 15, marginTop: 1, flexShrink: 0 }} />
    <span style={{ fontSize: 13, color: "#5b21b6", lineHeight: 1.55 }}>{children}</span>
  </div>
);

const AdmissionForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab]         = useState("student");
  const [sections, setSections]           = useState([]);
  const [submitting, setSubmitting]       = useState(false);
  const [nextRollNumber, setNextRollNumber]     = useState(null);
  const [rollPreviewLoading, setRollPreviewLoading] = useState(false);

  const currentIndex = TAB_KEYS.indexOf(activeTab);

  const { lastStudent = [], registrationNumber } = useSelector(s => s.students);
  const { user }                                 = useSelector(s => s.auth);
  const { schoolClasses = [] }                   = useSelector(s => s.schoolClass || {});
  const { selectedAcademicYear }                 = useSelector(s => s.academicYear);

  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      dispatch(getClassData({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (registrationNumber) form.setFieldsValue({ registrationNumber });
  }, [registrationNumber, form]);

  const handleClassChange = (schoolClassId) => {
    const cls = schoolClasses.find(c => c._id === schoolClassId);
    const secs = (cls?.sections || []).map(s => s.sectionId ? { ...s, _id: s.sectionId._id || s.sectionId, name: s.sectionId.name || s.name } : s);
    setSections(secs);
    form.setFieldsValue({ sectionId: undefined });
    setNextRollNumber(null);
  };

  const handleSectionChange = async (sectionId) => {
    form.setFieldsValue({ sectionId });
    setNextRollNumber(null);
    const schoolClassId = form.getFieldValue("schoolClassId");
    if (!schoolClassId || !sectionId || !schoolId || !academicYearId) return;
    setRollPreviewLoading(true);
    const res = await dispatch(fetchClassRollNumbers({ schoolId, academicYearId, schoolClassId, sectionId }));
    setRollPreviewLoading(false);
    if (res.meta.requestStatus === "fulfilled") {
      const list = res.payload || [];
      const maxRoll = list.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0);
      setNextRollNumber(maxRoll + 1);
    }
  };

  const goNext = async () => {
    const fieldsToValidate = STEP_RULES[activeTab] || [];
    if (fieldsToValidate.length) {
      try {
        await form.validateFields(fieldsToValidate);
      } catch {
        return; // validation failed — stay on current step
      }
    }
    setActiveTab(TAB_KEYS[currentIndex + 1]);
  };

  const onFinish = async (values) => {
    if (!schoolId || !academicYearId) {
      message.error("Please select an academic year before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        studentData: {
          name:        values.studentName,
          email:       values.email,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender:      values.gender,
          address:     values.address,
          bloodGroup:  values.bloodGroup,
        },
        fatherData: { name: values.fatherName, email: values.fatherEmail, mobile: values.fatherMobile },
        motherData: { name: values.motherName, email: values.motherEmail, mobile: values.motherMobile },
        schoolId,
        academicYearId,
        schoolClassId: values.schoolClassId,
        sectionId:     values.sectionId,
      };

      const res = await dispatch(createStudent(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        message.success("Student admitted successfully!");
        const { credentials, enrollment } = res?.payload || {};
        if (credentials) {
          Modal.success({
            title: <span style={{ fontSize: 17, fontWeight: 700, color: "#7c3aed" }}>Admission Successful</span>,
            width: 480,
            icon: null,
            content: (
              <div style={{ marginTop: 14 }}>
                {/* Roll Number + Registration Number summary */}
                {enrollment && (
                  <div style={{
                    display: "flex", gap: 10, marginBottom: 14,
                    padding: "12px 14px", borderRadius: 10,
                    background: "rgba(22,163,74,0.06)",
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Roll Number</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#15803D" }}>{enrollment.rollNumber ?? "—"}</div>
                    </div>
                    <div style={{ width: 1, background: "rgba(22,163,74,0.2)" }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Reg. Number</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#15803D", marginTop: 4 }}>{enrollment.registrationNumber ?? "—"}</div>
                    </div>
                  </div>
                )}
                <CredentialBlock label="Student" creds={credentials.student} />
                <CredentialBlock label="Father"  creds={credentials.father} />
                <CredentialBlock label="Mother"  creds={credentials.mother} />
              </div>
            ),
            onOk: onClose,
          });
        } else {
          onClose?.();
        }
        form.resetFields();
        setActiveTab("student");
        setSections([]);
        setNextRollNumber(null);
        dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      } else {
        message.error(res?.payload || "Admission failed. Please try again.");
      }
    } catch (err) {
      message.error("Something went wrong: " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .adm-form .ant-form-item-label > label {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: var(--text-secondary, #4b5563) !important;
          height: auto !important;
        }
        .adm-form .ant-input,
        .adm-form .ant-input-number,
        .adm-form .ant-input-number-input,
        .adm-form .ant-picker {
          border-radius: 8px !important;
          border: 1.5px solid #e5e7eb !important;
          font-size: 13px !important;
          background: #fff !important;
          color: #111827 !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          height: 38px !important;
        }
        .adm-form .ant-input:focus,
        .adm-form .ant-input-number:focus-within,
        .adm-form .ant-picker:focus-within {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important;
        }
        .adm-form .ant-input:hover,
        .adm-form .ant-input-number:hover,
        .adm-form .ant-picker:hover {
          border-color: #a78bfa !important;
        }
        .adm-form textarea.ant-input {
          height: auto !important;
          min-height: 80px !important;
          padding-top: 8px !important;
        }
        .adm-form .ant-select .ant-select-selector {
          border-radius: 8px !important;
          border: 1.5px solid #e5e7eb !important;
          font-size: 13px !important;
          background: #fff !important;
          color: #111827 !important;
          height: 38px !important;
          align-items: center !important;
        }
        .adm-form .ant-select:hover .ant-select-selector {
          border-color: #a78bfa !important;
        }
        .adm-form .ant-select-focused .ant-select-selector {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important;
        }
        .adm-form .ant-picker { width: 100% !important; }
        .adm-form .ant-input-number { width: 100% !important; }
        .adm-form .ant-form-item-explain-error {
          font-size: 11px !important;
          margin-top: 3px !important;
        }
        .adm-form .ant-input[disabled] {
          background: #f5f3ff !important;
          color: #7c3aed !important;
          font-weight: 700 !important;
          border-color: #ddd6fe !important;
          cursor: default !important;
        }
        .adm-form .roll-preview-assigned .ant-input[disabled] {
          background: #f0fdf4 !important;
          color: #15803D !important;
          border-color: #86efac !important;
          font-size: 15px !important;
        }
        .adm-form .roll-preview-placeholder .ant-input[disabled] {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          border-color: #e2e8f0 !important;
          font-weight: 400 !important;
          font-style: italic !important;
        }
        .adm-form .ant-form-item {
          margin-bottom: 16px !important;
        }

        /* Step tabs */
        .adm-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 20px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          min-width: 80px;
          transition: background 0.2s;
        }
        .adm-tab:hover { background: rgba(124,58,237,0.03); }
        .adm-tab .step-num {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          transition: all 0.22s;
        }
        .adm-tab .step-lbl {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .adm-tab.active .step-num {
          background: #7c3aed;
          color: #fff;
          box-shadow: 0 3px 10px rgba(124,58,237,0.4);
        }
        .adm-tab.active .step-lbl { color: #7c3aed; }
        .adm-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #7c3aed;
          border-radius: 2px 2px 0 0;
        }
        .adm-tab.done .step-num {
          background: #d1fae5;
          color: #059669;
          border: 2px solid #10b981;
        }
        .adm-tab.done .step-lbl { color: #059669; }
        .adm-tab.idle .step-num {
          background: #f3f4f6;
          color: #9ca3af;
          border: 1.5px solid #e5e7eb;
        }
        .adm-tab.idle .step-lbl { color: #9ca3af; }
        .adm-connector {
          flex: 1; height: 1.5px;
          background: #e5e7eb;
          margin-top: -10px;
          transition: background 0.3s;
        }
        .adm-connector.done { background: #10b981; }

        /* Grid layouts */
        .adm-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0 20px;
        }
        .adm-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 20px;
        }
        @media (max-width: 640px) {
          .adm-row { grid-template-columns: 1fr 1fr; }
          .adm-row-2 { grid-template-columns: 1fr; }
          .adm-tab { min-width: 56px; padding: 10px 8px; }
          .adm-tab .step-lbl { display: none; }
        }
        @media (max-width: 420px) {
          .adm-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Gradient Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        padding: "20px 28px 18px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -30, right: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -50, right: 80, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, border: "1px solid rgba(255,255,255,0.2)",
            }}>🎓</div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>
                New Admission
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                Student Admission Form
              </h2>
            </div>
          </div>
          {lastStudent?.registrationNumber && (
            <div style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "8px 14px",
              border: "1px solid rgba(255,255,255,0.2)",
              textAlign: "right",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                Last Reg. No.
              </div>
              <div style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>
                {lastStudent.registrationNumber}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step Tabs ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        borderBottom: "1px solid #f3f4f6",
        background: "#fafafa",
      }}>
        {TABS.map((tab, i) => (
          <React.Fragment key={tab.key}>
            <button
              type="button"
              className={`adm-tab ${activeTab === tab.key ? "active" : currentIndex > i ? "done" : "idle"}`}
              onClick={() => {
                // Only allow going back or to already-completed steps
                if (i < currentIndex) setActiveTab(tab.key);
              }}
            >
              <div className="step-num">
                {currentIndex > i ? <CheckOutlined style={{ fontSize: 12 }} /> : tab.step}
              </div>
              <span className="step-lbl">{tab.label}</span>
            </button>
            {i < TABS.length - 1 && (
              <div className={`adm-connector ${currentIndex > i ? "done" : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Form Body ── */}
      <div style={{ padding: "24px 28px 8px", maxHeight: "55vh", overflowY: "auto" }}>
        <Form
          className="adm-form"
          layout="vertical"
          form={form}
          onFinish={() => onFinish(form.getFieldsValue(true))}
        >
          {/* STEP 1 — Student */}
          {activeTab === "student" && (
            <>
              <SectionHeading>Basic Information</SectionHeading>
              <div className="adm-row">
                <Form.Item name="studentName" label="Student Name" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                  <Input placeholder="student@email.com" />
                </Form.Item>
                <Form.Item name="mobileNumber" label="Mobile" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="10-digit number" maxLength={10} />
                </Form.Item>
              </div>

              <SectionHeading>Class & Enrollment</SectionHeading>
              <div className="adm-row">
                <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Select a class" }]}>
                  <Select
                    placeholder="Select class"
                    onChange={handleClassChange}
                    showSearch
                    filterOption={(inp, opt) => opt.label?.toLowerCase().includes(inp.toLowerCase())}
                    options={schoolClasses.map(c => ({ label: c.name, value: c._id }))}
                  />
                </Form.Item>
                <Form.Item name="sectionId" label="Section" rules={[{ required: true, message: "Select a section" }]}>
                  <Select
                    placeholder={sections.length ? "Select section" : "Select class first"}
                    disabled={!sections.length}
                    options={sections.map(s => ({ label: s.name || s.sectionId?.name || "—", value: s._id || s.sectionId?._id || s.sectionId }))}
                    onChange={handleSectionChange}
                  />
                </Form.Item>
                <Form.Item name="admissionDate" label="Admission Date" rules={[{ required: true, message: "Required" }]}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <div className="adm-row-2">
                <Form.Item name="registrationNumber" label="Registration No.">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Roll No. (Auto)">
                  <div className={
                    nextRollNumber != null
                      ? "roll-preview-assigned"
                      : "roll-preview-placeholder"
                  }>
                    <Input
                      disabled
                      value={
                        rollPreviewLoading
                          ? "Loading..."
                          : nextRollNumber != null
                            ? nextRollNumber
                            : "Select class & section"
                      }
                    />
                  </div>
                </Form.Item>
              </div>
              <div className="adm-row-2">
                <Form.Item name="smsMobile" label="SMS Mobile">
                  <Input placeholder="For SMS alerts" maxLength={10} />
                </Form.Item>
                <Form.Item name="feeDiscount" label="Fee Discount (%)">
                  <InputNumber placeholder="0" min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </div>
            </>
          )}

          {/* STEP 2 — Details */}
          {activeTab === "other" && (
            <>
              <SectionHeading>Personal Details</SectionHeading>
              <div className="adm-row">
                <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: "Required" }]}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Required" }]}>
                  <Select placeholder="Select" options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
                </Form.Item>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select placeholder="Select" options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => ({ value: b, label: b }))} />
                </Form.Item>
              </div>

              <div className="adm-row">
                <Form.Item name="cast" label="Caste">
                  <Select placeholder="Select" options={["General","OBC","SC","ST","Other"].map(c => ({ value: c, label: c }))} />
                </Form.Item>
                <Form.Item name="religion" label="Religion">
                  <Select placeholder="Select" options={["Hindu","Muslim","Christian","Sikh","Other"].map(r => ({ value: r, label: r }))} />
                </Form.Item>
                <Form.Item name="birthFormId" label="Birth Form ID">
                  <Input placeholder="Official birth form ID" />
                </Form.Item>
              </div>

              <div className="adm-row">
                <Form.Item name="siblings" label="No. of Siblings">
                  <InputNumber placeholder="0" min={0} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="orphan" label="Orphan">
                  <Select placeholder="Select" options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]} />
                </Form.Item>
                <Form.Item name="identificationMark" label="Identification Mark">
                  <Input placeholder="Any visible mark" />
                </Form.Item>
              </div>

              <SectionHeading>Additional Info</SectionHeading>
              <div className="adm-row-2">
                <Form.Item name="address" label="Address">
                  <TextArea rows={3} placeholder="Residential address" />
                </Form.Item>
                <Form.Item name="disease" label="Medical Conditions">
                  <TextArea rows={3} placeholder="Any known medical conditions" />
                </Form.Item>
              </div>
            </>
          )}

          {/* STEP 3 — Father */}
          {activeTab === "father" && (
            <>
              <SectionHeading>Father's Information</SectionHeading>
              <div className="adm-row">
                <Form.Item name="fatherName" label="Father Name" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item name="fatherMobile" label="Mobile Number" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="10-digit number" maxLength={10} />
                </Form.Item>
                <Form.Item name="fatherEmail" label="Email Address">
                  <Input placeholder="father@email.com" />
                </Form.Item>
              </div>
              <div className="adm-row">
                <Form.Item name="fatherOccupation" label="Occupation">
                  <Input placeholder="e.g. Engineer" />
                </Form.Item>
                <Form.Item name="fatherEducation" label="Education">
                  <Input placeholder="e.g. B.Tech" />
                </Form.Item>
                <Form.Item name="fatherIncome" label="Annual Income (₹)">
                  <InputNumber placeholder="0" min={0} style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <InfoHint>Father's login credentials will be auto-generated after successful admission.</InfoHint>
            </>
          )}

          {/* STEP 4 — Mother */}
          {activeTab === "mother" && (
            <>
              <SectionHeading>Mother's Information</SectionHeading>
              <div className="adm-row">
                <Form.Item name="motherName" label="Mother Name">
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item name="motherMobile" label="Mobile Number">
                  <Input placeholder="10-digit number" maxLength={10} />
                </Form.Item>
                <Form.Item name="motherEmail" label="Email Address">
                  <Input placeholder="mother@email.com" />
                </Form.Item>
              </div>
              <div className="adm-row">
                <Form.Item name="motherOccupation" label="Occupation">
                  <Input placeholder="e.g. Doctor" />
                </Form.Item>
                <Form.Item name="motherEducation" label="Education">
                  <Input placeholder="e.g. M.A." />
                </Form.Item>
                <Form.Item name="motherIncome" label="Annual Income (₹)">
                  <InputNumber placeholder="0" min={0} style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <InfoHint>Mother's login credentials will be auto-generated after successful admission.</InfoHint>
            </>
          )}
        </Form>
      </div>

      {/* ── Footer Navigation ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 28px 20px",
        borderTop: "1px solid #f3f4f6",
        background: "#fafafa",
      }}>
        {/* Back button */}
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setActiveTab(TAB_KEYS[currentIndex - 1])}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "0 20px", height: 38, borderRadius: 8,
            border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#374151",
            fontSize: 13, fontWeight: 600, cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          <LeftOutlined style={{ fontSize: 11 }} /> Back
        </button>

        {/* Step dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {TAB_KEYS.map((_, i) => (
            <div
              key={i}
              style={{
                width:        i === currentIndex ? 24 : 7,
                height:       7,
                borderRadius: 4,
                background:   i === currentIndex ? "#7c3aed"
                            : i < currentIndex  ? "#10b981"
                            : "#e5e7eb",
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>

        {/* Next / Submit */}
        {currentIndex < TAB_KEYS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0 22px", height: 38, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              color: "#fff", border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            }}
          >
            Next <RightOutlined style={{ fontSize: 11 }} />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => form.submit()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "0 28px", height: 38, borderRadius: 8,
              background: submitting ? "#d1fae5" : "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
              color: "#fff", border: "none",
              fontSize: 13, fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            }}
          >
            <CheckOutlined style={{ fontSize: 12 }} />
            {submitting ? "Submitting…" : "Submit Admission"}
          </button>
        )}
      </div>
    </>
  );
};

export default AdmissionForm;
