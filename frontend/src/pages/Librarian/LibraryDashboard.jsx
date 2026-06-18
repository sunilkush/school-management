import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Badge, Col, Empty, Row, Spin, Table, Tag, Typography,
} from "antd";
import {
  BookOutlined, AlertOutlined, CheckCircleOutlined,
  ClockCircleOutlined, DollarOutlined, ReloadOutlined,
  FileTextOutlined, TeamOutlined, SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { fetchLibraryDashboard, fetchLibraryBooks, fetchIssuedBooks } from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell } from "../../styles/pageStyles";

dayjs.extend(relativeTime);

const { Text } = Typography;

/* ── KPI card ─────────────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, color, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      ...sectionPanel,
      display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
      marginBottom: 0, cursor: onClick ? "pointer" : "default",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
  >
    <div style={iconWell(color, 48)}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Quick action tile ────────────────────────────────────────────── */
const ActionTile = ({ icon, label, path, color, navigate }) => (
  <div
    onClick={() => navigate(path)}
    style={{
      ...sectionPanel, marginBottom: 0, padding: "16px 14px",
      textAlign: "center", cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
  >
    <div style={iconWell(color, 40, { margin: "0 auto 10px" })}>{icon}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
  </div>
);

/* ── Status tag ──────────────────────────────────────────────────── */
const StatusTag = ({ status }) => {
  const map = {
    Issued:   { color: "#d97706", bg: "#fef3c7" },
    Returned: { color: "#059669", bg: "#d1fae5" },
    Overdue:  { color: "#dc2626", bg: "#fee2e2" },
    Lost:     { color: "#7c3aed", bg: "#ede9fe" },
  };
  const s = map[status] || { color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 999 }}>
      {status}
    </span>
  );
};

/* ── Main component ──────────────────────────────────────────────── */
const LibraryDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { dashboard, dashboardLoading, books, issuedBooks, booksLoading } = useSelector((s) => s.library || {});

  useEffect(() => {
    dispatch(fetchLibraryDashboard());
    dispatch(fetchLibraryBooks());
    dispatch(fetchIssuedBooks());
  }, [dispatch]);

  /* ── derived stats ── */
  const stats = useMemo(() => {
    if (dashboard) return dashboard;
    // Fallback computed from raw slices
    const total   = books.length;
    const issued  = issuedBooks.filter((b) => b.status === "Issued").length;
    const overdue = issuedBooks.filter((b) => b.status === "Overdue").length;
    const avail   = books.reduce((s, b) => s + (b.availableCopies ?? 0), 0);
    return { totalBooks: total, issuedCount: issued, overdueCount: overdue, availableCopies: avail };
  }, [dashboard, books, issuedBooks]);

  /* ── category breakdown for pie ── */
  const categoryData = useMemo(() => {
    const map = {};
    books.forEach((b) => { map[b.category || "Other"] = (map[b.category || "Other"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [books]);

  /* ── monthly issue trend from issuedBooks ── */
  const monthlyTrend = useMemo(() => {
    const map = {};
    issuedBooks.forEach((r) => {
      const m = dayjs(r.issueDate || r.createdAt).format("MMM");
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).slice(-6).map(([month, count]) => ({ month, count }));
  }, [issuedBooks]);

  const PIE_COLORS = ["#7c3aed", "#0891b2", "#059669", "#f97316", "#dc2626", "#8b5cf6"];

  const recentActivity = stats?.recentActivity || issuedBooks.slice(0, 10).map((r) => ({
    _id: r._id, bookTitle: r.bookId?.title || "Unknown",
    borrower: r.borrowerName || r.studentName || "Unknown",
    status: r.status, issueDate: r.issueDate, dueDate: r.dueDate, fine: r.fine,
  }));

  const activityColumns = [
    {
      title: "Book",
      dataIndex: "bookTitle",
      render: (t) => <Text strong ellipsis style={{ maxWidth: 140 }}>{t}</Text>,
    },
    { title: "Borrower", dataIndex: "borrower",
      render: (n) => <Text style={{ fontSize: 12 }}>{n}</Text> },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "Due",
      dataIndex: "dueDate",
      render: (d) => d ? (
        <span style={{ fontSize: 11, color: new Date(d) < new Date() ? "#dc2626" : "var(--text-muted)" }}>
          {dayjs(d).format("DD MMM")}
        </span>
      ) : "—",
    },
    {
      title: "Fine",
      dataIndex: "fine",
      render: (f) => f > 0 ? <Tag color="red">₹{f}</Tag> : null,
    },
  ];

  if (dashboardLoading || booksLoading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <Spin size="large" tip="Loading library data..." />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Library Dashboard"
        subtitle="Real-time overview of book circulation, fines, and activity"
        icon={<BookOutlined />}
        extra={
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--primary)", fontSize: 13, fontWeight: 600 }}
            onClick={() => { dispatch(fetchLibraryDashboard()); dispatch(fetchLibraryBooks()); dispatch(fetchIssuedBooks()); }}
          >
            <ReloadOutlined /> Refresh
          </div>
        }
      />

      {/* ── KPI Row ─────────────────────────────────────────────── */}
      <div style={statGrid(170)}>
        <KpiCard icon={<BookOutlined />}          label="Total Books"     value={stats?.totalBooks ?? books.length}     color="#7c3aed" onClick={() => navigate("librarian/book-catalog")} />
        <KpiCard icon={<CheckCircleOutlined />}   label="Available Copies" value={stats?.availableCopies}              color="#059669" />
        <KpiCard icon={<FileTextOutlined />}       label="Currently Issued" value={stats?.issuedCount}                 color="#0891b2" onClick={() => navigate("librarian/issue-return")} />
        <KpiCard icon={<AlertOutlined />}          label="Overdue"          value={stats?.overdueCount}                color="#dc2626" sub={stats?.overdueCount > 0 ? "Needs attention" : undefined} onClick={() => navigate("librarian/overdue")} />
        <KpiCard icon={<DollarOutlined />}         label="Pending Fines"    value={stats?.pendingFinesAmount != null ? `₹${stats.pendingFinesAmount}` : "₹0"} color="#f97316" onClick={() => navigate("librarian/fines")} />
        <KpiCard icon={<TeamOutlined />}           label="Members"          value={stats?.totalMembers ?? "—"}         color="#8b5cf6" onClick={() => navigate("librarian/members")} />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Actions</div>
        <div style={statGrid(120)}>
          <ActionTile icon={<BookOutlined />}        label="Add Book"       path="librarian/book-catalog" color="#7c3aed" navigate={navigate} />
          <ActionTile icon={<FileTextOutlined />}     label="Issue Book"     path="librarian/issue-return" color="#0891b2" navigate={navigate} />
          <ActionTile icon={<AlertOutlined />}        label="Overdue Books"  path="librarian/overdue"      color="#dc2626" navigate={navigate} />
          <ActionTile icon={<DollarOutlined />}       label="Fine Management" path="librarian/fines"      color="#f97316" navigate={navigate} />
          <ActionTile icon={<TeamOutlined />}         label="Members"        path="librarian/members"      color="#059669" navigate={navigate} />
          <ActionTile icon={<ClockCircleOutlined />}  label="Reports"        path="librarian/reports"      color="#8b5cf6" navigate={navigate} />
          <ActionTile icon={<SettingOutlined />}      label="Settings"       path="librarian/settings"     color="#64748b" navigate={navigate} />
        </div>
      </div>

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 16 }}>Books by Category</div>
            {categoryData.length === 0 ? (
              <Empty description="No books yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} books`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 16 }}>Monthly Issue Trend</div>
            {monthlyTrend.length === 0 ? (
              <Empty description="No issue data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyTrend} barSize={28}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Books Issued" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Status summary tiles ────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: "Issued", count: issuedBooks.filter((b) => b.status === "Issued").length, color: "#d97706", bg: "#fef9c3" },
          { label: "Returned", count: issuedBooks.filter((b) => b.status === "Returned").length, color: "#059669", bg: "#d1fae5" },
          { label: "Overdue", count: issuedBooks.filter((b) => b.status === "Overdue").length, color: "#dc2626", bg: "#fee2e2" },
          { label: "Lost", count: issuedBooks.filter((b) => b.status === "Lost").length, color: "#7c3aed", bg: "#ede9fe" },
        ].map(({ label, count, color, bg }) => (
          <Col xs={12} sm={6} key={label}>
            <div style={{ background: bg, borderRadius: 12, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Recent Activity ──────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Recent Activity</div>
        <Table
          rowKey="_id"
          columns={activityColumns}
          dataSource={recentActivity}
          pagination={{ pageSize: 8, size: "small" }}
          scroll={{ x: 600 }}
          locale={{ emptyText: <Empty description="No recent activity" /> }}
          size="small"
        />
      </div>

      {/* ── Top Borrowed Books ───────────────────────────────────── */}
      {stats?.topBorrowedBooks?.length > 0 && (
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Top Borrowed Books</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topBorrowedBooks.map((book, i) => (
              <div key={book._id || i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{book.title}</div>
                </div>
                <Tag color="blue">{book.count} issued</Tag>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryDashboard;
