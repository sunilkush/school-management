import { Empty, Table, Tag, Typography } from "antd";

import { pill, sectionPanel } from "../../styles/pageStyles";

const { Text, Title } = Typography;

const pct = (n) => `${Number(n || 0).toFixed(2)}%`;

/**
 * Read-only rendering of one ReportCard. Shared by the staff review screen and the student and
 * parent portals so all three show identical figures — and so the on-screen card matches the
 * PDF (services/reportCardPdf.service.js) rather than drifting from it.
 */
export default function ReportCardView({ card, showStudent = false }) {
  if (!card) return <Empty description="No report card" />;

  const options = card.templateId?.options || {};
  const failed = card.totals?.resultStatus === "FAIL";

  // One column per constituent exam, derived from whichever components exist on the card.
  const examColumns = [];
  const seen = new Set();
  for (const subject of card.subjects || []) {
    for (const c of subject.components || []) {
      const key = String(c.examId);
      if (seen.has(key)) continue;
      seen.add(key);
      examColumns.push({ key, title: c.examName || "Exam" });
    }
  }

  const columns = [
    { title: "Subject", dataIndex: "subjectName", key: "subjectName", fixed: "left", width: 160 },
    ...(options.showPerExamBreakdown === false
      ? []
      : examColumns.map((col) => ({
          title: col.title,
          key: col.key,
          width: 110,
          render: (_, row) => {
            const match = (row.components || []).find((c) => String(c.examId) === col.key);
            return match ? (
              <Text type="secondary">{`${match.obtainedMarks} / ${match.totalMarks}`}</Text>
            ) : (
              <Text type="secondary">—</Text>
            );
          },
        }))),
    {
      title: "Weighted",
      dataIndex: "weightedPercentage",
      key: "weightedPercentage",
      align: "right",
      width: 100,
      render: (v, row) => (
        <Text strong style={{ color: row.isPassed === false ? "var(--danger)" : "var(--text)" }}>{pct(v)}</Text>
      ),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      align: "right",
      width: 80,
      render: (v, row) => <span style={pill(row.isPassed === false ? "var(--danger)" : "var(--primary)")}>{v || "—"}</span>,
    },
  ];

  return (
    <div>
      <div style={{ ...sectionPanel, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {showStudent && (
              <Title level={5} style={{ margin: 0 }}>
                {card.studentId?.name || "Student"}
              </Title>
            )}
            <Text type="secondary">{card.templateId?.name || "Report card"}</Text>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={pill(failed ? "var(--danger)" : "var(--success)")}>
              {failed ? "FAIL" : "PASS"}
            </span>
            <span style={pill("var(--primary)")}>{pct(card.totals?.percentage)} · {card.totals?.grade || "—"}</span>
            {options.showRank !== false && card.rank ? (
              <span style={pill("var(--purple)")}>Rank {card.rank}</span>
            ) : null}
            {options.showAttendance !== false && card.attendance?.totalDays ? (
              <span style={pill("var(--accent)")}>
                Attendance {card.attendance.presentDays}/{card.attendance.totalDays} ({pct(card.attendance.percentage)})
              </span>
            ) : null}
            {!card.isPublished && <Tag color="warning">Provisional</Tag>}
          </div>
        </div>
      </div>

      <Table
        size="small"
        rowKey={(row) => String(row.subjectId || row.subjectName)}
        columns={columns}
        dataSource={card.subjects || []}
        pagination={false}
        scroll={{ x: 640 }}
        style={{ marginBottom: 16 }}
      />

      {(card.coScholastic || []).some((c) => c.area) && (
        <div style={sectionPanel}>
          <Text strong>Co-scholastic areas</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 12 }}>
            {card.coScholastic.map((entry) => (
              <div key={entry.area} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <Text type="secondary">{entry.area}</Text>
                <Text strong>{entry.grade || "—"}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {options.showRemarks !== false && card.classTeacherRemarks && (
        <div style={sectionPanel}>
          <Text strong>Class teacher's remarks</Text>
          <p style={{ margin: "8px 0 0", fontStyle: "italic", color: "var(--text-secondary)" }}>
            {card.classTeacherRemarks}
          </p>
        </div>
      )}
    </div>
  );
}
