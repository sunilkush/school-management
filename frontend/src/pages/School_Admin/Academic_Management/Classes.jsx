import React, { useEffect, useState, lazy, Suspense, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import {
  Table,
  Tag,
  Input,
  Button,
  Space,
  Typography,
  Empty,
  Spin,
  Tooltip,
  Badge,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../context/ThemeContext";

const { Text } = Typography;

const MobileCards = lazy(() => import("./MobileCards"));

const CLASS_COLORS = [
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
];

const Classes = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );
  const { user } = useSelector((state) => state.auth || {});

  const [filterText, setFilterText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (schoolId) dispatch(getClassData({ schoolId }));
  }, [dispatch, schoolId]);

  const stats = useMemo(() => {
    const sections = schoolClasses.reduce(
      (acc, c) => acc + (c.sections?.length || 0),
      0
    );
    const mapped = schoolClasses.reduce((acc, c) => {
      return (
        acc +
        (c.sections?.filter((s) => s.subjects?.length > 0).length || 0)
      );
    }, 0);
    return { total: schoolClasses.length, sections, mapped };
  }, [schoolClasses]);

  const filteredItems = useMemo(() => {
    let data = schoolClasses.filter((item) =>
      (item?.name ?? "").toLowerCase().includes(filterText.toLowerCase())
    );
    if (activeFilter === "with-sections") {
      data = data.filter((c) => c.sections?.length > 0);
    } else if (activeFilter === "unmapped") {
      data = data.filter((c) =>
        c.sections?.every((s) => !s.subjects?.length)
      );
    }
    return data;
  }, [schoolClasses, filterText, activeFilter]);

  const columns = [
    {
      title: "Class",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (name, _, index) => {
        const palette = CLASS_COLORS[index % CLASS_COLORS.length];
        const sectionCount = schoolClasses[index]?.sections?.length || 0;
        const subjectCount = schoolClasses[index]?.sections?.reduce(
          (acc, s) => acc + (s.subjects?.length || 0),
          0
        );
        return (
          <Space align="center" size={10}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: palette.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: palette.color,
                flexShrink: 0,
              }}
            >
              {name?.replace(/\D/g, "") || <ApartmentOutlined />}
            </div>
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {name}
              </Text>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                {sectionCount} section{sectionCount !== 1 ? "s" : ""} &nbsp;·&nbsp;{" "}
                {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Sections",
      dataIndex: "sections",
      key: "sections",
      width: 180,
      render: (sections = []) =>
        sections.length ? (
          <Space wrap size={4}>
            {sections.map((sec) => (
              <Tag
                key={sec._id}
                style={{
                  borderRadius: 20,
                  background: isDark ? "#0c1a2e" : "#E6F1FB",
                  color: isDark ? "#60a5fa" : "#185FA5",
                  border: "none",
                  fontWeight: 500,
                  fontSize: 12,
                  padding: "2px 10px",
                  margin: 0,
                }}
              >
                {sec.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            No sections
          </Text>
        ),
    },
    {
      title: "Subjects",
      dataIndex: "sections",
      key: "subjects",
      render: (sections = []) =>
        sections.length ? (
          <div>
            {sections.map((sec) => (
              <div
                key={sec._id}
                style={{ fontSize: 12, color: "#6b7280", marginBottom: 3 }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: isDark ? "#d1d5db" : "#1e293b",
                    marginRight: 4,
                  }}
                >
                  {sec.name}:
                </span>
                {sec.subjects?.length
                  ? sec.subjects.map((s) => s.name).join(", ")
                  : "—"}
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 100,
      render: () => (
        <Space size={6}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              style={{ borderRadius: 7 }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ borderRadius: 7 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "with-sections", label: "With Sections" },
    { key: "unmapped", label: "Unmapped" },
  ];

  const statCards = [
    {
      label: "Total Classes",
      value: stats.total,
      dot: "#1677ff",
      sub: "This academic year",
    },
    {
      label: "Total Sections",
      value: stats.sections,
      dot: "#0ea472",
      sub: "Across all classes",
    },
    {
      label: "Mapped Sections",
      value: stats.mapped,
      dot: "#f59e0b",
      sub: "Subjects assigned",
    },
  ];

  return (
    <div style={{ padding: "0px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: isDark ? "#e8e8e8" : "#111827" }}>
            Classes
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>
            Manage classes, sections &amp; subjects
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, fontWeight: 500 }}>
          Add Class
        </Button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              background: isDark ? "#111111" : "#f8faff",
              borderRadius: 10,
              padding: "14px 16px",
              border: `0.5px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, color: isDark ? "#e8e8e8" : "#111827" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: isDark ? "#4b5563" : "#c0c0c0", marginTop: 2 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN TABLE CARD */}
      <div
        style={{
          border: `0.5px solid ${isDark ? "#1f1f1f" : "#e9edf3"}`,
          borderRadius: 14,
          overflow: "hidden",
          background: isDark ? "#141414" : "#ffffff",
        }}
      >
        {/* TOOLBAR */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            borderBottom: `0.5px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            placeholder="Search classes..."
            allowClear
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
          />

          <Space size={6}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  fontSize: 12,
                  padding: "5px 13px",
                  borderRadius: 20,
                  border: activeFilter === tab.key
                    ? "none"
                    : `0.5px solid ${isDark ? "#333" : "#e2e8f0"}`,
                  background: activeFilter === tab.key
                    ? "#1677ff"
                    : "transparent",
                  color: activeFilter === tab.key
                    ? "#fff"
                    : isDark ? "#9ca3af" : "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
                {tab.key === "unmapped" && (
                  <Badge
                    count={schoolClasses.filter((c) =>
                      c.sections?.every((s) => !s.subjects?.length)
                    ).length}
                    size="small"
                    style={{ marginLeft: 6, fontSize: 10 }}
                  />
                )}
              </button>
            ))}
          </Space>
        </div>

        {/* TABLE */}
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8, size: "small" }}
          size="middle"
          style={{ borderRadius: 0 }}
          locale={{
            emptyText: (
              <Empty
                description="No classes found"
                style={{ padding: "32px 0" }}
              />
            ),
          }}
          onRow={() => ({
            style: { cursor: "default" },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = isDark ? "#1a1a1a" : "#f8faff";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "";
            },
          })}
        />
      </div>
    </div>
  );
};

export default Classes;