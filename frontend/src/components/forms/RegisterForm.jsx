import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Select, Upload, Checkbox, Steps, DatePicker, InputNumber, message } from "antd";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import { registerUser, resetState } from "../../features/authSlice";
import { createEmployee, resetEmployeeState } from "../../features/employeeSlice";
import { savePayrollStructure } from "../../features/payrollSlice";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";

const EXCLUDED_ROLES_FOR_SCHOOL_ADMIN = ["super admin", "school admin", "student", "parent"];
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

/* ─── shared CSS injected once ─── */
const FORM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .reg-form .ant-form-item-label > label {
    font-size: 11px !important; font-weight: 700 !important; color: #999 !important;
    text-transform: uppercase !important; letter-spacing: 0.07em !important; height: auto !important;
  }
  .reg-form .ant-input, .reg-form .ant-input-affix-wrapper,
  .reg-form .ant-input-number, .reg-form .ant-picker {
    border-radius: 10px !important; border: 1.5px solid #e8e4ff !important;
    font-size: 12px !important; height: 30px !important;
    background: #fdfcff !important; color: #1a1a2e !important; width: 100% !important;
  }
  .reg-form .ant-input-affix-wrapper { padding: 0 12px !important; }
  .reg-form .ant-input-affix-wrapper input { height: 30px !important; background: transparent !important; }
  .reg-form .ant-input:focus, .reg-form .ant-input-affix-wrapper-focused,
  .reg-form .ant-input-number-focused, .reg-form .ant-picker-focused {
    border-color: #7c6ff7 !important; box-shadow: 0 0 0 3px rgba(124,111,247,0.1) !important;
  }
  .reg-form .ant-select .ant-select-selector {
    border-radius: 10px !important; border: 1.5px solid #e8e4ff !important;
    height: 30px !important; background: #fdfcff !important;
    align-items: center !important; font-size: 12px !important;
  }
  .reg-form .ant-select-focused .ant-select-selector {
    border-color: #7c6ff7 !important; box-shadow: 0 0 0 3px rgba(124,111,247,0.1) !important;
  }
  .reg-form .ant-checkbox-checked .ant-checkbox-inner {
    background: #7c6ff7 !important; border-color: #7c6ff7 !important;
  }
  .reg-form .ant-form-item-explain-error { font-size: 11px !important; margin-top: 3px !important; }
  .reg-form .ant-form-item { margin-bottom: 14px !important; }
  .reg-form .ant-input-number-handler-wrap { display: none; }

  .reg-alert {
    padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500;
  }
  .reg-alert.success { background: #f0fdf8; color: #1d9e75; border: 1px solid #bbf7d0; }
  .reg-alert.error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  .reg-btn {
    height: 30px; border-radius: 10px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s; letter-spacing: 0.01em;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .reg-btn-primary {
    background: linear-gradient(135deg, #1677ff 0%, #5a50c9 100%);
    color: #fff; box-shadow: 0 4px 14px rgba(124,111,247,0.35); padding: 0 20px;
  }
  .reg-btn-primary:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(124,111,247,0.45); transform: translateY(-1px);
  }
  .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .reg-btn-ghost { background: transparent; color: #7c6ff7; border: 1.5px solid #e8e4ff !important; padding: 0 16px; }
  .reg-btn-ghost:hover { border-color: #7c6ff7 !important; }

  .upload-zone {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    border: 1.5px dashed #ddd8ff; border-radius: 10px; background: #faf9ff;
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
  }
  .upload-zone:hover { border-color: #7c6ff7; background: #f3f0ff; }

  .step-status-row {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
  }
  .step-status-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px;
    border-radius: 10px; font-size: 12px; font-weight: 500;
  }
  .step-status-item.done    { background: #f0fdf8; color: #1d9e75; }
  .step-status-item.loading { background: #f5f3ff; color: #7c3aed; }
  .step-status-item.error   { background: #fef2f2; color: #dc2626; }
  .step-status-item.idle    { background: #f8fafc; color: #94a3b8; }

  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── status icon helper ─── */
const StatusIcon = ({ status }) => {
  if (status === "done")    return <CheckCircle size={14} />;
  if (status === "loading") return <Loader2 size={14} className="spin" />;
  if (status === "error")   return <span>✕</span>;
  return <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #cbd5e1", display: "inline-block" }} />;
};

/* ─── main component ─── */
const RegisterForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles }   = useSelector((s) => s.role);
  const { schools } = useSelector((s) => s.school);
  const { Loading, error, user } = useSelector((s) => s.auth);

  const currentUserRole  = user?.role?.name?.toLowerCase();
  const currentSchoolId  = user?.school?._id;
  const isSuperAdmin     = currentUserRole === "super admin";
  const isSchoolAdmin    = currentUserRole === "school admin";

  const [currentStep, setCurrentStep] = useState(0);
  const [avatarName,  setAvatarName]  = useState("");
  const [status, setStatus] = useState({ user: "idle", employee: "idle", payroll: "idle" });
  const [doneMsg, setDoneMsg] = useState("");
  const [errMsg,  setErrMsg]  = useState("");

  /* fetch lookups */
  useEffect(() => {
    if (!schools?.length) dispatch(fetchSchools());
    if (!roles?.length)   dispatch(fetchRoles());
  }, [dispatch, schools?.length, roles?.length]);

  useEffect(() => {
    if (isSchoolAdmin && currentSchoolId) form.setFieldValue("schoolId", currentSchoolId);
  }, [isSchoolAdmin, currentSchoolId, form]);

  const filteredRoles = useMemo(() => {
    if (!roles?.length || !currentUserRole) return [];
    if (isSuperAdmin)  return roles.filter((r) => r.name.toLowerCase() === "school admin");
    if (isSchoolAdmin) return roles.filter((r) => !EXCLUDED_ROLES_FOR_SCHOOL_ADMIN.includes(r.name.toLowerCase()));
    return [];
  }, [roles, currentUserRole, isSuperAdmin, isSchoolAdmin]);

  const schoolOptions = useMemo(() => schools.map((s) => ({ value: s._id, label: s.name })), [schools]);
  const roleOptions   = useMemo(() => filteredRoles.map((r) => ({ value: r._id, label: r.name })), [filteredRoles]);

  const handleAvatarUpload = useCallback((file) => {
    if (file.size > MAX_AVATAR_SIZE_BYTES) return Upload.LIST_IGNORE;
    setAvatarName(file.name);
    return false;
  }, []);

  /* ── Step 1 → Step 2 ── */
  const goToStep2 = async () => {
    try {
      await form.validateFields([
        "name", "email", "password", "confirmPassword",
        ...(isSuperAdmin ? ["schoolId"] : []),
        "roleId",
      ]);
      setCurrentStep(1);
    } catch {
      /* validation errors shown by Form */
    }
  };

  /* ── Final submit: user → employee → payroll ── */
  const onFinish = useCallback(async (values) => {
    /* validate required employee fields before anything hits the server */
    if (!values.phone || !values.gender || !values.joinDate) {
      message.error("Phone, Gender and Join Date are required");
      return;
    }
    setErrMsg("");
    setDoneMsg("");
    const resolvedSchoolId = isSchoolAdmin ? currentSchoolId : values.schoolId;

    /* ── 1. Register user ── */
    setStatus({ user: "loading", employee: "idle", payroll: "idle" });
    const payload = { ...values, schoolId: resolvedSchoolId };
    delete payload.confirmPassword;
    delete payload.phone;
    delete payload.gender;
    delete payload.department;
    delete payload.designation;
    delete payload.employmentType;
    delete payload.joinDate;
    delete payload.basicSalary;

    const userResult = await dispatch(registerUser(payload));
    if (userResult.meta.requestStatus !== "fulfilled") {
      setStatus((s) => ({ ...s, user: "error" }));
      setErrMsg(userResult.payload || "User registration failed");
      return;
    }
    setStatus((s) => ({ ...s, user: "done" }));

    const userId = userResult.payload?.data?._id;
    if (!userId) {
      setStatus((s) => ({ ...s, employee: "error", payroll: "error" }));
      setErrMsg("User created but ID not returned — employee not created");
      return;
    }

    /* ── 2. Create employee ── */
    setStatus((s) => ({ ...s, employee: "loading" }));
    const joinDate = values.joinDate ? dayjs(values.joinDate).toISOString() : new Date().toISOString();
    const empResult = await dispatch(createEmployee({
      userId,
      schoolId: resolvedSchoolId,
      phoneNo:        values.phone        || null,
      gender:         values.gender       || null,
      department:     values.department   || "",
      designation:    values.designation  || "",
      employmentType: values.employmentType || "Permanent",
      joinDate,
      qualification:  [],
    }));

    let employeeId = null;
    if (empResult.meta.requestStatus !== "fulfilled") {
      setStatus((s) => ({ ...s, employee: "error", payroll: "error" }));
      setErrMsg("User registered but employee creation failed: " + (empResult.payload?.message || ""));
      return;
    }
    setStatus((s) => ({ ...s, employee: "done" }));
    employeeId = empResult.payload?.data?.employee?._id;

    /* ── 3. Create payroll structure ── */
    if (!employeeId) {
      setStatus((s) => ({ ...s, payroll: "error" }));
      setErrMsg("Employee created but ID missing — payroll not created");
      return;
    }

    setStatus((s) => ({ ...s, payroll: "loading" }));
    const basic = Number(values.basicSalary) || 0;
    const hra   = Math.round(basic * 0.4);
    const gross = basic + hra;
    const payrollResult = await dispatch(savePayrollStructure({
      editingId: null,
      payload: {
        employeeId,
        schoolId: resolvedSchoolId,
        basic,
        hra,
        grossMonthly: gross,
        effectiveFrom: joinDate,
        status: "active",
      },
    }));

    if (payrollResult.meta.requestStatus !== "fulfilled") {
      setStatus((s) => ({ ...s, payroll: "error" }));
      setErrMsg("User & employee created but payroll setup failed");
      return;
    }

    setStatus({ user: "done", employee: "done", payroll: "done" });
    setDoneMsg("User, employee profile, and payroll created successfully!");
    form.resetFields();
    setAvatarName("");
    dispatch(resetState());
    dispatch(resetEmployeeState());
    setTimeout(() => {
      setDoneMsg("");
      setStatus({ user: "idle", employee: "idle", payroll: "idle" });
      setCurrentStep(0);
      onClose?.();
    }, 2000);
  }, [dispatch, isSchoolAdmin, currentSchoolId, onClose, form]);

  const isProcessing = status.user === "loading" || status.employee === "loading" || status.payroll === "loading";
  const allDone = status.user === "done" && status.employee === "done" && status.payroll === "done";

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{FORM_CSS}</style>

      {/* Steps indicator */}
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 20 }}
        items={[
          { title: "Account" },
          { title: "Employee & Payroll" },
        ]}
      />

      {/* Success */}
      {doneMsg && (
        <div className="reg-alert success">
          <CheckCircle size={16} />
          {doneMsg}
        </div>
      )}

      {/* Error */}
      {errMsg && (
        <div className="reg-alert error">
          <span style={{ fontSize: 16 }}>⚠️</span>
          {errMsg}
        </div>
      )}

      {/* Processing status */}
      {isProcessing || allDone ? (
        <div className="step-status-row">
          {[
            { key: "user",     label: "Creating user account" },
            { key: "employee", label: "Creating employee profile" },
            { key: "payroll",  label: "Setting up payroll structure" },
          ].map(({ key, label }) => (
            <div key={key} className={`step-status-item ${status[key]}`}>
              <StatusIcon status={status[key]} />
              {label}
            </div>
          ))}
        </div>
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="reg-form"
        initialValues={{
          isActive: false,
          avatar: [],
          employmentType: "Permanent",
          joinDate: dayjs(),
          basicSalary: 0,
        }}
      >
        {/* ════════════════════════════════
            STEP 1 — Account Details
        ════════════════════════════════ */}
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="e.g. Rahul Sharma" />
            </Form.Item>
            <Form.Item label="Email Address" name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input placeholder="user@school.com" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Password" name="password" rules={[{ required: true, min: 6, message: "Min 6 characters" }]}>
              <Input.Password placeholder="Min. 6 characters" />
            </Form.Item>
            <Form.Item
              label="Confirm Password" name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Required" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Repeat password" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isSuperAdmin ? "1fr 1fr" : "1fr", gap: "0 16px" }}>
            {isSuperAdmin && (
              <Form.Item label="School" name="schoolId" rules={[{ required: true, message: "Select a school" }]}>
                <Select placeholder="Select school" options={schoolOptions} />
              </Form.Item>
            )}
            <Form.Item label="Role" name="roleId" rules={[{ required: true, message: "Select a role" }]}>
              <Select placeholder="Select role" options={roleOptions} />
            </Form.Item>
          </div>

          <Form.Item
            label="Profile Avatar" name="avatar"
            valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}
          >
            <Upload beforeUpload={handleAvatarUpload} maxCount={1} showUploadList={false}>
              <div className="upload-zone">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0eeff", color: "#7c6ff7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Camera size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1677ff" }}>{avatarName || "Click to upload avatar"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>PNG, JPG · Max 1 MB</div>
                </div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, background: "#faf9ff", border: "1.5px solid #ede9fe", borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Activate Account</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>User can log in immediately after registration</div>
              </div>
              <Checkbox />
            </div>
          </Form.Item>

          <button type="button" className="reg-btn reg-btn-primary" style={{ width: "100%" }} onClick={goToStep2}>
            Next: Employee Details →
          </button>
        </div>

        {/* ════════════════════════════════
            STEP 2 — Employee & Payroll
        ════════════════════════════════ */}
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>

          {/* Section label */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6ff7", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12, paddingBottom: 6, borderBottom: "1.5px solid #ede9fe" }}>
            Employee Profile
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: "Required" }, { pattern: /^[0-9]{10,13}$/, message: "Enter valid 10-13 digit number" }]}>
              <Input placeholder="10-digit mobile number" />
            </Form.Item>
            <Form.Item label="Gender" name="gender" rules={[{ required: true, message: "Required" }]}>
              <Select placeholder="Select gender" options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]} />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Department" name="department">
              <Input placeholder="e.g. Science, Admin" />
            </Form.Item>
            <Form.Item label="Designation" name="designation">
              <Input placeholder="e.g. Senior Teacher" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Employment Type" name="employmentType">
              <Select options={[
                { value: "Permanent",  label: "Permanent"  },
                { value: "Contract",   label: "Contract"   },
                { value: "Part Time",  label: "Part Time"  },
                { value: "Full Time",  label: "Full Time"  },
                { value: "Intern",     label: "Intern"     },
              ]} />
            </Form.Item>
            <Form.Item label="Join Date" name="joinDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          {/* Payroll section */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6ff7", textTransform: "uppercase", letterSpacing: "0.07em", margin: "8px 0 12px", paddingBottom: 6, borderBottom: "1.5px solid #ede9fe" }}>
            Payroll Setup
          </div>

          <Form.Item label="Basic Salary (₹/month)" name="basicSalary">
            <InputNumber
              min={0} step={500}
              style={{ width: "100%" }}
              placeholder="e.g. 25000"
              formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>

          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14, background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
            HRA will be auto-calculated as 40% of basic. You can update the full salary structure later from <strong>Payroll → Salary Structures</strong>.
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="reg-btn reg-btn-ghost" style={{ flex: 1 }} onClick={() => setCurrentStep(0)} disabled={isProcessing}>
              ← Back
            </button>
            <button type="submit" className="reg-btn reg-btn-primary" style={{ flex: 2 }} disabled={isProcessing || allDone}>
              {isProcessing ? (
                <><Loader2 size={14} className="spin" /> Processing…</>
              ) : (
                "✓ Register & Create Employee"
              )}
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default RegisterForm;
