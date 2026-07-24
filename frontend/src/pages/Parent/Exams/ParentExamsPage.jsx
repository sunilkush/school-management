import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Collapse, Empty, Progress, Select, Segmented, Space, Table, Tag, message,
} from "antd";
import {
  BarChartOutlined, CalendarOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FilePdfOutlined, TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getExams, getParentResults } from "../../../features/examSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel,
  statCard, statLabel, statValue, statGrid,
} from "../../../styles/pageStyles";

const STAT_COLORS = ["#14B8A6", "#22C55E", "#EF4444", "#2563EB"];

const ParentExamsPage = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading }  = useSelector((s) => s.studentPortal || {});
  const { exams = [], results = [], loading, error } = useSelector((s) => s.exams || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [scheduleFilter,  setScheduleFilter]  = useState("upcoming");
  const [admitCardDownloadingId, setAdmitCardDownloadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyChildren()).unwrap().catch((err) => message.error(err || "Failed to load children"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.userId === selectedChildId) || null,
    [children, selectedChildId]
  );

  useEffect(() => {
    if (!selectedChildId) return;
    dispatch(getParentResults({ studentId: selectedChildId })).unwrap().catch(() => null);
  }, [dispatch, selectedChildId]);

  useEffect(() => {
    if (!selectedChild?.classId) return;
    dispatch(getExams({
      studentId: selectedChildId,
      schoolClassId: selectedChild.classId,
      ...(selectedChild.sectionId ? { sectionId: selectedChild.sectionId } : {}),
      sortBy: "examDate",
      sortOrder: "asc",
      status: "published",
    })).unwrap().catch(() => null);
  }, [dispatch, selectedChild, selectedChildId]);

  const summary = useMemo(() => {
    const total  = results.length;
    const passed = results.filter((r) => r.resultStatus === "PASS").length;
    const avg    = total
      ? Math.round(results.reduce((a, r) => a + Number(r.percentage || 0), 0) / total)
      : 0;
    return { total, passed, failed: total - passed, avg };
  }, [results]);

  const nextExam = useMemo(() => {
    const now = dayjs();
    return exams
      .filter((e) => dayjs(e.examDate).isAfter(now, "day") || dayjs(e.examDate).isSame(now, "day"))
      .sort((a, b) => dayjs(a.examDate).valueOf() - dayjs(b.examDate).valueOf())[0];
  }, [exams]);

  const handleDownloadAdmitCard = async (exam) => {
    if (!selectedChildId) return;
    setAdmitCardDownloadingId(exam._id);
    try {
      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const url = `${apiBase}/exams/${exam._id}/admit-cards/pdf?studentId=${selectedChildId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Admit card not available for this exam yet");
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `admit-card-${exam.title || exam._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      message.error(err.message || "Failed to download admit card");
    } finally {
      setAdmitCardDownloadingId(null);
    }
  };

  const filteredExams = useMemo(() => {
    const now = dayjs();
    if (scheduleFilter === "all") return exams;
    return exams.filter((e) => {
      const d = dayjs(e.examDate);
      return scheduleFilter === "upcoming"
        ? d.isAfter(now, "day") || d.isSame(now, "day")
        : d.isBefore(now, "day");
    });
  }, [exams, scheduleFilter]);

  const resultColumns = [
    { title: "Subject",  dataIndex: "subjectName"   },
    { title: "Obtained", dataIndex: "obtainedMarks" },
    { title: "Total",    dataIndex: "totalMarks"    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={r.isPassed ? "green" : "red"}>{r.isPassed ? "PASS" : "FAIL"}</Tag>
      ),
    },
  ];

  const statMeta = [
    { key: "total", label: "Results Published", value: summary.total,    icon: <TrophyOutlined />      },
    { key: "pass",  label: "Pass",              value: summary.passed,   icon: <CheckCircleOutlined /> },
    { key: "fail",  label: "Fail",              value: summary.failed,   icon: <CloseCircleOutlined /> },
    { key: "avg",   label: "Avg Score",         value: `${summary.avg}%`, icon: <BarChartOutlined />  },
  ];

  if (!childrenLoading && !children.length) {
    return (
      <>
        <PageHeader title="Child Exam Hub" subtitle="Monitor exam schedules and results." icon={<TrophyOutlined />} />
        <div style={pageWrapper}>
          <div style={sectionPanel}><Empty description="No linked children found for this parent account" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Child Exam Hub"
        subtitle="Monitor exam schedules and results with a parent-friendly layout."
        icon={<TrophyOutlined />}
        extra={
          <Select
            placeholder="Select child"
            value={selectedChildId}
            onChange={setSelectedChildId}
            loading={childrenLoading}
            style={{ minWidth: 280 }}
            options={children.map((c) => ({
              label: `${c.name}${c.className ? ` (${c.className}${c.sectionName ? ` - ${c.sectionName}` : ""})` : ""}`,
              value: c.userId,
            }))}
          />
        }
      />

      <div style={pageWrapper}>
        {/* Next exam notice */}
        {nextExam && (
          <div style={{
            ...sectionPanel,
            display: "flex", alignItems: "center", gap: 10,
            background: "#EFF6FF", borderColor: "#BFDBFE",
          }}>
            <CalendarOutlined style={{ color: "#2563EB", fontSize: 18 }} />
            <span>
              <span style={{ fontWeight: 700, color: "#1D4ED8" }}>Next Exam: </span>
              <span style={{ color: "#1D4ED8" }}>
                {nextExam.title || "Exam"} — {dayjs(nextExam.examDate).format("DD MMM YYYY")}
              </span>
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid" style={statGrid(160)}>
          {statMeta.map(({ key, label, value, icon }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        {/* Performance trend */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Overall Performance
          </div>
          <Progress
            percent={summary.avg}
            strokeColor={summary.avg >= 75 ? "#22C55E" : summary.avg >= 50 ? "#F59E0B" : "#EF4444"}
            trailColor="var(--border-muted)"
            format={(p) => <span style={{ fontWeight: 700 }}>{p}%</span>}
          />
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Some exam data failed to load"
            description={String(error)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Exam Schedule */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Exam Schedule</span>
            <Segmented
              value={scheduleFilter}
              onChange={setScheduleFilter}
              options={[
                { label: "Upcoming",  value: "upcoming"  },
                { label: "Completed", value: "completed" },
                { label: "All",       value: "all"       },
              ]}
            />
          </div>

          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>Loading exams…</div>
          ) : !filteredExams.length ? (
            <Empty description="No exams for the selected filter" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  style={{
                    padding: "14px 16px",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border-muted)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      {exam.title || "Untitled Exam"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <CalendarOutlined style={{ marginRight: 5 }} />
                      {dayjs(exam.examDate).format("DD MMM YYYY")}
                      {exam.subjectId?.name && (
                        <span style={{ marginLeft: 12 }}>📚 {exam.subjectId.name}</span>
                      )}
                      <span style={{ marginLeft: 12 }}>
                        Total {exam.totalMarks ?? 0} &nbsp;·&nbsp; Passing {exam.passingMarks ?? 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="small"
                    icon={<FilePdfOutlined />}
                    loading={admitCardDownloadingId === exam._id}
                    onClick={() => handleDownloadAdmitCard(exam)}
                  >
                    Admit Card
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Published Results */}
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>
            Published Results
          </div>
          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>Loading results…</div>
          ) : !results.length ? (
            <Empty description="No published results found" />
          ) : (
            <Collapse
              bordered={false}
              style={{ background: "transparent" }}
              items={results.map((result) => ({
                key: result._id,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700 }}>{result.examId?.title || "Exam"}</span>
                    <Tag color={result.resultStatus === "PASS" ? "success" : "error"}>{result.resultStatus}</Tag>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {result.percentage}% — Grade {result.grade || "—"}
                    </span>
                  </div>
                ),
                children: (
                  <>
                    <Table
                      rowKey={(r) => `${r.subjectId}-${r.subjectName}`}
                      pagination={false}
                      columns={resultColumns}
                      dataSource={result.subjects || []}
                      size="small"
                    />
                    <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        Rank: {result.rank || "—"}
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        Obtained: {result.totalObtainedMarks || 0}/{result.totalMaximumMarks || 0}
                      </span>
                    </div>
                  </>
                ),
              }))}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ParentExamsPage;
