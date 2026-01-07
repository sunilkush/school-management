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
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import {
  registerUser,
  resetAuthState,
  fetchAllUser,
} from "../../features/authSlice";

const { Title, Text } = Typography;

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
        currentUserRole !== "super admin" ? currentSchoolId || "" : "",
      isActive: false,
      avatar: null,
    }),
    [currentUserRole, currentSchoolId]
  );

  const [filteredRoles, setFilteredRoles] = useState([]);
  const [message, setMessage] = useState("");

  // 🔹 Fetch base data
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRoles());
  }, [dispatch]);

  // 🔹 Filter roles
  useEffect(() => {
    let updatedRoles = [];

    if (currentUserRole === "super admin") {
      updatedRoles = roles.filter(
        (role) =>
          role.name.toLowerCase() === "school admin"
      );
    } else if (currentUserRole === "school admin") {
      updatedRoles = roles.filter(
        (role) =>
          !["super admin", "school admin", "student", "parent"].includes(
            role.name.toLowerCase()
          )
      );
    }

    setFilteredRoles(updatedRoles);
  }, [roles, currentUserRole]);

  // 🔹 Success handling
  useEffect(() => {
    if (success) {
      setMessage("🎉 User registered successfully!");
      form.resetFields();
      dispatch(fetchAllUser());

      setTimeout(() => {
        setMessage("");
        dispatch(resetAuthState());
        onClose?.();
      }, 2000);
    }
  }, [success, dispatch, form, onClose]);

  // 🔹 Avatar resize & validation
  const handleAvatarUpload = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 1024 * 1024) {
        reject("Image must be under 1MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 50;
          canvas.height = 50;
          canvas.getContext("2d").drawImage(img, 0, 0, 50, 50);

          canvas.toBlob((blob) => {
            if (!blob || blob.size > 50 * 1024) {
              reject("Image too large after resize");
              return;
            }
            resolve(
              new File([blob], file.name, { type: file.type })
            );
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 🔹 Submit
  const onFinish = async (values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "avatar" && value) {
        formData.append("avatar", value.file.originFileObj);
      } else {
        formData.append(key, value);
      }
    });

    dispatch(registerUser(formData));
  };

  return (
    <>
      <Title level={4} style={{ textAlign: "center" }}>
        Register User
      </Title>

      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: 16 }}
      >
        Create staff account for your school
      </Text>

      {message && <Alert type="success" message={message} showIcon />}
      {error && <Alert type="error" message={error} showIcon />}

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
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true },
            { type: "email", message: "Enter valid email" },
          ]}
        >
          <Input placeholder="Email address" />
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
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject("Passwords do not match");
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        {currentUserRole === "super admin" && (
          <Form.Item
            label="School"
            name="schoolId"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select school">
              {schools.map((school) => (
                <Select.Option key={school._id} value={school._id}>
                  {school.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="Role"
          name="roleId"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select role">
            {filteredRoles.map((role) => (
              <Select.Option key={role._id} value={role._id}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Avatar"
          name="avatar"
          valuePropName="file"
        >
          <Upload
            beforeUpload={handleAvatarUpload}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Upload Avatar</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Active User</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
          >
            Register User
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default RegisterForm;
