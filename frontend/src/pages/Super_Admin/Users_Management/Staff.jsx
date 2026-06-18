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
  Popconfirm,
} from "antd";
import { ReloadOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
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
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearToggle, setClearToggle] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  }, [dispatch]);

  const staffs = useMemo(() => {
    let data = users.filter((u) => u?.role?.name === "Staff");
    if (selectedSchool !== "All") {
      data = data.filter((u) => u.school?.name === selectedSchool);
    }
    return data;
  }, [users, selectedSchool]);

  const schoolNames = [
    "All",
    ...new Set(schools.map((s) => s.name).filter(Boolean)),
  ];

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

  const handleBulkAction = async (activate) => {
    const targets = selectedRows.filter((r) => r._id !== currentUser?._id);
    if (!targets.length) {
      message.warning("No eligible rows selected");
      return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(
        targets.map((r) =>
          dispatch(
            activate
              ? activeUser({ id: r._id, isActive: true })
              : deleteUser({ id: r._id, isActive: false })
          )
        )
      );
      message.success(`${targets.length} staff member(s) ${activate ? "activated" : "deactivated"}`);
      setClearToggle((v) => !v);
      setSelectedRows([]);
      dispatch(fetchAllUser());
    } catch {
      message.error("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = [
    { name: "#", selector: (_, index) => index + 1, width: "60px" },
    {
      name: "Avatar",
      cell: (row) =>
        row.avatar ? (
          <img
            src={row.avatar}
            alt="avatar"
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <FaUserCircle size={28} color="#9CA3AF" />
        ),
      width: "80px",
    },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "School", selector: (row) => row.school?.name || "—" },
    {
      name: "Status",
      sortable: true,
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
      width: "150px",
    },
  ];

  if (error)
    return <Text type="danger" className="block text-center mt-6">{error}</Text>;

  return (
    <div style={{ padding: 16 }}>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>Staff Management</Title>
            <Text type="secondary">Manage all staff members across schools</Text>
          </div>
          <Space>
            <Select value={selectedSchool} onChange={setSelectedSchool} style={{ width: 220 }}>
              {schoolNames.map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAllUser())}>Refresh</Button>
          </Space>
        </Flex>
      </Card>

      <Card bordered={false}>
        {selectedRows.length > 0 && (
          <Flex
            align="center"
            gap={8}
            style={{ background: "#f0f5ff", borderRadius: 8, padding: "8px 14px", marginBottom: 12 }}
          >
            <Text strong>{selectedRows.length} selected</Text>
            <Popconfirm
              title={`Activate ${selectedRows.length} staff member(s)?`}
              onConfirm={() => handleBulkAction(true)}
              okText="Activate"
            >
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={bulkLoading}>
                Activate Selected
              </Button>
            </Popconfirm>
            <Popconfirm
              title={`Deactivate ${selectedRows.length} staff member(s)?`}
              onConfirm={() => handleBulkAction(false)}
              okText="Deactivate"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<StopOutlined />} loading={bulkLoading}>
                Deactivate Selected
              </Button>
            </Popconfirm>
          </Flex>
        )}
        <DataTable
          columns={columns}
          data={staffs}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          selectableRows
          onSelectedRowsChange={({ selectedRows: rows }) => setSelectedRows(rows)}
          clearSelectedRows={clearToggle}
          noDataComponent="No staff found"
          customStyles={{ headCells: { style: { fontWeight: 600, backgroundColor: "#F9FAFB" } } }}
        />
      </Card>
    </div>
  );
};

export default Staff;
