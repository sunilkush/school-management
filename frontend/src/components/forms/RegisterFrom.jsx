import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  Checkbox,
  Typography,
  Alert,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import { registerUser, resetState, fetchAllUser } from "../../features/authSlice";

const { Text } = Typography;

// ✅ Static outside component — never re-created on render
const EXCLUDED_ROLES_FOR_SCHOOL_ADMIN = ["super admin", "school admin", "student", "parent"];

// ✅ Avatar file size limit constant — easy to change in one place
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024; // 1MB

const RegisterForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error, user, success } = useSelector((state) => state.auth);

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;
  const isSuperAdmin = currentUserRole === "super admin";
  const isSchoolAdmin = currentUserRole === "school admin";

  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Stable initial values — memoized so Form doesn't reset on parent re-renders
  const initialValues = useMemo(
    () => ({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleId: undefined,
      schoolId: isSchoolAdmin ? currentSchoolId : undefined,
      isActive: false,
      avatar: [],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // ✅ Intentionally empty — initial values should only be set once on mount
  );

  // ✅ Fetch reference data only if not already loaded
  useEffect(() => {
    if (!schools?.length) dispatch(fetchSchools());
    if (!roles?.length) dispatch(fetchRoles());
  }, [dispatch,schools,roles]); 

  // ✅ Auto-set school for school admin
  useEffect(() => {
    if (isSchoolAdmin && currentSchoolId) {
      form.setFieldValue("schoolId", currentSchoolId);
    }
  }, [isSchoolAdmin, currentSchoolId, form]);

  // ✅ Derive filtered roles via useMemo instead of useState + useEffect
  const filteredRoles = useMemo(() => {
    if (!roles?.length || !currentUserRole) return [];

    if (isSuperAdmin) {
      return roles.filter((r) => r.name.toLowerCase() === "school admin");
    }

    if (isSchoolAdmin) {
      return roles.filter(
        (r) => !EXCLUDED_ROLES_FOR_SCHOOL_ADMIN.includes(r.name.toLowerCase())
      );
    }

    return [];
  }, [roles, currentUserRole, isSuperAdmin, isSchoolAdmin]);

  // ✅ School options memoized
  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })),
    [schools]
  );

  // ✅ Role options memoized
  const roleOptions = useMemo(
    () => filteredRoles.map((r) => ({ value: r._id, label: r.name })),
    [filteredRoles]
  );

  // ✅ Success: show message, reset, close
  useEffect(() => {
    if (!success) return;

    setSuccessMessage("User registered successfully");
    form.resetFields();
    dispatch(fetchAllUser());

    const timer = setTimeout(() => {
      setSuccessMessage("");
      dispatch(resetState());
      onClose?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [success, dispatch, form, onClose]);

  // ✅ Avatar: block oversized files from being added to the list
  const handleAvatarUpload = useCallback((file) => {
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return Upload.LIST_IGNORE; // silently blocks — add a message if UX needs it
    }
    return false; // prevent auto-upload, let form handle it
  }, []);

  // ✅ Submit: build FormData cleanly
  const onFinish = useCallback(
    (values) => {
      const formData = new FormData();

      // ✅ Always use Redux source of truth for schoolId — don't trust form value for school admin
      const payload = {
        ...values,
        schoolId: isSchoolAdmin ? currentSchoolId : values.schoolId,
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "avatar") {
          if (value?.length > 0) formData.append("avatar", value[0].originFileObj);
        } else if (key === "confirmPassword") {
          // ✅ Never send confirmPassword to the server
          return;
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      dispatch(registerUser(formData));
    },
    [dispatch, isSchoolAdmin, currentSchoolId]
  );

  return (
    <>
      <Text type="secondary">Create user account</Text>

      {/* Feedback alerts */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          showIcon
          style={{ marginTop: 12 }}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 12 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        {/* Full Name */}
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Please enter full name" }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        {/* Email */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        {/* Password */}
        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please enter a password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Min. 6 characters" />
        </Form.Item>

        {/* Confirm Password */}
        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords do not match")); // ✅ Error should be an Error object, not a string
              },
            }),
          ]}
        >
          <Input.Password placeholder="Re-enter password" />
        </Form.Item>

        {/* School — Super Admin only */}
        {isSuperAdmin && (
          <Form.Item
            label="School"
            name="schoolId"
            rules={[{ required: true, message: "Please select a school" }]}
          >
            <Select
              placeholder="Select school"
              options={schoolOptions}
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        )}

        {/* Role */}
        <Form.Item
          label="Role"
          name="roleId"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select
            placeholder="Select role"
            options={roleOptions}
            disabled={!filteredRoles.length}
          />
        </Form.Item>

        {/* Avatar */}
        <Form.Item
          label="Avatar"
          name="avatar"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
          extra="Max file size: 1MB"
        >
          <Upload
            beforeUpload={handleAvatarUpload}
            maxCount={1}
            accept="image/*" // ✅ Restrict file picker to images only
          >
            <Button icon={<UploadOutlined />}>Upload Avatar</Button>
          </Upload>
        </Form.Item>

        {/* Active status */}
        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Active User</Checkbox>
        </Form.Item>

        {/* Submit */}
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Register User
        </Button>
      </Form>
    </>
  );
};

export default RegisterForm;