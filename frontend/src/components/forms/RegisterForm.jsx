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
import { registerUser, resetState ,fetchAllUser} from "../../features/authSlice";

const { Text } = Typography;

const EXCLUDED_ROLES_FOR_SCHOOL_ADMIN = [
  "super admin",
  "school admin",
  "student",
  "parent",
];

const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

const RegisterForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { Loading, error, user, success } = useSelector(
    (state) => state.auth
  );

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;
  const isSuperAdmin = currentUserRole === "super admin";
  const isSchoolAdmin = currentUserRole === "school admin";
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ FIX: avatar must be array
  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleId: undefined,
    schoolId: isSchoolAdmin ? currentSchoolId : undefined,
    isActive: false,
    avatar: [], // ✅ IMPORTANT FIX
  };

  useEffect(() => {
    if (!schools?.length) dispatch(fetchSchools());
    if (!roles?.length) dispatch(fetchRoles());
  }, [dispatch, schools, roles]);

  useEffect(() => {
    if (isSchoolAdmin && currentSchoolId) {
      form.setFieldValue("schoolId", currentSchoolId);
    }
  }, [isSchoolAdmin, currentSchoolId, form]);

  const filteredRoles = useMemo(() => {
    if (!roles?.length || !currentUserRole) return [];

    if (isSuperAdmin) {
      return roles.filter(
        (r) => r.name.toLowerCase() === "school admin"
      );
    }

    if (isSchoolAdmin) {
      return roles.filter(
        (r) =>
          !EXCLUDED_ROLES_FOR_SCHOOL_ADMIN.includes(
            r.name.toLowerCase()
          )
      );
    }

    return [];
  }, [roles, currentUserRole, isSuperAdmin, isSchoolAdmin]);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })),
    [schools]
  );

  const roleOptions = useMemo(
    () => filteredRoles.map((r) => ({ value: r._id, label: r.name })),
    [filteredRoles]
  );

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

  const handleAvatarUpload = useCallback((file) => {
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return Upload.LIST_IGNORE;
    }
    return false;
  }, []);

  // ✅ FINAL SUBMIT
  const onFinish = useCallback(
    (values) => {
      const payload = {
        ...values,
        schoolId: isSchoolAdmin
          ? currentSchoolId
          : values.schoolId,
      };

      delete payload.confirmPassword;

      dispatch(registerUser(payload));
    
    },
    [dispatch, isSchoolAdmin, currentSchoolId]
  );
  useEffect(() => {
    if (success) {
      setSuccessMessage("User registered successfully ✅");

      form.resetFields(); // ✅ form reset

      const timer = setTimeout(() => {
        setSuccessMessage("");
        dispatch(resetState()); // ✅ redux reset
        onClose?.(); // ✅ modal close (optional)
      }, 1500);

      return () => clearTimeout(timer);

    }
  }, [success, dispatch, form, onClose]);
  return (
    <>
      <Text type="secondary">Create user account</Text>

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
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, min: 6 }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value ||
                  getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(
                    new Error("Passwords do not match")
                  );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        {isSuperAdmin && (
          <Form.Item
            label="School"
            name="schoolId"
            rules={[{ required: true }]}
          >
            <Select options={schoolOptions} />
          </Form.Item>
        )}

        <Form.Item
          label="Role"
          name="roleId"
          rules={[{ required: true }]}
        >
          <Select options={roleOptions} />
        </Form.Item>

        {/* ✅ Avatar Upload */}
        <Form.Item
          label="Avatar"
          name="avatar"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
        >
          <Upload
            beforeUpload={handleAvatarUpload}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>
              Upload Avatar
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Active User</Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={Loading}
          block
        >
          Register User
        </Button>
      </Form>
    </>
  );
};

export default RegisterForm;