import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Input, Select, DatePicker, Button, InputNumber, message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastRegisteredStudent, createStudent } from "../../features/studentSlice";
import { getClassData } from "../../features/schoolClassSlice";

const { TextArea } = Input;

const TABS = [
  { key: "student", label: "Student", icon: "👤", step: 1 },
  { key: "other", label: "Details", icon: "📋", step: 2 },
  { key: "father", label: "Father", icon: "👨", step: 3 },
  { key: "mother", label: "Mother", icon: "👩", step: 4 },
];

const formSchema = z.object({}).passthrough();

const renderCredentialLine = (label, creds) => {
  if (!creds) return null;
  return (
    <div key={label} style={{ marginBottom: 16, padding: "5px", background: "#f8f7ff", borderRadius: 10, borderLeft: "3px solid #1677ff" }}>
      <div style={{ fontWeight: 600, color: "#4a3fa8", marginBottom: 6, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>Login ID: <span style={{ fontWeight: 500, color: "#222" }}>{creds.loginId || "—"}</span></div>
      <div style={{ fontSize: 13, color: "#555" }}>Password: <span style={{ fontWeight: 500, color: "#222" }}>{creds.password || "Already exists (unchanged)"}</span></div>
    </div>
  );
};

const FieldLabel = ({ children }) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</span>
);

const SectionHeading = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#b0a8f5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20, marginTop: 4, paddingBottom: 8, borderBottom: "1px solid #f0eeff" }}>
    {children}
  </div>
);

const inputStyle = {
  borderRadius: 5,
  border: "1.5px solid #69b1ff",
  fontSize: 12,
  height: 30,
  background: "#fdfcff",
  color: "#1a1a2e",
};

const selectStyle = {
  width: "100%",
};

const AdmissionForm = () => {
  const [form] = Form.useForm();
  const { handleSubmit: rhfHandleSubmit } = useForm({
    resolver: zodResolver(formSchema),
  });
  const dispatch = useDispatch();
  const tabKeys = ["student", "other", "father", "mother"];
  const [activeTab, setActiveTab] = useState("student");
  const currentIndex = tabKeys.indexOf(activeTab);

  const { lastStudent = [], registrationNumber } = useSelector((state) => state.students);
  const { user } = useSelector((state) => state.auth);
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const schoolId = user?.school?._id;
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);
  const academicYearId = selectedAcademicYear?._id;
  const [sections, setSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      dispatch(getClassData({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (registrationNumber) {
      form.setFieldsValue({ registrationNumber });
    }
  }, [registrationNumber, form]);

  const handleClassChange = (schoolClassId) => {
    const selectedClass = schoolClasses.find((c) => c._id === schoolClassId);
    setSections(selectedClass?.sections || []);
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
          name: values.studentName,
          email: values.email,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender: values.gender,
          address: values.address,
          bloodGroup: values.bloodGroup,
        },
        fatherData: { name: values.fatherName, email: values.fatherEmail, mobile: values.fatherMobile },
        motherData: { name: values.motherName, email: values.motherEmail, mobile: values.motherMobile },
        schoolId,
        academicYearId,
        schoolClassId: values.schoolClassId,
        sectionId: values.sectionId,
      };

      const res = await dispatch(createStudent(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        message.success("Student admitted successfully!");
        const credentials = res?.payload?.credentials;
        if (credentials) {
          Modal.success({
            title: (
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, color: "#3b35a8" }}>
                Login Credentials Created
              </span>
            ),
            width: 520,
            icon: null,
            content: (
              <div style={{ marginTop: 16 }}>
                {renderCredentialLine("Student", credentials.student)}
                {renderCredentialLine("Father", credentials.father)}
                {renderCredentialLine("Mother", credentials.mother)}
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

  const formItemStyle = {
    marginBottom: 18,
  };

  //const labelStyle = { fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" };

  return (
    <div style={{
      minHeight: "100vh",
      //background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
      padding: "0px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .adm-form .ant-form-item-label > label {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #888 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          height: auto !important;
        }
        .adm-form .ant-input,
        .adm-form .ant-input-number,
        .adm-form .ant-input-number-input,
        .adm-form .ant-picker {
          border-radius: 5px !important;
          border: 1.5px solid #69b1ff !important;
          font-size: 14px !important;
          height: 30px !important;
          background: #fdfcff !important;
          color: #1a1a2e !important;
          width: 100% !important;
        }
        .adm-form .ant-input:focus,
        .adm-form .ant-input-number:focus-within,
        .adm-form .ant-picker:focus-within,
        .adm-form .ant-input:hover,
        .adm-form .ant-input-number:hover,
        .adm-form .ant-picker:hover {
          border-color: #1677ff !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .adm-form textarea.ant-input {
          height: auto !important;
          min-height: 80px !important;
          padding-top: 10px !important;
        }
        .adm-form .ant-select .ant-select-selector {
          border-radius: 5px !important;
          border: 1.5px solid #69b1ff !important;
          font-size: 12px !important;
          height: 30px !important;
          background: #fdfcff !important;
          align-items: center !important;
        }
        .adm-form .ant-select:hover .ant-select-selector,
        .adm-form .ant-select-focused .ant-select-selector {
          border-color: #1677ff !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .adm-form .ant-form-item-explain-error {
          font-size: 11px !important;
          margin-top: 3px !important;
        }
        .adm-form .ant-input[disabled] {
          background: #f3f0ff !important;
          color: #1677ff !important;
          font-weight: 600 !important;
          border-color: #ddd8ff !important;
        }
        .tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          min-width: 90px;
        }
        .tab-btn .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .tab-btn .step-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .tab-btn.active .step-circle {
          background: #1677ff;
          color: #fff;
          box-shadow: 0 4px 14px rgba(124, 111, 247, 0.4);
        }
        .tab-btn.active .step-label { color: #5a50c9; }
        .tab-btn.done .step-circle {
          background: #d4f0e8;
          color: #1d9e75;
          border: 2px solid #5DCAA5;
        }
        .tab-btn.done .step-label { color: #1d9e75; }
        .tab-btn.idle .step-circle {
          background: #f0eeff;
          color: #c5bef5;
          border: 2px solid #e4dfff;
        }
        .tab-btn.idle .step-label { color: #c5bef5; }
        .tab-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 3px;
          width: 0;
          background: #1677ff;
          border-radius: 2px 2px 0 0;
          transition: width 0.2s;
        }
        .tab-btn.active::after { width: 60%; }
        .progress-connector {
          flex: 1;
          height: 2px;
          background: #69b1ff;
          margin-top: -20px;
          position: relative;
          top: -6px;
        }
        .progress-connector.done { background: #5DCAA5; }
        .nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 28px;
          height: 30px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .nav-btn.secondary {
          background: #f0eeff;
          color: #1677ff;
        }
        .nav-btn.secondary:not(:disabled):hover {
          background: #e4dfff;
          transform: translateX(-2px);
        }
        .nav-btn.primary {
          background: linear-gradient(135deg, #1677ff 0%, #5a50c9 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(124, 111, 247, 0.35);
        }
        .nav-btn.primary:not(:disabled):hover {
          transform: translateX(2px);
          box-shadow: 0 6px 20px rgba(124, 111, 247, 0.45);
        }
        .nav-btn.submit {
          background: linear-gradient(135deg, #1d9e75 0%, #0f6e56 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(29, 158, 117, 0.35);
        }
        .nav-btn.submit:not(:disabled):hover {
          box-shadow: 0 6px 20px rgba(29, 158, 117, 0.45);
        }
        .field-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0 20px;
        }
        .adm-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(124, 111, 247, 0.1), 0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          width: 100%;
          margin: 0 auto;
        }
        .info-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: #f3f0ff;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #1677ff;
        }
      `}</style>

      <div className="adm-card">
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1677ff 0%, #5a50c9 100%)",
          padding: "10px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30, width: 140, height: 140,
            borderRadius: "50%", background: "rgba(255,255,255,0.07)",
          }} />
          <div style={{
            position: "absolute", bottom: -50, right: 80, width: 200, height: 200,
            borderRadius: "50%", background: "rgba(255,255,255,0.05)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                School Management
              </div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                New Student Admission
              </h1>
            </div>
            {lastStudent && lastStudent.registrationNumber && (
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 16px", backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Last Reg No.</div>
                <div style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>{lastStudent.registrationNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: "1px solid #f0eeff",
          background: "#fefefe",
        }}>
          {TABS.map((tab, i) => (
            <React.Fragment key={tab.key}>
              <button
                className={`tab-btn ${activeTab === tab.key ? "active" : currentIndex > i ? "done" : "idle"}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <div className="step-circle">
                  {currentIndex > i ? "✓" : tab.step}
                </div>
                <span className="step-label">{tab.label}</span>
              </button>
              {i < TABS.length - 1 && (
                <div className={`progress-connector ${currentIndex > i ? "done" : ""}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Body */}
        <div style={{ padding: "20px" }}>
          <Form className="adm-form" layout="vertical" form={form} onFinish={rhfHandleSubmit((values) => onFinish(values))}>

            {/* ── STUDENT INFO ── */}
            {activeTab === "student" && (
              <div>
                <SectionHeading>Basic Information</SectionHeading>
                <div className="field-row">
                  <Form.Item name="studentName" label="Student Name" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <Input placeholder="Full name" style={inputStyle} />
                  </Form.Item>
                  <Form.Item name="email" label="Student Email" rules={[{ required: true, type: "email", message: "Valid email required" }]} style={formItemStyle}>
                    <Input placeholder="student@email.com" style={inputStyle} />
                  </Form.Item>
                  <Form.Item name="mobileNumber" label="Student Mobile" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <Input placeholder="10-digit number" maxLength={10} style={inputStyle} />
                  </Form.Item>
                </div>

                <SectionHeading>Class & Enrollment</SectionHeading>
                <div className="field-row">
                  <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Select a class" }]} style={formItemStyle}>
                    <Select
                      placeholder="Select class"
                      onChange={handleClassChange}
                      style={selectStyle}
                      options={schoolClasses.map((c) => ({ label: c.name, value: c._id }))}
                    />
                  </Form.Item>
                  <Form.Item name="sectionId" label="Section" rules={[{ required: true, message: "Select a section" }]} style={formItemStyle}>
                    <Select
                      placeholder="Select section"
                      disabled={!sections.length}
                      style={selectStyle}
                      options={sections.map((s) => ({ label: s.name, value: s._id }))}
                    />
                  </Form.Item>
                  <Form.Item name="admissionDate" label="Admission Date" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <DatePicker style={{ width: "100%" }} placeholder="Select date" />
                  </Form.Item>
                </div>

                <div className="field-row">
                  <Form.Item name="registrationNumber" label="Registration No." style={formItemStyle}>
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="smsMobile" label="SMS Mobile" style={formItemStyle}>
                    <Input placeholder="For SMS alerts" maxLength={10} />
                  </Form.Item>
                  <Form.Item name="feeDiscount" label="Fee Discount (%)" style={formItemStyle}>
                    <InputNumber style={{ width: "100%" }} placeholder="0" min={0} max={100} />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* ── OTHER INFO ── */}
            {activeTab === "other" && (
              <div>
                <SectionHeading>Personal Details</SectionHeading>
                <div className="field-row">
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
                  </Form.Item>
                  <Form.Item name="bloodGroup" label="Blood Group" style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => ({ value: b }))} />
                  </Form.Item>
                </div>

                <div className="field-row">
                  <Form.Item name="cast" label="Caste" style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={["General", "OBC", "SC", "ST", "Other"].map(c => ({ value: c }))} />
                  </Form.Item>
                  <Form.Item name="religion" label="Religion" style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={["Hindu", "Muslim", "Christian", "Sikh", "Other"].map(r => ({ value: r }))} />
                  </Form.Item>
                  <Form.Item name="birthFormId" label="Birth Form ID" style={formItemStyle}>
                    <Input placeholder="Official birth form ID" />
                  </Form.Item>
                </div>

                <div className="field-row">
                  <Form.Item name="siblings" label="No. of Siblings" style={formItemStyle}>
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
                  </Form.Item>
                  <Form.Item name="orphan" label="Orphan" style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={[{ value: "Yes" }, { value: "No" }]} />
                  </Form.Item>
                  <Form.Item name="osc" label="OSC" style={formItemStyle}>
                    <Select placeholder="Select" style={selectStyle} options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
                  </Form.Item>
                </div>

                <Form.Item name="identificationMark" label="Identification Mark" style={formItemStyle}>
                  <Input placeholder="Any visible identification mark" />
                </Form.Item>

                <SectionHeading>Additional Information</SectionHeading>
                <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Form.Item name="address" label="Address" style={formItemStyle}>
                    <TextArea rows={3} placeholder="Residential address" />
                  </Form.Item>
                  <Form.Item name="disease" label="Medical Conditions" style={formItemStyle}>
                    <TextArea rows={3} placeholder="Any known medical conditions" />
                  </Form.Item>
                  <Form.Item name="family" label="Family Info" style={formItemStyle}>
                    <TextArea rows={3} placeholder="Additional family information" />
                  </Form.Item>
                  <Form.Item name="notes" label="Notes" style={formItemStyle}>
                    <TextArea rows={3} placeholder="Any other notes" />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* ── FATHER INFO ── */}
            {activeTab === "father" && (
              <div>
                <SectionHeading>Father's Information</SectionHeading>
                <div className="field-row">
                  <Form.Item name="fatherName" label="Father Name" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="fatherMobile" label="Mobile Number" rules={[{ required: true, message: "Required" }]} style={formItemStyle}>
                    <Input placeholder="10-digit number" />
                  </Form.Item>
                  <Form.Item name="fatherEmail" label="Email Address" style={formItemStyle}>
                    <Input placeholder="father@email.com" />
                  </Form.Item>
                </div>
                <div className="field-row">
                  <Form.Item name="fatherOccupation" label="Occupation" style={formItemStyle}>
                    <Input placeholder="e.g. Engineer, Teacher" />
                  </Form.Item>
                  <Form.Item name="fatherEducation" label="Education Qualification" style={formItemStyle}>
                    <Input placeholder="e.g. B.Tech, MBA" />
                  </Form.Item>
                  <Form.Item name="fatherIncome" label="Annual Income (₹)" style={formItemStyle}>
                    <InputNumber style={{ width: "100%" }} placeholder="0" min={0} />
                  </Form.Item>
                </div>
                <div style={{ marginTop: 8, padding: "14px 18px", background: "#f8f7ff", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={{ fontSize: 13, color: "#1677ff" }}>Father's login credentials will be auto-generated after successful admission.</span>
                </div>
              </div>
            )}

            {/* ── MOTHER INFO ── */}
            {activeTab === "mother" && (
              <div>
                <SectionHeading>Mother's Information</SectionHeading>
                <div className="field-row">
                  <Form.Item name="motherName" label="Mother Name" style={formItemStyle}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item name="motherMobile" label="Mobile Number" style={formItemStyle}>
                    <Input placeholder="10-digit number" />
                  </Form.Item>
                  <Form.Item name="motherEmail" label="Email Address" style={formItemStyle}>
                    <Input placeholder="mother@email.com" />
                  </Form.Item>
                </div>
                <div className="field-row">
                  <Form.Item name="motherOccupation" label="Occupation" style={formItemStyle}>
                    <Input placeholder="e.g. Doctor, Homemaker" />
                  </Form.Item>
                  <Form.Item name="motherEducation" label="Education Qualification" style={formItemStyle}>
                    <Input placeholder="e.g. M.A., B.Ed" />
                  </Form.Item>
                  <Form.Item name="motherIncome" label="Annual Income (₹)" style={formItemStyle}>
                    <InputNumber style={{ width: "100%" }} placeholder="0" min={0} />
                  </Form.Item>
                </div>
                <div style={{ marginTop: 8, padding: "14px 18px", background: "#f8f7ff", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={{ fontSize: 13, color: "#1677ff" }}>Mother's login credentials will be auto-generated after successful admission.</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 36,
              paddingTop: 24,
              borderTop: "1px solid #f0eeff",
            }}>
              <button
                type="button"
                className="nav-btn secondary"
                disabled={currentIndex === 0}
                onClick={() => setActiveTab(tabKeys[currentIndex - 1])}
              >
                ← Previous
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {tabKeys.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === currentIndex ? "#1677ff" : i < currentIndex ? "#5DCAA5" : "#69b1ff",
                    transition: "all 0.3s",
                  }} />
                ))}
              </div>

              {currentIndex < tabKeys.length - 1 ? (
                <button
                  type="button"
                  className="nav-btn primary"
                  onClick={() => setActiveTab(tabKeys[currentIndex + 1])}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="nav-btn submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "✓ Submit Admission"}
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