import React from "react";
import { Checkbox, Input } from "antd";
import { CheckOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const getOptionValue = (opt, i) =>
  typeof opt === "string" ? opt : opt?.value || opt?.text || opt?.label || `${i + 1}`;

const getOptionLabel = (opt, i) =>
  typeof opt === "string" ? opt : opt?.label || opt?.text || opt?.value || `Option ${i + 1}`;

const getNormalizedOptions = (type, options) => {
  if (Array.isArray(options) && options.length) return options;
  if (type === "true_false") return ["True", "False"];
  return [];
};

/* ── Single-select option tile ── */
const OptionTile = ({ letter, label, value, selected, onClick }) => (
  <div
    onClick={() => onClick(value)}
    style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
      border: `1.5px solid ${selected ? "var(--primary)" : "var(--border-muted)"}`,
      background: selected ? "rgba(124,58,237,0.07)" : "var(--surface)",
      transition: "all 0.15s",
    }}
  >
    <div style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: 13,
      background: selected ? "var(--primary)" : "var(--surface-soft, #f8fafc)",
      color:      selected ? "#fff"           : "var(--text-muted)",
      border:     selected ? "none"           : "1px solid var(--border-muted)",
      transition: "all 0.15s",
    }}>
      {selected ? <CheckOutlined style={{ fontSize: 13 }} /> : letter}
    </div>
    <span style={{
      fontSize: 14, fontWeight: selected ? 600 : 400,
      color: selected ? "var(--primary)" : "var(--text-primary)",
      flex: 1,
    }}>
      {label}
    </span>
  </div>
);

/* ── Multi-select option tile ── */
const MultiTile = ({ letter, label, value, selected, onChange }) => (
  <div
    onClick={() => onChange(value)}
    style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
      border: `1.5px solid ${selected ? "var(--primary)" : "var(--border-muted)"}`,
      background: selected ? "rgba(124,58,237,0.07)" : "var(--surface)",
      transition: "all 0.15s",
    }}
  >
    <Checkbox checked={selected} onChange={() => onChange(value)}>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 12,
          background: selected ? "var(--primary)" : "var(--surface-soft, #f8fafc)",
          color:      selected ? "#fff"           : "var(--text-muted)",
          border:     selected ? "none"           : "1px solid var(--border-muted)",
        }}>
          {letter}
        </span>
        <span style={{
          fontSize: 14, fontWeight: selected ? 600 : 400,
          color: selected ? "var(--primary)" : "var(--text-primary)",
        }}>
          {label}
        </span>
      </span>
    </Checkbox>
  </div>
);

/* ── Main Question Card ── */
const QuestionCard = ({ question, index, onAnswerChange, userAnswer }) => {
  const type    = question?.type;
  const options = getNormalizedOptions(type, question?.options);
  const qid     = question._id;

  const handleSingleChange = (val) => {
    onAnswerChange(qid, userAnswer === val ? null : val);
  };

  const handleMultiChange = (val) => {
    const current = Array.isArray(userAnswer) ? userAnswer : [];
    const next    = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onAnswerChange(qid, next);
  };

  const isSingleSelect = ["mcq", "mcq_single", "true_false"].includes(type);
  const isMultiSelect  = type === "mcq_multi";
  const isText         = ["subjective", "short_answer", "long_answer"].includes(type);
  const isFill         = type === "fill_blank";
  const isMatch        = type === "match";

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-muted)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Question header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-muted)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--surface-soft, var(--surface-page))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            background: "rgba(124,58,237,0.1)", color: "var(--primary)",
            padding: "2px 8px", borderRadius: 99,
          }}>
            {type || "subjective"}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700,
          background: "rgba(8,145,178,0.1)", color: "#0891B2",
          padding: "3px 10px", borderRadius: 99,
        }}>
          {question?.marks ?? 0} mark{question?.marks !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Question body */}
      <div style={{ padding: "16px 18px" }}>
        {/* Question text */}
        <div style={{
          fontSize: 15, fontWeight: 600, color: "var(--text-primary)",
          lineHeight: 1.6, marginBottom: 16,
        }}>
          {question.text}
        </div>

        {/* Single-select (MCQ / True-False) */}
        {isSingleSelect && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {options.map((opt, i) => {
              const val  = getOptionValue(opt, i);
              const lbl  = getOptionLabel(opt, i);
              return (
                <OptionTile
                  key={val}
                  letter={OPTION_LETTERS[i] || `${i + 1}`}
                  label={lbl}
                  value={val}
                  selected={userAnswer === val}
                  onClick={handleSingleChange}
                />
              );
            })}
          </div>
        )}

        {/* Multi-select */}
        {isMultiSelect && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {options.map((opt, i) => {
              const val    = getOptionValue(opt, i);
              const lbl    = getOptionLabel(opt, i);
              const selArr = Array.isArray(userAnswer) ? userAnswer : [];
              return (
                <MultiTile
                  key={val}
                  letter={OPTION_LETTERS[i] || `${i + 1}`}
                  label={lbl}
                  value={val}
                  selected={selArr.includes(val)}
                  onChange={handleMultiChange}
                />
              );
            })}
          </div>
        )}

        {/* Subjective / essay */}
        {isText && (
          <TextArea
            rows={type === "long_answer" ? 6 : 4}
            placeholder="Write your answer here..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(qid, e.target.value)}
            style={{ borderRadius: 10, fontSize: 14 }}
          />
        )}

        {/* Fill in the blank */}
        {isFill && (
          <Input
            placeholder="Type your answer..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(qid, e.target.value)}
            style={{ borderRadius: 10, fontSize: 14, height: 44 }}
          />
        )}

        {/* Match the column */}
        {isMatch && (
          <TextArea
            rows={4}
            placeholder="Match pairs, e.g. A-1, B-2, C-3..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(qid, e.target.value)}
            style={{ borderRadius: 10, fontSize: 14 }}
          />
        )}

        {/* Unknown type */}
        {!type && (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Answer type unavailable.</p>
        )}
        {type && !isSingleSelect && !isMultiSelect && !isText && !isFill && !isMatch && (
          <TextArea
            rows={4}
            placeholder="Provide your answer in text format..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(qid, e.target.value)}
            style={{ borderRadius: 10, fontSize: 14 }}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
