import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  activeUser,
} from "../../../features/authSlice";

import {
  Layout,
  Table,
  Button,
  Tag,
  Avatar,
  Modal,
  Typography,
  Space,
  message,
  Card,
  Flex,
} from "antd";

import {
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";

import RegisterFrom from "../../../components/forms/RegisterFrom";

const { Content } = Layout;
const { Text } = Typography;

const Admins = () => {
  const dispatch = useDispatch();

  const {
    users = [],
    isLoading,
    error,
    user: currentUser,
  } = useSelector((state) => state.auth || {});
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    dispatch(fetchAllUser({
  roleName: ["School Admin"],
  isActive: true
}));
  }, [dispatch]);

  /* ================= TOGGLE STATUS ================= */
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }

    Modal.confirm({
      title: user.isActive ? "Deactivate User?" : "Activate User?",
      content: `Are you sure you want to ${
        user.isActive ? "deactivate" : "activate"
      } this user?`,
      okText: "Yes",
      cancelText: "No",

      onOk: async () => {
        try {
          if (user.isActive) {
            await dispatch(deleteUser(user._id)).unwrap(); // ✅ deactivate
          } else {
            await dispatch(activeUser(user._id)).unwrap(); // ✅ activate
          }

          // ✅ refresh list
          dispatch(
            fetchAllUser({
              roleName: ["School Admin"],
              isActive: true,
            })
          );
        } catch (err) {
          message.error("Operation failed");
          console.error(err);
        }
      },
    });
  };

  /* ================= SAFE FILTER ================= */
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users;
  }, [users]);
 
  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={!record.avatar && <UserOutlined />}
          />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: ["role", "name"],
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      render: (school) => school || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) =>
        isActive ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="red" icon={<StopOutlined />}>
            Inactive
          </Tag>
        ),
    },
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <Button
          danger={record.isActive}
          type={record.isActive ? "default" : "primary"}
          onClick={() => handleToggleStatus(record)}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 24, background: "#f5f7fa", minHeight: "100vh" }}>
      <Content>
        {/* HEADER */}
        <Card style={{ marginBottom: 16 }} bordered={false}>
          <Flex justify="space-between" align="center" wrap="wrap">
            <div>
              <Typography.Title level={4} style={{ marginBottom: 0 }}>
                School Admin Management
              </Typography.Title>
              <Typography.Text type="secondary">
                Manage school administrators
              </Typography.Text>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Add School Admin
            </Button>
          </Flex>
        </Card>

        {/* ERROR */}
        {error && (
          <Text type="danger" style={{ marginBottom: 12, display: "block" }}>
            {error}
          </Text>
        )}

        {/* TABLE */}
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 10 }}
          bordered
          style={{ background: "#fff", borderRadius: 8 }}
        />

        {/* MODAL */}
        <Modal
          title="Register New School Admin"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={720}
          destroyOnClose
        >
          <RegisterFrom onClose={() => setIsModalOpen(false)} />
        </Modal>
      </Content>
    </Layout>
  );
};

export default Admins;