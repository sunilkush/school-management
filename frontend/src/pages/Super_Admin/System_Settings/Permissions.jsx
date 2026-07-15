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
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, toolbarRow,
} from "../../../styles/pageStyles";

const HIGH_RISK_ACTIONS = [
  "delete",
  "update",
  "assign-teachers",
  "assign-schools",
  "manage-payments",
  "manage-users",
];

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
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
          <div style={iconWell("#2563EB", 34)}>
            <LockOutlined />
          </div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{text}</span>
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
            <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>
              <CheckCircleOutlined /> Yes
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="No Permission">
            <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>
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
      render: (value) => <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{value}</span>,
    },
    {
      title: "Added Actions",
      dataIndex: "added",
      key: "added",
      render: (items) =>
        items.length ? (
          <Space size={4} wrap>
            {items.map((item) => (
              <span key={item} style={pill("#15803D", "rgba(220,252,231,0.5)")}>+ {item}</span>
            ))}
          </Space>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>None</span>
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
              <span key={item} style={pill("#DC2626", "rgba(254,226,226,0.5)")}>- {item}</span>
            ))}
          </Space>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>None</span>
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
              <span key={item} style={pill("#B45309", "rgba(254,243,199,0.5)")}>{item}</span>
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
    <div style={pageWrapper}>
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
        <StatCard icon={<SafetyCertificateOutlined />} label="Roles" value={roles.length} color="#14B8A6" />
        <StatCard icon={<ApartmentOutlined />} label="Permission Modules" value={modules.length} color="#2563EB" />
        <StatCard
          icon={<WarningOutlined />}
          label="Pending Approvals"
          value={approvalQueue.filter((item) => item.status !== "Approved").length}
          color="#F59E0B"
        />
      </div>

      <style>{tableHeadCss("permissions-matrix-tbl")}</style>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <SafetyCertificateOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Role Permission Matrix</span>
          <span style={pill("var(--primary)")}>{dataSource.length} modules</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : dataSource.length === 0 ? (
          <Empty description="No permissions found" />
        ) : (
          <div className="permissions-matrix-tbl" style={tableContainer}>
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

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <DiffOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Permission Diff Viewer</span>
        </div>

        <span style={{ color: "var(--text-muted)" }}>
          Do roles compare karke added/removed actions aur high-risk changes dekhein.
        </span>

        <div style={{ ...toolbarRow, marginTop: 14 }}>
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
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <WarningOutlined style={{ color: "#F59E0B" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>High-Risk Approval Queue</span>
              <span style={pill("#B45309", "rgba(254,243,199,0.5)")}>{approvalQueue.length}</span>
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
                      <span key="approved" style={pill("#15803D", "rgba(220,252,231,0.5)")}>Approved</span>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.module}</span>
                        <span style={item.status === "Approved" ? pill("#15803D", "rgba(220,252,231,0.5)") : pill("#B45309", "rgba(254,243,199,0.5)")}>
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
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <AuditOutlined style={{ color: "#22C55E" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Audit Trail</span>
              <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>{auditTrail.length}</span>
            </div>

            <List
              dataSource={auditTrail}
              locale={{ emptyText: "No audit entries" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.message}</span>}
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
