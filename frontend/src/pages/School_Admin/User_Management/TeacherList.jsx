import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Modal,
  Space,
  Select,
  Empty,
  Tag,
  Typography,
  Tooltip,
  Badge,
  Row,
  Col,
  ConfigProvider,
} from "antd";

import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  currentUser,
} from "../../../features/authSlice";

import RegisterForm from "../../../components/forms/RegisterFrom";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

const TeacherList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users = [], hasFetchedUsers, Loading } = useSelector(
    (state) => state.auth
  );
  
  const loggedInUser = useSelector((state) => state.auth.user);
 
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // ✅ AntD v5 Modal fix
  const [modal, contextHolder] = Modal.useModal();
 
  const schoolId = loggedInUser?.school?._id;

  /* ── Fetch ── */
  useEffect(() => {
    if (!hasFetchedUsers) {
         dispatch(fetchAllUser({
        roleName: ["Teacher", "Staff"],
        isActive: true
      }));
      dispatch(currentUser());
    }
  }, [dispatch, hasFetchedUsers, schoolId]);

  /* ── Delete Handler ── */
  const handleDelete = (id) => {
    modal.confirm({
      title: "Are you sure?",
      content: "This user will be permanently deleted",
      okText: "Yes",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => {
        setDeletingId(id);

        try {
          await dispatch(deleteUser(id)).unwrap();
          await dispatch(fetchAllUser());
        } catch (error) {
          console.error("Delete failed:", error);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  /* ── Filter Users ── */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u?.isActive) return false;
      if (u?.school?._id !== schoolId) return false;

      const role = u?.role?.name?.toLowerCase();

      if (!["teacher", "staff"].includes(role)) return false;

      const matchSearch =
        u?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        u?.email?.toLowerCase().includes(searchText.toLowerCase());

      const matchRole =
        selectedRole === "all" || role === selectedRole;

      return matchSearch && matchRole;
    });
  }, [users, schoolId, searchText, selectedRole]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u?.isActive).length,
      roles: new Set(users.map((u) => u?.role?.name)).size,
    };
  }, [users]);

  /* ── Columns ── */
  const columns = [
    {
      title: "User",
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#6366f1",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            {record?.name?.charAt(0)}
          </div>
          <div>
            <Text strong>{record?.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      render: (_, r) => <Tag color="blue">{r?.role?.name}</Tag>,
    },
    {
      title: "Status",
      render: (_, r) => (
        <Badge
          status={r?.isActive ? "success" : "error"}
          text={r?.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() =>
                navigate(
                  `/dashboard/schooladmin/users/employee-from?id=${record._id}`
                )
              }
            />
          </Tooltip>

          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              type="text"
              onClick={() =>
                navigate(
                  `/dashboard/schooladmin/users/employee-detailes?id=${record._id}`
                )
              }
            />
          </Tooltip>

          <Button
            danger
            icon={<DeleteOutlined />}
            type="text"
            loading={deletingId === record._id}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
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
      {contextHolder} {/* ✅ IMPORTANT */}

      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Title level={4}>Users Management</Title>
          <Text type="secondary">Manage staff & teachers</Text>
        </div>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          {[
            { title: "Total Users", value: stats.total, icon: <TeamOutlined /> },
            { title: "Active", value: stats.active, icon: <UserOutlined /> },
            { title: "Roles", value: stats.roles, icon: <UserOutlined /> },
            { title: "Showing", value: filteredUsers.length, icon: <UserOutlined /> },
          ].map((s) => (
            <Col xs={12} sm={6} key={s.title}>
              <Card>
                <Space>
                  {s.icon}
                  <div>
                    <Text type="secondary">{s.title}</Text>
                    <br />
                    <Text strong>{s.value}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <Space>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search user..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Select value={selectedRole} onChange={setSelectedRole} style={{ width: 160 }}>
                <Option value="all">All Roles</Option>
                <Option value="teacher">Teacher</Option>
                <Option value="staff">Staff</Option>
              </Select>

              <Button
                icon={<ReloadOutlined />}
                loading={Loading}
                onClick={() => dispatch(fetchAllUser())}
              />
            </Space>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Add User
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="_id"
            loading={Loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No users found" /> }}
          />
        </Card>

        {/* Add User Modal */}
        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          title="Add New User"
          width={600}
        >
          <RegisterForm onClose={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default TeacherList;