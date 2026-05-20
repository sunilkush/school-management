import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Select, Upload, Checkbox } from "antd";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import { registerUser, resetState } from "../../features/authSlice";

const EXCLUDED_ROLES_FOR_SCHOOL_ADMIN = ["super admin", "school admin", "student", "parent"];
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

const RegisterForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { Loading, error, user, success } = useSelector((state) => state.auth);

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;
  const isSuperAdmin = currentUserRole === "super admin";
  const isSchoolAdmin = currentUserRole === "school admin";

  const [successMessage, setSuccessMessage] = useState("");
  const [avatarName, setAvatarName] = useState("");

  const initialValues = {
    name: "", email: "", password: "", confirmPassword: "",
    roleId: undefined,
    schoolId: isSchoolAdmin ? currentSchoolId : undefined,
    isActive: false,
    avatar: [],
  };

  useEffect(() => {
    if (!schools?.length) dispatch(fetchSchools());
    if (!roles?.length) dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (isSchoolAdmin && currentSchoolId) {
      form.setFieldValue("schoolId", currentSchoolId);
    }
  }, [isSchoolAdmin, currentSchoolId, form]);

  const filteredRoles = useMemo(() => {
    if (!roles?.length || !currentUserRole) return [];
    if (isSuperAdmin) return roles.filter((r) => r.name.toLowerCase() === "school admin");
    if (isSchoolAdmin) return roles.filter((r) => !EXCLUDED_ROLES_FOR_SCHOOL_ADMIN.includes(r.name.toLowerCase()));
    return [];
  }, [roles, currentUserRole, isSuperAdmin, isSchoolAdmin]);

  const schoolOptions = useMemo(() => schools.map((s) => ({ value: s._id, label: s.name })), [schools]);
  const roleOptions = useMemo(() => filteredRoles.map((r) => ({ value: r._id, label: r.name })), [filteredRoles]);

  useEffect(() => {
    if (!success) return;
    setSuccessMessage("User registered successfully");
    form.resetFields();
    setAvatarName("");
    const timer = setTimeout(() => {
      setSuccessMessage("");
      dispatch(resetState());
      onClose?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, dispatch, form, onClose]);

  const handleAvatarUpload = useCallback((file) => {
    if (file.size > MAX_AVATAR_SIZE_BYTES) return Upload.LIST_IGNORE;
    setAvatarName(file.name);
    return false;
  }, []);

  const onFinish = useCallback((values) => {
    const payload = { ...values, schoolId: isSchoolAdmin ? currentSchoolId : values.schoolId };
    delete payload.confirmPassword;
    dispatch(registerUser(payload));
  }, [dispatch, isSchoolAdmin, currentSchoolId]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .reg-form .ant-form-item-label > label {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #999 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.07em !important;
          height: auto !important;
        }
        .reg-form .ant-input,
        .reg-form .ant-input-affix-wrapper {
          border-radius: 10px !important;
          border: 1.5px solid #e8e4ff !important;
          font-size: 14px !important;
          height: 42px !important;
          background: #fdfcff !important;
          color: #1a1a2e !important;
        }
        .reg-form .ant-input-affix-wrapper { padding: 0 12px !important; }
        .reg-form .ant-input-affix-wrapper input { height: 40px !important; background: transparent !important; }
        .reg-form .ant-input:focus,
        .reg-form .ant-input-affix-wrapper:focus,
        .reg-form .ant-input-affix-wrapper-focused {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .reg-form .ant-input:hover,
        .reg-form .ant-input-affix-wrapper:hover {
          border-color: #7c6ff7 !important;
        }
        .reg-form .ant-select .ant-select-selector {
          border-radius: 10px !important;
          border: 1.5px solid #e8e4ff !important;
          height: 42px !important;
          background: #fdfcff !important;
          align-items: center !important;
          font-size: 14px !important;
        }
        .reg-form .ant-select:hover .ant-select-selector,
        .reg-form .ant-select-focused .ant-select-selector {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .reg-form .ant-checkbox-checked .ant-checkbox-inner {
          background: #7c6ff7 !important;
          border-color: #7c6ff7 !important;
        }
        .reg-form .ant-checkbox:hover .ant-checkbox-inner {
          border-color: #7c6ff7 !important;
        }
        .reg-form .ant-form-item-explain-error {
          font-size: 11px !important;
          margin-top: 3px !important;
        }
        .reg-form .ant-form-item { margin-bottom: 16px !important; }

        .reg-alert {
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
        }
        .reg-alert.success { background: #f0fdf8; color: #1d9e75; border: 1px solid #bbf7d0; }
        .reg-alert.error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        .submit-btn {
          width: 100%; height: 46px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.2s; letter-spacing: 0.01em;
          background: linear-gradient(135deg, #7c6ff7 0%, #5a50c9 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(124, 111, 247, 0.35);
          margin-top: 6px;
        }
        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(124, 111, 247, 0.45);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .upload-zone {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          border: 1.5px dashed #ddd8ff;
          border-radius: 12px;
          background: #faf9ff;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .upload-zone:hover {
          border-color: #7c6ff7;
          background: #f3f0ff;
        }
        .upload-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: #f0eeff; color: #7c6ff7;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
      `}</style>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="reg-alert success">
          <span style={{ fontSize: 18 }}>✅</span>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="reg-alert error">
          <span style={{ fontSize: 18 }}>⚠️</span>
          {error}
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        className="reg-form"
      >
        {/* Two column row: Name + Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Rahul Sharma" />
          </Form.Item>
          <Form.Item label="Email Address" name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
            <Input placeholder="user@school.com" />
          </Form.Item>
        </div>

        {/* Two column row: Password + Confirm */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Form.Item label="Password" name="password" rules={[{ required: true, min: 6, message: "Min 6 characters" }]}>
            <Input.Password placeholder="Min. 6 characters" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
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

        {/* School (super admin only) + Role — side by side when both shown */}
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

        {/* Avatar Upload */}
        <Form.Item
          label="Profile Avatar"
          name="avatar"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
          style={{ marginBottom: 16 }}
        >
          <Upload beforeUpload={handleAvatarUpload} maxCount={1} showUploadList={false}>
            <div className="upload-zone">
              <div className="upload-icon">📷</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#7c6ff7" }}>
                  {avatarName || "Click to upload avatar"}
                </div>
                <div style={{ fontSize: 11, color: "#c5bef5", marginTop: 2 }}>
                  PNG, JPG · Max 1 MB
                </div>
              </div>
            </div>
          </Upload>
        </Form.Item>

        {/* Active toggle */}
        <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", background: "#faf9ff",
            border: "1.5px solid #ede9fe", borderRadius: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Activate Account</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>User can log in immediately after registration</div>
            </div>
            <Checkbox />
          </div>
        </Form.Item>

        {/* Submit */}
        <button
          type="submit"
          className="submit-btn"
          disabled={!!Loading}
        >
          {Loading ? "Registering…" : "✓ Register User"}
        </button>
      </Form>
    </div>
  );
};

export default RegisterForm;