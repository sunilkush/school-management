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
  Grid,
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

import RegisterForm from "../../../components/forms/RegisterForm";
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

  const { users = []} = useSelector((state) => state.auth);
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
      title: "Are you sure?",
      content: "This user will be permanently deleted",
      okType: "danger",
      onOk: async () => {
        setDeletingId(id);
        try {
          await dispatch(deleteUser(id)).unwrap();
          dispatch(fetchAllUser());
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

      const matchSearch =
        u?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        u?.email?.toLowerCase().includes(searchText.toLowerCase());

      const matchRole =
        selectedRole === "all" || role === selectedRole;

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
      active: filteredUsers.length,
      roles: roleOptions.length,
    };
  }, [filteredUsers, roleOptions]);

  const columns = [
    {
      title: "User",
      render: (_, record) => (
        <Space>
          <div className="avatar">
            {record?.name?.charAt(0)}
          </div>
          <div>
            <Text strong>{record?.name}</Text>
            <br />
            <Text type="secondary">{record?.email}</Text>
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
          <Button
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/dashboard/schooladmin/users/employee-form?id=${record._id}`)
            }
          />
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/dashboard/schooladmin/users/employee-details?id=${record._id}`)
            }
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deletingId === record._id}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider>
      {contextHolder}

      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Title level={isMobile ? 5 : 4}>Users Management</Title>

        {/* Stats */}
        <Row gutter={[12, 12]}>
          {[
            { title: "Total", value: stats.total },
            { title: "Active", value: stats.active },
            { title: "Roles", value: stats.roles },
          ].map((s) => (
            <Col xs={12} md={6} key={s.title}>
              <Card size="small">
                <Text>{s.title}</Text>
                <br />
                <Text strong>{s.value}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: 20 }}>
          {/* Filters */}
          <Row gutter={[10, 10]}>
            <Col xs={24} md={8}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search..."
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: "100%" }}
              >
                <Option value="all">All</Option>
                {roleOptions.map((r) => (
                  <Option key={r.value} value={r.value}>
                    {r.label}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={12} md={4}>
              <Button
                block
                icon={<ReloadOutlined />}
                onClick={() => dispatch(fetchAllUser())}
              >
                Refresh
              </Button>
            </Col>

            <Col xs={12} md={6}>
              <Button
                type="primary"
                block
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
              >
                Add
              </Button>
            </Col>
          </Row>

          {/* Mobile Card View */}
          {isMobile ? (
            <div style={{ marginTop: 16 }}>
              {filteredUsers.map((user) => (
                <Card key={user._id} style={{ marginBottom: 10 }}>
                  <Text strong>{user.name}</Text>
                  <br />
                  <Text>{user.email}</Text>
                  <br />
                  <Tag>{user.role?.name}</Tag>
                </Card>
              ))}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="_id"
              pagination={{ pageSize: isTablet ? 6 : 10 }}
              scroll={{ x: true }}
            />
          )}
        </Card>

        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          width={isMobile ? "100%" : 600}
        >
          <RegisterForm onClose={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default TeacherList;