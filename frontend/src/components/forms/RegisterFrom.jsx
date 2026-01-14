import { useEffect, useState, useMemo } from "react";
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
import {
  registerUser,
  resetAuthState,
  fetchAllUser,
} from "../../features/authSlice";

const { Text } = Typography;

const RegisterForm = ({ onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error, user, success } = useSelector(
    (state) => state.auth
  );

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;

  const initialValues = useMemo(
    () => ({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleId: "",
      schoolId:
        currentUserRole === "school admin" ? currentSchoolId : undefined,
      isActive: false,
      avatar: null,
    }),
    [currentUserRole, currentSchoolId]
  );

  const [filteredRoles, setFilteredRoles] = useState([]);
  const [message, setMessage] = useState("");

  /* ✅ FIX 1: API only if data not present */
  useEffect(() => {
    if (!schools || schools.length === 0) {
      dispatch(fetchSchools());
    }
    if (!roles || roles.length === 0) {
      dispatch(fetchRoles());
    }
  }, [dispatch, schools?.length, roles?.length]);

  /* ✅ FIX 2: set school only once */
  useEffect(() => {
    if (currentUserRole === "school admin" && currentSchoolId) {
      form.setFieldsValue({ schoolId: currentSchoolId });
    }
  }, [currentUserRole, currentSchoolId]);

  /* ✅ FIX 3: role filtering without re-trigger */
  useEffect(() => {
    if (!roles?.length || !currentUserRole) return;

    if (currentUserRole === "super admin") {
      setFilteredRoles(
        roles.filter((r) => r.name.toLowerCase() === "school admin")
      );
    } else if (currentUserRole === "school admin") {
      setFilteredRoles(
        roles.filter(
          (r) =>
            !["super admin", "school admin", "student", "parent"].includes(
              r.name.toLowerCase()
            )
        )
      );
    }
  }, [roles, currentUserRole]);

  /* ✅ FIX 4: success logic safe */
  useEffect(() => {
    if (!success) return;

    setMessage("User registered successfully");
    form.resetFields();
    dispatch(fetchAllUser());

    const timer = setTimeout(() => {
      setMessage("");
      dispatch(resetAuthState());
      onClose?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [success]);

  const handleAvatarUpload = (file) => {
    if (file.size > 1024 * 1024) {
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onFinish = (values) => {
    const formData = new FormData();

    if (currentUserRole === "school admin") {
      values.schoolId = currentSchoolId;
    }

    Object.entries(values).forEach(([key, value]) => {
      if (key === "avatar" && value?.file) {
        formData.append("avatar", value.file.originFileObj);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    dispatch(registerUser(formData));
  };

  return (
    <>
      <Text type="secondary">Create user account</Text>

      {message && <Alert type="success" message={message} showIcon />}
      {error && <Alert type="error" message={error} showIcon />}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true }, { type: "email" }]}
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
                return !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject("Passwords do not match");
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        {currentUserRole === "super admin" && (
          <Form.Item label="School" name="schoolId" rules={[{ required: true }]}>
            <Select placeholder="Select school">
              {schools.map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="Role" name="roleId" rules={[{ required: true }]}>
          <Select placeholder="Select role">
            {filteredRoles.map((r) => (
              <Select.Option key={r._id} value={r._id}>
                {r.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Avatar" name="avatar">
          <Upload beforeUpload={handleAvatarUpload} maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Avatar</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Active User</Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Register User
        </Button>
      </Form>
    </>
  );
};

export default RegisterForm;
