import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Descriptions, Empty, Row, Select, Skeleton, Space, Tag, message } from "antd";
import { CarOutlined, EnvironmentOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../../../styles/pageStyles";

const ChildTransport = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [transport, setTransport]             = useState(null);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const fetchTransport = useCallback(async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/student-portal/child/${selectedChildId}/transport`);
      setTransport(res.data?.data?.assignment || null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load transport info");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => { fetchTransport(); }, [fetchTransport]);

  const route   = transport?.routeId   || {};
  const vehicle = transport?.vehicleId || {};

  return (
    <>
      <PageHeader
        title="Child Transport"
        subtitle="View your child's assigned route, vehicle, and pickup details."
        icon={<CarOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => { setSelectedChildId(v); setTransport(null); }}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchTransport}>
              Refresh
            </Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !transport ? (
          <div style={sectionPanel}>
            <Empty description={selectedChildId ? "No transport assigned for this child" : "Select a child to view transport details"} />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={iconWell("#7c3aed", 40)}><CarOutlined /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Route Details</div>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Route Name">
                    {route.routeName || route.name || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Point">
                    {route.startPoint || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="End Point">
                    {route.endPoint || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Pickup Stop">
                    {transport.pickupStop || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Drop Stop">
                    {transport.dropStop || "—"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={iconWell("#0284c7", 40)}><EnvironmentOutlined /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Vehicle Details</div>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Vehicle No">
                    {vehicle.vehicleNumber || vehicle.registrationNumber || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    {vehicle.vehicleType || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Driver">
                    {vehicle.driverName || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Driver Contact">
                    {vehicle.driverContact || vehicle.driverPhone || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={transport.isActive ? "green" : "red"}>
                      {transport.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Col>
          </Row>
        )}
      </div>
    </>
  );
};

export default ChildTransport;
