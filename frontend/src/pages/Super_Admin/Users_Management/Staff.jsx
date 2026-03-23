import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import {
  fetchAllUser,
  deleteUser,
  activeUser,
} from "../../../features/authSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import {
  Card,
  Select,
  Typography,
  Button,
  Tag,
  Flex,
  Space,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { FaUserCircle } from "react-icons/fa";

const { Option } = Select;
const { Title, Text } = Typography;

const Staff = () => {
  const dispatch = useDispatch();

  const { users = [], loading, error, user: currentUser } = useSelector(
    (state) => state.auth
  );
  const { schools = [] } = useSelector((state) => state.school);

  const [selectedSchool, setSelectedSchool] = useState("All");

  // 🔄 Initial Load
  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ Filter Staff (memoized for performance)
  const staffs = useMemo(() => {
    let data = users.filter((u) => u?.role?.name === "Staff");

    if (selectedSchool !== "All") {
      data = data.filter(
        (u) => u.school?.name === selectedSchool
      );
    }

    return data;
  }, [users, selectedSchool]);

  // 🏫 School dropdown options
  const schoolNames = [
    "All",
    ...new Set(schools.map((s) => s.name).filter(Boolean)),
  ];

  // 🔐 Activate / Deactivate (self-protection)
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      message.warning("You cannot change your own status");
      return;
    }

    dispatch(
      user.isActive
        ? deleteUser({ id: user._id, isActive: false })
        : activeUser({ id: user._id, isActive: true })
    ).then(() => {
      message.success("Status updated successfully");
      dispatch(fetchAllUser());
    });
  };

  // 📊 Table Columns
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
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <FaUserCircle size={28} color="#9CA3AF" />
        ),
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
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
      sortable: true,
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
      width: "150px",
    },
  ];

  // ❌ Error State
  if (error) {
    return (
      <Text type="danger" className="block text-center mt-6">
        {error}
      </Text>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* 🧠 HEADER */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Staff Management
            </Title>
            <Text type="secondary">
              Manage all staff members across schools
            </Text>
          </div>

          <Space>
            <Select
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 220 }}
            >
              {schoolNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchAllUser())}
            >
              Refresh
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* 📋 TABLE */}
      <Card bordered={false}>
        <DataTable
          columns={columns}
          data={staffs}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          noDataComponent="No staff found"
          customStyles={{
            headCells: {
              style: {
                fontWeight: 600,
                backgroundColor: "#F9FAFB",
              },
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Staff;
