import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, Typography, Tag, Input, Space } from "antd";
import { fetchAllUser } from "../../../features/authSlice";

const { Title, Text } = Typography;
const { Search } = Input;

const ParentsPage = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");

  const { users = [], user: loggedInUser, loading } = useSelector(
    (state) => state.auth || {}
  );

  const schoolId = loggedInUser?.school?._id;

  // 🔹 Fetch users
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllUser(schoolId));
    }
  }, [dispatch, schoolId]);

  // 🔹 Parents + Search Filter (Optimized with useMemo)
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

  // 🔹 Table Columns
  const columns = [
    {
      title: "#",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Parent Name",
      dataIndex: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone) => phone || "—",
    },
    {
      title: "Role",
      align: "center",
      render: () => <Tag color="green">Parent</Tag>,
    },
    {
      title: "School",
      render: (_, record) => record.school?.name || "—",
    },
  ];

  return (
    <Card bordered={false}>
      {/* Header with Search */}
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
        wrap
      >
        <Title level={4} style={{ margin: 0 }}>
          Parents List
        </Title>

        <Search
          placeholder="Search by name, email or phone"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />
      </Space>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={parentsList}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />
    </Card>
  );
};

export default ParentsPage;
