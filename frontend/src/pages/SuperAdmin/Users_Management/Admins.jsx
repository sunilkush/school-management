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
  Card, Flex
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
  const { users = [], loading, error, user: currentUser } = useSelector(
    (state) => state.auth
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

  /* ================= TOGGLE USER STATUS ================= */
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }

    Modal.confirm({
      title: user.isActive ? "Deactivate User?" : "Activate User?",
      content: `Are you sure you want to ${user.isActive ? "deactivate" : "activate"
        } this user?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        dispatch(
          user.isActive
            ? deleteUser({ id: user._id, isActive: false })
            : activeUser({ id: user._id, isActive: true })
        ).then(() => dispatch(fetchAllUser()));
      },
    });
  };

  /* ================= FILTER ONLY SCHOOL ADMINS ================= */
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) => u.role?.name?.toLowerCase() === "school admin"
    );
  }, [users]);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
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
      key: "role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      key: "school",
      render: (school) => school || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
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
      key: "action",
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
        {/* ================= HEADER ================= */}
        <Card
          style={{ marginBottom: 16 }}
          bordered={false}
        >
          <Flex justify="space-between" align="center" wrap="wrap">
            <div>
              <Typography.Title level={4} style={{ marginBottom: 0 }}>
                School Admin Management
              </Typography.Title>
              <Typography.Text type="secondary">
                Manage school administrators across all schools
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


        {/* ================= ERROR ================= */}
        {error && (
          <Text type="danger" style={{ marginBottom: 12, display: "block" }}>
            {error}
          </Text>
        )}

        {/* ================= TABLE ================= */}
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 10 }}
          bordered
          style={{ background: "#fff", borderRadius: 8 }}
        />

        {/* ================= MODAL ================= */}
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
