import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined, SafetyOutlined } from "@ant-design/icons";
import { createRole } from "../../features/roleSlice";
import { fetchSchools } from "../../features/schoolSlice";

const { Title, Text } = Typography;
const { Option } = Select;

/* ================= MODULES & ACTIONS ================= */
const moduleOptions = [
  "Schools","Users","Teachers","Students","Parents","Classes","Subjects","Exams",
  "Attendance","Finance","Settings","Fees","Reports","Hostel","Transport","Assignments",
  "Timetable","Notifications","Expenses","Library","Books","IssuedBooks","Rooms","Routes","Vehicles"
];

const actionOptions = [
  "create","read","update","delete","export","assign","collect","return"
];

const roleOptions = [
  "School Admin","Principal","Vice Principal","Teacher","Student","Parent",
  "Accountant","Staff","Librarian","Hostel Warden","Transport Manager",
  "Exam Coordinator","Receptionist","IT Support","Counselor","Subject Coordinator", "support staff","security"
];

const AddRoleForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { schools } = useSelector((state) => state.school);
  const { loading } = useSelector((state) => state.role);

  /* ================= FETCH SCHOOLS ================= */
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  /* ================= ROLE CHANGE ================= */
  const handleRoleChange = (value) => {
    form.setFieldsValue({ name: value, permissions: [] });

    if (value === "School Admin") {
      const fullPermissions = moduleOptions.map((m) => ({
        module: m,
        actions: [...actionOptions],
      }));
      form.setFieldsValue({ permissions: fullPermissions });
    }
  };

  /* ================= SUBMIT ================= */
  const onFinish = async (values) => {
    if (values.name !== "Super Admin" && !values.schoolId) {
      return message.warning("Please select a school");
    }

    const payload = {
      ...values,
      code:
        values.code ||
        values.name.toUpperCase().replace(/\s+/g, "_"),
      schoolId:
        values.name !== "Super Admin" ? values.schoolId : null,
    };

    try {
      await dispatch(createRole(payload)).unwrap();
      message.success("Role created successfully");
      form.resetFields();
    } catch (err) {
      message.error(err,"Failed to create role");
    }
  };

  return (
    <Card
      className="rounded-2xl shadow-sm"
      style={{ maxWidth: 1000, margin: "0 auto" }}
    >
      {/* ================= HEADER ================= */}
      <Space align="center" className="mb-2">
        <SafetyOutlined style={{ fontSize: 28, color: "#1677ff" }} />
        <div>
          <Title level={4} className="!mb-0">
            Create Role & Permissions
          </Title>
          <Text type="secondary">
            Define access control and responsibilities
          </Text>
        </div>
      </Space>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: "custom",
          level: 1,
          isActive: true,
          permissions: [],
        }}
        onFinish={onFinish}
      >
        {/* ================= BASIC INFO ================= */}
        <Title level={5}>Role Information</Title>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item
              label="Role Name"
              name="name"
              rules={[{ required: true, message: "Select a role" }]}
            >
              <Select
                placeholder="Select role"
                onChange={handleRoleChange}
              >
                {roleOptions.map((r) => (
                  <Option key={r} value={r}>{r}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item label="Role Code" name="code">
              <Input placeholder="AUTO GENERATED (optional)" />
            </Form.Item>
          </Col>

          <Col md={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} placeholder="Role description" />
            </Form.Item>
          </Col>
        </Row>

        {/* ================= META ================= */}
        <Row gutter={16}>
          <Col md={8}>
            <Form.Item label="Type" name="type">
              <Select>
                <Option value="system">System</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col md={8}>
            <Form.Item label="Hierarchy Level" name="level">
              <Input type="number" min={1} />
            </Form.Item>
          </Col>

          <Col md={8}>
            <Form.Item
              label="Active"
              name="isActive"
              valuePropName="checked"
            >
              <Checkbox>Enabled</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        {/* ================= SCHOOL ================= */}
        <Form.Item
          shouldUpdate={(p, c) => p.name !== c.name}
          noStyle
        >
          {({ getFieldValue }) =>
            getFieldValue("name") &&
            getFieldValue("name") !== "Super Admin" && (
              <Form.Item
                label="School"
                name="schoolId"
                rules={[{ required: true, message: "Select school" }]}
              >
                <Select placeholder="Select school">
                  {schools?.map((s) => (
                    <Option key={s._id} value={s._id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )
          }
        </Form.Item>

        <Divider />

        {/* ================= PERMISSIONS ================= */}
        <Title level={5}>Module Permissions</Title>

        <Form.List name="permissions">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  className="mb-3"
                  title={`Permission ${name + 1}`}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  }
                >
                  <Row gutter={16}>
                    <Col md={8}>
                      <Form.Item
                        label="Module"
                        name={[name, "module"]}
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select module">
                          {moduleOptions.map((m) => (
                            <Option key={m} value={m}>{m}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col md={16}>
                      <Form.Item label="Actions" name={[name, "actions"]}>
                        <Checkbox.Group>
                          <Row>
                            {actionOptions.map((a) => (
                              <Col span={8} key={a}>
                                <Checkbox value={a}>{a}</Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add()}
                block
              >
                Add Permission
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        {/* ================= ACTION ================= */}
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          className="w-full"
        >
          Create Role
        </Button>
      </Form>
    </Card>
  );
};

export default AddRoleForm;
