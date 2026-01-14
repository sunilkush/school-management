import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Select, Button, Space, message, Card, Divider, Table, Modal } from "antd";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice.js"; // fetch students for dropdown
import axios from "axios";

const { Option } = Select;

const ParentsPage = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { schoolStudents = [] } = useSelector((state) => state.students || {});
  const { user } = useSelector((state) => state.auth || {});
  const schoolId = user?.school?._id;

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [parentsList, setParentsList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentsBySchoolId({ schoolId }));
    fetchParents();
  }, [dispatch, schoolId]);

  // Fetch parents for table
  const fetchParents = async () => {
    try {
      setTableLoading(true);
      const res = await axios.get(`/api/v1/parents?schoolId=${schoolId}`);
      setParentsList(res.data.parents || []);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch parents");
    } finally {
      setTableLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await axios.post("/api/v1/parents/register", {
        ...values,
        schoolId: user?.school?._id,
      });
      message.success("Parent registered successfully!");
      form.resetFields();
      setModalVisible(false);
      fetchParents(); // refresh table
    } catch (err) {
      message.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Assigned Student",
      key: "student",
      render: (_, record) => record.student?.userDetails?.name || "—",
    },
  ];

  return (
    <div className=" max-w-full mx-auto">
      <Card
        title="Parents List"
        extra={
          <Button type="primary" onClick={() => setModalVisible(true)}>
            Add Parent
          </Button>
        }
      >
        <Table
          dataSource={parentsList}
          columns={columns}
          rowKey={(record) => record._id}
          loading={tableLoading}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title="Register New Parent"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
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
            <Select placeholder="Select student" loading={!schoolStudents.length}>
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
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParentsPage;
