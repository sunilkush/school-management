import React, { useCallback, useEffect, useMemo } from "react";
import {
  Form,
  DatePicker,
  Select,
  Table,
  Button,
  message,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  RollbackOutlined,
  DeleteOutlined,
  BookOutlined,
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
} from "../../../features/librarySlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  tableHeadCss,
  pill,
} from "../../../styles/pageStyles";

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
          <span style={pill("#d97706", "#fef3c7")}>Issued</span>
        ) : (
          <span style={pill("#059669", "#d1fae5")}>Returned</span>
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
    <div style={pageWrapper}>
      <style>{tableHeadCss("issue-book-tbl")}</style>
      <PageHeader
        title="Issue / Return Book"
        subtitle="Manage book issue and return records"
        icon={<BookOutlined />}
      />

      <div style={{ padding: "20px" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Issue Book</div>
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
                        <Option key={resolvedStudentId} value={resolvedStudentId}>
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
                    <Form.Item label="Issue Date" name="issueDate" rules={[{ required: true }]}>
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Expected Return Date" name="returnDate" rules={[{ required: true }]}>
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
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Return Book</div>
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
            </div>
          </Col>
        </Row>

        <div style={{ ...pageCard, marginTop: 24, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Issued Book Records</div>
          <Table
            className="issue-book-tbl"
            columns={columns}
            dataSource={issuedBooks}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            loading={issuedLoading || actionLoading}
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
