import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar, Badge, Col, Empty, Input, Modal, Row, Select,
  Spin, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  BookOutlined, ClockCircleOutlined, SearchOutlined,
  TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIssuedBooks, fetchLibraryStudents,
} from "../../features/librarySlice";
import apiClient from "../../api/httpClient";
import PageHeader from "../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss,
} from "../../styles/pageStyles";

const { Text } = Typography;
const { Option } = Select;

const MEMBER_TYPE_COLORS = {
  Student: "#9B87B8",
  Teacher: "#0891b2",
  Staff:   "#5BA89A",
};

const LibraryMembers = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const {
    students = [], issuedBooks = [], studentsLoading, issuedLoading,
  } = useSelector((s) => s.library || {});

  const schoolId = user?.school?._id || user?.schoolId;

  /* ── extra users ─────────────────────────────────────────────────── */
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  /* ── filters ─────────────────────────────────────────────────────── */
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ── borrowing history modal ──────────────────────────────────────- */
  const [historyModal, setHistoryModal] = useState(false);
  const [historyMember, setHistoryMember] = useState(null);

  useEffect(() => {
    dispatch(fetchIssuedBooks());
    if (schoolId) dispatch(fetchLibraryStudents({ schoolId, limit: 500 }));

    setUsersLoading(true);
    apiClient.get("/user/all")
      .then((r) => setAllUsers(Array.isArray(r?.data?.data) ? r.data.data : []))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [dispatch, schoolId]);

  /* ── build unified member list ────────────────────────────────────- */
  const members = useMemo(() => {
    const list = [];

    // Students
    students.forEach((s) => {
      const id   = s?.userId || s?.studentId || s?.student?._id || s?._id;
      const name = s?.userDetails?.name || s?.user?.name || s?.studentName || "Unknown";
      const reg  = s?.registrationNumber || s?.admissionNumber || "-";
      list.push({ id, name, regNo: reg, type: "Student", email: s?.userDetails?.email || s?.email || "" });
    });

    // Teachers & Staff from allUsers
    allUsers
      .filter((u) => ["Teacher", "Staff", "Accountant", "HR"].includes(u.role))
      .forEach((u) => {
        list.push({ id: u._id, name: u.name, regNo: u.employeeId || "-", type: u.role === "Teacher" ? "Teacher" : "Staff", email: u.email || "" });
      });

    return list;
  }, [students, allUsers]);

  /* ── enrich with issue data ───────────────────────────────────────- */
  const enriched = useMemo(() => {
    const issuesByUser = {};
    issuedBooks.forEach((ib) => {
      const uid = ib.issuedToUserId?._id || ib.issuedToUserId || ib.studentId?._id || ib.studentId;
      if (!uid) return;
      if (!issuesByUser[uid]) issuesByUser[uid] = [];
      issuesByUser[uid].push(ib);
    });

    return members.map((m) => {
      const issues = issuesByUser[m.id] || [];
      const active = issues.filter((i) => i.status === "Issued" || i.status === "Overdue").length;
      const overdue = issues.filter((i) => i.status === "Overdue").length;
      const pendingFine = issues.reduce((s, i) => s + (i.fineStatus === "Pending" ? (i.fine || 0) : 0), 0);
      return { ...m, totalIssued: issues.length, activeIssued: active, overdueCount: overdue, pendingFine, history: issues };
    });
  }, [members, issuedBooks]);

  /* ── filtered rows ───────────────────────────────────────────────── */
  const rows = useMemo(() => {
    return enriched.filter((m) => {
      if (typeFilter !== "All" && m.type !== typeFilter) return false;
      if (statusFilter === "Active" && m.activeIssued === 0) return false;
      if (statusFilter === "Overdue" && m.overdueCount === 0) return false;
      if (statusFilter === "No Books" && m.activeIssued > 0) return false;
      const q = searchText.toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.regNo.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [enriched, typeFilter, statusFilter, searchText]);

  /* ── summary stats ───────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:   enriched.length,
    active:  enriched.filter((m) => m.activeIssued > 0).length,
    overdue: enriched.filter((m) => m.overdueCount > 0).length,
    fines:   enriched.reduce((s, m) => s + m.pendingFine, 0),
  }), [enriched]);

  /* ── borrowing history data ──────────────────────────────────────── */
  const historyRows = useMemo(() => {
    if (!historyMember) return [];
    return historyMember.history.map((ib) => ({
      key: ib._id,
      bookTitle:  ib.bookId?.title || "Unknown",
      issueDate:  ib.issueDate ? dayjs(ib.issueDate).format("DD MMM YYYY") : "-",
      dueDate:    ib.dueDate   ? dayjs(ib.dueDate).format("DD MMM YYYY")   : "-",
      returnDate: ib.returnDate ? dayjs(ib.returnDate).format("DD MMM YYYY") : "-",
      status:     ib.status,
      fine:       ib.fine || 0,
      fineStatus: ib.fineStatus || "Pending",
    }));
  }, [historyMember]);

  const historyColumns = [
    { title: "Book", dataIndex: "bookTitle", render: (t) => <Text strong>{t}</Text> },
    { title: "Issue Date", dataIndex: "issueDate", width: 110 },
    { title: "Due Date", dataIndex: "dueDate", width: 110, render: (d, r) => <span style={{ color: r.status === "Overdue" ? "#D96B7A" : "inherit" }}>{d}</span> },
    { title: "Return Date", dataIndex: "returnDate", width: 110 },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => {
        const map = { Issued: "orange", Returned: "green", Overdue: "red", Lost: "purple" };
        return <Tag color={map[s] || "default"}>{s}</Tag>;
      },
    },
    {
      title: "Fine",
      width: 90,
      render: (_, r) => r.fine > 0 ? (
        <Tag color={r.fineStatus === "Paid" ? "green" : r.fineStatus === "Waived" ? "default" : "red"}>
          ₹{r.fine} {r.fineStatus !== "Pending" ? `(${r.fineStatus})` : ""}
        </Tag>
      ) : <Text type="secondary">—</Text>,
    },
  ];

  /* ── main table columns ──────────────────────────────────────────── */
  const columns = [
    {
      title: "Member",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            style={{ background: MEMBER_TYPE_COLORS[r.type] || "#6B7890", flexShrink: 0 }}
            size={34}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.regNo}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 90,
      render: (t) => (
        <span style={{ ...pill(MEMBER_TYPE_COLORS[t] || "#6B7890", `${MEMBER_TYPE_COLORS[t] || "#6B7890"}18`) }}>
          {t}
        </span>
      ),
    },
    {
      title: "Active Books",
      dataIndex: "activeIssued",
      width: 110,
      sorter: (a, b) => a.activeIssued - b.activeIssued,
      render: (c, r) => (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Tag color={c > 0 ? "blue" : "default"}>{c}</Tag>
          {r.overdueCount > 0 && <Tag color="red">{r.overdueCount} overdue</Tag>}
        </div>
      ),
    },
    {
      title: "Total Issued",
      dataIndex: "totalIssued",
      width: 110,
      sorter: (a, b) => a.totalIssued - b.totalIssued,
    },
    {
      title: "Pending Fine",
      dataIndex: "pendingFine",
      width: 110,
      sorter: (a, b) => a.pendingFine - b.pendingFine,
      render: (f) => f > 0 ? <Tag color="red">₹{f}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      width: 120,
      render: (_, r) => {
        if (r.overdueCount > 0) return <Badge status="error" text={<span style={{ fontSize: 12, color: "#D96B7A", fontWeight: 600 }}>Overdue</span>} />;
        if (r.activeIssued > 0) return <Badge status="warning" text={<span style={{ fontSize: 12 }}>Active</span>} />;
        return <Badge status="default" text={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>No Books</span>} />;
      },
    },
    {
      title: "History",
      width: 80,
      render: (_, r) => (
        <Tooltip title="View borrowing history">
          <Tag
            color="blue"
            style={{ cursor: "pointer" }}
            onClick={() => { setHistoryMember(r); setHistoryModal(true); }}
            icon={<ClockCircleOutlined />}
          >
            View
          </Tag>
        </Tooltip>
      ),
    },
  ];

  const isLoading = studentsLoading || issuedLoading || usersLoading;

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("members-tbl")}</style>
      <PageHeader
        title="Library Members"
        subtitle="All borrowers with borrowing status and history"
        icon={<TeamOutlined />}
      />

      {/* ── KPI row ───────────────────────────────────────────────── */}
      <div style={statGrid(150)}>
        {[
          { label: "Total Members",   value: stats.total,   icon: <TeamOutlined />,      color: "#0891b2" },
          { label: "Active Borrowers", value: stats.active,  icon: <BookOutlined />,       color: "#9B87B8" },
          { label: "With Overdues",   value: stats.overdue, icon: <ClockCircleOutlined />, color: "#D96B7A" },
          { label: "Pending Fines",   value: `₹${stats.fines}`, icon: <BookOutlined />,   color: "#D4922A" },
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

      {/* ── Filters + Table ──────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name, reg no, email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }}>
            <Option value="All">All Types</Option>
            <Option value="Student">Student</Option>
            <Option value="Teacher">Teacher</Option>
            <Option value="Staff">Staff</Option>
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
            <Option value="All">All Status</Option>
            <Option value="Active">Active Borrowers</Option>
            <Option value="Overdue">Has Overdues</Option>
            <Option value="No Books">No Active Books</Option>
          </Select>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="members-tbl"
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ["15", "30", "50"] }}
            scroll={{ x: 800 }}
            locale={{ emptyText: <Empty description="No members found" /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Borrowing history modal ────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar style={{ background: MEMBER_TYPE_COLORS[historyMember?.type] || "#6B7890" }} icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 700 }}>{historyMember?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>{historyMember?.type} · {historyMember?.regNo}</div>
            </div>
          </div>
        }
        open={historyModal}
        onCancel={() => { setHistoryModal(false); setHistoryMember(null); }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {historyMember && (
          <div>
            <Row gutter={12} style={{ marginBottom: 16 }}>
              {[
                { label: "Total Borrowed",  value: historyMember.totalIssued },
                { label: "Currently Active", value: historyMember.activeIssued },
                { label: "Overdues",         value: historyMember.overdueCount },
                { label: "Pending Fine",     value: `₹${historyMember.pendingFine}` },
              ].map(({ label, value }) => (
                <Col xs={12} sm={6} key={label}>
                  <div style={{ textAlign: "center", padding: "10px 8px", background: "var(--bg-secondary, #F7F8FC)", borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <Table
              rowKey="key"
              columns={historyColumns}
              dataSource={historyRows}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 650 }}
              locale={{ emptyText: <Empty description="No borrowing history" /> }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LibraryMembers;
