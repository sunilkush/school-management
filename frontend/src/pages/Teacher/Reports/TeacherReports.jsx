import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, DatePicker, Empty, Progress, Spin, Table, Tag, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { BarChart3 } from "lucide-react";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader.jsx";

/**
 * A teacher's own classes: this month's attendance per section, the students below 75%, and exam
 * results (class average, pass rate, and the average in the subjects this teacher teaches).
 * Data: GET /report/teacher/overview. The page used to list only "Report" records the teacher had
 * generated, which no teacher screen ever creates, so it was always empty.
 */
const pctColor = (p) => (p == null ? "var(--text-muted)" : p >= 90 ? "var(--success)" : p >= 75 ? "var(--primary)" : "var(--danger)");

const Stat = ({ label, value, sub, color = "var(--text-primary)" }) => (
  <div style={{ border: "1px solid var(--border-muted)", borderRadius: 12, padding: "10px 14px", background: "var(--surface)", minWidth: 0 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
    {sub ? <div className="u-muted" style={{ fontSize: 11 }}>{sub}</div> : null}
  </div>
);

const PctBar = ({ value }) => (
  value == null
    ? <span className="u-muted" style={{ fontSize: 12 }}>Not marked</span>
    : (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
        <Progress percent={value} showInfo={false} size="small" strokeColor={pctColor(value)} style={{ margin: 0, flex: 1 }} />
        <span style={{ fontWeight: 700, color: pctColor(value), fontSize: 12, width: 44, textAlign: "right" }}>{value}%</span>
      </div>
    )
);

const TeacherReports = () => {
  const [month, setMonth] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/report/teacher/overview", { params: { month: month.format("YYYY-MM") } });
      setData(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Could not load your class report");
    } finally {
      setLoading(false);
    }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const sections = data?.sections || [];
  const summary = useMemo(() => {
    const students = sections.reduce((s, x) => s + x.students, 0);
    const attended = sections.reduce((s, x) => s + x.present + x.late + x.halfday * 0.5, 0);
    const marked = sections.reduce((s, x) => s + x.days, 0);
    return {
      students,
      avg: marked ? Math.round((attended / marked) * 1000) / 10 : null,
      classTeacherOf: sections.filter((x) => x.isClassTeacher).map((x) => `${x.className}-${x.sectionName}`),
    };
  }, [sections]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Class Reports"
        subtitle="Attendance and exam results for the classes you teach"
        icon={<BarChart3 size={20} />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} allowClear={false}
              disabledDate={(d) => d && d.isAfter(dayjs(), "month")} format="MMM YYYY" />
            <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} onClick={load} /></Tooltip>
          </div>
        }
      />

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12, borderRadius: 10 }} />}

      <Spin spinning={loading}>
        {data && !data.academicYear && (
          <Alert type="info" showIcon style={{ marginTop: 12 }} message="No active academic year" description="Ask the school admin to set the current academic year." />
        )}
        {data?.academicYear && !sections.length && (
          <Alert type="info" showIcon style={{ marginTop: 12 }} message="No classes assigned to you"
            description={`You are not the class teacher or a subject teacher of any section in ${data.academicYear}. Ask the school admin to assign you in Classes & Sections.`} />
        )}

        {sections.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 16 }}>
              <Stat label="Sections" value={sections.length} sub={summary.classTeacherOf.length ? `Class teacher: ${summary.classTeacherOf.join(", ")}` : "Subject teacher"} />
              <Stat label="Students" value={summary.students} />
              <Stat label={`Attendance · ${month.format("MMM")}`} value={summary.avg == null ? "—" : `${summary.avg}%`} color={pctColor(summary.avg)} />
              <Stat label="Below 75%" value={data.lowAttendance.length} color={data.lowAttendance.length ? "var(--danger)" : "var(--success)"} sub="students this month" />
            </div>

            <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
              <div className="u-title" style={{ marginBottom: 10 }}>Attendance by section · {month.format("MMMM YYYY")}</div>
              <Table
                size="small" rowKey="sectionId" dataSource={sections} pagination={false} scroll={{ x: "max-content" }}
                columns={[
                  {
                    title: "Class",
                    render: (_, r) => (
                      <span>
                        <span className="u-strong">{r.className}-{r.sectionName}</span>
                        {r.isClassTeacher ? <Tag color="purple" style={{ marginLeft: 6 }}>Class teacher</Tag> : null}
                      </span>
                    ),
                  },
                  { title: "Your subjects", render: (_, r) => r.mySubjects.length ? r.mySubjects.join(", ") : <span className="u-muted">—</span> },
                  { title: "Students", dataIndex: "students" },
                  { title: "Days marked", dataIndex: "markedDays" },
                  { title: "Attendance", render: (_, r) => <PctBar value={r.attendancePct} /> },
                  { title: "Absent", dataIndex: "absent", render: (v) => v ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{v}</span> : 0 },
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginTop: 16 }}>
              <div className="section-panel" style={{ margin: 0, padding: 14 }}>
                <div className="u-title" style={{ marginBottom: 10 }}>Students below 75%</div>
                <Table
                  size="small" rowKey={(r) => `${r.sectionName}-${r.name}-${r.rollNumber}`} dataSource={data.lowAttendance}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Everyone is at 75% or above" /> }}
                  columns={[
                    { title: "Student", render: (_, r) => <span className="u-strong">{r.name}</span> },
                    { title: "Class", render: (_, r) => `${r.className}-${r.sectionName}` },
                    { title: "Absent", render: (_, r) => `${r.absent} of ${r.days}` },
                    { title: "%", dataIndex: "attendancePct", render: (v) => <span style={{ color: pctColor(v), fontWeight: 700 }}>{v}%</span> },
                  ]}
                />
              </div>

              <div className="section-panel" style={{ margin: 0, padding: 14 }}>
                <div className="u-title" style={{ marginBottom: 10 }}>Exam results · {data.academicYear}</div>
                <Table
                  size="small" rowKey={(r) => `${r.examName}-${r.className}-${r.sectionName}`} dataSource={data.exams}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }} scroll={{ x: "max-content" }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No exam results yet" /> }}
                  columns={[
                    { title: "Exam", render: (_, r) => <span className="u-strong">{r.examName}</span> },
                    { title: "Class", render: (_, r) => `${r.className}-${r.sectionName}` },
                    { title: "Avg", dataIndex: "avgPct", render: (v) => `${v}%` },
                    { title: "Pass", dataIndex: "passPct", render: (v) => <span style={{ color: pctColor(v), fontWeight: 600 }}>{v}%</span> },
                    { title: "Your subject", render: (_, r) => r.mySubjects.length ? r.mySubjects.map((s) => `${s.name} ${s.avgPct}%`).join(", ") : "—" },
                  ]}
                />
              </div>
            </div>
          </>
        )}
      </Spin>
    </div>
  );
};

export default TeacherReports;
