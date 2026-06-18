import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Empty, Row, Select, Skeleton, Space, Tabs, Tag } from "antd";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { BarChartOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { getParentResults } from "../../../features/examSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid } from "../../../styles/pageStyles";

const PIE_COLORS = ["#5BA89A", "#D96B7A", "#D4922A"];
const STAT_COLORS = ["#9B87B8", "#5B9EC9", "#5BA89A", "#D4922A"];

const ChildProgress = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});
  const { results = [], loading: gradeLoading }  = useSelector((s) => s.exams || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [attendance, setAttendance]           = useState([]);
  const [homework, setHomework]               = useState([]);
  const [attLoading, setAttLoading]           = useState(false);
  const [hwLoading, setHwLoading]             = useState(false);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const loadAll = useCallback(async () => {
    if (!selectedChildId) return;
    const now   = dayjs();
    const month = now.month() + 1;
    const year  = now.year();

    dispatch(getParentResults({ studentId: selectedChildId }));

    setAttLoading(true);
    try {
      const res = await apiClient.get("/attendance/my", { params: { childId: selectedChildId, month, year } });
      setAttendance(res.data?.data || []);
    } finally {
      setAttLoading(false);
    }

    setHwLoading(true);
    try {
      const res = await apiClient.get(`/student-portal/child/${selectedChildId}/homework`);
      setHomework(res.data?.data?.homework || []);
    } finally {
      setHwLoading(false);
    }
  }, [dispatch, selectedChildId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const attStats = useMemo(() => {
    const present  = attendance.filter((a) => a.status === "present").length;
    const absent   = attendance.filter((a) => a.status === "absent").length;
    const late     = attendance.filter((a) => a.status === "late").length;
    const total    = attendance.length;
    const attPct   = total ? Math.round((present / total) * 100) : 0;
    return { present, absent, late, total, attPct };
  }, [attendance]);

  const attPieData = [
    { name: "Present", value: attStats.present },
    { name: "Absent",  value: attStats.absent  },
    { name: "Late",    value: attStats.late     },
  ].filter((d) => d.value > 0);

  const gradeChartData = useMemo(() =>
    results.map((r) => ({
      exam:       (r.examId?.title || "Exam").substring(0, 12),
      percentage: Number(r.percentage || 0),
    })),
  [results]);

  const hwStats = useMemo(() => ({
    total:     homework.length,
    pending:   homework.filter((h) => !h.submission).length,
    submitted: homework.filter((h) => h.submission).length,
    graded:    homework.filter((h) => h.submission && h.grade !== null && h.grade !== undefined).length,
    avgGrade:  (() => {
      const graded = homework.filter((h) => h.grade !== null && h.grade !== undefined);
      return graded.length ? Math.round(graded.reduce((a, b) => a + Number(b.grade || 0), 0) / graded.length) : null;
    })(),
  }), [homework]);

  const hwPieData = [
    { name: "Graded",    value: hwStats.graded },
    { name: "Submitted", value: hwStats.submitted - hwStats.graded },
    { name: "Pending",   value: hwStats.pending },
  ].filter((d) => d.value > 0);

  const topStatMeta = [
    { key: "att",       label: "Attendance %",    value: `${attStats.attPct}%` },
    { key: "exams",     label: "Exams Taken",      value: results.length },
    { key: "avgGrade",  label: "Avg Grade",        value: hwStats.avgGrade !== null ? `${hwStats.avgGrade}/100` : "—" },
    { key: "pending",   label: "Pending HW",       value: hwStats.pending },
  ];

  const isLoading = childLoading || attLoading || hwLoading || gradeLoading;

  return (
    <>
      <PageHeader
        title="Child Progress Analytics"
        subtitle="Comprehensive view of your child's attendance, grades, and homework completion."
        icon={<BarChartOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => { setSelectedChildId(v); setAttendance([]); setHomework([]); }}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={isLoading} onClick={loadAll}>Refresh</Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {!selectedChildId ? (
          <div style={sectionPanel}><Empty description="Select a child to view progress analytics" /></div>
        ) : isLoading && !results.length && !attendance.length ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <>
            {/* KPI row */}
            <div className="stat-grid" style={statGrid(170)}>
              {topStatMeta.map(({ key, label, value }, i) => (
                <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
                  <div>
                    <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                    <div style={statValue(STAT_COLORS[i])}>{isLoading ? "…" : value}</div>
                  </div>
                </div>
              ))}
            </div>

            <Tabs
              defaultActiveKey="attendance"
              items={[
                {
                  key: "attendance",
                  label: "Attendance",
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <div style={sectionPanel}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                            Monthly Breakdown
                          </div>
                          {attPieData.length ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie data={attPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                                  {attPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <Empty description="No attendance data" />}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div style={sectionPanel}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                            Summary
                          </div>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {[
                              { label: "Total Days",  value: attStats.total,   color: "#9B87B8" },
                              { label: "Present",     value: attStats.present, color: "#5BA89A" },
                              { label: "Absent",      value: attStats.absent,  color: "#D96B7A" },
                              { label: "Late",        value: attStats.late,    color: "#D4922A" },
                            ].map(({ label, value, color }) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</span>
                                <Tag color={color === "#5BA89A" ? "green" : color === "#D96B7A" ? "red" : color === "#D4922A" ? "orange" : "purple"}>
                                  {value}
                                </Tag>
                              </div>
                            ))}
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "grades",
                  label: "Exam Results",
                  children: gradeChartData.length ? (
                    <div style={sectionPanel}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                        Exam Score Trend
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={gradeChartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                          <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [`${v}%`, "Score"]} />
                          <Legend />
                          <Line type="monotone" dataKey="percentage" name="Score %" stroke="#9B87B8" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div style={sectionPanel}><Empty description="No exam results available" /></div>,
                },
                {
                  key: "homework",
                  label: "Homework",
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <div style={sectionPanel}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                            Completion Breakdown
                          </div>
                          {hwPieData.length ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie data={hwPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                                  {hwPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <Empty description="No homework data" />}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div style={sectionPanel}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
                            Homework Summary
                          </div>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {[
                              { label: "Total Assigned", value: hwStats.total     },
                              { label: "Pending",        value: hwStats.pending   },
                              { label: "Submitted",      value: hwStats.submitted },
                              { label: "Graded",         value: hwStats.graded    },
                              { label: "Avg Grade",      value: hwStats.avgGrade !== null ? `${hwStats.avgGrade}/100` : "—" },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</span>
                                <strong style={{ color: "var(--text-primary)" }}>{value}</strong>
                              </div>
                            ))}
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ChildProgress;
