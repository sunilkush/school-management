import { useState } from "react";
import { Alert, Button, Checkbox, Modal, Space, Statistic, Table, Typography, message } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

import { generateTimetable } from "../../services/timetableApi";

const { Text, Paragraph } = Typography;

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Two-step on purpose: Preview first, then an explicit Apply.
 *
 * Generating replaces the section's existing rows, which may have been hand-tuned over weeks —
 * that must never be the side effect of pressing one button. The preview also surfaces unmet
 * period demand, which is the normal outcome when the plan asks for more periods than the week
 * has slots for.
 */
export default function GenerateTimetableModal({
  open, onClose, academicYearId, schoolClassId, sectionId, className, onApplied,
}) {
  const [days, setDays] = useState(ALL_DAYS);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const targets = schoolClassId ? [{ schoolClassId, sectionId: sectionId || null }] : [];

  const reset = () => { setPreview(null); setLoading(false); };

  const run = async (commit) => {
    setLoading(true);
    try {
      const result = await generateTimetable({ academicYearId, targets, workingDays: days, commit });
      if (commit) {
        message.success(result.written ? `Timetable saved — ${result.written} periods` : "Timetable saved");
        onApplied?.();
        reset();
        onClose?.();
      } else {
        setPreview(result);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const unmetColumns = [
    { title: "Subject", dataIndex: "subjectId", render: (v) => String(v).slice(-6) },
    { title: "Wanted", dataIndex: "requested", align: "right" },
    { title: "Placed", dataIndex: "placed", align: "right" },
    {
      title: "Short by",
      dataIndex: "shortfall",
      align: "right",
      render: (v) => <Text type="danger" strong>{v}</Text>,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={() => { reset(); onClose?.(); }}
      title="Generate timetable"
      width={640}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={() => { reset(); onClose?.(); }}>Close</Button>
          <Button icon={<ThunderboltOutlined />} loading={loading && !preview} onClick={() => run(false)}>
            {preview ? "Re-preview" : "Preview"}
          </Button>
          <Button type="primary" danger disabled={!preview} loading={loading && !!preview} onClick={() => run(true)}>
            Replace timetable
          </Button>
        </Space>
      }
    >
      {!schoolClassId ? (
        <Alert type="warning" showIcon message="Pick a class and section first" />
      ) : (
        <>
          <Paragraph type="secondary" style={{ marginTop: 0 }}>
            Builds a clash-free week for <Text strong>{className || "this section"}</Text> from each
            subject's weekly period count and its assigned teacher. A teacher already committed
            elsewhere in the school is never double-booked.
          </Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Working days</Text>
            <Checkbox.Group
              value={days}
              onChange={setDays}
              options={ALL_DAYS.map((d) => ({ value: d, label: d.slice(0, 3).toUpperCase() }))}
            />
          </div>

          {preview && (
            <>
              <Space size={32} style={{ marginBottom: 16 }}>
                <Statistic title="Periods placed" value={preview.filledSlots} />
                <Statistic title="Slots available" value={preview.totalSlots} />
                <Statistic
                  title="Subjects short"
                  value={preview.unmet?.length || 0}
                  valueStyle={{ color: preview.unmet?.length ? "var(--danger)" : "var(--success)" }}
                />
              </Space>

              {preview.unmet?.length > 0 && (
                <>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Some subjects could not get all their periods"
                    description="Usually the week has fewer slots than the plan asks for, or the teacher is committed to another section at every remaining slot. You can apply this and fill the rest by hand."
                  />
                  <Table
                    size="small"
                    rowKey={(r) => `${r.subjectId}`}
                    columns={unmetColumns}
                    dataSource={preview.unmet}
                    pagination={false}
                  />
                </>
              )}

              <Alert
                type="error"
                showIcon
                style={{ marginTop: 16 }}
                message="Applying replaces the existing timetable for this section"
                description="Any periods you arranged by hand will be overwritten. Nothing is written until you press Replace."
              />
            </>
          )}
        </>
      )}
    </Modal>
  );
}
