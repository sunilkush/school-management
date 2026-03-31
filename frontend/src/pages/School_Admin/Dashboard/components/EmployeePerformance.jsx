import React, { useState } from "react";
import { Select, Typography, Avatar, Tag } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;

const performanceConfig = {
  EXCELLENT: { color: "#0ea472", bg: "rgba(14,164,114,0.08)",  border: "rgba(14,164,114,0.2)",  dot: "#0ea472" },
  GOOD:      { color: "#1677ff", bg: "rgba(22,119,255,0.08)",  border: "rgba(22,119,255,0.2)",  dot: "#1677ff" },
  AVERAGE:   { color: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)",   dot: "#ea580c" },
  POOR:      { color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   dot: "#dc2626" },
};

const employees = [
  {
    name: "Arthur Henry",
    email: "arthur.henry@school.edu",
    designation: "Senior Designer",
    performance: "EXCELLENT",
    dept: "Design",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    name: "Kristin Cooper",
    email: "kristin.cooper@school.edu",
    designation: "JS Developer",
    performance: "GOOD",
    dept: "Engineering",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Marcus Webb",
    email: "marcus.webb@school.edu",
    designation: "Math Teacher",
    performance: "GOOD",
    dept: "Faculty",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@school.edu",
    designation: "Science Teacher",
    performance: "AVERAGE",
    dept: "Faculty",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const EmployeePerformance = () => {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("lastMonth");
  const [hovered, setHovered] = useState(null);

  const cardBg   = isDark ? "#141414" : "#ffffff";
  const border   = isDark ? "#1f1f1f" : "#f0f0f0";
  const rowHover = isDark ? "#1a1a1a" : "#f8faff";
  const textPri  = isDark ? "#e8e8e8" : "#111827";
  const textSec  = isDark ? "#6b7280" : "#9ca3af";
  const thBg     = isDark ? "#0f0f0f" : "#f9fafb";
  const thBorder = isDark ? "#1f1f1f" : "#f0f0f0";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 20px 8px",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>
            Teacher Performance
          </Text>
          <Text style={{ fontSize: 12, color: textSec }}>Staff activity overview</Text>
        </div>
        <Select
          value={period}
          onChange={setPeriod}
          size="small"
          style={{ width: 120 }}
          bordered={false}
        >
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
        </Select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: thBg, borderBottom: `1px solid ${thBorder}` }}>
              {["Employee", "Department", "Designation", "Performance", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 12px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: textSec,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const perf = performanceConfig[emp.performance] ?? performanceConfig.AVERAGE;
              const isHov = hovered === i;

              return (
                <tr
                  key={emp.email}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHov ? rowHover : "transparent",
                    borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#f5f5f5"}`,
                    transition: "background 0.15s ease",
                    cursor: "default",
                  }}
                >
                  {/* Employee */}
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        src={emp.avatar}
                        size={34}
                        style={{ flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                      />
                      <div>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: textPri, display: "block" }}>
                          {emp.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSec }}>{emp.email}</Text>
                      </div>
                    </div>
                  </td>

                  {/* Dept */}
                  <td style={{ padding: "12px 12px" }}>
                    <Text style={{ fontSize: 12, color: textSec }}>{emp.dept}</Text>
                  </td>

                  {/* Designation */}
                  <td style={{ padding: "12px 12px" }}>
                    <Text style={{ fontSize: 12.5, color: textPri }}>{emp.designation}</Text>
                  </td>

                  {/* Performance */}
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: perf.color,
                      background: perf.bg,
                      border: `1px solid ${perf.border}`,
                      padding: "3px 9px",
                      borderRadius: 99,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: perf.dot, display: "inline-block",
                      }} />
                      {emp.performance}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{
                      display: "flex",
                      gap: 6,
                      opacity: isHov ? 1 : 0,
                      transition: "opacity 0.15s ease",
                    }}>
                      {[
                        { Icon: EyeOutlined,  color: "#1677ff", bg: "rgba(22,119,255,0.08)" },
                        { Icon: EditOutlined, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                      ].map(({ Icon, color, bg }, j) => (
                        <button
                          key={j}
                          style={{
                            width: 28, height: 28,
                            borderRadius: 7,
                            border: "none",
                            background: bg,
                            color,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            transition: "transform 0.15s ease",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.12)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          <Icon />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 4px 4px",
        borderTop: `1px solid ${isDark ? "#1a1a1a" : "#f5f5f5"}`,
        marginTop: 4,
      }}>
        <Text style={{ fontSize: 11, color: textSec }}>
          Showing {employees.length} staff members
        </Text>
        <button style={{
          fontSize: 11, fontWeight: 600,
          color: "#1677ff",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "3px 0",
        }}>
          View all →
        </button>
      </div>
    </div>
  );
};

export default EmployeePerformance;