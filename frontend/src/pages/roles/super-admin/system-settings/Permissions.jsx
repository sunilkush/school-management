import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
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
  List,
  message,
  Statistic,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  DiffOutlined,
  WarningOutlined,
  AuditOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../../features/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../../../../features/roleSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const HIGH_RISK_ACTIONS = [
  "delete",
  "update",
  "assign-teachers",
  "assign-schools",
  "manage-payments",
  "manage-users",
];

const css = `
.permissions-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #fdf2f8 100%);
}

.permissions-hero {
  background: #ffffffcc;
  backdrop-filter: blur(14px);
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  padding: 24px;
  margin-bottom: 18px;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.permissions-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.gov-card {
  border-radius: 24px !important;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.metric-card {
  border-radius: 22px !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.06);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.permission-tag {
  border-radius: 999px !important;
  padding: 3px 10px !important;
  font-weight: 600;
}

@media (max-width: 768px) {
  .permissions-page {
    padding: 14px;
  }
}
`;

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
    return Array.from(
      new Set(
        roles.flatMap((role) =>
          role.permissions?.map((perm) => perm.module).filter(Boolean)
        )
      )
    ).sort();
  }, [roles]);

  const dataSource = useMemo(() => {
    return modules.map((module, index) => {
      const row = { key: index, module };

      roles.forEach((role) => {
        row[role._id] = role.permissions?.some(
          (p) => p.module === module && p.actions?.length
        );
      });

      return row;
    });
  }, [modules, roles]);

  const columns = [
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      fixed: "left",
      width: 230,
      render: (text) => (
        <Space>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "#e0f2fe",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockOutlined />
          </div>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    ...roles.map((role) => ({
      title: role.name,
      dataIndex: role._id,
      key: role._id,
      align: "center",
      width: 160,
      render: (value) =>
        value ? (
          <Tooltip title="Permission Granted">
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              className="permission-tag"
            >
              Yes
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="No Permission">
            <Tag
              color="error"
              icon={<CloseCircleOutlined />}
              className="permission-tag"
            >
              No
            </Tag>
          </Tooltip>
        ),
    })),
  ];

  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role._id,
  }));

  const diffRows = useMemo(() => {
    const baseRole = roles.find((role) => role._id === baseRoleId);
    const compareRole = roles.find((role) => role._id === compareRoleId);

    if (!baseRole || !compareRole) return [];

    const baseMap = new Map(
      (baseRole.permissions || []).map((perm) => [
        perm.module,
        new Set(perm.actions || []),
      ])
    );

    const compareMap = new Map(
      (compareRole.permissions || []).map((perm) => [
        perm.module,
        new Set(perm.actions || []),
      ])
    );

    const unionModules = Array.from(
      new Set([...baseMap.keys(), ...compareMap.keys()])
    );

    return unionModules
      .map((module) => {
        const baseActions = baseMap.get(module) || new Set();
        const compareActions = compareMap.get(module) || new Set();

        const added = [...compareActions].filter(
          (action) => !baseActions.has(action)
        );
        const removed = [...baseActions].filter(
          (action) => !compareActions.has(action)
        );

        return {
          key: module,
          module,
          added,
          removed,
          highRisk: [...added, ...removed].filter((action) =>
            HIGH_RISK_ACTIONS.includes(action)
          ),
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

    message.success("Approval request queued");
  };

  const approveRequest = (id) => {
    setApprovalQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    );

    setAuditTrail((prev) => [
      {
        id: `${id}-approved`,
        message: "High-risk permission change approved",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const diffColumns = [
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Added Actions",
      dataIndex: "added",
      key: "added",
      render: (items) =>
        items.length ? (
          items.map((item) => (
            <Tag key={item} color="success" className="permission-tag">
              + {item}
            </Tag>
          ))
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
    {
      title: "Removed Actions",
      dataIndex: "removed",
      key: "removed",
      render: (items) =>
        items.length ? (
          items.map((item) => (
            <Tag key={item} color="error" className="permission-tag">
              - {item}
            </Tag>
          ))
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
    {
      title: "High Risk",
      dataIndex: "highRisk",
      key: "highRisk",
      render: (items, row) => (
        <Space wrap>
          {items.length ? (
            items.map((item) => (
              <Tag key={item} color="volcano" className="permission-tag">
                {item}
              </Tag>
            ))
          ) : (
            <Tag className="permission-tag">None</Tag>
          )}

          {items.length > 0 && (
            <Button size="small" onClick={() => queueApproval(row)}>
              Request Approval
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="permissions-page">
        <div className="permissions-hero">
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} lg={14}>
              <Space align="center">
                <div className="permissions-icon">
                  <SafetyCertificateOutlined />
                </div>

                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Permissions Matrix
                  </Title>
                  <Text style={{ color: "#64748b" }}>
                    Role-wise module permissions, diff viewer aur high-risk
                    approval governance.
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Select
                allowClear
                size="large"
                placeholder="Global Roles"
                style={{ width: "100%" }}
                value={selectedSchoolId}
                onChange={setSelectedSchoolId}
              >
                {schools.map((school) => (
                  <Option key={school._id} value={school._id}>
                    {school.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 16, marginBottom: 18 }}
          message={
            selectedSchoolId
              ? "School Specific Permissions"
              : "Global Permission View"
          }
          description="Permissions yahan role-wise compare aur audit ki ja sakti hain. High-risk changes ke liye approval queue use karein."
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="metric-card">
              <Statistic
                title="Roles"
                value={roles.length}
                prefix={<SafetyCertificateOutlined style={{ color: "#7c3aed" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="metric-card">
              <Statistic
                title="Permission Modules"
                value={modules.length}
                prefix={<ApartmentOutlined style={{ color: "#2563eb" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="metric-card">
              <Statistic
                title="Pending Approvals"
                value={
                  approvalQueue.filter((item) => item.status !== "Approved")
                    .length
                }
                prefix={<WarningOutlined style={{ color: "#d97706" }} />}
              />
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          className="gov-card"
          style={{ marginBottom: 18 }}
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: "#7c3aed" }} />
              <span>Role Permission Matrix</span>
              <Tag color="blue">{dataSource.length} modules</Tag>
            </Space>
          }
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : dataSource.length === 0 ? (
            <Empty description="No permissions found" />
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              bordered={false}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          )}
        </Card>

        <Card
          bordered={false}
          className="gov-card"
          style={{ marginBottom: 18 }}
          title={
            <Space>
              <DiffOutlined style={{ color: "#2563eb" }} />
              <span>Permission Diff Viewer</span>
            </Space>
          }
        >
          <Text type="secondary">
            Do roles compare karke added/removed actions aur high-risk changes
            dekhein.
          </Text>

          <Row gutter={[12, 12]} style={{ marginTop: 14, marginBottom: 14 }}>
            <Col xs={24} md={8}>
              <Select
                placeholder="Base role"
                options={roleOptions}
                value={baseRoleId}
                onChange={setBaseRoleId}
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={24} md={8}>
              <Select
                placeholder="Compare role"
                options={roleOptions}
                value={compareRoleId}
                onChange={setCompareRoleId}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          <Table
            rowKey="key"
            columns={diffColumns}
            dataSource={diffRows}
            scroll={{ x: 850 }}
            pagination={{ pageSize: 6 }}
            locale={{ emptyText: "Select roles to compare" }}
          />
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              bordered={false}
              className="gov-card"
              title={
                <Space>
                  <WarningOutlined style={{ color: "#d97706" }} />
                  <span>High-Risk Approval Queue</span>
                  <Tag color="orange">{approvalQueue.length}</Tag>
                </Space>
              }
            >
              <List
                dataSource={approvalQueue}
                locale={{ emptyText: "No approval requests" }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      item.status !== "Approved" ? (
                        <Button
                          key="approve"
                          size="small"
                          type="primary"
                          onClick={() => approveRequest(item.id)}
                        >
                          Approve
                        </Button>
                      ) : (
                        <Tag key="approved" color="success">
                          Approved
                        </Tag>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.module}</Text>
                          <Tag
                            color={
                              item.status === "Approved" ? "success" : "warning"
                            }
                          >
                            {item.status}
                          </Tag>
                        </Space>
                      }
                      description={`Risk actions: ${
                        item.riskActions.join(", ") || "None"
                      } | Requested: ${new Date(
                        item.requestedAt
                      ).toLocaleString()}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              bordered={false}
              className="gov-card"
              title={
                <Space>
                  <AuditOutlined style={{ color: "#16a34a" }} />
                  <span>Audit Trail</span>
                  <Tag color="green">{auditTrail.length}</Tag>
                </Space>
              }
            >
              <List
                dataSource={auditTrail}
                locale={{ emptyText: "No audit entries" }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{item.message}</Text>}
                      description={new Date(item.timestamp).toLocaleString()}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Permissions;