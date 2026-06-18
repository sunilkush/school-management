import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table, Button, Space, Input, Select, Tag, Modal, Form, message,
  Popconfirm, Row, Col, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined,
  ReloadOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createLibraryBook, deleteLibraryBook, fetchLibraryBooks, updateLibraryBook,
} from "../../../features/librarySlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableHeadCss, statCard, statLabel, statValue, statGrid,
  pill, emptyState, iconWell,
} from "../../../styles/pageStyles";

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

const STAT_META = [
  { key: "total",     label: "Total Books", color: "#9B87B8" },
  { key: "available", label: "Available",   color: "#5BA89A" },
  { key: "issued",    label: "Issued",      color: "#D96B7A" },
];

const Books = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [form] = Form.useForm();

  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { user } = useSelector((state) => state.auth || {});
  const { books: rawBooks = [], booksLoading, actionLoading } = useSelector((state) => state.library || {});

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

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

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
      const bySearch = !search ||
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

  const stats = useMemo(() => ({
    total:     books.length,
    available: books.filter((b) => b.quantity > 0).length,
    issued:    books.filter((b) => b.quantity === 0).length,
  }), [books]);

  const columns = [
    {
      title: "Book",
      dataIndex: "title",
      key: "title",
      render: (text, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{text}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.author}</div>
        </div>
      ),
    },
    { title: "Category", dataIndex: "category", key: "category",
      render: (v) => <span style={pill("#9B87B8", "rgba(205,180,219,0.2)")}>{v}</span>,
    },
    { title: "ISBN", dataIndex: "isbn", key: "isbn",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v || "—"}</span>,
    },
    {
      title: "Available",
      dataIndex: "quantity",
      key: "quantity",
      render: (q) => q > 0
        ? <span style={pill("#5BA89A", "#d1fae5")}>{q} / {books.find((b) => b.quantity === q)?.totalCopies ?? q}</span>
        : <span style={pill("#D96B7A", "rgba(255,202,212,0.2)")}>Out of stock</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => status === "Available"
        ? <span style={pill("#5BA89A", "#d1fae5")}>Available</span>
        : <span style={pill("#D4922A", "#fff7ed")}>Issued</span>,
    },
    {
      title: "Shelf",
      dataIndex: "shelfLocation",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v || "—"}</span>,
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit Book">
            <Button
              type="text" size="small" icon={<EditOutlined />} style={{ color: "#f59e0b" }}
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
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Tooltip title="Delete Book">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("books-table")}</style>

      <PageHeader
        title="Library Books"
        subtitle={`${selectedAcademicYear?.name ?? "Current Year"} · ${user?.school?.name ?? "School"}`}
        icon={<BookOutlined />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchBooks} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingBook(null); form.resetFields(); setIsModalOpen(true); }}>
              Add Book
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            {/* KPI stats */}
            <div className="stat-grid" style={statGrid(200)}>
              {STAT_META.map(({ key, label, color }) => (
                <div key={key} style={statCard({ color })}>
                  <div>
                    <div style={statLabel(color)}>{label}</div>
                    <div style={statValue(color)}>{stats[key]}</div>
                  </div>
                  <div style={{ fontSize: 28, color, opacity: 0.5 }}><BookOutlined /></div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Books
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                prefix={<SearchOutlined />}
                placeholder="Search book / author / ISBN"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260 }}
              />
              <Select
                allowClear
                placeholder="Category"
                style={{ width: 160 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
              >
                {categories.map((category) => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
              <Select
                allowClear
                placeholder="Status"
                style={{ width: 130 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="Available">Available</Option>
                <Option value="Issued">Issued</Option>
              </Select>
            </div>
          </div>

          {!booksLoading && filteredBooks.length === 0 ? (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={emptyState}>
                <BookOutlined style={{ fontSize: 36, color: "var(--text-muted)", marginBottom: 12, display: "block" }} />
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  {searchText || categoryFilter || statusFilter ? "No books match your filters" : "No books in the library yet"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {searchText || categoryFilter || statusFilter ? "Try clearing your filters" : 'Click "Add Book" to add the first book'}
                </div>
              </div>
            </div>
          ) : (
            <div className="books-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
              <Table
                columns={columns}
                dataSource={filteredBooks}
                rowKey="_id"
                loading={booksLoading || actionLoading}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showTotal: (total) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} books</span>,
                }}
                scroll={{ x: 800 }}
                locale={{ emptyText: "No books found" }}
              />
            </div>
          )}
        </div>

        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconWell("var(--primary)", 34)}><BookOutlined /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                  {editingBook ? "Edit Book" : "Add Book"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the book details</div>
              </div>
            </div>
          }
          open={isModalOpen}
          confirmLoading={actionLoading}
          onCancel={() => { setIsModalOpen(false); setEditingBook(null); form.resetFields(); }}
          onOk={() => form.submit()}
          okText="Save"
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="title" label="Book Title" rules={[{ required: true }]}>
                  <Input placeholder="Enter title" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="author" label="Author" rules={[{ required: true }]}>
                  <Input placeholder="Enter author" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Input placeholder="Enter category" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="publisher" label="Publisher" rules={[{ required: true }]}>
                  <Input placeholder="Enter publisher" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="isbn" label="ISBN" rules={[{ required: true }]}>
                  <Input placeholder="Enter ISBN" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="shelfLocation" label="Shelf Location" rules={[{ required: true }]}>
                  <Input placeholder="e.g. A-01" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="totalCopies" label="Total Copies" rules={[{ required: true }]}>
                  <Input type="number" min={1} placeholder="Total copies" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="availableCopies" label="Available Copies" rules={[{ required: true }]}>
                  <Input type="number" min={0} placeholder="Available copies" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default Books;
