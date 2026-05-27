import React, { useMemo } from "react";
import { Card, Col, Row, Tag, Typography, Empty, Spin, Flex } from "antd";
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
      <Flex className="role-workspace-loader" align="center" justify="center">
        <Spin size="large" tip="Loading role workspace..." />
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Card>
        <Title level={3} className="role-workspace-title">Role Workspace</Title>
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
                <Flex wrap gap={8}>
                  {group.actions.length ? (
                    group.actions.map((action) => (
                      <Tag color="blue" key={`${group.module}-${action}`}>
                        {action.toUpperCase()}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">No actions mapped</Text>
                  )}
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Flex>
  );
};

export default RoleWorkspace;
