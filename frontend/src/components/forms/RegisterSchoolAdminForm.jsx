import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Select, Upload, Checkbox, message } from "antd";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import { registerUser, resetState } from "../../features/authSlice";
import PasswordRequirements from "./PasswordRequirements";
import { passwordRule, isStrongPassword } from "../../utils/passwordPolicy";

const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

/**
 * Super Admin creating the person who will run a school.
 *
 * ── Why this is not RegisterForm ──────────────────────────────────────────────────────────────
 *
 * RegisterForm is a two-step wizard: account, then an employee profile and an opening salary
 * structure. That is right for the staff a school hires — a teacher, a driver — and wrong for
 * this. A School Admin is an account handed to somebody so they can set their school up. The
 * department list, the designations and the payroll all belong to that school, and a platform
 * administrator has none of it to hand.
 *
 * It was one component with a flag for a while, and the flag was wrong: it keyed off "is the
 * signed-in user a Super Admin", which is also true on the Transport page, where a Super Admin
 * registers Drivers who very much are employees and do need payroll. Two audiences that share
 * six fields and nothing else are two forms.
 *
 * What IS shared stays shared: the password policy (utils/passwordPolicy), the rules panel
 * (PasswordRequirements) are imported by both, and the styling lives in styles/_forms.scss.
 */
const RegisterSchoolAdminForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles } = useSelector((s) => s.role);
  const { schools } = useSelector((s) => s.school);

  const passwordValue = Form.useWatch("password", form) || "";
  const [passwordFocused, setPasswordFocused] = useState(false);

  const selectedSchoolId = Form.useWatch("schoolId", form);

  const [avatarName, setAvatarName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!schools?.length) dispatch(fetchSchools());
    if (!roles?.length) dispatch(fetchRoles());
  }, [dispatch, schools?.length, roles?.length]);

  /**
   * Which "School Admin" role to attach.
   *
   * Roles are scoped: initializeNewSchool gives every new school its own set, so a role by that
   * name exists once per school plus once at platform level. Offering all of them under an
   * identical label is how somebody ends up attached to another school's role — and that role
   * carries the schoolId their permissions are scoped by.
   *
   * So: the selected school's own role if it has one, the platform role otherwise. Exactly one
   * either way. The final fallback keeps something in the list rather than leaving a required
   * dropdown empty, which is a dead end that explains nothing.
   */
  const roleOptions = useMemo(() => {
    const named = (roles || []).filter((r) => r.name?.toLowerCase() === "school admin");
    const ownedBySelected = selectedSchoolId
      ? named.filter((r) => r.schoolId && String(r.schoolId) === String(selectedSchoolId))
      : [];
    const chosen = ownedBySelected.length
      ? ownedBySelected
      : named.filter((r) => !r.schoolId).length
        ? named.filter((r) => !r.schoolId)
        : named;
    return chosen.map((r) => ({ value: r._id, label: r.name }));
  }, [roles, selectedSchoolId]);

  /* Changing the school can change which role is correct, so a role already picked is cleared —
     Ant Design keeps a field's value when the options behind it change. */
  useEffect(() => {
    form.setFieldValue("roleId", undefined);
  }, [selectedSchoolId, form]);

  /* With one option there is nothing to choose. Selecting it keeps the field visible and
     auditable without asking for a click that has only one answer. */
  useEffect(() => {
    if (roleOptions.length === 1) form.setFieldValue("roleId", roleOptions[0].value);
  }, [roleOptions, form]);

  const schoolOptions = useMemo(
    () => (schools || []).map((s) => ({ value: s._id, label: s.name })),
    [schools]
  );

  const handleAvatarUpload = useCallback((file) => {
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      message.error(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the limit is 1 MB.`);
      return Upload.LIST_IGNORE;
    }
    setAvatarName(file.name);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    return false;
  }, []);

  const onFinish = useCallback(
    async (values) => {
      setErrMsg("");
      setSaving(true);

      const payload = { ...values };
      delete payload.confirmPassword;

      const result = await dispatch(registerUser(payload));
      setSaving(false);

      if (result.meta.requestStatus !== "fulfilled") {
        setErrMsg(result.payload || "Could not create the school admin");
        return;
      }

      setCreated({
        name: values.name,
        email: values.email,
        school: schoolOptions.find((s) => s.value === values.schoolId)?.label || "",
        isActive: values.isActive !== false,
      });

      form.resetFields();
      setAvatarName("");
      setAvatarPreview("");
      dispatch(resetState());

      if (onClose) setTimeout(onClose, 1600);
    },
    [dispatch, form, onClose, schoolOptions]
  );

  if (created) {
    return (
      <div>
        <div className="reg-alert success" style={{ marginBottom: 0 }}>
          <CheckCircle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>{created.name} can now run {created.school}</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              {created.email}
              {created.isActive ? " · can sign in now" : " · account is locked until activated"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>

      {errMsg && (
        <div className="reg-alert error">
          <span style={{ fontSize: 16 }}>⚠️</span>
          {errMsg}
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="reg-form"
        initialValues={{ isActive: true, avatar: [] }}
      >
        <div className="reg-grid-2">
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Rahul Sharma" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="admin@school.edu.in" />
          </Form.Item>
        </div>

        <div className="reg-grid-2">
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Required" }, passwordRule]}
          >
            <Input.Password
              placeholder="Min. 8 characters"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
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

        {/* Shown while the box is focused, and kept up while what is typed still fails. */}
        {(passwordFocused || (passwordValue && !isStrongPassword(passwordValue))) && (
          <PasswordRequirements value={passwordValue} />
        )}

        <div className="reg-grid-2">
          <Form.Item
            label="School"
            name="schoolId"
            rules={[{ required: true, message: "Select a school" }]}
            extra={
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                The school this person will administer.
              </span>
            }
          >
            <Select placeholder="Select school" options={schoolOptions} showSearch optionFilterProp="label" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Select a role" }]}
            extra={
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Set from the school — a School Admin sees that school and nothing else.
              </span>
            }
          >
            <Select placeholder="Select a school first" options={roleOptions} disabled={!selectedSchoolId} />
          </Form.Item>
        </div>

        <Form.Item
          label="Profile Avatar"
          name="avatar"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
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
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--primary-light)", color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Camera size={18} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13, fontWeight: 600, color: "var(--primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {avatarName || "Click to upload avatar"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {avatarName ? "Click to replace · PNG, JPG · Max 1 MB" : "PNG, JPG · Max 1 MB"}
                </div>
              </div>
            </div>
          </Upload>
        </Form.Item>

        <label className="reg-toggle-row">
          <span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              Activate account
            </span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              They can sign in straight away. Untick to create the account but keep it locked.
            </span>
          </span>
          <Form.Item name="isActive" valuePropName="checked" noStyle>
            <Checkbox />
          </Form.Item>
        </label>

        <button type="submit" className="reg-btn reg-btn-primary" style={{ width: "100%" }} disabled={saving}>
          {saving ? (
            <>
              <Loader2 size={14} className="spin" /> Creating…
            </>
          ) : (
            "Create School Admin"
          )}
        </button>
      </Form>
    </div>
  );
};

export default RegisterSchoolAdminForm;
