import React, { useEffect, useState, lazy, Suspense, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";

import {
  Table,
  Tag,
  Input,
  Button,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Grid,
  Empty,
  Spin,
  ConfigProvider,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const MobileCards = lazy(() => import("./MobileCards"));

const Classes = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );
  const { user } = useSelector((state) => state.auth || {});

  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (schoolId) dispatch(getClassData({ schoolId }));
  }, [dispatch, schoolId]);

  /* ── Filter ── */
  const filteredItems = useMemo(() => {
    return schoolClasses.filter((item) =>
      (item?.name ?? "").toLowerCase().includes(filterText.toLowerCase())
    );
  }, [schoolClasses, filterText]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    return {
      total: schoolClasses.length,
      sections: schoolClasses.reduce(
        (acc, c) => acc + (c.sections?.length || 0),
        0
      ),
    };
  }, [schoolClasses]);

  /* ── Columns ── */
  const columns = [
    {
      title: "Class",
      dataIndex: "name",
      render: (name) => (
        <Space>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ApartmentOutlined style={{ color: "#6366f1" }} />
          </div>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Sections",
      dataIndex: "sections",
      render: (sections = []) => (
        <Space wrap>
          {sections.map((sec) => (
            <Tag
              key={sec._id}
              style={{
                borderRadius: 20,
                background: "#f0f9ff",
                color: "#0284c7",
                border: "1px solid #bae6fd",
              }}
            >
              {sec.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Subjects",
      dataIndex: "sections",
      render: (sections = []) => (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {sections.map((sec) => (
            <div key={sec._id}>
              <b style={{ color: "#1e293b" }}>{sec.name}:</b>{" "}
              {sec.subjects?.length
                ? sec.subjects.map((s) => s.name).join(", ")
                : "—"}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "",
      align: "right",
      render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
          fontFamily: "'Inter', sans-serif",
          colorBorder: "#e2e8f0",
        },
      }}
    >
      <div style={{ padding: 24 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            Classes
          </Title>
          <Text type="secondary">
            Manage classes, sections & subjects
          </Text>
        </div>

        {/* ── Stats ── */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={12} md={6}>
            <Card>
              <Text type="secondary">Total Classes</Text>
              <Title level={3}>{stats.total}</Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Text type="secondary">Total Sections</Text>
              <Title level={3}>{stats.sections}</Title>
            </Card>
          </Col>
        </Row>

        {/* ── Main Card ── */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              borderBottom: "1px solid #f1f5f9",
              background: "#fff",
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search classes..."
              allowClear
              onChange={(e) => setFilterText(e.target.value)}
              style={{ width: 260, borderRadius: 8 }}
            />

            <Button type="primary" icon={<PlusOutlined />}>
              Add Class
            </Button>
          </div>

          {/* Content */}
          <div style={{ padding: 16 }}>
            {screens.md ? (
              <Table
                columns={columns}
                dataSource={filteredItems}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 8 }}
                showHeader={true}
                style={{ borderRadius: 12 }}
                locale={{
                  emptyText: (
                    <Empty description="No classes found" />
                  ),
                }}
              />
            ) : (
              <Suspense fallback={<Spin />}>
                <MobileCards data={filteredItems} />
              </Suspense>
            )}
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Classes;