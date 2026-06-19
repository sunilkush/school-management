import React, { useEffect, useMemo, useRef } from "react";
import {
  Button, Col, Empty, Progress, Row, Spin, Table, Tag, Typography,
} from "antd";
import {
  BookOutlined, DownloadOutlined, PrinterOutlined,
  FileTextOutlined, AlertOutlined, CheckCircleOutlined, DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIssuedBooks, fetchLibraryBooks, fetchFineSummary,
} from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss,
} from "../../styles/pageStyles";

const { Text } = Typography;
const PIE_COLORS = ["#14B8A6", "#0891b2", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6", "#F59E0B", "#14b8a6"];

const LibraryReports = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const { books = [], issuedBooks = [], fines, booksLoading, issuedLoading } = useSelector((s) => s.library || {});

  useEffect(() => {
    dispatch(fetchLibraryBooks());
    dispatch(fetchIssuedBooks());
    dispatch(fetchFineSummary());
  }, [dispatch]);

  /* ── main summary ────────────────────────────────────────────────── */
  const summary = useMemo(() => {
    const totalTitles      = books.length;
    const totalCopies      = books.reduce((s, b) => s + Number(b.totalCopies || 0), 0);
    const availableCopies  = books.reduce((s, b) => s + Number(b.availableCopies || 0), 0);
    const issuedActive     = issuedBooks.filter((b) => b.status === "Issued").length;
    const overdueCount     = issuedBooks.filter((b) => b.status === "Overdue").length;
    const returnedCount    = issuedBooks.filter((b) => b.status === "Returned").length;
    const lostCount        = issuedBooks.filter((b) => b.status === "Lost").length;
    const utilization      = totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0;
    const pendingFines     = issuedBooks.reduce((s, b) => s + (b.fineStatus === "Pending" ? (b.fine || 0) : 0), 0);

    return { totalTitles, totalCopies, availableCopies, issuedActive, overdueCount, returnedCount, lostCount, utilization, pendingFines };
  }, [books, issuedBooks]);

  /* ── category breakdown ──────────────────────────────────────────── */
  const categoryData = useMemo(() => {
    const map = {};
    books.forEach((b) => { map[b.category || "Uncategorized"] = (map[b.category || "Uncategorized"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [books]);

  /* ── top 10 borrowed books ───────────────────────────────────────── */
  const topBorrowed = useMemo(() => {
    const counts = {};
    issuedBooks.forEach((ib) => {
      const title = ib.bookId?.title || "Unknown";
      counts[title] = (counts[title] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([title, count]) => ({ key: title, title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [issuedBooks]);

  /* ── monthly trend (last 6 months) ──────────────────────────────── */
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(dayjs().subtract(i, "month").format("MMM YYYY"));
    }
    const issuedByMonth = {};
    const returnedByMonth = {};
    issuedBooks.forEach((ib) => {
      const m = dayjs(ib.issueDate || ib.createdAt).format("MMM YYYY");
      issuedByMonth[m] = (issuedByMonth[m] || 0) + 1;
      if (ib.returnDate) {
        const rm = dayjs(ib.returnDate).format("MMM YYYY");
        returnedByMonth[rm] = (returnedByMonth[rm] || 0) + 1;
      }
    });
    return months.map((m) => ({
      month: m.split(" ")[0],
      issued: issuedByMonth[m] || 0,
      returned: returnedByMonth[m] || 0,
    }));
  }, [issuedBooks]);

  /* ── member-type breakdown ───────────────────────────────────────── */
  const memberTypeData = useMemo(() => {
    const map = {};
    issuedBooks.forEach((ib) => {
      const t = ib.memberType || "Student";
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [issuedBooks]);

  /* ── print handler ───────────────────────────────────────────────── */
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Library Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a2e; }
        h2 { border-bottom: 2px solid #14B8A6; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #14B8A6; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-val { font-size: 24px; font-weight: 800; }
        .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748B; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>Library Report — ${dayjs().format("DD MMM YYYY")}</h2>
      ${content}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  /* ── CSV export ──────────────────────────────────────────────────── */
  const handleExportCSV = () => {
    const headers = ["Book Title", "Times Issued"];
    const rows = topBorrowed.map((r) => [r.title, r.count]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-report-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = booksLoading || issuedLoading;

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("report-tbl")}</style>
      <PageHeader
        title="Library Reports"
        subtitle="Circulation statistics, category breakdown, and trends"
        icon={<FileTextOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            <Button icon={<DownloadOutlined />} type="primary" onClick={handleExportCSV}>Export CSV</Button>
          </div>
        }
      />

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div ref={printRef}>
          {/* ── KPI row ─────────────────────────────────────────────── */}
          <div style={statGrid(150)}>
            {[
              { label: "Book Titles",     value: summary.totalTitles,     color: "#14B8A6", icon: <BookOutlined /> },
              { label: "Total Copies",    value: summary.totalCopies,     color: "#0891b2", icon: <FileTextOutlined /> },
              { label: "Available",       value: summary.availableCopies, color: "#22C55E", icon: <CheckCircleOutlined /> },
              { label: "Issued",          value: summary.issuedActive,    color: "#F59E0B", icon: <BookOutlined /> },
              { label: "Overdue",         value: summary.overdueCount,    color: "#EF4444", icon: <AlertOutlined /> },
              { label: "Lost",            value: summary.lostCount,       color: "#14B8A6", icon: <AlertOutlined /> },
              { label: "Pending Fines",   value: `₹${summary.pendingFines}`, color: "#F59E0B", icon: <DollarOutlined /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
                <div style={iconWell(color, 38)}>{icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Utilization bar ──────────────────────────────────────── */}
          <div style={{ ...sectionPanel, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>Collection Utilization</div>
            <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {summary.totalCopies - summary.availableCopies} of {summary.totalCopies} copies in circulation
              </Text>
              <Text strong style={{ fontSize: 12 }}>{summary.utilization}%</Text>
            </div>
            <Progress percent={summary.utilization} strokeColor="#14B8A6" status="active" showInfo={false} />
          </div>

          {/* ── Charts row ───────────────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={14}>
              <div style={{ ...sectionPanel, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Monthly Issue vs. Return Trend</div>
                {monthlyTrend.every((m) => m.issued === 0) ? (
                  <Empty description="No circulation data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyTrend} barSize={18} barGap={4}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="issued"   fill="#14B8A6" radius={[4, 4, 0, 0]} name="Issued" />
                      <Bar dataKey="returned" fill="#22C55E" radius={[4, 4, 0, 0]} name="Returned" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Col>

            <Col xs={24} lg={10}>
              <div style={{ ...sectionPanel, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>By Member Type</div>
                {memberTypeData.length === 0 ? (
                  <Empty description="No data" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={memberTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {memberTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} issues`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Col>
          </Row>

          {/* ── Category breakdown ───────────────────────────────────── */}
          <div style={{ ...sectionPanel, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Books by Category</div>
            {categoryData.length === 0 ? (
              <Empty description="No books added yet" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categoryData.map(({ name, value }, i) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{name}</div>
                    <div style={{ width: 160 }}>
                      <Progress
                        percent={Math.round((value / books.length) * 100)}
                        size="small"
                        strokeColor={PIE_COLORS[i % PIE_COLORS.length]}
                        format={() => `${value}`}
                        showInfo
                      />
                    </div>
                    <Tag color="default" style={{ minWidth: 50, textAlign: "center" }}>{value} titles</Tag>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Top 10 borrowed ──────────────────────────────────────── */}
          <div style={sectionPanel}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Top Borrowed Books</div>
            <Table
              className="report-tbl"
              rowKey="key"
              columns={[
                { title: "#", render: (_, __, i) => <span style={{ fontWeight: 700, color: "#14B8A6" }}>{i + 1}</span>, width: 40 },
                { title: "Book Title", dataIndex: "title", render: (t) => <Text strong>{t}</Text> },
                {
                  title: "Times Issued",
                  dataIndex: "count",
                  width: 140,
                  sorter: (a, b) => a.count - b.count,
                  defaultSortOrder: "descend",
                  render: (c) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag color="blue">{c}</Tag>
                      <Progress percent={topBorrowed.length > 0 ? Math.round((c / topBorrowed[0]?.count) * 100) : 0} size="small" showInfo={false} style={{ width: 80 }} strokeColor="#14B8A6" />
                    </div>
                  ),
                },
              ]}
              dataSource={topBorrowed}
              pagination={false}
              locale={{ emptyText: <Empty description="No circulation data yet" /> }}
              size="small"
            />
          </div>

          {/* ── Status breakdown summary ──────────────────────────────── */}
          <Row gutter={[12, 12]}>
            {[
              { label: "Issued",   count: summary.issuedActive,    color: "#F59E0B", bg: "rgba(254,243,199,0.25)" },
              { label: "Returned", count: summary.returnedCount,   color: "#22C55E", bg: "rgba(220,252,231,0.2)" },
              { label: "Overdue",  count: summary.overdueCount,    color: "#EF4444", bg: "rgba(254,226,226,0.2)" },
              { label: "Lost",     count: summary.lostCount,       color: "#14B8A6", bg: "rgba(20,184,166,0.2)" },
            ].map(({ label, count, color, bg }) => (
              <Col xs={12} sm={6} key={label}>
                <div style={{ background: bg, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default LibraryReports;
