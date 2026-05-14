import React, { useEffect, useMemo, useState } from "react";
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
  Grid,
  Avatar,
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
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  currentUser,
} from "../../../../features/authSlice";

import RegisterForm from "../../../../components/forms/RegisterForm";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const TeacherList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const { users = [] } = useSelector((state) => state.auth);
  const loggedInUser = useSelector((state) => state.auth.user);

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [modal, contextHolder] = Modal.useModal();

  const schoolId = loggedInUser?.school?._id;

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ isActive: true }));
  }, [dispatch, schoolId]);

  const handleDelete = (id) => {
    modal.confirm({
      title: "Delete user?",
      content: "This user will be permanently deleted.",
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        setDeletingId(id);
        try {
          await dispatch(deleteUser(id)).unwrap();
          dispatch(fetchAllUser({ isActive: true }));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u?.isActive) return false;
      if (u?.school?._id !== schoolId) return false;

      const role = u?.role?.name?.toLowerCase();
      if (role === "student") return false;

      const keyword = searchText.toLowerCase();

      const matchSearch =
        u?.name?.toLowerCase().includes(keyword) ||
        u?.email?.toLowerCase().includes(keyword) ||
        u?.phone?.toLowerCase?.().includes(keyword);

      const matchRole = selectedRole === "all" || role === selectedRole;

      return matchSearch && matchRole;
    });
  }, [users, schoolId, searchText, selectedRole]);

  const roleOptions = useMemo(() => {
    const roleMap = new Map();

    users.forEach((u) => {
      if (!u?.isActive) return;
      if (u?.school?._id !== schoolId) return;

      const roleName = u?.role?.name?.trim();
      if (!roleName || roleName.toLowerCase() === "student") return;

      const roleValue = roleName.toLowerCase();

      if (!roleMap.has(roleValue)) {
        roleMap.set(roleValue, roleName);
      }
    });

    return [...roleMap.entries()].map(([value, label]) => ({
      value,
      label,
    }));
  }, [users, schoolId]);

  const stats = useMemo(() => {
    return {
      total: filteredUsers.length,
      active: filteredUsers.filter((u) => u?.isActive).length,
      roles: roleOptions.length,
    };
  }, [filteredUsers, roleOptions]);

  const columns = [
    {
      title: "User",
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            size={42}
            style={{
              background: "linear-gradient(135deg, #1677ff, #69b1ff)",
              fontWeight: 700,
            }}
          >
            {record?.name?.charAt(0)?.toUpperCase() || <UserOutlined />}
          </Avatar>

          <div>
            <Text strong style={{ fontSize: 14 }}>
              {record?.name || "Unnamed User"}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record?.email || "No email"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      render: (_, r) => (
        <Tag color="blue" style={{ borderRadius: 999, padding: "2px 10px" }}>
          {r?.role?.name || "N/A"}
        </Tag>
      ),
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
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              shape="circle"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(
                  `/dashboard/schooladmin/users/employee-form?id=${record._id}`
                )
              }
            />
          </Tooltip>

          <Tooltip title="View">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(
                  `/dashboard/schooladmin/users/employee-details?id=${record._id}`
                )
              }
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              loading={deletingId === record._id}
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 14,
        },
      }}
    >
      {contextHolder}

      <div className="users-page">
        <div className="page-hero">
          <div>
            <div className="eyebrow">School Staff Directory</div>
            <Title level={isMobile ? 4 : 3} className="page-title">
              Users Management
            </Title>
            <Text type="secondary">
              Manage teachers, admins and staff users in one place.
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="hero-add-btn"
          >
            Add User
          </Button>
        </div>

        <Row gutter={[14, 14]} className="stats-row">
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <div className="stat-icon blue">
                <TeamOutlined />
              </div>
              <div>
                <Text type="secondary">Total Users</Text>
                <div className="stat-value">{stats.total}</div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <div className="stat-icon green">
                <SafetyCertificateOutlined />
              </div>
              <div>
                <Text type="secondary">Active</Text>
                <div className="stat-value">{stats.active}</div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <div className="stat-icon purple">
                <UserOutlined />
              </div>
              <div>
                <Text type="secondary">Roles</Text>
                <div className="stat-value">{stats.roles}</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="content-card">
          <div className="toolbar">
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search by name, email or phone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />

            <Select
              size="large"
              value={selectedRole}
              onChange={setSelectedRole}
              className="role-select"
            >
              <Option value="all">All Roles</Option>
              {roleOptions.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>

            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchAllUser({ isActive: true }))}
            >
              Refresh
            </Button>
          </div>

          {filteredUsers.length === 0 ? (
            <Empty
              style={{ padding: "48px 0" }}
              description="No users found"
            />
          ) : isMobile ? (
            <div className="mobile-list">
              {filteredUsers.map((user) => (
                <Card key={user._id} className="user-mobile-card">
                  <div className="mobile-user-top">
                    <Space size={12}>
                      <Avatar
                        size={46}
                        style={{
                          background:
                            "linear-gradient(135deg, #1677ff, #69b1ff)",
                          fontWeight: 800,
                        }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || <UserOutlined />}
                      </Avatar>

                      <div>
                        <Text strong>{user?.name || "Unnamed User"}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {user?.email || "No email"}
                        </Text>
                      </div>
                    </Space>

                    <Badge status="success" />
                  </div>

                  <div className="mobile-user-meta">
                    <Tag color="blue">{user?.role?.name || "N/A"}</Tag>
                    <Tag color={user?.isActive ? "green" : "red"}>
                      {user?.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>

                  <div className="mobile-actions">
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() =>
                        navigate(
                          `/dashboard/schooladmin/users/employee-details?id=${user._id}`
                        )
                      }
                    >
                      View
                    </Button>

                    <Button
                      icon={<EditOutlined />}
                      onClick={() =>
                        navigate(
                          `/dashboard/schooladmin/users/employee-form?id=${user._id}`
                        )
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={deletingId === user._id}
                      onClick={() => handleDelete(user._id)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="_id"
              pagination={{
                pageSize: isTablet ? 6 : 10,
                showSizeChanger: true,
              }}
              scroll={{ x: 800 }}
              className="users-table"
            />
          )}
        </Card>

        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          width={isMobile ? "96%" : 680}
          centered
          destroyOnClose
          title="Add New User"
        >
          <RegisterForm onClose={() => setIsModalOpen(false)} />
        </Modal>
      </div>

      <style>{`
        .users-page {
          min-height: 100%;
         
         
        }

        .page-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .eyebrow {
          color: #1677ff;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .page-title {
          margin: 0 !important;
          font-weight: 900 !important;
          color: #101828 !important;
        }

        .hero-add-btn {
          border-radius: 14px;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(22, 119, 255, 0.25);
        }

        .stats-row {
          margin-bottom: 16px;
        }

        .stat-card {
          border: 0;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .stat-card .ant-card-body {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
        }

        .stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .stat-icon.blue {
          background: #eaf3ff;
          color: #1677ff;
        }

        .stat-icon.green {
          background: #eafaf4;
          color: #0ea472;
        }

        .stat-icon.purple {
          background: #f4efff;
          color: #722ed1;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 900;
          color: #101828;
          line-height: 1;
          margin-top: 5px;
        }

        .content-card {
          border: 0;
          border-radius: 24px;
          box-shadow: 0 16px 45px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .toolbar {
          display: grid;
          grid-template-columns: 1fr 220px auto;
          gap: 12px;
          margin-bottom: 18px;
        }

        .search-input,
        .role-select {
          width: 100%;
        }

        .users-table .ant-table {
          border-radius: 16px;
          overflow: hidden;
        }

        .users-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #667085;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .mobile-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-mobile-card {
          border-radius: 18px;
          border: 1px solid #edf2f7;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        }

        .user-mobile-card .ant-card-body {
          padding: 14px;
        }

        .mobile-user-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .mobile-user-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .mobile-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 44px;
          gap: 8px;
          margin-top: 14px;
        }

        .mobile-actions .ant-btn {
          border-radius: 12px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .users-page {
            padding: 12px;
          }

          .page-hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-add-btn {
            width: 100%;
          }

          .toolbar {
            grid-template-columns: 1fr;
          }

          .content-card {
            border-radius: 18px;
          }

          .content-card .ant-card-body {
            padding: 14px;
          }

          .stat-card .ant-card-body {
            padding: 14px;
          }

          .stat-value {
            font-size: 22px;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default TeacherList;