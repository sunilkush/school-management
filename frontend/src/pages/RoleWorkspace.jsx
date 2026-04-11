import React, { useMemo } from "react";
import { Card, Col, Row, Tag, Typography, Empty, Spin } from "antd";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const RoleWorkspace = () => {
  const { user } = useSelector((state) => state.auth);
  const { role, permissions, loading } = useSelector((state) => state.roleUi);

  const roleName =
    role?.name || (typeof user?.role === "string" ? user.role : user?.role?.name) || "User";

  const grouped = useMemo(() => {
    if (!Array.isArray(permissions)) return [];
    return permissions.map((item) => ({
      module: item.module,
      actions: item.actions || [],
    }));
  }, [permissions]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spin size="large" tip="Loading role workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>Role Workspace</Title>
        <Text type="secondary">
          Welcome, <b>{roleName}</b>. This screen is auto-configured from your role permissions.
        </Text>
      </Card>

      {grouped.length === 0 ? (
        <Card>
          <Empty description="No permissions assigned for this role" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {grouped.map((group) => (
            <Col xs={24} md={12} lg={8} key={group.module}>
              <Card title={group.module}>
                <div className="flex flex-wrap gap-2">
                  {group.actions.length ? (
                    group.actions.map((action) => (
                      <Tag color="blue" key={`${group.module}-${action}`}>
                        {action.toUpperCase()}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">No actions mapped</Text>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default RoleWorkspace;
