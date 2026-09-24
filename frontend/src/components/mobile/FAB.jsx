import { useState } from "react";
import { Tooltip } from "antd";
import { Plus, X } from "lucide-react";

/**
 * Floating Action Button
 * Usage:
 *   <FAB onClick={openCreateModal} />
 *   <FAB icon={<PlusOutlined />} label="New Student" onClick={...} color="var(--primary)" />
 *
 * For multi-action FAB, pass `actions` array:
 *   <FAB actions={[
 *     { label: "Add Student", icon: <UserPlusOutlined />, onClick: ... },
 *     { label: "Import CSV",  icon: <UploadOutlined />,  onClick: ... },
 *   ]} />
 */
const FAB = ({
  onClick,
  icon,
  label = "Create",
  color = "var(--primary)",
  actions,
  bottom = 76,   /* above bottom nav on mobile */
  right  = 20,
  size   = 52,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isMulti = Array.isArray(actions) && actions.length > 0;

  const handleMain = () => {
    if (isMulti) {
      setExpanded((p) => !p);
    } else {
      onClick?.();
    }
  };

  const btnStyle = (bg = color, sz = size) => ({
    width:   sz,
    height:  sz,
    borderRadius: "50%",
    background:   bg,
    border:       "none",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    cursor:       "pointer",
    boxShadow:    `0 4px 16px color-mix(in srgb, ${bg} 33%, transparent), 0 2px 6px rgba(0,0,0,0.18)`,
    color:        "#fff",
    transition:   "transform 0.18s ease, box-shadow 0.18s ease",
    flexShrink:   0,
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <>

      <div className="fab-root" style={{ "--fab-right": `${right}px`, "--fab-bottom": `${bottom}px` }}>
        {/* Main button */}
        <Tooltip title={!isMulti ? label : undefined} placement="left">
          <button
            className="fab-main"
            onClick={handleMain}
            aria-label={label}
            style={btnStyle()}
          >
            {isMulti ? (
              expanded
                ? <X size={22} strokeWidth={2.2}/>
                : (icon || <Plus size={22} strokeWidth={2.2}/>)
            ) : (
              icon || <Plus size={22} strokeWidth={2.2}/>
            )}
          </button>
        </Tooltip>

        {/* Multi-action children */}
        {isMulti && expanded && actions.map((action, i) => (
          <div
            key={i}
            className="fab-action-item"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="fab-label-chip">{action.label}</span>
            <button
              className="fab-child"
              onClick={() => { action.onClick?.(); setExpanded(false); }}
              aria-label={action.label}
              style={btnStyle(action.color || `hsl(${220 + i*30},70%,52%)`, 44)}
            >
              {action.icon || <Plus size={18}/>}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default FAB;
