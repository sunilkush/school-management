import React from "react";

/**
 * The filter row shared by the attendance pages (mark, records, monthly), so a select on one page
 * is the same size and sits in the same place as on the others.
 *
 * Each page used to lay its row out by hand — 180px columns with a 16px gap here, 170px and 14px
 * there, the action button inside the row on two pages and under it on the third — so the same
 * control came out a different width depending on which page it was on.
 */

const COLUMN = 190;
const GAP = 14;

export const FilterGrid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${COLUMN}px, 1fr))`,
      gap: GAP,
      // Top-aligned: a field with a hint under it grows downwards and does not push its
      // control out of line with the rest of the row.
      alignItems: "start",
    }}
  >
    {children}
  </div>
);

/** One labelled control. `hint` is a line of small text under it, when there is something to say. */
export const FilterField = ({ label, hint, hintTone = "muted", children }) => (
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 6,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {label || " "}
    </div>
    {children}
    {hint && (
      <div
        style={{
          fontSize: 11,
          marginTop: 4,
          color: hintTone === "warning" ? "var(--warning-hover)" : "var(--text-muted)",
        }}
      >
        {hint}
      </div>
    )}
  </div>
);

