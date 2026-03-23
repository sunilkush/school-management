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
  Row,
  Col,
  Card,
  Tag,
} from "antd";
import {
  PlusOutlined,
  RollbackOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const IssueBook = () => {
  const [issueForm] = Form.useForm();
  const [returnForm] = Form.useForm();

  const [issuedBooks, setIssuedBooks] = useState([]);

  /* ================= ISSUE BOOK ================= */
  const handleIssueBook = (values) => {
    const newEntry = {
      key: Date.now(),
      studentName: values.studentName,
      bookTitle: values.bookTitle,
      issueDate: values.issueDate.format("DD-MM-YYYY"),
      returnDate: values.returnDate.format("DD-MM-YYYY"),
      status: "Issued",
    };

    setIssuedBooks([...issuedBooks, newEntry]);
    message.success("Book issued successfully");
    issueForm.resetFields();
  };

  /* ================= RETURN BOOK ================= */
  const handleReturnBook = (values) => {
    setIssuedBooks((prev) =>
      prev.map((book) =>
        book.key === values.issueId
          ? { ...book, status: "Returned" }
          : book
      )
    );
    message.success("Book returned successfully");
    returnForm.resetFields();
  };

  /* ================= TABLE ================= */
  const columns = [
    { title: "Student", dataIndex: "studentName" },
    { title: "Book", dataIndex: "bookTitle" },
    { title: "Issue Date", dataIndex: "issueDate" },
    { title: "Return Date", dataIndex: "returnDate" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "Issued" ? (
          <Tag color="orange">Issued</Tag>
        ) : (
          <Tag color="green">Returned</Tag>
        ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          danger
          type="link"
          icon={<DeleteOutlined />}
          onClick={() => {
            setIssuedBooks(issuedBooks.filter((b) => b.key !== record.key));
            message.success("Record deleted");
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#f5f7fa" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Library</Breadcrumb.Item>
        <Breadcrumb.Item>Issue / Return Book</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Row gutter={[24, 24]}>
          {/* ================= ISSUE BOOK ================= */}
          <Col xs={24} md={12}>
            <Card
              title="📘 Issue Book"
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <Form
                form={issueForm}
                layout="vertical"
                onFinish={handleIssueBook}
              >
                <Form.Item
                  label="Student Name"
                  name="studentName"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter student name" />
                </Form.Item>

                <Form.Item
                  label="Book Title"
                  name="bookTitle"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select book">
                    <Option value="Mathematics">Mathematics</Option>
                    <Option value="Science">Science</Option>
                    <Option value="English">English</Option>
                    <Option value="History">History</Option>
                  </Select>
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label="Issue Date"
                      name="issueDate"
                      rules={[{ required: true }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Expected Return Date"
                      name="returnDate"
                      rules={[{ required: true }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  block
                >
                  Issue Book
                </Button>
              </Form>
            </Card>
          </Col>

          {/* ================= RETURN BOOK ================= */}
          <Col xs={24} md={12}>
            <Card
              title="📗 Return Book"
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <Form
                form={returnForm}
                layout="vertical"
                onFinish={handleReturnBook}
              >
                <Form.Item
                  label="Issued Book Record"
                  name="issueId"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select issued book">
                    {issuedBooks
                      .filter((b) => b.status === "Issued")
                      .map((book) => (
                        <Option key={book.key} value={book.key}>
                          {book.studentName} - {book.bookTitle}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Return Date" name="actualReturnDate">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  icon={<RollbackOutlined />}
                  block
                >
                  Return Book
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* ================= TABLE ================= */}
        <Card
          title="📋 Issued Book Records"
          style={{ marginTop: 24, borderRadius: 12 }}
          bordered={false}
        >
          <Table
            columns={columns}
            dataSource={issuedBooks}
            pagination={{ pageSize: 5 }}
            rowKey="key"
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default IssueBook;
