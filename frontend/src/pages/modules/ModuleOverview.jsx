import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Col, Row, Typography, Tag, Space, Empty } from "antd";
import { useSelector } from "react-redux";
import { getRoleModules } from "../../utils/moduleRegistry";

const { Title, Text } = Typography;

const ModuleOverview = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.roleUi.permissions || []);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "";

  const modules = useMemo(() => {
    const permissionModules = permissions.map((p) => p.module);
    return getRoleModules(roleName, permissionModules);
  }, [roleName, permissions]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>ERP Module Center</Title>
        <Text type="secondary">Role based module access for {roleName || "current user"}.</Text>
      </Card>

      {!modules.length ? (
        <Card>
          <Empty description="No module access configured for this role" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {modules.map((module) => (
            <Col xs={24} md={12} xl={8} key={module.key}>
              <Card
                hoverable
                onClick={() => navigate(`/dashboard/modules/${module.key}`)}
                title={module.title}
                extra={<Tag color="blue">Open</Tag>}
              >
                <Text type="secondary">{module.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
};

export default ModuleOverview;
