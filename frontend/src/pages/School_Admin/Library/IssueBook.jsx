import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Col, DatePicker, Empty, Form, Input, Modal,
  Popconfirm, Row, Select, Spin, Table, Tag, message,
} from "antd";
import {
  AlertOutlined, BookOutlined, CheckCircleOutlined,
  DeleteOutlined, FileTextOutlined,
  PlusOutlined, RollbackOutlined, SearchOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
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
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;

const STATUS_COLORS = {
  Issued:   { color: "#F59E0B", bg: "rgba(254,243,199,0.25)" },
  Returned: { color: "#22C55E", bg: "#d1fae5" },
  Overdue:  { color: "#EF4444", bg: "rgba(254,226,226,0.2)" },
  Lost:     { color: "#14B8A6", bg: "rgba(20,184,166,0.2)" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { color: "#64748B", bg: "#f1f5f9" };
  return (
    <span style={{ ...pill(s.color, s.bg), whiteSpace: "nowrap" }}>{status}</span>
  );
};

const IssueBook = () => {
  const dispatch = useDispatch();
  const [issueForm] = Form.useForm();
  const [returnForm] = Form.useForm();

  const { user } = useSelector((s) => s.auth || {});
  const {
    books = [], issuedBooks: raw = [], students = [],
    booksLoading, issuedLoading, studentsLoading, actionLoading,
  } = useSelector((s) => s.library || {});

  const schoolId = user?.school?._id || user?.schoolId;

  /* ── extra member lists ─────────────────────────────────────────── */
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [memberType, setMemberType] = useState("Student");
  const [searchText, setSearchText] = useState("");

  /* ── return modal ─────────────────────────────────────────────────- */
  const [returnModal, setReturnModal] = useState(false);
  const [returningRecord, setReturningRecord] = useState(null);
  const [returnStatus, setReturnStatus] = useState("Returned");

  /* ── fetch all users (Teachers / Staff) ─────────────────────────── */
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get("/user/all");
      setAllUsers(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      /* silent */
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchLibraryBooks()).unwrap(),
        dispatch(fetchIssuedBooks()).unwrap(),
        schoolId
          ? dispatch(fetchLibraryStudents({ schoolId, limit: 300 })).unwrap()
          : Promise.resolve(),
        loadUsers(),
      ]);
    } catch (e) {
      message.error(e || "Failed to load data");
    }
  }, [dispatch, schoolId, loadUsers]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── normalise issued rows ─────────────────────────────────────── */
  const issuedRows = useMemo(() =>
    raw.map((e) => ({
      key: e._id, _id: e._id,
      borrowerName: e.borrowerName || e.studentName || e.issuedToUserId?.name || "Unknown",
      memberType:   e.memberType || "Student",
      bookTitle:    e.bookId?.title || "Unknown",
      bookId:       e.bookId?._id || e.bookId,
      issueDate:    e.issueDate ? dayjs(e.issueDate).format("DD MMM YYYY") : "-",
      dueDate:      e.dueDate   ? dayjs(e.dueDate).format("DD MMM YYYY")   : "-",
      dueDateRaw:   e.dueDate,
      status:       e.status || "Issued",
      fine:         e.fine || 0,
      fineStatus:   e.fineStatus || "Pending",
    })), [raw]);

  const filteredRows = useMemo(() => {
    const q = searchText.toLowerCase();
    return issuedRows.filter((r) =>
      r.borrowerName.toLowerCase().includes(q) ||
      r.bookTitle.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }, [issuedRows, searchText]);

  const activeIssued = useMemo(() =>
    issuedRows.filter((r) => r.status === "Issued" || r.status === "Overdue"),
    [issuedRows]);

  /* ── member options based on memberType ─────────────────────────── */
  const memberOptions = useMemo(() => {
    if (memberType === "Student") {
      return students.map((s) => {
        const id   = s?.studentId || s?.student?._id || s?._id;
        const name = s?.userDetails?.name || s?.user?.name || s?.studentName || s?.registrationNumber;
        return { value: id, label: name };
      });
    }
    const roles = memberType === "Teacher" ? ["Teacher"] : ["Staff", "Accountant", "HR"];
    return allUsers.filter((u) => roles.includes(u.role?.name)).map((u) => ({ value: u._id, label: u.name }));
  }, [memberType, students, allUsers]);

  /* ── issue handler ──────────────────────────────────────────────── */
  const handleIssue = async (values) => {
    if (!schoolId) { message.error("School context missing — re-login."); return; }
    const payload = {
      schoolId,
      bookId:       values.bookId,
      memberType:   values.memberType,
      // The picker's value is a Student._id for members, a User._id for
      // teacher/staff — IssuedBook stores those under different fields
      // (studentId vs issuedToUserId), so route it to the right one.
      ...(values.memberType === "Student"
        ? { studentId: values.issuedToUserId }
        : { issuedToUserId: values.issuedToUserId }),
      issueDate:    values.issueDate?.toISOString(),
    };
    try {
      await dispatch(issueLibraryBook(payload)).unwrap();
      message.success("Book issued successfully");
      issueForm.resetFields();
      loadAll();
    } catch (e) {
      message.error(e || "Unable to issue book");
    }
  };

  /* ── open return modal ──────────────────────────────────────────── */
  const openReturn = (record) => {
    setReturningRecord(record);
    setReturnStatus("Returned");
    setReturnModal(true);
  };

  /* ── confirm return ─────────────────────────────────────────────── */
  const handleReturn = async () => {
    try {
      await dispatch(returnLibraryBook({ id: returningRecord._id, status: returnStatus })).unwrap();
      message.success(`Book marked as ${returnStatus}`);
      setReturnModal(false);
      setReturningRecord(null);
      loadAll();
    } catch (e) {
      message.error(e || "Unable to return book");
    }
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteIssuedBook(id)).unwrap();
      message.success("Record deleted");
      loadAll();
    } catch (e) {
      message.error(e || "Unable to delete record");
    }
  };

  /* ── summary counts ─────────────────────────────────────────────── */
  const summaryStats = useMemo(() => ({
    total:   issuedRows.length,
    issued:  issuedRows.filter((r) => r.status === "Issued").length,
    overdue: issuedRows.filter((r) => r.status === "Overdue").length,
    fines:   issuedRows.reduce((s, r) => s + (r.fineStatus === "Pending" ? r.fine : 0), 0),
  }), [issuedRows]);

  /* ── table columns ──────────────────────────────────────────────── */
  const columns = [
    {
      title: "Borrower",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.borrowerName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.memberType}</div>
        </div>
      ),
    },
    {
      title: "Book",
      dataIndex: "bookTitle",
      render: (t) => <span style={{ fontWeight: 500 }}>{t}</span>,
    },
    { title: "Issue Date", dataIndex: "issueDate", width: 110 },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      width: 110,
      render: (d, r) => (
        <span style={{ color: (r.status === "Overdue") ? "#EF4444" : "inherit", fontWeight: r.status === "Overdue" ? 700 : 400 }}>
          {d}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => <StatusBadge status={s} />,
    },
    {
      title: "Fine",
      width: 90,
      render: (_, r) => r.fine > 0 ? (
        <Tag color={r.fineStatus === "Paid" ? "green" : r.fineStatus === "Waived" ? "default" : "red"}>
          ₹{r.fine} {r.fineStatus !== "Pending" ? `(${r.fineStatus})` : ""}
        </Tag>
      ) : null,
    },
    {
      title: "Actions",
      width: 130,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4 }}>
          {(r.status === "Issued" || r.status === "Overdue") && (
            <Button
              size="small" type="primary" ghost
              icon={<RollbackOutlined />}
              onClick={() => openReturn(r)}
            >
              Return
            </Button>
          )}
          <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(r._id)} okText="Yes" cancelText="No">
            <Button size="small" danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("issue-tbl")}</style>
      <PageHeader
        title="Issue / Return Books"
        subtitle="Manage book circulation for students, teachers, and staff"
        icon={<BookOutlined />}
      />

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(150)}>
        {[
          { label: "Total Records", value: summaryStats.total,   icon: <FileTextOutlined />, color: "#0891b2" },
          { label: "Currently Issued", value: summaryStats.issued, icon: <BookOutlined />,   color: "#14B8A6" },
          { label: "Overdue",          value: summaryStats.overdue, icon: <AlertOutlined />, color: "#EF4444" },
          { label: "Pending Fines",    value: `₹${summaryStats.fines}`, icon: <RupeeIcon />, color: "#F59E0B" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Issue form ─────────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Issue a Book</div>
        <Form form={issueForm} layout="vertical" onFinish={handleIssue}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Member Type" name="memberType" initialValue="Student" rules={[{ required: true }]}>
                <Select onChange={(v) => { setMemberType(v); issueForm.setFieldValue("issuedToUserId", undefined); }}>
                  <Option value="Student">Student</Option>
                  <Option value="Teacher">Teacher</Option>
                  <Option value="Staff">Staff</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Member" name="issuedToUserId" rules={[{ required: true, message: "Select a member" }]}>
                <Select
                  showSearch
                  placeholder="Search member..."
                  optionFilterProp="label"
                  loading={studentsLoading || usersLoading}
                  options={memberOptions}
                  notFoundContent={<Empty description="No members found" />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Book" name="bookId" rules={[{ required: true, message: "Select a book" }]}>
                <Select
                  showSearch
                  placeholder="Search book title..."
                  optionFilterProp="children"
                  loading={booksLoading}
                  notFoundContent={<Empty description="No available books" />}
                >
                  {books.filter((b) => (b.availableCopies || 0) > 0).map((b) => (
                    <Option key={b._id} value={b._id}>
                      {b.title} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({b.availableCopies} left)</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Issue Date" name="issueDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} style={{ display: "flex", alignItems: "flex-end" }}>
              <Form.Item style={{ width: "100%", marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block loading={actionLoading}>
                  Issue Book
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* ── Records table ──────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Issue Records</div>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search borrower, book, status..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />
        </div>
        <Table
          className="issue-tbl"
          rowKey="_id"
          columns={columns}
          dataSource={filteredRows}
          loading={issuedLoading || actionLoading}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "25", "50"] }}
          scroll={{ x: 800 }}
          rowClassName={(r) => r.status === "Overdue" ? "overdue-row" : ""}
          locale={{ emptyText: <Empty description="No issue records" /> }}
        />
      </div>

      {/* ── Return modal ────────────────────────────────────────────── */}
      <Modal
        title="Return / Mark Book"
        open={returnModal}
        onCancel={() => setReturnModal(false)}
        onOk={handleReturn}
        okText="Confirm"
        confirmLoading={actionLoading}
        destroyOnClose
      >
        {returningRecord && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...sectionPanel, padding: 14, marginBottom: 0 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{returningRecord.bookTitle}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Borrower: <strong>{returningRecord.borrowerName}</strong> &nbsp;|&nbsp;
                Due: <strong style={{ color: returningRecord.status === "Overdue" ? "#EF4444" : "inherit" }}>{returningRecord.dueDate}</strong>
              </div>
              {returningRecord.status === "Overdue" && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(254,226,226,0.2)", borderRadius: 8, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>
                  <AlertOutlined /> This book is overdue. Fine will be calculated on return.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Return Status</div>
              <Select value={returnStatus} onChange={setReturnStatus} style={{ width: "100%" }}>
                <Option value="Returned">
                  <CheckCircleOutlined style={{ color: "#22C55E", marginRight: 6 }} />
                  Returned — Book is back in good condition
                </Option>
                <Option value="Lost">
                  <AlertOutlined style={{ color: "#14B8A6", marginRight: 6 }} />
                  Lost — Borrower reports book is lost
                </Option>
              </Select>
            </div>

            {returnStatus === "Lost" && (
              <div style={{ padding: "8px 12px", background: "rgba(20,184,166,0.2)", borderRadius: 8, fontSize: 12, color: "#14B8A6", fontWeight: 600 }}>
                <RupeeIcon /> A lost book fine from library settings will be applied.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssueBook;
