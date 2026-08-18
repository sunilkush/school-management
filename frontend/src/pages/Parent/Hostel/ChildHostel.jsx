import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Button, Col, Descriptions, Empty, List, Row, Select, Skeleton, Space, Tag, message } from "antd";
import { HomeOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../../../styles/pageStyles";

const ChildHostel = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [hostel, setHostel]                   = useState(null);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const fetchHostel = useCallback(async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/student-portal/child/${selectedChildId}/hostel`);
      setHostel(res.data?.data || null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load hostel info");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => { fetchHostel(); }, [fetchHostel]);

  return (
    <>
      <PageHeader
        title="Child Hostel"
        subtitle="View your child's hostel allocation, room, and warden details."
        icon={<HomeOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => { setSelectedChildId(v); setHostel(null); }}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchHostel}>Refresh</Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : !hostel ? (
          <div style={sectionPanel}>
            <Empty description={selectedChildId ? "No hostel allocated for this child" : "Select a child to view hostel details"} />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <div style={sectionPanel}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={iconWell("var(--accent)", 40)}><HomeOutlined /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Hostel Allocation</div>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Room Number">{hostel.roomNumber || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Capacity">{hostel.capacity || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Academic Year">{hostel.academicYear?.name || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={hostel.status === "occupied" ? "green" : "default"}>
                      {hostel.status === "occupied" ? "Occupied" : "Vacant"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Col>
            <Col xs={24} md={10}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Roommates</div>
                {hostel.roommates?.length ? (
                  <List
                    size="small"
                    dataSource={hostel.roommates}
                    renderItem={(name) => (
                      <List.Item>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar size={30} icon={<UserOutlined />} style={{ background: "var(--primary)" }} />
                          <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{name}</span>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No roommates assigned to this room.</span>
                )}
              </div>
            </Col>
          </Row>
        )}
      </div>
    </>
  );
};

export default ChildHostel;
