import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, InputNumber, message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastRegisteredStudent, createStudent } from "../../features/studentSlice";
import { getClassData } from "../../features/schoolClassSlice";
import {
  UserOutlined,
  ProfileOutlined,
  ManOutlined,
  WomanOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { pageWrapper } from "../../styles/pageStyles.js";

const { TextArea } = Input;

const TABS = [
  { key: "student", label: "Student",  icon: <UserOutlined />,    step: 1 },
  { key: "other",   label: "Details",  icon: <ProfileOutlined />, step: 2 },
  { key: "father",  label: "Father",   icon: <ManOutlined />,     step: 3 },
  { key: "mother",  label: "Mother",   icon: <WomanOutlined />,   step: 4 },
];

const TAB_KEYS = TABS.map(t => t.key);

/* ── Credential block inside success modal ── */
const CredentialBlock = ({ label, creds }) => {
  if (!creds) return null;
  return (
    <div style={{
      marginBottom: 12,
      padding: "12px 14px",
      background: "var(--primary-light)",
      borderRadius: 10,
      borderLeft: "3px solid var(--primary)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>
        Login ID: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{creds.loginId || "—"}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Password: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{creds.password || "Already exists (unchanged)"}</span>
      </div>
    </div>
  );
};

/* ── Section heading ── */
const SectionHeading = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 18, marginTop: 6,
    paddingBottom: 8,
    borderBottom: "1px solid var(--border-muted)",
  }}>
    {children}
  </div>
);

/* ── Info hint banner ── */
const InfoHint = ({ children }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 16px",
    background: "var(--primary-light)",
    border: "1px solid rgba(124,58,237,0.15)",
    borderRadius: 10,
    marginTop: 10,
  }}>
    <InfoCircleOutlined style={{ color: "var(--primary)", fontSize: 15, marginTop: 1, flexShrink: 0 }} />
    <span style={{ fontSize: 13, color: "var(--primary)", lineHeight: 1.5 }}>{children}</span>
  </div>
);

const AdmissionForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab]   = useState("student");
  const [sections, setSections]     = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
    setSections(cls?.sections || []);
    form.setFieldsValue({ sectionId: undefined });
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
        const credentials = res?.payload?.credentials;
        if (credentials) {
          Modal.success({
            title: (
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--primary)" }}>
                Login Credentials Created
              </span>
            ),
            width: 480,
            icon: null,
            content: (
              <div style={{ marginTop: 14 }}>
                <CredentialBlock label="Student" creds={credentials.student} />
                <CredentialBlock label="Father"  creds={credentials.father} />
                <CredentialBlock label="Mother"  creds={credentials.mother} />
              </div>
            ),
          });
        }
        form.resetFields();
        setActiveTab("student");
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
    <div style={{ ...pageWrapper }}>
      <style>{`
        /* ── Form controls ── */
        .adm-form .ant-form-item-label > label {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: var(--text-muted) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.07em !important;
          height: auto !important;
        }
        .adm-form .ant-input,
        .adm-form .ant-input-number,
        .adm-form .ant-input-number-input,
        .adm-form .ant-picker {
          border-radius: 8px !important;
          border: 1px solid var(--border-color) !important;
          font-size: 13px !important;
          background: var(--surface) !important;
          color: var(--text-primary) !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
        }
        .adm-form .ant-input:focus,
        .adm-form .ant-input-number:focus-within,
        .adm-form .ant-picker:focus-within,
        .adm-form .ant-input:hover,
        .adm-form .ant-input-number:hover,
        .adm-form .ant-picker:hover {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px var(--primary-light) !important;
        }
        .adm-form textarea.ant-input {
          height: auto !important;
          min-height: 80px !important;
          padding-top: 8px !important;
        }
        .adm-form .ant-select .ant-select-selector {
          border-radius: 8px !important;
          border: 1px solid var(--border-color) !important;
          font-size: 13px !important;
          background: var(--surface) !important;
          color: var(--text-primary) !important;
        }
        .adm-form .ant-select:hover .ant-select-selector,
        .adm-form .ant-select-focused .ant-select-selector {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px var(--primary-light) !important;
        }
        .adm-form .ant-picker { width: 100% !important; }
        .adm-form .ant-input-number { width: 100% !important; }
        .adm-form .ant-form-item-explain-error {
          font-size: 11px !important;
          margin-top: 3px !important;
        }
        .adm-form .ant-input[disabled] {
          background: var(--primary-light) !important;
          color: var(--primary) !important;
          font-weight: 700 !important;
          border-color: var(--border-muted) !important;
          cursor: default !important;
        }
        /* ── Step tabs ── */
        .adm-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 13px 18px;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: opacity 0.2s;
          min-width: 72px;
        }
        .adm-tab .step-circle {
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          transition: all 0.22s;
        }
        .adm-tab .step-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .adm-tab.active .step-circle {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 4px 12px rgba(124,58,237,0.35);
        }
        .adm-tab.active .step-label { color: var(--primary); }
        .adm-tab.done .step-circle {
          background: var(--success-light);
          color: var(--success);
          border: 2px solid var(--success);
        }
        .adm-tab.done .step-label { color: var(--success); }
        .adm-tab.idle .step-circle {
          background: var(--surface-soft);
          color: var(--text-disabled);
          border: 2px solid var(--border-color);
        }
        .adm-tab.idle .step-label { color: var(--text-disabled); }
        .adm-tab::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          height: 2px; width: 0;
          background: var(--primary);
          border-radius: 2px 2px 0 0;
          transition: width 0.25s;
        }
        .adm-tab.active::after { width: 52%; }
        .adm-connector {
          flex: 1; height: 2px;
          background: var(--border-color);
          position: relative; top: -10px;
          transition: background 0.3s;
        }
        .adm-connector.done { background: var(--success); }
        /* ── Nav buttons ── */
        .adm-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 22px; height: 40px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.2s;
        }
        .adm-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .adm-btn.secondary {
          background: var(--surface-soft);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .adm-btn.secondary:not(:disabled):hover { background: var(--surface-soft-hover); }
        .adm-btn.primary {
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }
        .adm-btn.primary:not(:disabled):hover {
          box-shadow: 0 6px 18px rgba(124,58,237,0.4);
          transform: translateX(2px);
        }
        .adm-btn.submit {
          background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
          padding: 0 28px;
        }
        .adm-btn.submit:not(:disabled):hover {
          box-shadow: 0 6px 18px rgba(16,185,129,0.42);
        }
        /* ── Field grid ── */
        .adm-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0 20px;
        }
        .adm-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 20px;
        }
        @media (max-width: 580px) {
          .adm-row, .adm-row-2 { grid-template-columns: 1fr; }
          .adm-tab { min-width: 56px; padding: 10px 8px; }
          .adm-tab .step-label { display: none; }
        }
      `}</style>

      <div style={{
        background: "var(--surface)",
        borderRadius: 20,
        border: "1px solid var(--border-muted)",
        boxShadow: "var(--shadow-strong)",
        overflow: "hidden",
      }}>

        {/* ── Card Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
          padding: "18px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -28, right: -28, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -40, right: 90, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                School Management
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                New Student Admission
              </h1>
            </div>
            {lastStudent?.registrationNumber && (
              <div style={{
                background: "rgba(255,255,255,0.14)",
                borderRadius: 12, padding: "8px 16px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                textAlign: "right",
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Last Reg. No.
                </div>
                <div style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>
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
          padding: "0 16px",
          borderBottom: "1px solid var(--border-muted)",
          background: "var(--surface)",
        }}>
          {TABS.map((tab, i) => (
            <React.Fragment key={tab.key}>
              <button
                type="button"
                className={`adm-tab ${activeTab === tab.key ? "active" : currentIndex > i ? "done" : "idle"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <div className="step-circle">
                  {currentIndex > i ? <CheckOutlined style={{ fontSize: 13 }} /> : tab.step}
                </div>
                <span className="step-label">{tab.label}</span>
              </button>
              {i < TABS.length - 1 && (
                <div className={`adm-connector ${currentIndex > i ? "done" : ""}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Form Body ── */}
        <div style={{ padding: "24px" }}>
          <Form
            className="adm-form"
            layout="vertical"
            form={form}
            onFinish={() => onFinish(form.getFieldsValue(true))}
          >

            {/* ── STUDENT ── */}
            {activeTab === "student" && (
              <div>
                <SectionHeading>Basic Information</SectionHeading>
                <div className="adm-row">
                  <Form.Item name="studentName" label="Student Name" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="email" label="Student Email" rules={[{ required: true, type: "email", message: "Valid email required" }]} style={{ marginBottom: 18 }}>
                    <Input placeholder="student@email.com" />
                  </Form.Item>
                  <Form.Item name="mobileNumber" label="Student Mobile" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <Input placeholder="10-digit number" maxLength={10} />
                  </Form.Item>
                </div>

                <SectionHeading>Class & Enrollment</SectionHeading>
                <div className="adm-row">
                  <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Select a class" }]} style={{ marginBottom: 18 }}>
                    <Select
                      placeholder="Select class"
                      onChange={handleClassChange}
                      options={schoolClasses.map(c => ({ label: c.name, value: c._id }))}
                    />
                  </Form.Item>
                  <Form.Item name="sectionId" label="Section" rules={[{ required: true, message: "Select a section" }]} style={{ marginBottom: 18 }}>
                    <Select
                      placeholder="Select section"
                      disabled={!sections.length}
                      options={sections.map(s => ({ label: s.name, value: s._id }))}
                    />
                  </Form.Item>
                  <Form.Item name="admissionDate" label="Admission Date" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <DatePicker placeholder="Select date" />
                  </Form.Item>
                </div>

                <div className="adm-row">
                  <Form.Item name="registrationNumber" label="Registration No." style={{ marginBottom: 18 }}>
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="smsMobile" label="SMS Mobile" style={{ marginBottom: 18 }}>
                    <Input placeholder="For SMS alerts" maxLength={10} />
                  </Form.Item>
                  <Form.Item name="feeDiscount" label="Fee Discount (%)" style={{ marginBottom: 18 }}>
                    <InputNumber placeholder="0" min={0} max={100} />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* ── DETAILS ── */}
            {activeTab === "other" && (
              <div>
                <SectionHeading>Personal Details</SectionHeading>
                <div className="adm-row">
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <DatePicker />
                  </Form.Item>
                  <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={[{ value: "Male" }, { value: "Female" }]} />
                  </Form.Item>
                  <Form.Item name="bloodGroup" label="Blood Group" style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => ({ value: b }))} />
                  </Form.Item>
                </div>

                <div className="adm-row">
                  <Form.Item name="cast" label="Caste" style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={["General","OBC","SC","ST","Other"].map(c => ({ value: c }))} />
                  </Form.Item>
                  <Form.Item name="religion" label="Religion" style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={["Hindu","Muslim","Christian","Sikh","Other"].map(r => ({ value: r }))} />
                  </Form.Item>
                  <Form.Item name="birthFormId" label="Birth Form ID" style={{ marginBottom: 18 }}>
                    <Input placeholder="Official birth form ID" />
                  </Form.Item>
                </div>

                <div className="adm-row">
                  <Form.Item name="siblings" label="No. of Siblings" style={{ marginBottom: 18 }}>
                    <InputNumber placeholder="0" min={0} />
                  </Form.Item>
                  <Form.Item name="orphan" label="Orphan" style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={[{ value: "Yes" }, { value: "No" }]} />
                  </Form.Item>
                  <Form.Item name="osc" label="OSC" style={{ marginBottom: 18 }}>
                    <Select placeholder="Select" options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
                  </Form.Item>
                </div>

                <Form.Item name="identificationMark" label="Identification Mark" style={{ marginBottom: 18 }}>
                  <Input placeholder="Any visible identification mark" />
                </Form.Item>

                <SectionHeading>Additional Information</SectionHeading>
                <div className="adm-row-2">
                  <Form.Item name="address" label="Address" style={{ marginBottom: 18 }}>
                    <TextArea rows={3} placeholder="Residential address" />
                  </Form.Item>
                  <Form.Item name="disease" label="Medical Conditions" style={{ marginBottom: 18 }}>
                    <TextArea rows={3} placeholder="Any known medical conditions" />
                  </Form.Item>
                  <Form.Item name="family" label="Family Info" style={{ marginBottom: 18 }}>
                    <TextArea rows={3} placeholder="Additional family information" />
                  </Form.Item>
                  <Form.Item name="notes" label="Notes" style={{ marginBottom: 18 }}>
                    <TextArea rows={3} placeholder="Any other notes" />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* ── FATHER ── */}
            {activeTab === "father" && (
              <div>
                <SectionHeading>Father's Information</SectionHeading>
                <div className="adm-row">
                  <Form.Item name="fatherName" label="Father Name" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="fatherMobile" label="Mobile Number" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 18 }}>
                    <Input placeholder="10-digit number" />
                  </Form.Item>
                  <Form.Item name="fatherEmail" label="Email Address" style={{ marginBottom: 18 }}>
                    <Input placeholder="father@email.com" />
                  </Form.Item>
                </div>
                <div className="adm-row">
                  <Form.Item name="fatherOccupation" label="Occupation" style={{ marginBottom: 18 }}>
                    <Input placeholder="e.g. Engineer, Teacher" />
                  </Form.Item>
                  <Form.Item name="fatherEducation" label="Education" style={{ marginBottom: 18 }}>
                    <Input placeholder="e.g. B.Tech, MBA" />
                  </Form.Item>
                  <Form.Item name="fatherIncome" label="Annual Income (₹)" style={{ marginBottom: 18 }}>
                    <InputNumber placeholder="0" min={0} />
                  </Form.Item>
                </div>
                <InfoHint>
                  Father's login credentials will be auto-generated after successful admission.
                </InfoHint>
              </div>
            )}

            {/* ── MOTHER ── */}
            {activeTab === "mother" && (
              <div>
                <SectionHeading>Mother's Information</SectionHeading>
                <div className="adm-row">
                  <Form.Item name="motherName" label="Mother Name" style={{ marginBottom: 18 }}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="motherMobile" label="Mobile Number" style={{ marginBottom: 18 }}>
                    <Input placeholder="10-digit number" />
                  </Form.Item>
                  <Form.Item name="motherEmail" label="Email Address" style={{ marginBottom: 18 }}>
                    <Input placeholder="mother@email.com" />
                  </Form.Item>
                </div>
                <div className="adm-row">
                  <Form.Item name="motherOccupation" label="Occupation" style={{ marginBottom: 18 }}>
                    <Input placeholder="e.g. Doctor, Homemaker" />
                  </Form.Item>
                  <Form.Item name="motherEducation" label="Education" style={{ marginBottom: 18 }}>
                    <Input placeholder="e.g. M.A., B.Ed" />
                  </Form.Item>
                  <Form.Item name="motherIncome" label="Annual Income (₹)" style={{ marginBottom: 18 }}>
                    <InputNumber placeholder="0" min={0} />
                  </Form.Item>
                </div>
                <InfoHint>
                  Mother's login credentials will be auto-generated after successful admission.
                </InfoHint>
              </div>
            )}

            {/* ── Navigation ── */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid var(--border-muted)",
            }}>
              <button
                type="button"
                className="adm-btn secondary"
                disabled={currentIndex === 0}
                onClick={() => setActiveTab(TAB_KEYS[currentIndex - 1])}
              >
                <LeftOutlined style={{ fontSize: 11 }} /> Previous
              </button>

              {/* Step dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {TAB_KEYS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width:      i === currentIndex ? 22 : 7,
                      height:     7,
                      borderRadius: 4,
                      background: i === currentIndex ? "var(--primary)"
                                : i < currentIndex  ? "var(--success)"
                                : "var(--border-color)",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </div>

              {currentIndex < TAB_KEYS.length - 1 ? (
                <button
                  type="button"
                  className="adm-btn primary"
                  onClick={() => setActiveTab(TAB_KEYS[currentIndex + 1])}
                >
                  Next <RightOutlined style={{ fontSize: 11 }} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="adm-btn submit"
                  disabled={submitting}
                >
                  <CheckOutlined style={{ fontSize: 13 }} />
                  {submitting ? "Submitting…" : "Submit Admission"}
                </button>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionForm;
