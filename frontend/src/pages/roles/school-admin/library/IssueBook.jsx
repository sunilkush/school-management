import React, { useCallback, useEffect, useMemo } from "react";
import {
  Layout,
  Breadcrumb,
  Form,
  DatePicker,
  Select,
  Table,
  Button,
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
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteIssuedBook,
  fetchIssuedBooks,
  fetchLibraryBooks,
  fetchLibraryStudents,
  issueLibraryBook,
  returnLibraryBook,
} from "../../../../features/librarySlice";

const { Content } = Layout;
const { Option } = Select;

const normalizeIssuedRecord = (entry) => ({
  key: entry._id,
  _id: entry._id,
  studentId: entry.studentId?._id || entry.studentId,
  studentName: entry.studentName || entry.studentEmail || "Unknown",
  bookId: entry.bookId?._id || entry.bookId,
  bookTitle: entry.bookId?.title || "Unknown",
  issueDate: entry.issueDate ? dayjs(entry.issueDate).format("DD-MM-YYYY") : "-",
  returnDate: entry.returnDate ? dayjs(entry.returnDate).format("DD-MM-YYYY") : "-",
  status: entry.status || "Issued",
});

const IssueBook = () => {
  const dispatch = useDispatch();
  const [issueForm] = Form.useForm();
  const [returnForm] = Form.useForm();

  const { user } = useSelector((state) => state.auth || {});
  const {
    books = [],
    issuedBooks: rawIssuedBooks = [],
    students = [],
    booksLoading,
    issuedLoading,
    studentsLoading,
    actionLoading,
  } = useSelector((state) => state.library || {});

  const schoolId = user?.school?._id || user?.schoolId;

  const issuedBooks = useMemo(
    () => rawIssuedBooks.map(normalizeIssuedRecord),
    [rawIssuedBooks]
  );

  const fetchSeedData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchLibraryBooks()).unwrap(),
        dispatch(fetchIssuedBooks()).unwrap(),
        schoolId
          ? dispatch(fetchLibraryStudents({ schoolId, limit: 100 })).unwrap()
          : Promise.resolve(),
      ]);
    } catch (error) {
      message.error(error || "Failed to load issue/return data");
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    fetchSeedData();
  }, [fetchSeedData]);

  const handleIssueBook = async (values) => {
    if (!schoolId) {
      message.error("School context not found. Please re-login.");
      return;
    }

    const payload = {
      schoolId,
      studentId: values.studentId,
      bookId: values.bookId,
      issueDate: values.issueDate?.toISOString(),
      dueDate: values.returnDate?.toISOString(),
    };

    try {
      await dispatch(issueLibraryBook(payload)).unwrap();
      message.success("Book issued successfully");
      issueForm.resetFields();
      fetchSeedData();
    } catch (error) {
      message.error(error || "Unable to issue book");
    }
  };

  const handleReturnBook = async (values) => {
    try {
      await dispatch(returnLibraryBook(values.issueId)).unwrap();
      message.success("Book returned successfully");
      returnForm.resetFields();
      fetchSeedData();
    } catch (error) {
      message.error(error || "Unable to return book");
    }
  };

  const handleDelete = async (issueId) => {
    try {
      await dispatch(deleteIssuedBook(issueId)).unwrap();
      message.success("Record deleted");
      fetchSeedData();
    } catch (error) {
      message.error(error || "Unable to delete record");
    }
  };

  const columns = [
    { title: "Student", dataIndex: "studentName" },
    { title: "Book", dataIndex: "bookTitle" },
    { title: "Issue Date", dataIndex: "issueDate" },
    { title: "Return Date", dataIndex: "returnDate" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const normalized = String(status || "").toLowerCase();
        return normalized === "issued" ? (
          <Tag color="orange">Issued</Tag>
        ) : (
          <Tag color="green">Returned</Tag>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          danger
          type="link"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record._id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  const issuedOnlyRecords = useMemo(
    () => issuedBooks.filter((book) => String(book.status || "").toLowerCase() === "issued"),
    [issuedBooks]
  );

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#f5f7fa" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Library</Breadcrumb.Item>
        <Breadcrumb.Item>Issue / Return Book</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="📘 Issue Book" bordered={false} style={{ borderRadius: 12 }}>
              <Form form={issueForm} layout="vertical" onFinish={handleIssueBook}>
                <Form.Item
                  label="Student"
                  name="studentId"
                  rules={[{ required: true, message: "Please select student" }]}
                >
                  <Select
                    placeholder="Select student"
                    showSearch
                    optionFilterProp="children"
                    loading={studentsLoading}
                  >
                    {students.map((student) => {
                      const resolvedStudentId =
                        student?.studentId ||
                        student?.student?._id ||
                        student?._id;
                      const label =
                        student?.userDetails?.name ||
                        student?.user?.name ||
                        student?.studentName ||
                        student?.registrationNumber;

                      return (
                        <Option
                          key={resolvedStudentId}
                          value={resolvedStudentId}
                        >
                          {label}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Book Title"
                  name="bookId"
                  rules={[{ required: true, message: "Please select book" }]}
                >
                  <Select
                    placeholder="Select book"
                    showSearch
                    optionFilterProp="children"
                    loading={booksLoading}
                  >
                    {books.map((book) => (
                      <Option key={book._id} value={book._id}>
                        {book.title}
                      </Option>
                    ))}
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
                  loading={actionLoading}
                >
                  Issue Book
                </Button>
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="📗 Return Book" bordered={false} style={{ borderRadius: 12 }}>
              <Form form={returnForm} layout="vertical" onFinish={handleReturnBook}>
                <Form.Item
                  label="Issued Book Record"
                  name="issueId"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select issued book" showSearch optionFilterProp="children">
                    {issuedOnlyRecords.map((book) => (
                      <Option key={book._id} value={book._id}>
                        {book.studentName} - {book.bookTitle}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  icon={<RollbackOutlined />}
                  block
                  loading={actionLoading}
                >
                  Return Book
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>

        <Card title="📋 Issued Book Records" style={{ marginTop: 24, borderRadius: 12 }} bordered={false}>
          <Table
            columns={columns}
            dataSource={issuedBooks}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            loading={issuedLoading || actionLoading}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default IssueBook;