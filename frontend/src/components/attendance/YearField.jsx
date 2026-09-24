import React from "react";
import { Input } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

/**
 * The academic year the page is working in, shown as a read-only field.
 *
 * It is an antd Input rather than a styled <div> so it takes its height, corners and border from
 * the theme like every select beside it — the hand-drawn box it replaces was 32px tall next to
 * 42px selects.
 */
const YearField = ({ year, schoolChosen, loading = false }) => {
  const text = loading
    ? "Loading…"
    : year
      ? `${year.name}${year.isActive ? " · running" : ""}`
      : schoolChosen
        ? "No active year"
        : "Pick a school";

  return (
    <Input
      readOnly
      // Nothing to edit here, so Tab goes past it instead of stopping to select its text.
      tabIndex={-1}
      value={text}
      prefix={<CalendarOutlined className="u-muted" />}
      style={{
        width: "100%",
        cursor: "default",
        color: year ? "var(--text-primary)" : "var(--text-muted)",
        background: "var(--surface-soft)",
      }}
      aria-label="Academic year"
    />
  );
};

export default YearField;
