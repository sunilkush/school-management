import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import {
  Card,
  Typography,
  Tabs,
  Button,
  Tag,
  Space,
  Flex,
  message,
} from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { FaUserCircle } from "react-icons/fa";
import {
  fetchAllUser,
  deleteUser,
  activeUser,
} from "../../../features/authSlice";

const { Title, Text } = Typography;

const Transport = () => {
  const dispatch = useDispatch();
  const { users = [], loading, user: currentUser } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

  // ✅ Filter Drivers & Transporters
  const drivers = useMemo(
    () => users.filter((u) => u?.role?.name === "Driver"),
    [users]
  );

  const transporters = useMemo(
    () => users.filter((u) => u?.role?.name === "Transporter"),
    [users]
  );

  // ✅ Activate / Deactivate
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }

    dispatch(
      user.isActive
        ? deleteUser({ id: user._id, isActive: false })
        : activeUser({ id: user._id, isActive: true })
    ).then(() => dispatch(fetchAllUser()));
  };

  // ✅ Common Columns
  const columns = [
    {
      name: "#",
      selector: (_, index) => index + 1,
      width: "60px",
    },
    {
      name: "Avatar",
      cell: (row) =>
        row.avatar ? (
          <img
            src={row.avatar}
            alt="avatar"
            style={{ width: 36, height: 36, borderRadius: "50%" }}
          />
        ) : (
          <FaUserCircle size={28} color="#9CA3AF" />
        ),
      width: "80px",
    },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    {
      name: "School",
      selector: (row) => row.school?.name || "—",
    },
    {
      name: "Status",
      cell: (row) => (
        <Tag color={row.isActive ? "green" : "red"}>
          {row.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <Button
          size="small"
          type="primary"
          danger={row.isActive}
          onClick={() => handleToggleStatus(row)}
        >
          {row.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
      width: "140px",
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* 🚍 Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Transport Management
            </Title>
            <Text type="secondary">
              Manage drivers and transporters across schools
            </Text>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchAllUser())}
            >
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Transport User
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* 🚚 Tabs */}
      <Card bordered={false}>
        <Tabs
          defaultActiveKey="drivers"
          items={[
            {
              key: "drivers",
              label: `Drivers (${drivers.length})`,
              children: (
                <DataTable
                  columns={columns}
                  data={drivers}
                  progressPending={loading}
                  pagination
                  highlightOnHover
                  striped
                  responsive
                  noDataComponent="No drivers found"
                />
              ),
            },
            {
              key: "transporters",
              label: `Transporters (${transporters.length})`,
              children: (
                <DataTable
                  columns={columns}
                  data={transporters}
                  progressPending={loading}
                  pagination
                  highlightOnHover
                  striped
                  responsive
                  noDataComponent="No transporters found"
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Transport;
