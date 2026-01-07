import React, { useEffect, useState } from "react";
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
import { fetchAllUser, deleteUser } from "../../../features/authSlice";
import RegisterForm from "../../../components/forms/RegisterFrom";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users = [], user: loggedInUser } = useSelector((state) => state.auth);

  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const schoolId = loggedInUser?.school?._id;
  const role =
    loggedInUser?.role?.name ||
    JSON.parse(localStorage.getItem("user"))?.role?.name;

  // Fetch users
  useEffect(() => {
    dispatch(fetchAllUser(schoolId));
  }, [dispatch, schoolId]);

  // Filter users based on role
  const filteredUsers = users?.filter((u) => {
    if (!u.isActive) return false;
    const sameSchool = u.school?._id === schoolId;

    if (role?.toLowerCase() === "teacher") {
      return sameSchool && u.role?.name?.toLowerCase() === "student";
    }

    if (role?.toLowerCase() === "school admin") {
      if (selectedRole === "all") {
        return sameSchool && ["teacher", "school admin"].includes(u.role?.name?.toLowerCase());
      }
      return sameSchool && u.role?.name?.toLowerCase() === selectedRole;
    }

    return false;
  });

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
                navigate(`/dashboard/schooladmin/users/employee-from?id=${record._id}`)
              }
            />
          </Tooltip>

          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              type="text"
              onClick={() =>
                navigate(`/dashboard/schooladmin/users/employee-detailes?id=${record._id}`)
              }
            />
          </Tooltip>

          <Popconfirm
            title="Delete User?"
            description="This user will be deactivated."
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              dispatch(deleteUser({ id: record._id, isActive: false }))
                .unwrap()
                .then(() => dispatch(fetchAllUser(schoolId)))
            }
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
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Title level={4}>
              {role?.toLowerCase() === "teacher" ? "Students List" : "Teachers & Staff"}
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
                    { value: "school admin", label: "School Admins" },
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
