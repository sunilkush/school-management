import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Input,
  Select,
  Button,
  Modal,
  Form,
  InputNumber,
  Space,
  message,
} from "antd";
import { SearchOutlined, PlusOutlined, DollarOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const CollectFees = () => {
  const [students, setStudents] = useState([
    { key: 1, name: "John Doe", className: "10", section: "A", feeStatus: "Pending" },
    { key: 2, name: "Jane Smith", className: "9", section: "B", feeStatus: "Paid" },
    { key: 3, name: "Michael Brown", className: "10", section: "A", feeStatus: "Pending" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();
  const [searchName, setSearchName] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const handleCollectFee = () => {
    setStudents(
      students.map((student) =>
        student.key === selectedStudent.key
          ? { ...student, feeStatus: "Paid" }
          : student
      )
    );
    message.success(`Fee collected for ${selectedStudent.name}!`);
    form.resetFields();
    setModalVisible(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchName.toLowerCase()) &&
      (filterClass ? student.className === filterClass : true)
  );

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Class", dataIndex: "className", key: "className" },
    { title: "Section", dataIndex: "section", key: "section" },
    { title: "Fee Status", dataIndex: "feeStatus", key: "feeStatus" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          disabled={record.feeStatus === "Paid"}
          onClick={() => {
            setSelectedStudent(record);
            setModalVisible(true);
          }}
        >
          Collect Fee
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Finance</Breadcrumb.Item>
        <Breadcrumb.Item>Collect Fees</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Filters */}
        <div style={{ marginBottom: 16, display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by student name"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by class"
            style={{ width: 150 }}
            allowClear
            value={filterClass}
            onChange={(value) => setFilterClass(value)}
          >
            <Option value="9">9</Option>
            <Option value="10">10</Option>
            <Option value="11">11</Option>
            <Option value="12">12</Option>
          </Select>
        </div>

        {/* Students Table */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />

        {/* Collect Fee Modal */}
        <Modal
          title={`Collect Fee for ${selectedStudent?.name}`}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedStudent(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCollectFee}>
            <Form.Item
              label="Amount"
              name="amount"
              rules={[{ required: true, message: "Enter fee amount" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Enter amount"
                min={0}
                prefix="₹"
              />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedStudent(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  Collect
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default CollectFees;
