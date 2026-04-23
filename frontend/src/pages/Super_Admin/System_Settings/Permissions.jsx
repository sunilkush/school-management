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
  Row,
  Col,
  Space,
  Button,
  List,
  message,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../../../features/roleSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const HIGH_RISK_ACTIONS = ["delete", "update", "assign-teachers", "assign-schools", "manage-payments", "manage-users"];

const Permissions = () => {
  const dispatch = useDispatch();
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [baseRoleId, setBaseRoleId] = useState(null);
  const [compareRoleId, setCompareRoleId] = useState(null);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);

  const { schools = [] } = useSelector((state) => state.school);
  const { roles = [], loading } = useSelector((state) => state.role);

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

  const modules = useMemo(() => {
    return Array.from(new Set(roles.flatMap((role) => role.permissions?.map((perm) => perm.module)))).sort();
  }, [roles]);

  const dataSource = modules.map((module, index) => {
    const row = { key: index, module };
    roles.forEach((role) => {
      row[role._id] = role.permissions?.some((p) => p.module === module && p.actions?.length);
    });
    return row;
  });

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
            <Tag color="green" icon={<CheckCircleOutlined />}>Yes</Tag>
          </Tooltip>
        ) : (
          <Tooltip title="No Permission">
            <Tag color="red" icon={<CloseCircleOutlined />}>No</Tag>
          </Tooltip>
        ),
    })),
  ];

  const roleOptions = roles.map((role) => ({ label: role.name, value: role._id }));

  const diffRows = useMemo(() => {
    const baseRole = roles.find((role) => role._id === baseRoleId);
    const compareRole = roles.find((role) => role._id === compareRoleId);
    if (!baseRole || !compareRole) return [];

    const baseMap = new Map((baseRole.permissions || []).map((perm) => [perm.module, new Set(perm.actions || [])]));
    const compareMap = new Map((compareRole.permissions || []).map((perm) => [perm.module, new Set(perm.actions || [])]));

    const unionModules = Array.from(new Set([...baseMap.keys(), ...compareMap.keys()]));

    return unionModules
      .map((module) => {
        const baseActions = baseMap.get(module) || new Set();
        const compareActions = compareMap.get(module) || new Set();

        const added = [...compareActions].filter((action) => !baseActions.has(action));
        const removed = [...baseActions].filter((action) => !compareActions.has(action));

        return {
          key: module,
          module,
          added,
          removed,
          highRisk: [...added, ...removed].filter((action) => HIGH_RISK_ACTIONS.includes(action)),
        };
      })
      .filter((row) => row.added.length || row.removed.length);
  }, [roles, baseRoleId, compareRoleId]);

  const queueApproval = (row) => {
    const entry = {
      id: `${Date.now()}-${row.module}`,
      module: row.module,
      riskActions: row.highRisk,
      status: "Pending Approval",
      requestedAt: new Date().toISOString(),
    };

    setApprovalQueue((prev) => [entry, ...prev]);
    setAuditTrail((prev) => [
      {
        id: `${entry.id}-audit`,
        message: `Approval requested for high-risk changes in ${row.module}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
    message.success("Approval request queued and audit log recorded");
  };

  const approveRequest = (id) => {
    setApprovalQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Approved" } : item)));
    setAuditTrail((prev) => [
      { id: `${id}-approved`, message: "High-risk permission change approved", timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  const diffColumns = [
    { title: "Module", dataIndex: "module", key: "module" },
    {
      title: "Added Actions",
      dataIndex: "added",
      key: "added",
      render: (items) => items.map((item) => <Tag key={item} color="green">+ {item}</Tag>),
    },
    {
      title: "Removed Actions",
      dataIndex: "removed",
      key: "removed",
      render: (items) => items.map((item) => <Tag key={item} color="red">- {item}</Tag>),
    },
    {
      title: "High-Risk",
      dataIndex: "highRisk",
      key: "highRisk",
      render: (items, row) => (
        <Space>
          {items.length ? items.map((item) => <Tag key={item} color="volcano">{item}</Tag>) : <Tag>None</Tag>}
          {items.length > 0 && <Button size="small" onClick={() => queueApproval(row)}>Request Approval</Button>}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <div>
            <Title level={4} className="mb-0">Permissions Matrix</Title>
            <Text type="secondary">View module-wise permissions for each role</Text>
          </div>

          <Select
            allowClear
            placeholder="Global Roles"
            style={{ minWidth: 260 }}
            value={selectedSchoolId}
            onChange={setSelectedSchoolId}
          >
            {schools.map((school) => (
              <Option key={school._id} value={school._id}>{school.name}</Option>
            ))}
          </Select>
        </div>

        <div className="mb-3">
          <Tag color={selectedSchoolId ? "blue" : "default"}>
            {selectedSchoolId ? "School Specific Permissions" : "Global Permissions"}
          </Tag>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spin size="large" /></div>
        ) : dataSource.length === 0 ? (
          <Empty description="No permissions found" />
        ) : (
          <Table columns={columns} dataSource={dataSource} bordered scroll={{ x: "max-content" }} pagination={{ pageSize: 10 }} size="middle" />
        )}
      </Card>

      <Card>
        <Title level={5}>Permission Diff Viewer</Title>
        <Text type="secondary">Compare two roles to see what changed, including high-risk actions.</Text>
        <Row gutter={[12, 12]} style={{ marginTop: 10 }}>
          <Col xs={24} md={8}>
            <Select placeholder="Base role" options={roleOptions} value={baseRoleId} onChange={setBaseRoleId} style={{ width: "100%" }} />
          </Col>
          <Col xs={24} md={8}>
            <Select placeholder="Compare role" options={roleOptions} value={compareRoleId} onChange={setCompareRoleId} style={{ width: "100%" }} />
          </Col>
        </Row>

        <Table
          style={{ marginTop: 12 }}
          rowKey="key"
          columns={diffColumns}
          dataSource={diffRows}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: "Select roles to compare" }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="High-Risk Approval Queue">
            <List
              dataSource={approvalQueue}
              locale={{ emptyText: "No approval requests" }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.status !== "Approved" ? (
                      <Button key="approve" size="small" onClick={() => approveRequest(item.id)}>Approve</Button>
                    ) : null,
                  ]}
                >
                  <List.Item.Meta
                    title={`${item.module} (${item.status})`}
                    description={`Risk actions: ${item.riskActions.join(", ")} | Requested: ${new Date(item.requestedAt).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Audit Trail">
            <List
              dataSource={auditTrail}
              locale={{ emptyText: "No audit entries" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.message}
                    description={new Date(item.timestamp).toLocaleString()}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Permissions;