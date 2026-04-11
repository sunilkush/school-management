import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  Select,
  Table,
  Typography,
  Tag,
  Tooltip,
  Spin,
  Empty,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../../../features/roleSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const Permissions = () => {
  const dispatch = useDispatch();
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  const { schools = [] } = useSelector((state) => state.school);
  const { roles = [], loading } = useSelector((state) => state.role);
  
  /* ================= LOAD DATA ================= */

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchRoleBySchool(selectedSchoolId));
    } else {
      dispatch(fetchRoles());
    }
  }, [dispatch, selectedSchoolId]);

  /* ================= PREPARE MODULES ================= */

  const modules = useMemo(() => {
    return Array.from(
      new Set(
        roles.flatMap((role) =>
          role.permissions?.map((perm) => perm.module)
        )
      )
    ).sort();
  }, [roles]);

  /* ================= TABLE DATA ================= */

  const dataSource = modules.map((module, index) => {
    const row = { key: index, module };
    roles.forEach((role) => {
      row[role._id] = role.permissions?.some(
        (p) => p.module === module && p.actions?.length
      );
    });
    return row;
  });

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      fixed: "left",
      width: 220,
      render: (text) => <Text strong>{text}</Text>,
    },
    ...roles.map((role) => ({
      title: role.name,
      dataIndex: role._id,
      key: role._id,
      align: "center",
      render: (value) =>
        value ? (
          <Tooltip title="Permission Granted">
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Yes
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="No Permission">
            <Tag color="red" icon={<CloseCircleOutlined />}>
              No
            </Tag>
          </Tooltip>
        ),
    })),
  ];

  /* ================= UI ================= */

  return (
    <Card className="shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <Title level={4} className="mb-0">
            Permissions Matrix
          </Title>
          <Text type="secondary">
            View module-wise permissions for each role
          </Text>
        </div>

        <Select
          allowClear
          placeholder="Global Roles"
          style={{ minWidth: 260 }}
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
        >
          {schools.map((school) => (
            <Option key={school._id} value={school._id}>
              {school.name}
            </Option>
          ))}
        </Select>
      </div>

      {/* Status */}
      <div className="mb-3">
        <Tag color={selectedSchoolId ? "blue" : "default"}>
          {selectedSchoolId ? "School Specific Permissions" : "Global Permissions"}
        </Tag>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : dataSource.length === 0 ? (
        <Empty description="No permissions found" />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          bordered
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      )}
    </Card>
  );
};

export default Permissions;
