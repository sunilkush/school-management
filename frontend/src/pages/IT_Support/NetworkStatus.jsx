import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Typography,
} from "antd";
import { ReloadOutlined, WifiOutlined } from "@ant-design/icons";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";

const { Text } = Typography;

const NetworkStatus = () => {
  const [health, setHealth]   = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/health");
      setHealth(res.data.data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isOnline = health?.status === "ok";
  const dbOk     = health?.db === "connected";
  const uptime   = health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : "—";

  const services = [
    { name: "API Server",         ok: isOnline, desc: isOnline ? `Uptime: ${uptime}` : "Not reachable" },
    { name: "Database",           ok: dbOk,     desc: dbOk ? "Connected" : "Disconnected" },
    { name: "Backend Connection", ok: isOnline, desc: health?.timestamp ? `Last checked: ${dayjs(health.timestamp).format("HH:mm:ss")}` : "—" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert
        type={isOnline ? "success" : loading ? "info" : "error"}
        message={loading ? "Checking system status…" : isOnline ? "All critical systems are operational" : "Backend unreachable — check your connection"}
        showIcon
        action={<Button size="small" icon={<ReloadOutlined />} onClick={checkHealth} loading={loading}>Refresh</Button>}
      />

      <Card title={<Space><WifiOutlined /> Service Health</Space>}>
        <Spin spinning={loading}>
          <List
            dataSource={services}
            renderItem={(svc) => (
              <List.Item>
                <Row style={{ width: "100%" }} gutter={16} align="middle">
                  <Col xs={24} md={8}>
                    <Text strong>{svc.name}</Text>
                  </Col>
                  <Col xs={24} md={10}>
                    <Text type="secondary">{svc.desc}</Text>
                  </Col>
                  <Col xs={24} md={6}>
                    <Badge
                      status={svc.ok ? "success" : loading ? "processing" : "error"}
                      text={svc.ok ? "Operational" : loading ? "Checking…" : "Down"}
                    />
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      {health && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Server Uptime"  value={uptime} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Database"       value={health.db || "—"} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Last Checked"   value={health.timestamp ? dayjs(health.timestamp).format("HH:mm:ss") : "—"} />
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
};

export default NetworkStatus;
