import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Tooltip,
  Modal,
  Popconfirm,
  Tag,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser, deleteUser ,currentUser} from "../../../features/authSlice";
import RegisterForm from "../../../components/forms/RegisterFrom";
import { useNavigate } from "react-router-dom";
import memoryStorage from "../../../utils/memoryStorage";

const { Title } = Typography;

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const {users=[]} = useSelector((state) => state.auth) || [];
  const loggedInUser = useSelector((state) => state.auth.user);
  const hasFetchedUsers = useSelector(state => state.auth.hasFetchedUsers);
  // Local state
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stable schoolId
  const schoolId = useMemo(
    () => loggedInUser?.school?._id || null,
    [loggedInUser?.school?._id]
  );

  // Role
  const role =
    loggedInUser?.role?.name ||
    JSON.parse(memoryStorage.getItem("user"))?.role?.name;



 useEffect(() => {
  if (!hasFetchedUsers) {
    dispatch(fetchAllUser());
    dispatch(currentUser())
  }
}, [dispatch, hasFetchedUsers]);

  // Filter users based on role
  const filteredUsers = useMemo(() => {
    return users?.filter((u) => {
      if (!u.isActive) return false;
      if (u.school?._id !== schoolId) return false;

      const userRole = u.role?.name?.toLowerCase();

      if (role?.toLowerCase() === "teacher") {
        return userRole === "student";
      }

      if (role?.toLowerCase() === "school admin") {
        if (selectedRole === "all") {
          return !["super admin", "student", "parent"].includes(userRole);
        }
        return userRole === selectedRole;
      }

      return false;
    });
  }, [users, schoolId, role, selectedRole]);

  // Table columns
  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      responsive: ["md"],
    },
    {
      title: "Role",
      render: (_, record) => <Tag color="blue">{record.role?.name}</Tag>,
    },
    {
      title: "School",
      render: (_, record) => record.school?.name || "—",
      responsive: ["lg"],
    },
    {
      title: "Actions",
      align: "center",
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

          <Popconfirm
            title="Delete User?"
            description="This user will be deactivated."
            okText="Yes"
            cancelText="No"
            onConfirm={() => dispatch(deleteUser(record._id))} // ✅ Fixed
          >
            <Button danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        {/* Header */}
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", marginBottom: 16 }}
        >
          <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
            <Title level={4}>
              {role?.toLowerCase() === "teacher"
                ? "Students List"
                : "Teachers & Staff"}
            </Title>

            {role?.toLowerCase() === "school admin" && (
              <Space wrap>
                <Select
                  value={selectedRole}
                  style={{ minWidth: 160 }}
                  onChange={setSelectedRole}
                  options={[
                    { value: "all", label: "All Roles" },
                    { value: "teacher", label: "Teachers" },
                    { value: "staff", label: "Staff" },
                    { value: "accountant", label: "Accountants" },
                    { value: "librarian", label: "Librarians" },
                  ]}
                />

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Add Staff
                </Button>
              </Space>
            )}
          </Space>

          {/* Table */}
          <Table
            className="mt-4"
            loading={!users.length}
            columns={columns}
            dataSource={filteredUsers}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        </Space>
      </Card>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        footer={null}
        destroyOnClose
        onCancel={() => setIsModalOpen(false)}
        width={600}
        title="Register Staff"
      >
        <RegisterForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
};

export default UsersPage;