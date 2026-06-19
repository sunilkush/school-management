import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Empty, Select, Skeleton, Space, Table, Tag, message } from "antd";
import { BookOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid, pill } from "../../../styles/pageStyles";

const STAT_COLORS = ["#14B8A6", "#EF4444", "#F59E0B"];

const ChildLibrary = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [books, setBooks]                     = useState([]);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const fetchBooks = useCallback(async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/student-portal/child/${selectedChildId}/library`);
      setBooks(res.data?.data || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load library books");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const stats = useMemo(() => ({
    issued:  books.filter((b) => b.status === "Issued").length,
    overdue: books.filter((b) => b.status === "Overdue").length,
    fine:    books.reduce((a, b) => a + (b.fineAmount || 0), 0),
  }), [books]);

  const statMeta = [
    { key: "issued",  label: "Issued",  value: stats.issued },
    { key: "overdue", label: "Overdue", value: stats.overdue },
    { key: "fine",    label: "Total Fine", value: `₹${stats.fine}` },
  ];

  const columns = [
    {
      title: "Book",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.bookId?.title || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.bookId?.author || ""}</div>
        </div>
      ),
    },
    { title: "ISBN", render: (_, r) => r.bookId?.isbn || "—", responsive: ["md"] },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (v) => {
        if (!v) return "—";
        const overdue = dayjs(v).isBefore(dayjs(), "day");
        return <span style={{ color: overdue ? "#EF4444" : "inherit" }}>{dayjs(v).format("DD MMM YYYY")}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={s === "Issued" ? "blue" : s === "Overdue" ? "red" : "green"}>{s}</Tag>,
    },
    {
      title: "Fine",
      dataIndex: "fineAmount",
      render: (v) => v > 0 ? <span style={pill("#EF4444", "rgba(254,226,226,0.2)")}>₹{v}</span> : "—",
    },
  ];

  return (
    <>
      <PageHeader
        title="Child Library"
        subtitle="Track books issued to your child and any outstanding fines."
        icon={<BookOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => { setSelectedChildId(v); setBooks([]); }}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchBooks}>Refresh</Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        <div className="stat-grid" style={statGrid(160)}>
          {statMeta.map(({ key, label, value }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}><BookOutlined /></div>
            </div>
          ))}
        </div>

        <div style={sectionPanel}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : !selectedChildId ? (
            <Empty description="Select a child to view library books" />
          ) : !books.length ? (
            <Empty description="No books currently issued" />
          ) : (
            <Table
              columns={columns}
              dataSource={books}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 700 }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ChildLibrary;
