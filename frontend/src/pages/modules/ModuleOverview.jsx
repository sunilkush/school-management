import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Empty, Flex, Row, Tag, Typography } from "antd";
import { ArrowRightOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { getRoleModules } from "../../utils/moduleRegistry";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles.js";

const { Text } = Typography;

const MODULE_META = {
  "school-management":     { color: "#2563EB", emoji: "🏫" },
  "academic-management":   { color: "#7C3AED", emoji: "📚" },
  "student-management":    { color: "#10B981", emoji: "🎓" },
  "teacher-management":    { color: "#F59E0B", emoji: "👩‍🏫" },
  "attendance-system":     { color: "#EF4444", emoji: "✅" },
  "exam-result":           { color: "#14B8A6", emoji: "📝" },
  "timetable-management":  { color: "#6366F1", emoji: "🗓️" },
  "fees-management":       { color: "#22C55E", emoji: "💰" },
  "transport-management":  { color: "#F97316", emoji: "🚌" },
  "hostel-management":     { color: "#8B5CF6", emoji: "🏠" },
  "library-management":    { color: "#0EA5E9", emoji: "📖" },
  "inventory":             { color: "#64748B", emoji: "📦" },
  "communication":         { color: "#EC4899", emoji: "💬" },
  "learning-management":   { color: "#84CC16", emoji: "🧑‍💻" },
  "reports-analytics":     { color: "#A855F7", emoji: "📊" },
};

const ModuleOverview = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.roleUi.permissions || []);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "";

  const modules = useMemo(() => {
    const permissionModules = permissions.map((p) => p.module);
    return getRoleModules(roleName, permissionModules);
  }, [roleName, permissions]);

  return (
    <>
      <PageHeader
        title="ERP Module Center"
        subtitle={`Role-based module access for ${roleName || "current user"}.`}
        icon={<AppstoreOutlined />}
        extra={
          <Tag color="blue" style={{ borderRadius: 99, padding: "4px 12px", fontSize: 13 }}>
            {modules.length} modules available
          </Tag>
        }
      />

      <div style={pageWrapper}>
        {!modules.length ? (
          <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
            <Empty description="No module access configured for this role." />
          </div>
        ) : (
          <Row gutter={[14, 14]}>
            {modules.map((mod) => {
              const meta = MODULE_META[mod.key] || { color: "#2563EB", emoji: "📋" };
              return (
                <Col xs={24} sm={12} xl={8} key={mod.key}>
                  <div
                    onClick={() => navigate(`/dashboard/modules/${mod.key}`)}
                    style={{
                      background: "var(--surface)",
                      borderRadius: 16,
                      border: "1px solid var(--border-muted)",
                      borderTop: `4px solid ${meta.color}`,
                      padding: "20px 22px",
                      cursor: "pointer",
                      transition: "box-shadow 0.18s ease, transform 0.18s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}20`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Background accent */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 80,
                      height: 80,
                      background: `${meta.color}08`,
                      borderRadius: "0 0 0 80px",
                      pointerEvents: "none",
                    }} />

                    <Flex align="flex-start" gap={14}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `${meta.color}15`,
                        border: `1px solid ${meta.color}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}>
                        {meta.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" justify="space-between" gap={8}>
                          <Text strong style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.3 }}>
                            {mod.title}
                          </Text>
                          <ArrowRightOutlined style={{ color: meta.color, fontSize: 13, flexShrink: 0 }} />
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block", lineHeight: 1.5 }}>
                          {mod.description}
                        </Text>
                      </div>
                    </Flex>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </>
  );
};

export default ModuleOverview;
