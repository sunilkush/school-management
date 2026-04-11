import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Typography,
  Tag,
  Input,
  Space,
  Avatar,
  Row,
  Col,
  Empty,
  Badge,
  ConfigProvider,
} from "antd";

import {
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import { fetchAllUser } from "../../../features/authSlice";

const { Title, Text } = Typography;

const ParentsList = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");

  const { users = [], user: loggedInUser, loading } = useSelector(
    (state) => state.auth || {}
  );

  const schoolId = loggedInUser?.school?._id;

  /* ── Fetch ── */
  useEffect(() => {
    if (schoolId) {
         dispatch(fetchAllUser({
        roleName: ["Parent"],
        isActive: true
      }));
    }
  }, [dispatch, schoolId]);

  /* ── Filtered Parents ── */
  const parentsList = useMemo(() => {
    return users.filter((u) => {
      if (
        !u.isActive ||
        u.school?._id !== schoolId ||
        u.role?.name?.toLowerCase() !== "parent"
      )
        return false;

      if (!searchText) return true;

      const keyword = searchText.toLowerCase();
      return (
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.phone?.toLowerCase().includes(keyword)
      );
    });
  }, [users, schoolId, searchText]);
  
  /* ── Stats ── */
  const stats = useMemo(() => {
    const active = parentsList.length;
    return {
      total: users.filter((u) => u.role?.name === "parent").length,
      active,
      showing: parentsList.length,
    };
  }, [users, parentsList]);

  /* ── Columns ── */
  const columns = [
    {
      title: "Parent",
      dataIndex: "name",
      render: (name, record) => (
        <Space size={10}>
          <Avatar
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              name
            )}&background=6366f1&color=fff`}
          />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone) => phone || "—",
    },
    {
      title: "School",
      render: (_, record) => record.school?.name || "—",
    },
    {
      title: "Status",
      render: () => <Badge status="success" text="Active" />,
    },
    {
      title: "Role",
      render: () => (
        <Tag color="green" style={{ borderRadius: 20 }}>
          Parent
        </Tag>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
        },
      }}
    >
      <div style={{ padding: 24 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            Parents
          </Title>
          <Text type="secondary">
            {loggedInUser?.school?.name ?? "School"}
          </Text>
        </div>

        {/* ── Stats ── */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          {[
            {
              title: "Total Parents",
              value: stats.total,
              icon: <TeamOutlined />,
               bg: "#f0fdf4",
              color: "#16a34a",
            },
            {
              title: "Active",
              value: stats.active,
              icon: <UserOutlined />,
                bg: "#f0f9ff",
              color: "#0ea5e9",
            },
            {
              title: "Showing",
              value: stats.showing,
              icon: <FilterOutlined />,
               bg: "#fffbeb",
              color: "#f59e0b",
            },
          ].map((stat) => (
            <Col xs={12} sm={8} key={stat.title}>
              <Card>
                <Space>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: stat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <Text type="secondary">{stat.title}</Text>
                    <br />
                    <Text strong style={{ fontSize: 18 }}>
                      {stat.value}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Table Card ── */}
        <Card bodyStyle={{ padding: 0 }}>
          {/* Toolbar */}
          <div
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search parents..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={parentsList}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    searchText
                      ? "No parents found."
                      : "No parents available."
                  }
                />
              ),
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default ParentsList;