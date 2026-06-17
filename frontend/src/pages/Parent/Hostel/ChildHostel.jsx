import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Descriptions, Empty, Row, Select, Skeleton, Space, Tag, message } from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
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
                  <div style={iconWell("#7c3aed", 40)}><HomeOutlined /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Hostel Allocation</div>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Hostel Name">{hostel.hostelName || hostel.name || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Room Number">{hostel.roomNumber || hostel.room || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Bed Number">{hostel.bedNumber || hostel.bed || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Floor">{hostel.floor || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Check-In Date">
                    {hostel.checkInDate ? new Date(hostel.checkInDate).toLocaleDateString("en-IN") : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Warden">{hostel.wardenName || hostel.warden || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Warden Contact">{hostel.wardenContact || hostel.wardenPhone || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={hostel.isActive ? "green" : "red"}>{hostel.isActive ? "Active" : "Inactive"}</Tag>
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

export default ChildHostel;
