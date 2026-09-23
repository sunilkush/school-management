import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select, Upload, Checkbox, Steps, DatePicker, InputNumber, message } from "antd";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import { registerUser, resetState } from "../../features/authSlice";
import { createEmployee, resetEmployeeState } from "../../features/employeeSlice";
import { savePayrollStructure } from "../../features/payrollSlice";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import PasswordRequirements from "./PasswordRequirements";
import { passwordRule, isStrongPassword } from "../../utils/passwordPolicy";

const EXCLUDED_ROLES_FOR_SCHOOL_ADMIN = ["super admin", "school admin", "student", "parent"];
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

/* ─── shared CSS injected once ─── */
const FORM_CSS = `
  .reg-form .ant-form-item-label > label {
    font-size: 11px !important; font-weight: 700 !important; color: var(--text-muted) !important;
    text-transform: uppercase !important; letter-spacing: 0.07em !important; height: auto !important;
  }
  .reg-form .ant-input, .reg-form .ant-input-affix-wrapper,
  .reg-form .ant-input-number, .reg-form .ant-picker {
    border-radius: 10px !important; border: 1px solid var(--border) !important;
    font-size: 13px !important; height: 38px !important;
    background: var(--surface) !important; color: var(--text) !important; width: 100% !important;
  }
  .reg-form .ant-input-affix-wrapper { padding: 0 12px !important; }
  .reg-form .ant-input-affix-wrapper > .ant-input {
    height: 36px !important; background: transparent !important; width: auto !important;
    flex: 1 1 auto !important; border: none !important; box-shadow: none !important; border-radius: 0 !important;
  }
  .reg-form .ant-input-affix-wrapper .ant-input-suffix { margin-left: 8px; color: var(--text-muted); }
  .reg-form .ant-input:focus, .reg-form .ant-input-affix-wrapper-focused,
  .reg-form .ant-input-number-focused, .reg-form .ant-picker-focused {
    border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12) !important;
  }
  .reg-form .ant-select .ant-select-selector {
    border-radius: 10px !important; border: 1px solid var(--border) !important;
    height: 38px !important; background: var(--surface) !important;
    align-items: center !important; font-size: 13px !important;
  }
  .reg-form .ant-select-focused .ant-select-selector {
    border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12) !important;
  }
  .reg-form .ant-checkbox-checked .ant-checkbox-inner {
    background: var(--primary) !important; border-color: var(--primary) !important;
  }
  .reg-form .ant-form-item-explain-error { font-size: 11px !important; margin-top: 3px !important; }
  .reg-form .ant-form-item { margin-bottom: 16px !important; }
  .reg-form .ant-input-number-handler-wrap { display: none; }

  /* Section divider inside a step, e.g. "Employee Profile" / "Payroll Setup". */
  .reg-section {
    font-size: 11px; font-weight: 700; color: var(--primary);
    text-transform: uppercase; letter-spacing: 0.07em;
    margin: 4px 0 14px; padding-bottom: 7px; border-bottom: 1px solid var(--border);
  }

  .reg-alert {
    padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500;
  }
  .reg-alert.success { background: var(--success-light); color: var(--success-hover); border: 1px solid rgba(var(--success-rgb), 0.3); }
  .reg-alert.error   { background: var(--danger-light); color: var(--danger-hover); border: 1px solid rgba(var(--danger-rgb), 0.3); }

  .reg-btn {
    height: 40px; border-radius: 10px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .reg-btn-primary { background: var(--primary); color: #fff; padding: 0 20px; }
  .reg-btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
  .reg-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .reg-btn-ghost {
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border) !important; padding: 0 16px;
  }
  .reg-btn-ghost:hover:not(:disabled) { border-color: var(--primary) !important; color: var(--primary); }
  .reg-btn-ghost:disabled { opacity: 0.55; cursor: not-allowed; }

  .upload-zone {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    border: 1px dashed var(--border); border-radius: 10px; background: var(--surface-soft);
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
  }
  .upload-zone:hover { border-color: var(--primary); background: var(--primary-light); }

  /* The whole row toggles the checkbox, not just the 16px box on the right. */
  .reg-toggle-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 14px; background: var(--surface-soft); border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 20px; cursor: pointer;
  }
  .reg-toggle-row:hover { border-color: var(--primary); }

  .step-status-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .step-status-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px;
    border-radius: 10px; font-size: 12px; font-weight: 500;
  }
  .step-status-item.done    { background: var(--success-light); color: var(--success-hover); }
  .step-status-item.loading { background: var(--primary-light); color: var(--primary); }
  .step-status-item.error   { background: var(--danger-light); color: var(--danger-hover); }
  .step-status-item.idle    { background: var(--surface-soft); color: var(--text-muted); }

  .reg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  @media (max-width: 600px) {
    .reg-grid-2 { grid-template-columns: 1fr; }
    .reg-actions { flex-direction: column-reverse; }
    .reg-actions .reg-btn { width: 100%; }
  }

  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── status icon helper ─── */
const StatusIcon = ({ status }) => {
  if (status === "done")    return <CheckCircle size={14} />;
  if (status === "loading") return <Loader2 size={14} className="spin" />;
  if (status === "error")   return <span>✕</span>;
  return <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--border)", display: "inline-block" }} />;
};

/* ─── main component ───
   allowedRoleNames: optional array of role names (case-insensitive) to restrict the Role
   dropdown to, overriding the default Super-Admin-creates-School-Admin-only behavior. Used by
   pages like Transport Management, which reuse this form to register a specific role set
   (Driver/Transporter) rather than a School Admin. */
const RegisterForm = ({ onClose, allowedRoleNames }) => {
  const [form] = Form.useForm();
  // The rules are shown while the box is focused, and stay up while what is typed still fails.
  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordValue = Form.useWatch("password", form) || "";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { roles }   = useSelector((s) => s.role);
  const { schools } = useSelector((s) => s.school);
  const { user } = useSelector((s) => s.auth);

  const currentUserRole  = user?.role?.name?.toLowerCase();
  const currentSchoolId  = user?.school?._id;
  const isSuperAdmin     = currentUserRole === "super admin";
  const isSchoolAdmin    = currentUserRole === "school admin";

  /**
   * Super Admin registers a School Admin — an account for somebody to run a school with, not a
   * member of that school's staff.
   *
   * The employee profile and the opening salary structure belong to the school: its department
   * list, its designations, its payroll. A platform administrator has none of that to hand and
   * no business inventing it, and the school admin they create would arrive already carrying a
   * payroll record nobody in the school asked for.
   *
   * So for Super Admin this is one step that creates one account. A School Admin registering
   * their own staff still gets the full wizard, which is where those details actually belong.
   */
  const accountOnly = isSuperAdmin;

  const [currentStep, setCurrentStep] = useState(0);
  const [avatarName,  setAvatarName]  = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  // What was just created, kept on screen on the standalone page (a dialog closes instead).
  const [created, setCreated] = useState(null);
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

  /**
   * Which school the new user belongs to. The Role list depends on it — see filteredRoles below.
   *
   * Changing the school clears whatever role was already picked, because that role may belong to
   * the school just navigated away from. Ant Design keeps a field's value when the options behind
   * it change, so without this a role chosen first and a school chosen second would submit an id
   * that no longer appears in the dropdown showing it.
   */
  const selectedSchoolId = Form.useWatch("schoolId", form);

  useEffect(() => {
    if (isSuperAdmin) form.setFieldValue("roleId", undefined);
  }, [selectedSchoolId, isSuperAdmin, form]);

  const filteredRoles = useMemo(() => {
    if (!roles?.length || !currentUserRole) return [];
    if (allowedRoleNames?.length) {
      const allowed = allowedRoleNames.map((n) => n.toLowerCase());
      return roles.filter((r) => allowed.includes(r.name.toLowerCase()));
    }

    /**
     * Super Admin creates School Admins, so the list is the roles by that name — but WHICH one
     * matters, and filtering by name alone got that wrong.
     *
     * Roles are scoped: initializeNewSchool gives every new school its own set, so a role named
     * "School Admin" exists once per school plus once at platform level (schoolId null). Picking
     * by name alone offered every one of them under an identical label, with nothing to tell
     * them apart, and attaching a new admin to another school's role is not a cosmetic mistake.
     *
     * So: the selected school's own role if it has one, the platform role otherwise. Exactly one
     * option either way. The final fallback keeps the old behaviour rather than handing back an
     * empty list — a required dropdown with nothing in it is a dead end with no explanation.
     */
    if (isSuperAdmin) {
      const named = roles.filter((r) => r.name.toLowerCase() === "school admin");
      const ownedBySelected = selectedSchoolId
        ? named.filter((r) => r.schoolId && String(r.schoolId) === String(selectedSchoolId))
        : [];
      if (ownedBySelected.length) return ownedBySelected;

      const platform = named.filter((r) => !r.schoolId);
      return platform.length ? platform : named;
    }

    if (isSchoolAdmin) return roles.filter((r) => !EXCLUDED_ROLES_FOR_SCHOOL_ADMIN.includes(r.name.toLowerCase()));
    return [];
  }, [roles, currentUserRole, isSuperAdmin, isSchoolAdmin, allowedRoleNames, selectedSchoolId]);

  const schoolOptions = useMemo(() => schools.map((s) => ({ value: s._id, label: s.name })), [schools]);
  const roleOptions   = useMemo(() => filteredRoles.map((r) => ({ value: r._id, label: r.name })), [filteredRoles]);

  const handleAvatarUpload = useCallback((file) => {
    // Was silently ignored before, so an oversized photo looked like a click that did nothing.
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      message.error(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the limit is 1 MB.`);
      return Upload.LIST_IGNORE;
    }
    setAvatarName(file.name);
    setAvatarPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
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

    /* Super Admin's School Admin is an account and nothing else — see `accountOnly` above.
       Returning here rather than skipping past the two blocks below keeps them unreachable
       instead of merely unused, so neither can be reintroduced by accident. */
    if (accountOnly) {
      setCreated({
        name: values.name,
        email: values.email,
        role: roleOptions.find((r) => r.value === values.roleId)?.label || "",
        isActive: values.isActive !== false,
      });
      form.resetFields();
      setAvatarName("");
      setAvatarPreview("");
      dispatch(resetState());
      if (onClose) {
        setDoneMsg("School Admin created successfully!");
        setTimeout(() => {
          setDoneMsg("");
          setStatus({ user: "idle", employee: "idle", payroll: "idle" });
          setCurrentStep(0);
          onClose();
        }, 1500);
      }
      return;
    }

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
    setCreated({
      name: values.name,
      email: values.email,
      role: roleOptions.find((r) => r.value === values.roleId)?.label || "",
      isActive: values.isActive !== false,
    });
    form.resetFields();
    setAvatarName("");
    setAvatarPreview("");
    dispatch(resetState());
    dispatch(resetEmployeeState());
    // In a dialog the caller closes it. On the page there is nowhere to be sent, so the result
    // stays on screen with the two things anyone does next.
    if (onClose) {
      setDoneMsg("User, employee profile, and payroll created successfully!");
      setTimeout(() => {
        setDoneMsg("");
        setStatus({ user: "idle", employee: "idle", payroll: "idle" });
        setCurrentStep(0);
        onClose();
      }, 1500);
    }
  }, [dispatch, isSchoolAdmin, currentSchoolId, onClose, form, roleOptions, accountOnly]);

  const startAnother = () => {
    setCreated(null);
    setStatus({ user: "idle", employee: "idle", payroll: "idle" });
    setErrMsg("");
    setCurrentStep(0);
  };

  // Defined once and placed in whichever column is free — next to Role, or below School+Role.
  const avatarField = (
    <Form.Item
      label="Profile Avatar" name="avatar"
      valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}
    >
      <Upload beforeUpload={handleAvatarUpload} maxCount={1} showUploadList={false}>
        <div className="upload-zone">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={18} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {avatarName || "Click to upload avatar"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {avatarName ? "Click to replace · PNG, JPG · Max 1 MB" : "PNG, JPG · Max 1 MB"}
            </div>
          </div>
        </div>
      </Upload>
    </Form.Item>
  );

  const isProcessing = accountOnly
    ? status.user === "loading"
    : status.user === "loading" || status.employee === "loading" || status.payroll === "loading";
  const allDone = accountOnly
    ? status.user === "done"
    : status.user === "done" && status.employee === "done" && status.payroll === "done";

  if (created && !onClose) {
    return (
      <div>
        <style>{FORM_CSS}</style>
        <div style={{ textAlign: "center", padding: "24px 8px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", margin: "0 auto 14px",
            background: "var(--success-light)", color: "var(--success-hover)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={26} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{created.name} is now on the staff list</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            {created.role ? `${created.role} · ` : ""}{created.email}
            {created.isActive ? " · can sign in now" : " · account is not active yet"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
            Employee profile and payroll structure were created too.
          </div>
          <div className="reg-actions" style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
            <button type="button" className="reg-btn reg-btn-ghost" onClick={startAnother}>Create another user</button>
            <button type="button" className="reg-btn reg-btn-primary" onClick={() => navigate("/dashboard/schooladmin/teacher")}>
              Go to Teachers &amp; Staff
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{FORM_CSS}</style>

      {/* Steps indicator — a one-step form has nothing to step through. */}
      {!accountOnly && (
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 20 }}
        // Backwards is always allowed; forwards goes through the same validation as the button,
        // so step 2 can never be reached with an invalid account.
        onChange={(step) => { if (isProcessing) return; if (step === 0) setCurrentStep(0); else goToStep2(); }}
        items={[
          { title: "Account", description: "Login & role" },
          { title: "Employee & Payroll", description: "Profile & salary" },
        ]}
      />
      )}

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
            // Not listed when they will not run — a row that never leaves "idle" reads as a step
            // that failed.
            ...(accountOnly
              ? []
              : [
                  { key: "employee", label: "Creating employee profile" },
                  { key: "payroll",  label: "Setting up payroll structure" },
                ]),
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
          isActive: true,
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
          <div className="reg-grid-2">
            <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="e.g. Rahul Sharma" />
            </Form.Item>
            <Form.Item label="Email Address" name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input placeholder="user@school.com" />
            </Form.Item>
          </div>

          <div className="reg-grid-2">
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Required" }, passwordRule]}
              // Passed as null when hidden: an always-present extra node would leave a gap under the box.
              extra={
                passwordFocused || (!!passwordValue && !isStrongPassword(passwordValue)) ? (
                  <PasswordRequirements value={passwordValue} />
                ) : null
              }
            >
              <Input.Password
                placeholder="Min. 8 characters"
                styles={{border:"none"}}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
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
              <Input.Password placeholder="Repeat password" styles={{border:"none"}}/>
            </Form.Item>
          </div>

          <div className="reg-grid-2">
            {isSuperAdmin && (
              <Form.Item label="School" name="schoolId" rules={[{ required: true, message: "Select a school" }]}>
                <Select placeholder="Select school" options={schoolOptions} />
              </Form.Item>
            )}
            <Form.Item
              label="Role"
              name="roleId"
              rules={[{ required: true, message: "Select a role" }]}
              extra={
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Decides which menu and pages this person sees after signing in.
                </span>
              }
            >
              <Select placeholder="Select role" options={roleOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            {!isSuperAdmin && avatarField}
          </div>

          {isSuperAdmin && avatarField}

          <label className="reg-toggle-row">
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Activate account</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                User can sign in straight away. Untick to create the account but keep it locked.
              </span>
            </span>
            <Form.Item name="isActive" valuePropName="checked" noStyle>
              <Checkbox />
            </Form.Item>
          </label>

          {accountOnly ? (
            <button
              type="submit"
              className="reg-btn reg-btn-primary"
              style={{ width: "100%" }}
              disabled={isProcessing || allDone}
            >
              {isProcessing ? (
                <><Loader2 size={14} className="spin" /> Creating…</>
              ) : (
                "✓ Create School Admin"
              )}
            </button>
          ) : (
            <button type="button" className="reg-btn reg-btn-primary" style={{ width: "100%" }} onClick={goToStep2}>
              Next: Employee Details →
            </button>
          )}
        </div>

        {/* ════════════════════════════════
            STEP 2 — Employee & Payroll
        ════════════════════════════════ */}
        {/* Not rendered at all when there is no step 2 — hiding it with display:none leaves its
            Form.Items mounted, and phone, gender and joinDate are required. The submit would then
            fail validation against fields that are not on screen, which looks like a button that
            does nothing. */}
        {!accountOnly && (
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>

          {/* Section label */}
          {/* Who is being created — step 1 is off screen by the time this matters. */}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Creating <strong style={{ color: "var(--text)" }}>{form.getFieldValue("name") || "this user"}</strong>
            {roleOptions.find((r) => r.value === form.getFieldValue("roleId"))?.label ? (
              <> as <strong style={{ color: "var(--text)" }}>{roleOptions.find((r) => r.value === form.getFieldValue("roleId"))?.label}</strong></>
            ) : null}
            . These details build the employee record and the opening salary structure.
          </div>

          <div className="reg-section">Employee Profile</div>

          <div className="reg-grid-2">
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

          <div className="reg-grid-2">
            <Form.Item label="Department" name="department">
              <Input placeholder="e.g. Science, Admin" />
            </Form.Item>
            <Form.Item label="Designation" name="designation">
              <Input placeholder="e.g. Senior Teacher" />
            </Form.Item>
          </div>

          <div className="reg-grid-2">
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
          <div className="reg-section" style={{ marginTop: 22 }}>Payroll Setup</div>

          <Form.Item label="Basic Salary (₹/month)" name="basicSalary">
            <InputNumber
              min={0} step={500}
              style={{ width: "100%" }}
              placeholder="e.g. 25000"
              formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>

          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, background: "var(--background)", padding: "8px 12px", borderRadius: 8 }}>
            HRA will be auto-calculated as 40% of basic. You can update the full salary structure later from <strong>Payroll → Salary Structures</strong>.
          </div>

          {/* Action buttons */}
          <div className="reg-actions" style={{ display: "flex", gap: 10, marginTop: 4 }}>
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
        )}
      </Form>
    </div>
  );
};

export default RegisterForm;
