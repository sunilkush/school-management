import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createLibraryBook,
  deleteLibraryBook,
  fetchLibraryBooks,
  updateLibraryBook,
} from "../../../features/librarySlice";

const { Title, Text } = Typography;
const { Option } = Select;

const normalizeBook = (book) => ({
  key: book._id,
  _id: book._id,
  title: book.title || "",
  author: book.author || "",
  category: book.category || "General",
  quantity: Number(book.availableCopies ?? 0),
  totalCopies: Number(book.totalCopies ?? 0),
  isbn: book.isbn || "",
  publisher: book.publisher || "",
  shelfLocation: book.shelfLocation || "",
  status: Number(book.availableCopies ?? 0) > 0 ? "Available" : "Issued",
  schoolId: book.schoolId?._id || book.schoolId,
});

const Books = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [form] = Form.useForm();
    const {selectedAcademicYear} = useSelector((state) => state.academicYear || {});
  const { user } = useSelector((state) => state.auth || {});
  const { books: rawBooks = [], booksLoading, actionLoading } = useSelector(
    (state) => state.library || {}
  );

  const schoolId = user?.school?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const books = useMemo(() => rawBooks.map(normalizeBook), [rawBooks]);

  const fetchBooks = useCallback(async () => {
    try {
      await dispatch(fetchLibraryBooks()).unwrap();
    } catch (error) {
      message.error(error || "Failed to fetch books");
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSave = async (values) => {
    if (!schoolId && !editingBook?.schoolId) {
      message.error("School context not found. Please re-login.");
      return;
    }

    const payload = {
      title: values.title,
      author: values.author,
      category: values.category,
      publisher: values.publisher,
      isbn: values.isbn,
      totalCopies: Number(values.totalCopies),
      availableCopies: Number(values.availableCopies),
      shelfLocation: values.shelfLocation,
      schoolId: editingBook?.schoolId || schoolId,
      academicYearId: editingBook?.academicYearId || academicYearId || null,
    };

    try {
      if (editingBook?._id) {
        await dispatch(updateLibraryBook({ id: editingBook._id, payload })).unwrap();
        message.success("Book updated successfully");
      } else {
        await dispatch(createLibraryBook(payload)).unwrap();
        message.success("Book added successfully");
      }

      setIsModalOpen(false);
      setEditingBook(null);
      form.resetFields();
      fetchBooks();
    } catch (error) {
      message.error(error || "Unable to save book");
    }
  };

  const handleDelete = async (bookId) => {
    try {
      await dispatch(deleteLibraryBook(bookId)).unwrap();
      message.success("Book deleted");
      fetchBooks();
    } catch (error) {
      message.error(error || "Unable to delete book");
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const search = searchText.trim().toLowerCase();
      const bySearch =
        !search ||
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        book.isbn.toLowerCase().includes(search);

      const byCategory = !categoryFilter || book.category === categoryFilter;
      const byStatus = !statusFilter || book.status === statusFilter;

      return bySearch && byCategory && byStatus;
    });
  }, [books, searchText, categoryFilter, statusFilter]);

  const categories = useMemo(
    () => [...new Set(books.map((book) => book.category).filter(Boolean))],
    [books]
  );

  const columns = [
    {
      title: "Book Name",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    { title: "Author", dataIndex: "author", key: "author" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Available",
      dataIndex: "quantity",
      key: "quantity",
      render: (q) =>
        q > 0 ? <Tag color="green">{q}</Tag> : <Tag color="red">Out</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "Available" ? (
          <Tag color="green">Available</Tag>
        ) : (
          <Tag color="orange">Issued</Tag>
        ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Book">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditingBook(record);
                form.setFieldsValue({
                  title: record.title,
                  author: record.author,
                  category: record.category,
                  publisher: record.publisher,
                  isbn: record.isbn,
                  totalCopies: record.totalCopies,
                  availableCopies: record.quantity,
                  shelfLocation: record.shelfLocation,
                });
                setIsModalOpen(true);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this book?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Tooltip title="Delete Book">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle">
        <Title level={3}>
          <BookOutlined /> Library Books
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Book
        </Button>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Statistic title="Total Books" value={books.length} />
        </Col>
        <Col span={6}>
          <Statistic
            title="Available"
            value={books.filter((b) => b.quantity > 0).length}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Issued"
            value={books.filter((b) => b.quantity === 0).length}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ margin: "16px 0" }}>
        <Col span={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search book / author / ISBN"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Select
            allowClear
            placeholder="Category"
            style={{ width: "100%" }}
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            {categories.map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            allowClear
            placeholder="Status"
            style={{ width: "100%" }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="Available">Available</Option>
            <Option value="Issued">Issued</Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredBooks}
        rowKey="_id"
        bordered
        loading={booksLoading || actionLoading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "No books found" }}
      />

      <Modal
        title={editingBook ? "Edit Book" : "Add Book"}
        open={isModalOpen}
        confirmLoading={actionLoading}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingBook(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Book Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="author" label="Author" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="publisher" label="Publisher" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="isbn" label="ISBN" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="totalCopies" label="Total Copies" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="availableCopies"
            label="Available Copies"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="shelfLocation"
            label="Shelf Location"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Books;