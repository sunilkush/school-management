import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * MobileCard — replaces a single table row on mobile screens.
 *
 * Props:
 *   avatar      — ReactNode shown top-left (Avatar, icon, etc.)
 *   title       — Primary line (bold)
 *   subtitle    — Secondary line (muted)
 *   badge       — ReactNode shown in top-right (Tag, Status, etc.)
 *   meta        — Array of { label, value } shown as key-value rows
 *   actions     — ReactNode (buttons/icons) shown in footer
 *   expandable  — If true, meta rows are hidden until card is tapped
 *   accent      — Left border color (defaults to --primary)
 *   style       — Extra style overrides
 *
 * Example:
 *   <MobileCard
 *     avatar={<Avatar>A</Avatar>}
 *     title="Aarav Sharma"
 *     subtitle="Class 10-A · Roll 23"
 *     badge={<Tag color="green">Present</Tag>}
 *     meta={[
 *       { label: "Admission", value: "2021-ADM-001" },
 *       { label: "Parent",    value: "Raj Sharma"   },
 *       { label: "Phone",     value: "+91 98765 43210" },
 *     ]}
 *     actions={<><Button size="small">Edit</Button><Button size="small" danger>Delete</Button></>}
 *   />
 */
const MobileCard = ({
  avatar,
  title,
  subtitle,
  badge,
  meta = [],
  actions,
  expandable = false,
  accent,
  style: extraStyle,
  onClick,
}) => {
  const [open, setOpen] = useState(!expandable);

  const bg     = "var(--surface)";
  const border = "var(--border)";
  const txtPri = "var(--text)";
  const txtMut = "var(--text-muted)";
  const metaBg = "var(--surface-soft)";
  const accentColor = accent || "var(--primary, #2563EB)";

  return (
    <div
      style={{
        background:    bg,
        border:        `1px solid ${border}`,
        borderLeft:    `3px solid ${accentColor}`,
        borderRadius:  14,
        overflow:      "hidden",
        marginBottom:  10,
        boxShadow:     "var(--shadow-soft)",
        ...extraStyle,
      }}
      onClick={onClick}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        12,
          padding:    "13px 14px",
          cursor:     expandable ? "pointer" : onClick ? "pointer" : "default",
        }}
        onClick={expandable ? () => setOpen((p) => !p) : undefined}
      >
        {/* Avatar */}
        {avatar && (
          <div style={{ flexShrink: 0 }}>{avatar}</div>
        )}

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize:   13.5,
            color:      txtPri,
            lineHeight: 1.35,
            overflow:   "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize:   11.5,
              color:      txtMut,
              marginTop:  2,
              lineHeight: 1.4,
              overflow:   "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Badge + expand icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {badge}
          {expandable && (
            <span style={{ color: txtMut, display: "flex", alignItems: "center" }}>
              {open
                ? <ChevronUp  size={14} strokeWidth={2}/>
                : <ChevronDown size={14} strokeWidth={2}/>
              }
            </span>
          )}
        </div>
      </div>

      {/* ── Meta rows ── */}
      {open && meta.length > 0 && (
        <div style={{
          background: metaBg,
          borderTop:  `1px solid ${border}`,
          padding:    "10px 14px",
          display:    "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:        "8px 16px",
        }}>
          {meta.map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: txtMut, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: txtPri, lineHeight: 1.35 }}>
                {item.value ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions footer ── */}
      {actions && (
        <div style={{
          display:        "flex",
          alignItems:     "center",
          gap:            8,
          padding:        "10px 14px",
          borderTop:      `1px solid ${border}`,
          justifyContent: "flex-end",
        }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default MobileCard;
