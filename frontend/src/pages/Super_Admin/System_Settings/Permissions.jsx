import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Select,
  Table,
  Tooltip,
  Spin,
  Empty,
  Row,
  Col,
  Space,
  List,
  message,
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
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../../../features/roleSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell, pill } from "../../../styles/pageStyles";

const HIGH_RISK_ACTIONS = [
  "delete",
  "update",
  "assign-teachers",
  "assign-schools",
  "manage-payments",
  "manage-users",
];

const StatCard = ({ icon, label, value, color }) => (
  <div className="section-panel is-header-strip">
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div className="u-title-lg">{value}</div>
    </div>
  </div>
);

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
          <div style={iconWell("var(--primary)", 34)}>
            <LockOutlined />
          </div>
          <span className="u-strong-bold">{text}</span>
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
            <span style={pill("var(--success-hover)", "var(--success-light)")}>
              <CheckCircleOutlined /> Yes
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="No Permission">
            <span style={pill("var(--danger-hover)", "var(--danger-light)")}>
              <CloseCircleOutlined /> No
            </span>
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
      render: (value) => <span className="u-strong-bold">{value}</span>,
    },
    {
      title: "Added Actions",
      dataIndex: "added",
      key: "added",
      render: (items) =>
        items.length ? (
          <Space size={4} wrap>
            {items.map((item) => (
              <span key={item} style={pill("var(--success-hover)", "var(--success-light)")}>+ {item}</span>
            ))}
          </Space>
        ) : (
          <span className="u-muted">None</span>
        ),
    },
    {
      title: "Removed Actions",
      dataIndex: "removed",
      key: "removed",
      render: (items) =>
        items.length ? (
          <Space size={4} wrap>
            {items.map((item) => (
              <span key={item} style={pill("var(--danger-hover)", "var(--danger-light)")}>- {item}</span>
            ))}
          </Space>
        ) : (
          <span className="u-muted">None</span>
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
              <span key={item} style={pill("var(--warning-hover)", "var(--warning-light)")}>{item}</span>
            ))
          ) : (
            <span style={pill("var(--text-muted)")}>None</span>
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
    <div className="page-wrapper">
      <PageHeader
        title="Permissions Matrix"
        subtitle="Role-wise module permissions, diff viewer aur high-risk approval governance"
        icon={<SafetyCertificateOutlined />}
        extra={
          <Select
            allowClear
            placeholder="Global Roles"
            style={{ width: 240 }}
            value={selectedSchoolId}
            onChange={setSelectedSchoolId}
            options={schools.map((school) => ({ label: school.name, value: school._id }))}
          />
        }
      />

      <div style={statGrid(170)}>
        <StatCard icon={<SafetyCertificateOutlined />} label="Roles" value={roles.length} color="var(--accent)" />
        <StatCard icon={<ApartmentOutlined />} label="Permission Modules" value={modules.length} color="var(--primary)" />
        <StatCard
          icon={<WarningOutlined />}
          label="Pending Approvals"
          value={approvalQueue.filter((item) => item.status !== "Approved").length}
          color="var(--warning)"
        />
      </div>


      <div className="section-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <SafetyCertificateOutlined style={{ color: "var(--primary)" }} />
          <span className="u-title-sm">Role Permission Matrix</span>
          <span style={pill("var(--primary)")}>{dataSource.length} modules</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : dataSource.length === 0 ? (
          <Empty description="No permissions found" />
        ) : (
          <div className="permissions-matrix-tbl table-container">
            <Table
              columns={columns}
              dataSource={dataSource}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </div>
        )}
      </div>

      <div className="section-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <DiffOutlined style={{ color: "var(--primary)" }} />
          <span className="u-title-sm">Permission Diff Viewer</span>
        </div>

        <span className="u-muted">
          Do roles compare karke added/removed actions aur high-risk changes dekhein.
        </span>

        <div className="toolbar-row" style={{ marginTop: 14 }}>
          <Select
            placeholder="Base role"
            options={roleOptions}
            value={baseRoleId}
            onChange={setBaseRoleId}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Compare role"
            options={roleOptions}
            value={compareRoleId}
            onChange={setCompareRoleId}
            style={{ width: 220 }}
          />
        </div>

        <Table
          rowKey="key"
          columns={diffColumns}
          dataSource={diffRows}
          scroll={{ x: 850 }}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: "Select roles to compare" }}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div className="section-panel" style={{ marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <WarningOutlined style={{ color: "var(--warning)" }} />
              <span className="u-title-sm">High-Risk Approval Queue</span>
              <span style={pill("var(--warning-hover)", "var(--warning-light)")}>{approvalQueue.length}</span>
            </div>

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
                      <span key="approved" style={pill("var(--success-hover)", "var(--success-light)")}>Approved</span>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span className="u-strong-bold">{item.module}</span>
                        <span style={item.status === "Approved" ? pill("var(--success-hover)", "var(--success-light)") : pill("var(--warning-hover)", "var(--warning-light)")}>
                          {item.status}
                        </span>
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
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div className="section-panel" style={{ marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <AuditOutlined style={{ color: "var(--success)" }} />
              <span className="u-title-sm">Audit Trail</span>
              <span style={pill("var(--success-hover)", "var(--success-light)")}>{auditTrail.length}</span>
            </div>

            <List
              dataSource={auditTrail}
              locale={{ emptyText: "No audit entries" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span className="u-strong-bold">{item.message}</span>}
                    description={new Date(item.timestamp).toLocaleString()}
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Permissions;
