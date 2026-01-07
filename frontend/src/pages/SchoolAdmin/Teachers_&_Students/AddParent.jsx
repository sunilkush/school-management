import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Select, Button, Space, message, Card, Divider } from "antd";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice.js"; // fetch students for dropdown
import axios from "axios";

const { Option } = Select;

const AddParent = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { schoolStudents = [] } = useSelector((state) => state.students || {});
  const { user } = useSelector((state) => state.auth || {});
  const schoolId = user?.school?._id;
  const [loading, setLoading] = useState(false);
   console.log("schoolStudents", schoolStudents);
  useEffect(() => {
    dispatch(fetchStudentsBySchoolId({ schoolId }));
  }, [dispatch, schoolId]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await axios.post("/api/v1/parents/register", {
        ...values,
        schoolId: user?.school?._id,
      });
      message.success("Parent registered successfully!");
      form.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card title="Register New Parent" bordered>
        <Divider />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Parent Name"
            name="name"
            rules={[{ required: true, message: "Please enter parent name" }]}
          >
            <Input placeholder="Enter parent's name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter valid email" },
            ]}
          >
            <Input placeholder="Enter parent's email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item label="Phone Number" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            label="Assign Student"
            name="studentId"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select
              placeholder="Select student"
              loading={!schoolStudents.length}
            >
              {schoolStudents.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.userDetails?.name || "—"} ({s.class?.name || "—"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Register Parent
              </Button>
              <Button htmlType="reset" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddParent;
