import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
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

const Students = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector(
    (state) => state.auth
  );
  const { schools = [] } = useSelector((state) => state.school);

  const [selectedSchool, setSelectedSchool] = useState("All");

  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ Filter students
  const students = useMemo(() => {
    let data = users.filter((u) => u?.role?.name === "Student");
    if (selectedSchool !== "All") {
      data = data.filter((s) => s.school?.name === selectedSchool);
    }
    return data;
  }, [users, selectedSchool]);

  const schoolNames = [
    "All",
    ...new Set(schools.map((s) => s.name).filter(Boolean)),
  ];

  // ✅ Toggle status (self-protection)
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

  // ✅ Columns
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

  if (error)
    return (
      <Text type="danger" className="block text-center mt-6">
        {error}
      </Text>
    );

  return (
    <div style={{ padding: 16 }}>
      {/* ✅ Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Student Management
            </Title>
            <Text type="secondary">
              Super Admin can manage students across all schools
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

      {/* ✅ Table */}
      <Card bordered={false}>
        <DataTable
          columns={columns}
          data={students}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          noDataComponent="No students found"
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

export default Students;
