import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Table,
  Space,
  message,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const IssueBook = () => {
  const [form] = Form.useForm();
  const [issuedBooks, setIssuedBooks] = useState([]);

  const handleIssueBook = (values) => {
    const newEntry = {
      key: issuedBooks.length + 1,
      studentName: values.studentName,
      bookTitle: values.bookTitle,
      issueDate: values.issueDate.format("DD-MM-YYYY"),
      returnDate: values.returnDate.format("DD-MM-YYYY"),
    };
    setIssuedBooks([...issuedBooks, newEntry]);
    message.success("Book issued successfully!");
    form.resetFields();
  };

  const columns = [
    {
      title: "Student Name",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Book Title",
      dataIndex: "bookTitle",
      key: "bookTitle",
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      key: "issueDate",
    },
    {
      title: "Return Date",
      dataIndex: "returnDate",
      key: "returnDate",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            danger
            onClick={() => {
              setIssuedBooks(issuedBooks.filter((b) => b.key !== record.key));
              message.success("Entry removed");
            }}
          >
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Library</Breadcrumb.Item>
        <Breadcrumb.Item>Issue Book</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Issue Book Form */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Issue a New Book</h2>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleIssueBook}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="Student Name"
              name="studentName"
              rules={[{ required: true, message: "Please enter student name" }]}
            >
              <Input placeholder="Enter student name" />
            </Form.Item>

            <Form.Item
              label="Book Title"
              name="bookTitle"
              rules={[{ required: true, message: "Please enter book title" }]}
            >
              <Select placeholder="Select a book" showSearch optionFilterProp="children">
                <Option value="Mathematics">Mathematics</Option>
                <Option value="Science">Science</Option>
                <Option value="English">English</Option>
                <Option value="History">History</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Issue Date"
              name="issueDate"
              rules={[{ required: true, message: "Please select issue date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Return Date"
              name="returnDate"
              rules={[{ required: true, message: "Please select return date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Issue Book
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Issued Books Table */}
        <div>
          <h2 style={{ marginBottom: 16 }}>Issued Books</h2>
          <Table
            columns={columns}
            dataSource={issuedBooks}
            pagination={{ pageSize: 5 }}
            rowKey="key"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default IssueBook;
