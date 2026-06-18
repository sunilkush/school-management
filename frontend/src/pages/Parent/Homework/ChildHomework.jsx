import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Empty, Modal, Select, Skeleton, Space, Table, Tag, message } from "antd";
import {
  BookOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FileTextOutlined, ReloadOutlined, TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid, pill } from "../../../styles/pageStyles";

const STAT_COLORS = ["#9B87B8", "#5B9EC9", "#D4922A", "#5BA89A"];

const statusTag = (hw) => {
  if (!hw.submission) return <Tag color="orange">Pending</Tag>;
  if (hw.grade !== null && hw.grade !== undefined) return <Tag color="green">Graded</Tag>;
  return <Tag color="blue">Submitted</Tag>;
};

const ChildHomework = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [homework, setHomework]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [detailHw, setDetailHw]               = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const fetchHomework = useCallback(async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/student-portal/child/${selectedChildId}/homework`);
      setHomework(res.data?.data?.homework || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load homework");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);

  const stats = useMemo(() => ({
    total:     homework.length,
    pending:   homework.filter((h) => !h.submission).length,
    submitted: homework.filter((h) => h.submission && (h.grade === null || h.grade === undefined)).length,
    graded:    homework.filter((h) => h.submission && h.grade !== null && h.grade !== undefined).length,
  }), [homework]);

  const statMeta = [
    { key: "total",     label: "Total",     icon: <FileTextOutlined />,    value: stats.total },
    { key: "pending",   label: "Pending",   icon: <ClockCircleOutlined />, value: stats.pending },
    { key: "submitted", label: "Submitted", icon: <CheckCircleOutlined />, value: stats.submitted },
    { key: "graded",    label: "Graded",    icon: <TrophyOutlined />,      value: stats.graded },
  ];

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      render: (v, row) => (
        <a style={{ color: "var(--primary)", fontWeight: 600 }} onClick={() => setDetailHw(row)}>{v}</a>
      ),
    },
    {
      title: "Subject",
      render: (_, r) => r.subjectId?.name || "—",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (v) => {
        if (!v) return "—";
        const d = dayjs(v);
        const overdue = d.isBefore(dayjs(), "day");
        return <span style={{ color: overdue ? "#D96B7A" : "inherit" }}>{d.format("DD MMM YYYY")}</span>;
      },
    },
    {
      title: "Status",
      render: (_, r) => statusTag(r),
    },
    {
      title: "Grade",
      render: (_, r) =>
        r.grade !== null && r.grade !== undefined
          ? <span style={pill("#5BA89A", "#d1fae5")}>{r.grade}/100</span>
          : "—",
    },
    {
      title: "Action",
      render: (_, r) => (
        <Button size="small" onClick={() => setDetailHw(r)}>Details</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Child Homework"
        subtitle="Track your child's assignments, submission status, and grades."
        icon={<BookOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => { setSelectedChildId(v); setHomework([]); }}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchHomework}>
              Refresh
            </Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {/* Stats */}
        <div className="stat-grid" style={statGrid(160)}>
          {statMeta.map(({ key, label, icon, value }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        <div style={sectionPanel}>
          {!selectedChildId ? (
            <Empty description="Select a child to view their homework" />
          ) : loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : !homework.length ? (
            <Empty description="No homework assigned yet" />
          ) : (
            <Table
              columns={columns}
              dataSource={homework}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 700 }}
            />
          )}
        </div>

        {/* Detail Modal */}
        <Modal
          open={!!detailHw}
          title={detailHw?.title || "Homework Details"}
          onCancel={() => setDetailHw(null)}
          footer={<Button onClick={() => setDetailHw(null)}>Close</Button>}
          width={560}
        >
          {detailHw && (
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Subject</div>
                <div style={{ fontWeight: 600 }}>{detailHw.subjectId?.name || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{detailHw.description || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Due Date</div>
                <div>{detailHw.dueDate ? dayjs(detailHw.dueDate).format("DD MMM YYYY") : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                {statusTag(detailHw)}
              </div>
              {detailHw.submission && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Submitted On</div>
                  <div>{detailHw.submission.submittedAt ? dayjs(detailHw.submission.submittedAt).format("DD MMM YYYY, hh:mm A") : "—"}</div>
                </div>
              )}
              {detailHw.grade !== null && detailHw.grade !== undefined && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Grade</div>
                  <span style={pill("#5BA89A", "#d1fae5")}>{detailHw.grade}/100</span>
                </div>
              )}
              {detailHw.feedback && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Teacher Feedback</div>
                  <div style={{ background: "var(--surface)", padding: "10px 14px", borderRadius: 8, fontStyle: "italic" }}>
                    {detailHw.feedback}
                  </div>
                </div>
              )}
            </Space>
          )}
        </Modal>
      </div>
    </>
  );
};

export default ChildHomework;
