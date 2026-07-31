import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input, InputNumber, Spin, message, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined, TrophyOutlined } from "@ant-design/icons";
import { fetchGradingScale, updateGradingScale } from "../../../features/gradingScaleSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, pill } from "../../../styles/pageStyles";

let rowKeySeq = 0;
const nextRowKey = () => `row-${++rowKeySeq}-${Date.now()}`;

const toRows = (grades = []) =>
  [...grades]
    .sort((a, b) => b.minPercentage - a.minPercentage)
    .map((g) => ({ key: nextRowKey(), grade: g.grade, minPercentage: g.minPercentage }));

const GradingScaleSettings = () => {
  const dispatch = useDispatch();
  const { scale, isDefault, loading, actionLoading } = useSelector((s) => s.gradingScale || {});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dispatch(fetchGradingScale());
  }, [dispatch]);

  useEffect(() => {
    if (scale?.grades) setRows(toRows(scale.grades));
  }, [scale]);

  const sortedForPreview = useMemo(
    () => [...rows].filter((r) => r.grade && Number.isFinite(r.minPercentage)).sort((a, b) => b.minPercentage - a.minPercentage),
    [rows]
  );

  const validationError = useMemo(() => {
    if (!rows.length) return "Add at least one grade band";
    const seen = new Set();
    for (const row of rows) {
      if (!row.grade?.trim()) return "Every band needs a grade label";
      if (!Number.isFinite(row.minPercentage) || row.minPercentage < 0 || row.minPercentage > 100) {
        return `"${row.grade}" needs a minimum percentage between 0 and 100`;
      }
      if (seen.has(row.minPercentage)) return `Duplicate minimum percentage (${row.minPercentage}) — each band needs its own threshold`;
      seen.add(row.minPercentage);
    }
    if (!rows.some((r) => r.minPercentage === 0)) return "One band must start at 0% to cover the lowest scores";
    return null;
  }, [rows]);

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { key: nextRowKey(), grade: "", minPercentage: 0 }]);
  const removeRow = (key) => setRows((prev) => prev.filter((r) => r.key !== key));

  const handleSave = async () => {
    if (validationError) {
      message.error(validationError);
      return;
    }
    try {
      await dispatch(
        updateGradingScale({ grades: rows.map(({ grade, minPercentage }) => ({ grade: grade.trim(), minPercentage })) })
      ).unwrap();
      message.success("Grading scale saved");
    } catch (e) {
      message.error(e || "Unable to save grading scale");
    }
  };

  if (loading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin size="large" tip="Loading grading scale..." />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Grading Scale"
        subtitle="Define the percentage thresholds used to compute grades when exam results are published"
        icon={<TrophyOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchGradingScale())}>
            Refresh
          </Button>
        }
      />

      {isDefault && (
        <div style={{ ...pill("#B45309", "rgba(254,243,199,0.5)"), display: "block", padding: "10px 16px", margin: "20px 0" }}>
          This school hasn't customized its grading scale yet — showing the platform default. Save to make it official.
        </div>
      )}

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>
          Grade Bands
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Each band applies from its minimum percentage up to the next band's threshold. Bands are evaluated highest-first.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 12, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 4px" }}>
            <span>Grade Label</span>
            <span>Minimum %</span>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 12, alignItems: "center" }}>
              <Input
                value={row.grade}
                placeholder="e.g. A, B+, Distinction"
                onChange={(e) => updateRow(row.key, "grade", e.target.value)}
              />
              <InputNumber
                value={row.minPercentage}
                min={0}
                max={100}
                style={{ width: "100%" }}
                addonAfter="%"
                onChange={(v) => updateRow(row.key, "minPercentage", v ?? 0)}
              />
              <Tooltip title="Remove band">
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label={`Remove ${row.grade || "grade"} band`}
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1}
                />
              </Tooltip>
            </div>
          ))}
        </div>

        <Button icon={<PlusOutlined />} onClick={addRow} style={{ marginTop: 14 }}>
          Add Band
        </Button>

        {validationError && (
          <div style={{ ...pill("#DC2626", "rgba(254,226,226,0.3)"), display: "block", padding: "8px 14px", marginTop: 16 }}>
            {validationError}
          </div>
        )}

        {!validationError && sortedForPreview.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-muted)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Preview
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sortedForPreview.map((row, idx) => {
                const upperBound = idx === 0 ? 100 : sortedForPreview[idx - 1].minPercentage;
                const rangeLabel = idx === 0 ? `${row.minPercentage}% – 100%` : `${row.minPercentage}% – ${upperBound}%`;
                return (
                  <span key={row.key} style={pill("#2563EB", "rgba(219,234,254,0.5)")}>
                    {row.grade}: {rangeLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={actionLoading}
            disabled={Boolean(validationError)}
            onClick={handleSave}
          >
            Save Grading Scale
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GradingScaleSettings;
